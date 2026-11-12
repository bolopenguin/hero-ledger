<script lang="ts">
	// The class at a glance: key numbers, spellcasting and class-specific tables.
	import { currentChar } from '$lib/current.svelte';
	import { getClass, scores, signed, spellcasting, subclassName } from '$lib/calc';
	import { classStats, FONT_OF_MAGIC, PREP_RULE } from '$lib/classStats';
	import { AB_NAMES } from '$lib/data/srd';

	const ch = $derived(currentChar());
	const cls = $derived(getClass(ch));
	const s = $derived(spellcasting(ch, scores(ch)));
	const stats = $derived(classStats(ch));
</script>

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
