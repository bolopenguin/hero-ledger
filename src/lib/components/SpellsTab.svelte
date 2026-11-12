<script lang="ts">
	import { Plus, Swords, Trash2 } from 'lucide-svelte';
	import { currentChar } from '$lib/current.svelte';
	import {
		attackFromSpell,
		getClass,
		grantedSpells,
		scores,
		signed,
		spellcasting,
		spellDamage,
		SPELL_KIND_LABEL
	} from '$lib/calc';
	import { PREP_RULE } from '$lib/classStats';
	import { AB_NAMES } from '$lib/data/srd';
	import { newAttack, newSpell } from '$lib/store.svelte';
	import { allPackSpells, rulesKey, rulesText } from '$lib/packs.svelte';
	import { ABILITIES, type SpellDef } from '$lib/types';
	import Stat from './Stat.svelte';
	import RulesText from './RulesText.svelte';

	const ch = $derived(currentChar());
	const sc = $derived(scores(ch));
	const s = $derived(spellcasting(ch, sc));
	const cls = $derived(getClass(ch));
	const sorted = $derived(
		[...ch.spells.list].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
	);
	const levels = $derived([...new Set(sorted.map((x) => x.level))]);
	const preparedCount = $derived(
		ch.spells.list.filter((x) => x.level > 0 && x.prepared && !x.always).length
	);
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
	// Magical Secrets (Bard 10): prepare from the Cleric, Druid and Wizard lists too.
	const lists = $derived(
		ch.classId === 'bard' && ch.level >= 10 ? [className, 'cleric', 'druid', 'wizard'] : [className]
	);
	const listLabel = $derived(lists.map((x) => x[0]?.toUpperCase() + x.slice(1)).join(' + '));
	const spellbookCount = $derived(ch.spells.list.filter((x) => x.level > 0).length);
	const inAttacks = (name: string) =>
		ch.attacks.some((a) => (a.spell ?? a.name).toLowerCase() === name.toLowerCase());
	function toAttack(name: string) {
		const d = byName.get(name.toLowerCase());
		const p = d && attackFromSpell(ch, d);
		if (p) ch.attacks.push(newAttack(p));
	}
	const maxSpellLevel = $derived(
		s.pact ? s.pact.level : Math.max(0, ...s.slots.map((n, i) => (n ? i + 1 : 0)))
	);
	let levelTab = $state<number | 'all'>('all');
	const filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		const have = new Set([
			...ch.spells.list.map((x) => x.name.toLowerCase()),
			...granted.map((g) => g.name.toLowerCase())
		]);
		return library
			.filter((x) => !have.has(x.name.toLowerCase()))
			.filter(
				(x) => !classOnly || !className || x.classes.some((c) => lists.includes(c.toLowerCase()))
			)
			.filter((x) => !maxLevelOnly || x.level <= maxSpellLevel)
			.filter((x) => !q || x.name.toLowerCase().includes(q) || x.school.toLowerCase() === q);
	});
	// Level tabs with counts, so every level is reachable without typing.
	const levelCounts = $derived.by(() => {
		const m = new Map<number, number>();
		for (const x of filtered) m.set(x.level, (m.get(x.level) ?? 0) + 1);
		return [...m.entries()].sort((a, b) => a[0] - b[0]);
	});
	const matches = $derived(
		levelTab === 'all' ? filtered : filtered.filter((x) => x.level === levelTab)
	);
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
	{#if !s.caster}
		<section class="panel">
			<h2 class="panel-title">Spells</h2>
			<p class="text-sm text-base-content/70">
				{cls?.name ?? 'Your class'} doesn't cast spells at level {ch.level}{ch.classId ===
					'fighter' || ch.classId === 'rogue'
					? ' (the Eldritch Knight and Arcane Trickster subclasses add spellcasting at level 3)'
					: ''}. Spells from your species, feats or items still go below.
			</p>
			<label class="mt-2 flex items-center gap-2 text-sm">
				<span>Spellcasting ability for those spells</span>
				<select class="select w-40 select-sm" bind:value={ch.spells.ability}>
					<option value="">— choose —</option>
					{#each ABILITIES as ab (ab)}<option value={ab}>{AB_NAMES[ab]}</option>{/each}
				</select>
				{#if ch.spells.ability}<span class="text-base-content/70"
						>DC {s.dc} · attack {signed(s.atk)}</span
					>{/if}
			</label>
		</section>
	{:else}
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
				<div class="flex flex-col items-center">
					<span class="label-xs">Modifier</span><span class="num text-2xl">{signed(s.mod)}</span>
				</div>
				<Stat label="Save DC" value={s.dc} key="spellDc" />
				<Stat label="Spell attack" value={s.atk} key="spellAtk" sign />
				{#if s.cantrips !== null}<div class="flex flex-col items-center">
						<span class="label-xs">Cantrips</span><span class="num text-2xl"
							>{cantripCount}/{s.cantrips}</span
						>
					</div>{/if}
				{#if ch.classId === 'wizard'}<div
						class="flex flex-col items-center"
						title="Spells of level 1+ in your spellbook: six at level 1 and two more each level, plus any you copy"
					>
						<span class="label-xs">Spellbook</span><span class="num text-2xl"
							>{spellbookCount}/{6 + 2 * (ch.level - 1)}+</span
						>
					</div>{/if}
				{#if s.prepared !== null}<div class="flex flex-col items-center">
						<span class="label-xs">Prepared</span><span
							class="num text-2xl {preparedCount > s.prepared ? 'text-warning' : ''}"
							>{preparedCount}/{s.prepared}</span
						>
					</div>{/if}
			</div>

			{#if s.slots.some((n) => n > 0) || s.pact}
				<div class="mt-3 flex flex-wrap gap-x-6 gap-y-2 border-t border-base-300 pt-3">
					{#each s.slots as n, i (i)}
						{#if n > 0}
							<div class="flex flex-col items-center">
								<span class="label-xs">Level {i + 1}</span><span class="num text-xl">{n}</span>
							</div>
						{/if}
					{/each}
					{#if s.pact}
						<div class="flex flex-col items-center">
							<span class="label-xs">Pact slots · level {s.pact.level}</span><span
								class="num text-xl">{s.pact.n}</span
							>
						</div>
					{/if}
				</div>
			{:else}
				<p class="mt-2 text-sm text-base-content/60">
					Your class has no spell slots at this level. Spells from feats or species still go in the
					list below.
				</p>
			{/if}
			{#if PREP_RULE[ch.classId]}<p class="mt-3 text-xs text-base-content/65">
					{PREP_RULE[ch.classId]}
				</p>{/if}
		</section>
	{/if}

	{#if granted.length}
		<section class="panel" aria-labelledby="ap-h">
			<h2 id="ap-h" class="panel-title">
				Spells from your features <span
					class="font-sans text-xs font-normal tracking-normal text-base-content/50 normal-case"
					>they don't count against your prepared spells</span
				>
			</h2>
			<div class="overflow-x-auto">
				<table class="table min-w-[46rem] table-sm">
					<thead>
						<tr class="label-xs"
							><th class="w-12">Lvl</th><th>Name</th><th>Casting time</th><th>Range</th><th
								>Duration</th
							><th>Comp.</th><th>How</th><th>From</th></tr
						>
					</thead>
					<tbody>
						{#each granted as g (g.name)}
							<tr>
								<td class="num">{g.def ? (g.def.level === 0 ? 'C' : g.def.level) : '—'}</td>
								<td>
									<span class="font-semibold">{g.name}</span>
									{#if g.def && spellDamage(g.def)}
										{#if inAttacks(g.name)}<span
												class="text-success"
												title="In your attacks (Combat tab)"
												><Swords class="inline size-3.5" /></span
											>
										{:else}<button
												type="button"
												class="btn btn-ghost px-1 btn-xs"
												title="Add to attacks (Combat tab)"
												onclick={() => toAttack(g.name)}><Swords class="size-3.5" /></button
											>{/if}
									{/if}
									{#if g.def?.conc}<span class="tag ml-1">C</span>{/if}{#if g.def?.ritual}<span
											class="tag ml-1">R</span
										>{/if}
									{#if g.def}<p class="max-w-md text-xs text-base-content/65">{g.def.d}</p>{/if}
								</td>
								<td class="text-sm">{g.def?.time ?? ''}</td>
								<td class="text-sm">{g.def?.range ?? ''}</td>
								<td class="text-sm">{g.def?.duration ?? ''}</td>
								<td class="text-sm"
									>{g.def?.comp ?? ''}{#if g.def?.cost}<span
											class="ml-1 font-semibold text-secondary"
											>{g.def.cost} GP{g.def.consumed ? ' (used up)' : ''}</span
										>{/if}</td
								>
								<td class="text-xs whitespace-nowrap"
									>{g.def?.level === 0 ? 'Cantrip, known' : SPELL_KIND_LABEL[g.kind]}</td
								>
								<td class="text-xs text-base-content/60">{g.source}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	{/if}

	<section class="panel" aria-labelledby="sl-h">
		<div class="mb-2 flex items-center gap-2">
			<h2 id="sl-h" class="panel-title mb-0">
				{ch.classId === 'wizard' ? 'Cantrips & spellbook' : 'Cantrips & prepared spells'}
			</h2>
			<button
				type="button"
				class="btn ml-auto btn-sm"
				onclick={() => ch.spells.list.push(newSpell({ level: 1 }))}
				><Plus class="size-4" /> Spell</button
			>
		</div>
		{#if library.length}
			<div class="mb-3 rounded-box bg-base-200 p-2">
				<div class="flex flex-wrap items-center gap-2">
					<input
						class="input min-w-0 flex-1 input-sm"
						placeholder="Search {library.length} spells from your packs…"
						bind:value={query}
						aria-label="Search spells"
					/>
					<label class="flex items-center gap-1.5 text-sm"
						><input type="checkbox" class="checkbox checkbox-xs" bind:checked={classOnly} />
						{s.list ? listLabel : 'Class'} list{lists.length > 1 ? 's' : ''}</label
					>
					<label class="flex items-center gap-1.5 text-sm"
						><input type="checkbox" class="checkbox checkbox-xs" bind:checked={maxLevelOnly} /> Up
						to level {maxSpellLevel}</label
					>
				</div>
				<div class="mt-2 flex flex-wrap gap-1" role="tablist" aria-label="Spell level">
					<button
						type="button"
						role="tab"
						aria-selected={levelTab === 'all'}
						class="btn btn-xs {levelTab === 'all' ? 'btn-neutral' : 'btn-ghost'}"
						onclick={() => (levelTab = 'all')}>All {filtered.length}</button
					>
					{#each levelCounts as [lv, n] (lv)}
						<button
							type="button"
							role="tab"
							aria-selected={levelTab === lv}
							class="btn btn-xs {levelTab === lv ? 'btn-neutral' : 'btn-ghost'}"
							onclick={() => (levelTab = lv)}
							>{lv === 0 ? 'Cantrips' : `Level ${lv}`} <span class="opacity-60">{n}</span></button
						>
					{/each}
				</div>
				{#if true}
					<ul class="mt-2 flex max-h-96 flex-col overflow-y-auto">
						{#each matches as m (m.name)}
							<li>
								<button
									type="button"
									class="flex w-full items-baseline gap-2 rounded px-2 py-1 text-left text-sm hover:bg-base-100"
									onclick={() => addFromLibrary(m)}
								>
									<Plus class="size-3.5 shrink-0 translate-y-0.5" />
									<span class="font-semibold">{m.name}</span>
									<span class="text-xs text-base-content/60"
										>{m.level === 0 ? 'Cantrip' : `Level ${m.level}`} · {m.school}{m.conc
											? ' · C'
											: ''}{m.ritual ? ' · R' : ''}{m.cost
											? ` · ${m.cost} GP${m.consumed ? ' consumed' : ''}`
											: ''}</span
									>
									<span class="hidden truncate text-xs text-base-content/60 md:inline">{m.d}</span>
								</button>
							</li>
						{:else}
							<li class="px-2 py-1 text-sm text-base-content/60">
								No match. Untick the filters or check the spelling.
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{:else}
			<p class="mb-2 text-xs text-base-content/60">
				Load a content pack with spells (Packs) to search and add them with their details filled in.
			</p>
		{/if}
		{#if !sorted.length}<p class="py-4 text-center text-sm text-base-content/60">
				No spells yet.
			</p>{/if}
		<div class="overflow-x-auto">
			<table class="table min-w-[52rem] table-sm">
				<thead>
					<tr class="label-xs">
						<th class="w-14">Lvl</th><th>Name</th><th class="w-10" title="Prepared">Prep</th><th
							class="w-10"
							title="Always prepared">Alw</th
						><th>Casting time</th><th>Range</th><th>Duration</th><th
							class="w-10"
							title="Concentration">C</th
						><th class="w-10" title="Ritual">R</th><th>Comp.</th><th
							title="Gold cost of the Material component">Cost GP</th
						><th>Notes / page</th><th></th>
					</tr>
				</thead>
				{#each levels as lv (lv)}
					<tbody>
						<tr><td colspan="13" class="pt-3 font-display font-bold text-primary">{ord(lv)}</td></tr
						>
						{#each sorted.filter((x) => x.level === lv) as sp (sp.id)}
							<tr>
								<td
									><input
										type="number"
										min="0"
										max="9"
										class="num input w-12 input-xs"
										bind:value={sp.level}
									/></td
								>
								<td>
									<div class="flex items-center gap-1">
										<input
											class="input w-full min-w-36 font-semibold input-xs"
											bind:value={sp.name}
											placeholder="Spell name"
										/>
										<button
											type="button"
											class="btn btn-ghost px-1 btn-xs {sp.desc ? '' : 'opacity-40'}"
											title="Description"
											onclick={() => (openDesc[sp.id] = !openDesc[sp.id])}
											>{openDesc[sp.id] ? '▴' : '▾'}</button
										>
										{#if byName.get(sp.name.toLowerCase()) && spellDamage(byName.get(sp.name.toLowerCase())!)}
											{#if inAttacks(sp.name)}<span
													class="px-1 text-success"
													title="In your attacks (Combat tab)"><Swords class="size-3.5" /></span
												>
											{:else}<button
													type="button"
													class="btn btn-ghost px-1 btn-xs"
													title="Add to attacks (Combat tab), with its damage, to-hit or save DC"
													onclick={() => toAttack(sp.name)}><Swords class="size-3.5" /></button
												>{/if}
										{/if}
									</div>
								</td>
								<td
									><input
										type="checkbox"
										class="checkbox checkbox-xs"
										bind:checked={sp.prepared}
									/></td
								>
								<td
									><input
										type="checkbox"
										class="checkbox checkbox-xs"
										bind:checked={sp.always}
									/></td
								>
								<td><input class="input w-full min-w-24 input-xs" bind:value={sp.time} /></td>
								<td><input class="input w-full min-w-20 input-xs" bind:value={sp.range} /></td>
								<td><input class="input w-full min-w-24 input-xs" bind:value={sp.duration} /></td>
								<td
									><input type="checkbox" class="checkbox checkbox-xs" bind:checked={sp.conc} /></td
								>
								<td
									><input
										type="checkbox"
										class="checkbox checkbox-xs"
										bind:checked={sp.ritual}
									/></td
								>
								<td
									><input
										class="input w-20 input-xs"
										bind:value={sp.comp}
										title={sp.material}
									/></td
								>
								<td class="whitespace-nowrap">
									<input
										type="number"
										min="0"
										class="num input w-16 input-xs {sp.cost ? 'font-semibold text-secondary' : ''}"
										bind:value={sp.cost}
										title={sp.material || 'Material cost in GP'}
									/>
									{#if sp.consumed}<span
											class="text-[0.65rem] font-semibold text-warning"
											title="The spell consumes the material">USED UP</span
										>{/if}
								</td>
								<td><input class="input w-full min-w-40 input-xs" bind:value={sp.notes} /></td>
								<td
									><button
										type="button"
										class="btn btn-square btn-ghost btn-xs"
										aria-label="Delete {sp.name}"
										onclick={() => (ch.spells.list = ch.spells.list.filter((x) => x.id !== sp.id))}
										><Trash2 class="size-3.5" /></button
									></td
								>
							</tr>
							{#if openDesc[sp.id]}
								{@const full = rulesText(rulesKey('spell', sp.name))}
								<tr>
									<td></td>
									<td colspan="12">
										{#if sp.material}<p class="mb-1 text-xs text-base-content/70">
												<b>Material:</b>
												{sp.material}{sp.cost
													? ` (${sp.cost} GP${sp.consumed ? ', consumed' : ''})`
													: ''}
											</p>{/if}
										<textarea
											class="textarea w-full textarea-xs"
											rows="3"
											placeholder="What the spell does"
											bind:value={sp.desc}
										></textarea>
										{#if sp.school}<span class="text-xs text-base-content/50">{sp.school}</span
											>{/if}
										{#if full}<RulesText text={full} />{/if}
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
