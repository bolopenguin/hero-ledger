<script lang="ts">
	import { Plus, Trash2 } from 'lucide-svelte';
	import { currentChar } from '$lib/current.svelte';
	import { getClass, grantedSpells, scores, signed, spellcasting } from '$lib/calc';
	import { AB_NAMES } from '$lib/data/srd';
	import { newSpell } from '$lib/store.svelte';
	import { allPackSpells } from '$lib/packs.svelte';
	import { ABILITIES, type SpellDef } from '$lib/types';
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

	// Spell search from content packs.
	const library = $derived(allPackSpells());
	const byName = $derived(new Map(library.map((x) => [x.name.toLowerCase(), x])));
	// Spells your features keep prepared; ones you also added by hand stay in your list.
	const granted = $derived(
		grantedSpells(ch)
			.filter((g) => !ch.spells.list.some((x) => x.name.toLowerCase() === g.name.toLowerCase()))
			.map((g) => ({ ...g, def: byName.get(g.name.toLowerCase()) }))
			.sort((a, b) => (a.def?.level ?? 0) - (b.def?.level ?? 0) || a.name.localeCompare(b.name))
	);
	let query = $state('');
	let classOnly = $state(true);
	let maxLevelOnly = $state(true);
	const className = $derived(s.list);
	const maxSpellLevel = $derived(s.pact ? s.pact.level : Math.max(0, ...s.slots.map((n, i) => (n ? i + 1 : 0))));
	const matches = $derived.by(() => {
		const q = query.trim().toLowerCase();
		const have = new Set([...ch.spells.list.map((x) => x.name.toLowerCase()), ...granted.map((g) => g.name.toLowerCase())]);
		return library
			.filter((x) => !have.has(x.name.toLowerCase()))
			.filter((x) => !classOnly || !className || x.classes.some((c) => c.toLowerCase() === className))
			.filter((x) => !maxLevelOnly || x.level <= maxSpellLevel)
			.filter((x) => !q || x.name.toLowerCase().includes(q) || x.school.toLowerCase() === q)
			.slice(0, 40);
	});
	function addFromLibrary(d: SpellDef) {
		ch.spells.list.push(
			newSpell({
				name: d.name,
				level: d.level,
				school: d.school,
				time: d.time,
				range: d.range,
				duration: d.duration,
				conc: d.conc,
				ritual: d.ritual,
				comp: d.comp,
				material: d.material ?? '',
				cost: d.cost ?? 0,
				consumed: !!d.consumed,
				desc: [d.d, d.higher ? `Higher levels: ${d.higher}` : ''].filter(Boolean).join('\n')
			})
		);
		query = '';
	}
	let openDesc = $state<Record<string, boolean>>({});
</script>

