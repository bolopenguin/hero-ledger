<script lang="ts">
	// The background's ability score increase: +2 and +1, or +1 to three scores.
	import { currentChar } from '$lib/current.svelte';
	import { getBackground } from '$lib/calc';
	import { ABILITIES, type Ab } from '$lib/types';

	const ch = $derived(currentChar());
	const bg = $derived(getBackground(ch));
	const points = $derived(Object.values(ch.bgAsi).reduce((a, b) => a + (b ?? 0), 0));
	const choices = $derived<Ab[]>(bg?.freeAsi ? ABILITIES : (bg?.abilities ?? []));
	const names = $derived((bg?.abilities ?? []).map((a) => a.toUpperCase()).join(', '));
	const problem = $derived.by(() => {
		if (!bg || !points) return '';
		const vals = Object.entries(ch.bgAsi).filter(([, v]) => v);
		if (vals.some(([, v]) => (v ?? 0) > 2)) return 'no score above +2';
		if (points !== 3) return '';
		if (bg.freeAsi && !vals.some(([ab]) => bg.abilities.includes(ab as Ab)))
			return `put at least +1 on ${names}`;
		return '';
	});
	function allOnes() {
		ch.bgAsi = Object.fromEntries((bg?.abilities ?? []).slice(0, 3).map((a) => [a, 1]));
	}
</script>

{#if bg}
	<div class="mt-1 flex flex-wrap items-center gap-2 text-sm">
		<span class="font-semibold">Ability scores</span>
		<span class="text-xs {problem || points !== 3 ? 'text-warning' : 'text-base-content/60'}">
			{bg.freeAsi
				? `+2 and +1, or +1/+1/+1: at least +1 to one of ${names}, the rest to any score`
				: `+2 and +1, or +1 to each of ${names}`} ({points}/3){problem ? ` · ${problem}` : ''}
		</span>
		{#each choices as ab (ab)}
			<label class="flex items-center gap-1">
				<span class="text-xs uppercase">{ab}</span>
				<select
					class="select w-14 select-xs"
					value={String(ch.bgAsi[ab] ?? 0)}
					onchange={(e) => (ch.bgAsi = { ...ch.bgAsi, [ab]: Number(e.currentTarget.value) })}
				>
					<option value="0">+0</option><option value="1">+1</option><option value="2">+2</option>
				</select>
			</label>
		{/each}
		<button type="button" class="btn btn-ghost btn-xs" onclick={allOnes}>+1 / +1 / +1</button>
	</div>
{/if}
