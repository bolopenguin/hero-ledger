<script lang="ts">
	import { tick } from 'svelte';
	import { Plus } from 'lucide-svelte';
	import { currentChar } from '$lib/current.svelte';
	import {
		backgroundTool,
		darkvision,
		features,
		getBackground,
		getSpecies,
		featureAnchor,
		openChoices,
		originOf,
		pbFor,
		speed,
		startingChoices
	} from '$lib/calc';
	import { AB_NAMES, SKILLS } from '$lib/data/srd';
	import { ABILITIES } from '$lib/types';
	import { uid } from '$lib/store.svelte';
	import BackgroundScores from './BackgroundScores.svelte';
	import ClassSummary from './ClassSummary.svelte';
	import FeatureCard from './FeatureCard.svelte';
	import OptionChooser from './OptionChooser.svelte';

	const ch = $derived(currentChar());
	let showUpcoming = $state(false);
	let showHidden = $state(true);
	let filter = $state<string>('all');

	const all = $derived(features(ch, showUpcoming ? 20 : ch.level));
	const list = $derived(
		all.filter(
			(f) =>
				(showHidden || !f.hidden) &&
				(filter === 'all' || (filter === 'picks' ? !!f.pick || f.src === 'Feat' : f.a === filter))
		)
	);
	const origin = $derived(list.filter((f) => originOf(f)));
	const byLevel = $derived(list.filter((f) => !originOf(f)));
	const levels = $derived([...new Set(byLevel.map((f) => f.l))].sort((a, b) => a - b));
	// Choices still to make (feats, options, background skill and tools), linked to their card.
	const todo = $derived(openChoices(ch, features(ch)));
	const startTodo = $derived(
		startingChoices(ch).filter((cd) => (ch.choices[cd.key]?.length ?? 0) < cd.count)
	);
	async function jump(id: string) {
		filter = 'all';
		await tick();
		const el = document.getElementById(id);
		if (!el) return;
		el.scrollIntoView({ behavior: 'smooth', block: 'start' });
		el.classList.add('bg-warning/10');
		setTimeout(() => el.classList.remove('bg-warning/10'), 1500);
	}
	const sp = $derived(getSpecies(ch));
	const bg = $derived(getBackground(ch));
	const scoresTodo = $derived(
		!!bg && Object.values(ch.bgAsi).reduce((a, b) => a + (b ?? 0), 0) !== 3
	);
	const lineage = $derived(sp?.lineages?.find((l) => l.id === ch.lineage)?.name);
	const filters = [
		['all', 'All'],
		['action', 'Actions'],
		['bonus', 'Bonus Actions'],
		['reaction', 'Reactions'],
		['special', 'Special'],
		['passive', 'Passive'],
		['picks', 'Feats & choices']
	];

	function addFeature(l: number) {
		ch.features.push({ id: uid(), l, n: '', d: '', a: 'passive', src: 'Custom', uses: '', r: '' });
	}
</script>

