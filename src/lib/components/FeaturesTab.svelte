<script lang="ts">
	import { Plus } from 'lucide-svelte';
	import { currentChar } from '$lib/current.svelte';
	import { features, getClass, pbFor, subclassName } from '$lib/calc';
	import { uid } from '$lib/store.svelte';
	import FeatureCard from './FeatureCard.svelte';

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
	const levels = $derived([...new Set(list.map((f) => f.l))].sort((a, b) => a - b));
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

<section class="panel" aria-labelledby="feat-h">
	<div class="flex flex-wrap items-center gap-2">
		<h2 id="feat-h" class="panel-title mb-0">Features & feats by level</h2>
		<span class="text-sm text-base-content/60">
			{getClass(ch)?.name ?? 'No class'}{subclassName(ch) ? ` · ${subclassName(ch)}` : ''} · level {ch.level}
		</span>
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
</section>

<div class="mt-3 flex flex-col gap-3">
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
				{#each list.filter((f) => f.l === l) as f (f.key)}<FeatureCard {f} />{/each}
				<button
					type="button"
					class="btn mt-1 btn-ghost text-base-content/60 btn-xs"
					onclick={() => addFeature(l)}><Plus class="size-3" /> Add at level {l}</button
				>
			</div>
		</section>
	{/each}
	{#if !levels.length}
		<p class="panel text-center text-sm text-base-content/60">Nothing matches this filter.</p>
	{/if}
</div>
