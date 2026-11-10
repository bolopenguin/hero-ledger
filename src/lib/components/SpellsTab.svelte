<script lang="ts">
	import { Plus, Trash2 } from 'lucide-svelte';
	import { currentChar } from '$lib/current.svelte';
	import { getClass, scores, signed, spellcasting } from '$lib/calc';
	import { AB_NAMES } from '$lib/data/srd';
	import { newSpell } from '$lib/store.svelte';
	import { ABILITIES } from '$lib/types';
	import Stat from './Stat.svelte';
	import Pips from './Pips.svelte';

	const ch = $derived(currentChar());
	const sc = $derived(scores(ch));
	const s = $derived(spellcasting(ch, sc));
	const cls = $derived(getClass(ch));
	const sorted = $derived([...ch.spells.list].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)));
	const levels = $derived([...new Set(sorted.map((x) => x.level))]);
	const preparedCount = $derived(ch.spells.list.filter((x) => x.level > 0 && x.prepared && !x.always).length);
	const cantripCount = $derived(ch.spells.list.filter((x) => x.level === 0).length);
	const ord = (n: number) => (n === 0 ? 'Cantrips' : `Level ${n}`);
</script>

<div class="flex flex-col gap-3">
	<section class="panel" aria-labelledby="sc-h">
		<h2 id="sc-h" class="panel-title">Spellcasting</h2>
		<div class="flex flex-wrap items-end gap-x-8 gap-y-3">
			<label class="flex flex-col">
				<span class="label-xs">Ability</span>
				<select class="select select-sm" bind:value={ch.spells.ability}>
					<option value="">Auto ({cls?.castAbil ? AB_NAMES[cls.castAbil] : 'none'})</option>
					{#each ABILITIES as ab (ab)}<option value={ab}>{AB_NAMES[ab]}</option>{/each}
				</select>
			</label>
			<div class="flex flex-col items-center"><span class="label-xs">Modifier</span><span class="num text-2xl">{signed(s.mod)}</span></div>
			<Stat label="Save DC" value={s.dc} key="spellDc" />
			<Stat label="Spell attack" value={s.atk} key="spellAtk" sign />
			{#if s.cantrips !== null}<div class="flex flex-col items-center"><span class="label-xs">Cantrips</span><span class="num text-2xl">{cantripCount}/{s.cantrips}</span></div>{/if}
			{#if s.prepared !== null}<div class="flex flex-col items-center"><span class="label-xs">Prepared</span><span class="num text-2xl {preparedCount > s.prepared ? 'text-warning' : ''}">{preparedCount}/{s.prepared}</span></div>{/if}
		</div>

		{#if s.slots.some((n) => n > 0) || s.pact}
			<div class="border-base-300 mt-3 flex flex-wrap gap-x-6 gap-y-2 border-t pt-3">
				{#each s.slots as n, i (i)}
					{#if n > 0}
						<div class="flex flex-col"><span class="label-xs">Level {i + 1}</span><Pips max={n} bind:used={ch.spells.slotsUsed[i]} label="Level {i + 1} slots" /></div>
					{/if}
				{/each}
				{#if s.pact}
					<div class="flex flex-col"><span class="label-xs">Pact slots · level {s.pact.level}</span><Pips max={s.pact.n} bind:used={ch.spells.pactUsed} label="Pact slots" /></div>
				{/if}
			</div>
		{:else}
			<p class="text-base-content/60 mt-2 text-sm">Your class has no spell slots at this level. Spells from feats or species still go in the list below.</p>
		{/if}
	</section>

	<section class="panel" aria-labelledby="sl-h">
		<div class="mb-2 flex items-center gap-2">
			<h2 id="sl-h" class="panel-title mb-0">Cantrips & prepared spells</h2>
			<button type="button" class="btn btn-sm ml-auto" onclick={() => ch.spells.list.push(newSpell({ level: 1 }))}><Plus class="size-4" /> Spell</button>
		</div>
		{#if !sorted.length}<p class="text-base-content/60 py-4 text-center text-sm">No spells yet.</p>{/if}
		<div class="overflow-x-auto">
			<table class="table-sm table min-w-[52rem]">
				<thead>
					<tr class="label-xs">
						<th class="w-14">Lvl</th><th>Name</th><th class="w-10" title="Prepared">Prep</th><th class="w-10" title="Always prepared">Alw</th><th>Casting time</th><th>Range</th><th>Duration</th><th class="w-10" title="Concentration">C</th><th class="w-10" title="Ritual">R</th><th>Comp.</th><th>Notes / page</th><th></th>
					</tr>
				</thead>
				{#each levels as lv (lv)}
					<tbody>
						<tr><td colspan="12" class="font-display text-primary pt-3 font-bold">{ord(lv)}</td></tr>
						{#each sorted.filter((x) => x.level === lv) as sp (sp.id)}
							<tr>
								<td><input type="number" min="0" max="9" class="input input-xs num w-12" bind:value={sp.level} /></td>
								<td><input class="input input-xs w-full min-w-36 font-semibold" bind:value={sp.name} placeholder="Spell name" /></td>
								<td><input type="checkbox" class="checkbox checkbox-xs" bind:checked={sp.prepared} /></td>
								<td><input type="checkbox" class="checkbox checkbox-xs" bind:checked={sp.always} /></td>
								<td><input class="input input-xs w-full min-w-24" bind:value={sp.time} /></td>
								<td><input class="input input-xs w-full min-w-20" bind:value={sp.range} /></td>
								<td><input class="input input-xs w-full min-w-24" bind:value={sp.duration} /></td>
								<td><input type="checkbox" class="checkbox checkbox-xs" bind:checked={sp.conc} /></td>
								<td><input type="checkbox" class="checkbox checkbox-xs" bind:checked={sp.ritual} /></td>
								<td><input class="input input-xs w-20" bind:value={sp.comp} /></td>
								<td><input class="input input-xs w-full min-w-40" bind:value={sp.notes} /></td>
								<td><button type="button" class="btn btn-ghost btn-xs btn-square" aria-label="Delete {sp.name}" onclick={() => (ch.spells.list = ch.spells.list.filter((x) => x.id !== sp.id))}><Trash2 class="size-3.5" /></button></td>
							</tr>
						{/each}
					</tbody>
				{/each}
			</table>
		</div>
	</section>
</div>