<ClassSummary />
{#each startingChoices(ch).filter((x) => x.key === 'tools:class') as cd (cd.key)}
	<div id="class-tools" class="panel mt-3 scroll-mt-28">
		<span class="label-xs">{cd.source}</span>
		<OptionChooser choice={cd} />
	</div>
{/each}

<section class="panel mt-3" aria-labelledby="feat-h">
	<div class="flex flex-wrap items-center gap-2">
		<h2 id="feat-h" class="panel-title mb-0">Features & feats</h2>
		<button
			type="button"
			class="btn ml-auto btn-primary btn-sm"
			onclick={() => addFeature(ch.level)}><Plus class="size-4" /> Custom feature</button
		>
	</div>
	<div class="mt-3 flex flex-wrap items-center gap-1.5">
		{#each filters as [k, label] (k)}
			<button
				type="button"
				class="btn btn-xs {filter === k ? 'btn-neutral' : 'btn-ghost'}"
				onclick={() => (filter = k)}>{label}</button
			>
		{/each}
		<label class="ml-auto flex items-center gap-1.5 text-sm"
			><input type="checkbox" class="toggle toggle-xs" bind:checked={showUpcoming} /> Show upcoming levels</label
		>
		<label class="flex items-center gap-1.5 text-sm"
			><input type="checkbox" class="toggle toggle-xs" bind:checked={showHidden} /> Show hidden</label
		>
	</div>
	<div
		class="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t border-base-300 pt-2 text-sm"
	>
		{#if todo.length || startTodo.length || scoresTodo}
			<span class="font-semibold text-warning">Still to choose:</span>
			{#each todo as f (f.key)}
				<button type="button" class="link link-hover" onclick={() => jump(featureAnchor(f.key))}
					>{f.n}{originOf(f) ? '' : ` (level ${f.l})`}</button
				>
			{/each}
			{#if scoresTodo}<button
					type="button"
					class="link link-hover"
					onclick={() => jump('origin-background')}>Background ability scores</button
				>{/if}
			{#each startTodo as cd (cd.key)}
				<button
					type="button"
					class="link link-hover"
					onclick={() => jump(cd.key === 'tools:class' ? 'class-tools' : 'origin-background')}
					>{cd.key === 'tools:class'
						? 'Tool'
						: `Background ${(cd.label ?? 'choice').toLowerCase()}`}</button
				>
			{/each}
		{:else}
			<span class="text-success">Every choice for level {ch.level} is made.</span>
		{/if}
	</div>
</section>

<div class="mt-3 flex flex-col gap-3">
	{#if sp || bg}
		<section class="panel grid gap-x-4 sm:grid-cols-[5.5rem_minmax(0,1fr)]" aria-label="Origin">
			<div class="flex flex-row items-baseline gap-2 sm:flex-col sm:gap-0">
				<span class="font-display text-xl leading-tight font-bold text-primary">Origin</span>
				<span class="text-xs text-base-content/50">species & background</span>
			</div>
			<div class="min-w-0">
				{#if sp}
					<div class="flex flex-wrap items-baseline gap-x-3 border-b border-base-300 pb-1.5">
						<span class="label-xs">Species</span>
						<span class="font-display text-lg font-bold"
							>{sp.name}{lineage ? ` · ${lineage}` : ''}</span
						>
						<span class="text-sm text-base-content/60"
							>{[
								sp.size,
								`Speed ${speed(ch)} ft`,
								darkvision(ch) && !origin.some((f) => /darkvision/i.test(f.n))
									? `Darkvision ${darkvision(ch)} ft`
									: ''
							]
								.filter(Boolean)
								.join(' · ')}</span
						>
						{#if sp.lineages?.length && !lineage}<span class="text-sm text-warning"
								>Choose your {sp.lineageLabel ?? 'lineage'} on the Sheet tab.</span
							>{/if}
					</div>
					{#each origin.filter((f) => originOf(f) === 'Species') as f (f.key)}<FeatureCard
							{f}
						/>{/each}
				{/if}
				{#if bg}
					<div id="origin-background" class="mt-2 scroll-mt-28 border-b border-base-300 pb-1.5">
						<div class="flex flex-wrap items-baseline gap-x-3">
							<span class="label-xs">Background</span>
							<span class="font-display text-lg font-bold">{bg.name}</span>
						</div>
						<dl class="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
							<dt class="font-semibold">Skills</dt>
							<dd>
								{[
									...bg.skills.map((k) => SKILLS[k]?.name ?? k),
									...(ch.choices['skills:background'] ?? []).map((k) => SKILLS[k]?.name ?? k)
								].join(', ') || '—'}{bg.skillChoice &&
								(ch.choices['skills:background']?.length ?? 0) < (bg.skillChoice.count ?? 1)
									? `${bg.skills.length ? ' + ' : ''}${bg.skillChoice.count ?? 1} to choose`
									: ''}
							</dd>
							<dt class="font-semibold">Tool</dt>
							<dd>{backgroundTool(ch) || '—'}</dd>
						</dl>
						<BackgroundScores />
						{#each startingChoices(ch).filter( (x) => x.key.endsWith(':background') ) as cd (cd.key)}<OptionChooser
								choice={cd}
							/>{/each}
					</div>
					{#each origin.filter((f) => originOf(f) === 'Background') as f (f.key)}<FeatureCard
							{f}
						/>{/each}
				{/if}
			</div>
		</section>
	{/if}
	{#each levels as l (l)}
		<section
			class="panel grid gap-x-4 sm:grid-cols-[5.5rem_minmax(0,1fr)] {l > ch.level
				? 'opacity-60'
				: ''}"
			aria-label="Level {l}"
		>
			<div class="flex flex-row items-baseline gap-2 sm:flex-col sm:gap-0">
				<span class="label-xs">Level</span>
				<span class="font-display text-4xl leading-none font-bold text-primary">{l}</span>
				<span class="text-xs text-base-content/50">PB +{pbFor(l)}</span>
				{#if l > ch.level}<span class="tag mt-1">upcoming</span>{/if}
			</div>
			<div class="min-w-0">
				{#each byLevel.filter((f) => f.l === l) as f (f.key)}<FeatureCard {f} />{/each}
				<button
					type="button"
					class="btn mt-1 btn-ghost text-base-content/60 btn-xs"
					onclick={() => addFeature(l)}><Plus class="size-3" /> Add at level {l}</button
				>
			</div>
		</section>
	{/each}
	{#if !levels.length && !origin.length}
		<p class="panel text-center text-sm text-base-content/60">Nothing matches this filter.</p>
	{/if}
</div>
