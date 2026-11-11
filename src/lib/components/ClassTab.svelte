<script lang="ts">
	import { currentChar } from '$lib/current.svelte';
	import { features, getClass, scores, signed, spellcasting, subclassName } from '$lib/calc';
	import { classStats, FONT_OF_MAGIC, PREP_RULE } from '$lib/classStats';
	import { AB_NAMES } from '$lib/data/srd';
	import FeatureCard from './FeatureCard.svelte';

	const ch = $derived(currentChar());
	const cls = $derived(getClass(ch));
	const sc = $derived(scores(ch));
	const s = $derived(spellcasting(ch, sc));
	const stats = $derived(classStats(ch));
	const feats = $derived(features(ch).filter((f) => !f.hidden));
	// Things you track during play, and the choices your class asks you to make.
	const resources = $derived(feats.filter((f) => f.uses));
	const choices = $derived(feats.filter((f) => f.choose || f.pick));
	const open = $derived(
		choices.filter((f) =>
			f.choose ? (ch.choices[f.key]?.length ?? 0) < f.choose.count : !ch.picks[f.key]?.feat
		)
	);
	const rechargeLabel: Record<string, string> = {
		short: 'Short Rest',
		short1: '1 per Short, all per Long',
		long: 'Long Rest',
		'': ''
	};
</script>

<div class="flex flex-col gap-3">
	<section class="panel" aria-labelledby="cls-h">
		<div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
			<h2 id="cls-h" class="font-display text-2xl font-bold text-primary">
				{cls?.name ?? 'No class'}
				{ch.level}
			</h2>
			{#if subclassName(ch)}<span class="font-display text-lg text-accent">{subclassName(ch)}</span
				>{/if}
			<span class="text-sm text-base-content/60">Hit die d{cls?.hd ?? 8}</span>
			{#if s.caster && s.ability}
				<span class="ml-auto text-sm text-base-content/70"
					>Spellcasting: {AB_NAMES[s.ability]} · DC {s.dc} · attack {signed(s.atk)}</span
				>
			{/if}
		</div>
		{#if stats.length}
			<dl class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
				{#each stats as st (st.label)}
					<div class="rounded-box border border-base-300 px-3 py-2">
						<dt class="label-xs">{st.label}</dt>
						<dd class="num {st.value.length > 9 ? 'text-sm' : 'text-xl'}">{st.value}</dd>
						{#if st.hint}<dd class="text-xs text-base-content/60">{st.hint}</dd>{/if}
					</div>
				{/each}
			</dl>
		{/if}
		{#if ch.classId === 'sorcerer' && ch.level >= 2}
			<div class="mt-3 overflow-x-auto">
				<table class="table w-auto table-xs">
					<caption class="label-xs text-left">Font of Magic: create a slot</caption>
					<thead
						><tr
							><th>Slot level</th>{#each FONT_OF_MAGIC as [lv] (lv)}<th class="num">{lv}</th
								>{/each}</tr
						></thead
					>
					<tbody
						><tr
							><td>Sorcery Points</td>{#each FONT_OF_MAGIC as [lv, cost] (lv)}<td class="num"
									>{cost}</td
								>{/each}</tr
						></tbody
					>
				</table>
				<p class="text-xs text-base-content/60">
					Or turn a slot into points equal to its level. Created slots vanish after a Long Rest.
				</p>
			</div>
		{/if}
		{#if PREP_RULE[ch.classId]}<p class="mt-3 text-sm text-base-content/70">
				{PREP_RULE[ch.classId]}
			</p>{/if}
	</section>

	{#if resources.length}
		<section class="panel" aria-labelledby="res-h">
			<h2 id="res-h" class="panel-title">
				Limited uses <span
					class="font-sans text-xs font-normal tracking-normal text-base-content/50 normal-case"
					>tick them off on the printed sheet</span
				>
			</h2>
			<ul class="grid gap-x-6 md:grid-cols-2">
				{#each resources as f (f.key)}
					<li><FeatureCard {f} compact /></li>
				{/each}
			</ul>
		</section>
	{/if}

	<section class="panel" aria-labelledby="ch-h">
		<div class="flex flex-wrap items-baseline gap-2">
			<h2 id="ch-h" class="panel-title mb-0">Your choices</h2>
			{#if open.length}<span class="text-sm text-warning">{open.length} still to make</span
				>{:else}<span class="text-sm text-success">All made</span>{/if}
		</div>
		{#each choices as f (f.key)}
			<div class="border-b border-base-300 last:border-b-0">
				<span class="label-xs">Level {f.l}</span>
				<FeatureCard {f} />
			</div>
		{:else}
			<p class="text-sm text-base-content/60">Nothing to choose at this level.</p>
		{/each}
	</section>
</div>