<div class="flex flex-col gap-3">
	<section class="panel" aria-labelledby="sc-h">
		<h2 id="sc-h" class="panel-title">Spellcasting</h2>
		<div class="flex flex-wrap items-end gap-x-8 gap-y-3">
			<label class="flex flex-col">
				<span class="label-xs">Ability</span>
				<select class="select select-sm" bind:value={ch.spells.ability}>
					<option value="">Auto ({s.ability ? AB_NAMES[s.ability] : 'none'})</option>
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

	{#if granted.length}
		<section class="panel" aria-labelledby="ap-h">
			<h2 id="ap-h" class="panel-title">Always prepared <span class="text-base-content/50 font-sans text-xs font-normal tracking-normal normal-case">from your features; they don't count against your prepared spells</span></h2>
			<div class="overflow-x-auto">
				<table class="table-sm table min-w-[46rem]">
					<thead>
						<tr class="label-xs"><th class="w-12">Lvl</th><th>Name</th><th>Casting time</th><th>Range</th><th>Duration</th><th>Comp.</th><th>From</th></tr>
					</thead>
					<tbody>
						{#each granted as g (g.name)}
							<tr>
								<td class="num">{g.def ? (g.def.level === 0 ? 'C' : g.def.level) : '—'}</td>
								<td>
									<span class="font-semibold">{g.name}</span>
									{#if g.def?.conc}<span class="tag ml-1">C</span>{/if}{#if g.def?.ritual}<span class="tag ml-1">R</span>{/if}
									{#if g.def}<p class="text-base-content/65 max-w-md text-xs">{g.def.d}</p>{/if}
								</td>
								<td class="text-sm">{g.def?.time ?? ''}</td>
								<td class="text-sm">{g.def?.range ?? ''}</td>
								<td class="text-sm">{g.def?.duration ?? ''}</td>
								<td class="text-sm">{g.def?.comp ?? ''}{#if g.def?.cost}<span class="text-secondary ml-1 font-semibold">{g.def.cost} GP{g.def.consumed ? ' (used up)' : ''}</span>{/if}</td>
								<td class="text-base-content/60 text-xs">{g.source}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	{/if}

	<section class="panel" aria-labelledby="sl-h">
		<div class="mb-2 flex items-center gap-2">
			<h2 id="sl-h" class="panel-title mb-0">Cantrips & prepared spells</h2>
			<button type="button" class="btn btn-sm ml-auto" onclick={() => ch.spells.list.push(newSpell({ level: 1 }))}><Plus class="size-4" /> Spell</button>
		</div>
		{#if library.length}
			<div class="bg-base-200 rounded-box mb-3 p-2">
				<div class="flex flex-wrap items-center gap-2">
					<input class="input input-sm min-w-0 flex-1" placeholder="Search {library.length} spells from your packs…" bind:value={query} aria-label="Search spells" />
					<label class="flex items-center gap-1.5 text-sm"><input type="checkbox" class="checkbox checkbox-xs" bind:checked={classOnly} /> {s.list ? s.list[0].toUpperCase() + s.list.slice(1) : 'Class'} list</label>
					<label class="flex items-center gap-1.5 text-sm"><input type="checkbox" class="checkbox checkbox-xs" bind:checked={maxLevelOnly} /> Up to level {maxSpellLevel}</label>
				</div>
				{#if query.trim() || matches.length <= 40}
					<ul class="mt-2 flex max-h-72 flex-col overflow-y-auto">
						{#each matches as m (m.name)}
							<li>
								<button type="button" class="hover:bg-base-100 flex w-full items-baseline gap-2 rounded px-2 py-1 text-left text-sm" onclick={() => addFromLibrary(m)}>
									<Plus class="size-3.5 shrink-0 translate-y-0.5" />
									<span class="font-semibold">{m.name}</span>
									<span class="text-base-content/60 text-xs">{m.level === 0 ? 'Cantrip' : `Level ${m.level}`} · {m.school}{m.conc ? ' · C' : ''}{m.ritual ? ' · R' : ''}{m.cost ? ` · ${m.cost} GP${m.consumed ? ' consumed' : ''}` : ''}</span>
									<span class="text-base-content/60 hidden truncate text-xs md:inline">{m.d}</span>
								</button>
							</li>
						{:else}
							<li class="text-base-content/60 px-2 py-1 text-sm">No match. Untick the filters or check the spelling.</li>
						{/each}
					</ul>
				{/if}
			</div>
		{:else}
			<p class="text-base-content/60 mb-2 text-xs">Load a content pack with spells (Packs) to search and add them with their details filled in.</p>
		{/if}
		{#if !sorted.length}<p class="text-base-content/60 py-4 text-center text-sm">No spells yet.</p>{/if}
		<div class="overflow-x-auto">
			<table class="table-sm table min-w-[52rem]">
				<thead>
					<tr class="label-xs">
						<th class="w-14">Lvl</th><th>Name</th><th class="w-10" title="Prepared">Prep</th><th class="w-10" title="Always prepared">Alw</th><th>Casting time</th><th>Range</th><th>Duration</th><th class="w-10" title="Concentration">C</th><th class="w-10" title="Ritual">R</th><th>Comp.</th><th title="Gold cost of the Material component">Cost GP</th><th>Notes / page</th><th></th>
					</tr>
				</thead>
				{#each levels as lv (lv)}
					<tbody>
						<tr><td colspan="13" class="font-display text-primary pt-3 font-bold">{ord(lv)}</td></tr>
						{#each sorted.filter((x) => x.level === lv) as sp (sp.id)}
							<tr>
								<td><input type="number" min="0" max="9" class="input input-xs num w-12" bind:value={sp.level} /></td>
								<td>
									<div class="flex items-center gap-1">
										<input class="input input-xs w-full min-w-36 font-semibold" bind:value={sp.name} placeholder="Spell name" />
										<button type="button" class="btn btn-ghost btn-xs px-1 {sp.desc ? '' : 'opacity-40'}" title="Description" onclick={() => (openDesc[sp.id] = !openDesc[sp.id])}>{openDesc[sp.id] ? '▴' : '▾'}</button>
									</div>
								</td>
								<td><input type="checkbox" class="checkbox checkbox-xs" bind:checked={sp.prepared} /></td>
								<td><input type="checkbox" class="checkbox checkbox-xs" bind:checked={sp.always} /></td>
								<td><input class="input input-xs w-full min-w-24" bind:value={sp.time} /></td>
								<td><input class="input input-xs w-full min-w-20" bind:value={sp.range} /></td>
								<td><input class="input input-xs w-full min-w-24" bind:value={sp.duration} /></td>
								<td><input type="checkbox" class="checkbox checkbox-xs" bind:checked={sp.conc} /></td>
								<td><input type="checkbox" class="checkbox checkbox-xs" bind:checked={sp.ritual} /></td>
								<td><input class="input input-xs w-20" bind:value={sp.comp} title={sp.material} /></td>
								<td class="whitespace-nowrap">
									<input type="number" min="0" class="input input-xs num w-16 {sp.cost ? 'text-secondary font-semibold' : ''}" bind:value={sp.cost} title={sp.material || 'Material cost in GP'} />
									{#if sp.consumed}<span class="text-warning text-[0.65rem] font-semibold" title="The spell consumes the material">USED UP</span>{/if}
								</td>
								<td><input class="input input-xs w-full min-w-40" bind:value={sp.notes} /></td>
								<td><button type="button" class="btn btn-ghost btn-xs btn-square" aria-label="Delete {sp.name}" onclick={() => (ch.spells.list = ch.spells.list.filter((x) => x.id !== sp.id))}><Trash2 class="size-3.5" /></button></td>
							</tr>
							{#if openDesc[sp.id]}
								<tr>
									<td></td>
									<td colspan="12">
										{#if sp.material}<p class="text-base-content/70 mb-1 text-xs"><b>Material:</b> {sp.material}{sp.cost ? ` (${sp.cost} GP${sp.consumed ? ', consumed' : ''})` : ''}</p>{/if}
										<textarea class="textarea textarea-xs w-full" rows="3" placeholder="What the spell does" bind:value={sp.desc}></textarea>
										{#if sp.school}<span class="text-base-content/50 text-xs">{sp.school}</span>{/if}
									</td>
								</tr>
							{/if}
						{/each}
					</tbody>
				{/each}
			</table>
		</div>
	</section>
</div>
