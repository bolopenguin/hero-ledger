<script lang="ts">
	import { currentChar } from '$lib/current.svelte';
	import {
		activeFeats,
		armorClass,
		extraTraining,
		darkvision,
		getBackground,
		getClass,
		getSpecies,
		hpMax,
		initiative,
		makeCtx,
		mod,
		saves,
		scores,
		signed,
		skills,
		speed,
		startingChoices,
		toolProficiencies
	} from '$lib/calc';
	import { CLASSES } from '$lib/data/classes';
	import { AB_NAMES, ALIGNMENTS, ARMOR, BACKGROUNDS, SKILLS, SPECIES } from '$lib/data/srd';
	import { allPackSpecies, packs, packSubclasses } from '$lib/packs.svelte';
	import { ABILITIES, type Ab } from '$lib/types';
	import Stat from './Stat.svelte';
	import {
		ADV_TARGETS,
		advForSave,
		advForSkill,
		advLabel,
		advMarker,
		advantages,
		describe
	} from '$lib/advantage';
	import { uid } from '$lib/store.svelte';

	const ch = $derived(currentChar());
	const sc = $derived(scores(ch));
	const c = $derived(makeCtx(ch, sc));
	const cls = $derived(getClass(ch));
	const sp = $derived(getSpecies(ch));
	const bg = $derived(getBackground(ch));
	const sv = $derived(saves(ch, sc));
	const sk = $derived(skills(ch, sc));
	const ac = $derived(armorClass(ch, sc));
	const maxHp = $derived(hpMax(ch, sc));
	const packSubs = $derived(packSubclasses(ch.classId));
	const pSpecies = $derived(allPackSpecies());
	const pp = $derived(10 + (sk.perception?.value ?? 0) + (ch.bonus.pp ?? 0));
	// Advantage and disadvantage, shown next to each roll and listed under the skills.
	const adv = $derived(advantages(ch));
	const initAdv = $derived(advMarker(adv.filter((e) => e.target === 'init')));
	const saveMk = $derived(
		Object.fromEntries(ABILITIES.map((ab) => [ab, advMarker(advForSave(adv, ab))]))
	);
	const skillMk = $derived(
		Object.fromEntries(Object.keys(SKILLS).map((id) => [id, advMarker(advForSkill(adv, id))]))
	);
	let newAdv = $state({ target: 'stealth', mode: 'adv' as 'adv' | 'dis', cond: '' });
	function addAdv() {
		ch.advCustom = [...(ch.advCustom ?? []), { id: uid(), ...newAdv }];
		newAdv = { target: newAdv.target, mode: 'adv', cond: '' };
	}

	// Cycle what the player sees: none -> proficient -> expertise. Background skills are
	// always at least proficient, so for them the click toggles expertise on and off.
	function cycleSkill(id: string) {
		const eff = sk[id].prof;
		if (sk[id].fromBg || sk[id].fromFeature) ch.skills[id] = eff === 2 ? 0 : 2;
		else ch.skills[id] = (eff + 1) % 3;
	}
	function setBgAsi(mode: string) {
		const abs = bg?.abilities ?? [];
		if (mode === '111') ch.bgAsi = Object.fromEntries(abs.slice(0, 3).map((a) => [a, 1]));
		else ch.bgAsi = {};
	}
	const bgPoints = $derived(Object.values(ch.bgAsi).reduce((a, b) => a + (b ?? 0), 0));
	const bgAsiProblem = $derived.by(() => {
		if (!bg || !bgPoints) return '';
		const vals = Object.entries(ch.bgAsi).filter(([, v]) => v);
		if (vals.some(([, v]) => (v ?? 0) > 2)) return 'no score above +2';
		if (bg.freeAsi && !vals.some(([ab]) => bg.abilities.includes(ab as Ab)))
			return `put at least +1 on ${bg.abilities.map((a) => a.toUpperCase()).join(', ')}`;
		return '';
	});

	// Skill proficiencies the player picks by hand (background skills come automatically).
	const classSkillList = $derived(
		cls?.skills.list === 'any' ? null : new Set(cls?.skills.list ?? [])
	);
	const skillSources = $derived.by(() => {
		const out: [string, number][] = [];
		if (cls)
			out.push([
				`${cls.name}${cls.skills.list === 'any' ? ', any skills' : ', from the underlined skills'}`,
				cls.skills.n
			]);
		if (activeFeats(ch).some((f) => f.key === 'skill-expert' || f.key.endsWith(':skill-expert')))
			out.push(['Skill Expert feat: 1 skill', 1]);
		if (ch.classId === 'bard' && ch.subclassId === 'srd' && ch.level >= 3)
			out.push(['Bonus Proficiencies (Lore): 3 skills', 3]);
		return out;
	});
	const skillsExpected = $derived(skillSources.reduce((t, [, n]) => t + n, 0));
	const skillsPicked = $derived(
		Object.keys(SKILLS).filter(
			(id) => (ch.skills[id] ?? 0) >= 1 && !sk[id].fromBg && !sk[id].fromFeature
		).length
	);

	// Ability scores: recognise the standard array and point buy, and offer a class-based array.
	const POINT_COST: Record<number, number> = {
		8: 0,
		9: 1,
		10: 2,
		11: 3,
		12: 4,
		13: 5,
		14: 7,
		15: 9
	};
	const ARRAY = [15, 14, 13, 12, 10, 8];
	const PRIORITY: Record<string, Ab[]> = {
		barbarian: ['str', 'con', 'dex', 'wis', 'cha', 'int'],
		bard: ['cha', 'dex', 'con', 'wis', 'int', 'str'],
		cleric: ['wis', 'con', 'str', 'dex', 'cha', 'int'],
		druid: ['wis', 'con', 'dex', 'int', 'cha', 'str'],
		fighter: ['str', 'con', 'dex', 'wis', 'cha', 'int'],
		monk: ['dex', 'wis', 'con', 'str', 'int', 'cha'],
		paladin: ['str', 'cha', 'con', 'wis', 'dex', 'int'],
		ranger: ['dex', 'wis', 'con', 'str', 'int', 'cha'],
		rogue: ['dex', 'con', 'int', 'wis', 'cha', 'str'],
		sorcerer: ['cha', 'con', 'dex', 'wis', 'int', 'str'],
		warlock: ['cha', 'con', 'dex', 'wis', 'int', 'str'],
		wizard: ['int', 'con', 'dex', 'wis', 'cha', 'str']
	};
	const baseScores = $derived(ABILITIES.map((ab) => ch.abilities[ab]));
	const isArray = $derived([...baseScores].sort((a, b) => b - a).join() === ARRAY.join());
	const pointBuy = $derived(
		baseScores.every((v) => v in POINT_COST)
			? baseScores.reduce((t, v) => t + POINT_COST[v], 0)
			: null
	);
	function useArray() {
		const order = PRIORITY[ch.classId] ?? ABILITIES;
		order.forEach((ab, i) => (ch.abilities[ab] = ARRAY[i]));
	}
	function resetPointBuy() {
		for (const ab of ABILITIES) ch.abilities[ab] = 8;
	}

	const training = $derived(extraTraining(ch));
	const armorTraining = $derived(
		[...(cls?.armor ?? []), ...training.armor]
			.filter((a, i, arr) => arr.indexOf(a) === i)
			.map((a) => a[0].toUpperCase() + a.slice(1))
			.join(', ') || 'None'
	);
</script>

<div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
	<!-- Identity -->
	<section class="panel lg:col-span-2" aria-labelledby="identity-h">
		<h2 id="identity-h" class="sr-only">Identity</h2>
		<div class="grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
			<label class="flex flex-col sm:col-span-2">
				<span class="label-xs">Character name</span>
				<input
					id="char-name"
					class="line-input font-display text-2xl font-bold"
					bind:value={ch.name}
					placeholder="Unnamed hero"
				/>
			</label>
			<label class="flex flex-col">
				<span class="label-xs">Player</span>
				<input id="char-player" class="line-input" bind:value={ch.player} />
			</label>
			<div class="flex gap-3">
				<label class="flex w-20 flex-col">
					<span class="label-xs">Level</span>
					<input
						id="char-level"
						type="number"
						min="1"
						max="20"
						class="line-input num text-xl"
						bind:value={ch.level}
						onchange={() => (ch.level = Math.min(20, Math.max(1, Math.floor(ch.level || 1))))}
					/>
				</label>
				<label class="flex flex-1 flex-col">
					<span class="label-xs">XP</span>
					<input id="char-xp" type="number" min="0" class="line-input num" bind:value={ch.xp} />
				</label>
			</div>

			<label class="flex flex-col">
				<span class="label-xs">Class</span>
				<select
					id="char-class"
					class="select select-sm"
					bind:value={ch.classId}
					onchange={() => (ch.subclassId = '')}
				>
					{#each Object.entries(CLASSES) as [k, v] (k)}<option value={k}>{v.name}</option>{/each}
					<option value="custom">Custom class…</option>
				</select>
			</label>
			<label class="flex flex-col">
				<span class="label-xs"
					>Subclass {cls?.subLevels.length ? `(from level ${cls.subLevels[0]})` : ''}</span
				>
				<select id="char-subclass" class="select select-sm" bind:value={ch.subclassId}>
					<option value="">— none yet —</option>
					{#if cls?.sub.name}<option value="srd">{cls.sub.name}</option>{/if}
					{#each packSubs as s (s.key)}<option value={s.key}>{s.name} · {s.pack}</option>{/each}
					<option value="custom">Other subclass (write it in)…</option>
				</select>
			</label>
			<label class="flex flex-col">
				<span class="label-xs">Species</span>
				<select
					id="char-species"
					class="select select-sm"
					bind:value={ch.speciesId}
					onchange={() => (ch.lineage = '')}
				>
					{#each Object.entries(SPECIES) as [k, v] (k)}<option value={k}>{v.name}</option>{/each}
					{#each Object.entries(pSpecies) as [k, v] (k)}<option value={k}>{v.name}</option>{/each}
					<option value="custom">Custom species…</option>
				</select>
			</label>
			<label class="flex flex-col">
				<span class="label-xs">Background</span>
				<select
					id="char-bg"
					class="select select-sm"
					bind:value={ch.backgroundId}
					onchange={() => (ch.bgAsi = {})}
				>
					{#if packs.list.some((p) => Object.keys(p.backgrounds ?? {}).length)}
						<optgroup label="Built in">
							{#each Object.entries(BACKGROUNDS) as [k, v] (k)}<option value={k}>{v.name}</option
								>{/each}
						</optgroup>
						{#each packs.list.filter((p) => Object.keys(p.backgrounds ?? {}).length) as p (p.id)}
							<optgroup label={p.name}>
								{#each Object.entries(p.backgrounds ?? {}) as [k, v] (k)}<option
										value="pack:{p.id}:{k}">{v.name}</option
									>{/each}
							</optgroup>
						{/each}
					{:else}
						{#each Object.entries(BACKGROUNDS) as [k, v] (k)}<option value={k}>{v.name}</option
							>{/each}
					{/if}
					<option value="custom">Custom background…</option>
				</select>
			</label>

			{#if sp?.lineages}
				<label class="flex flex-col">
					<span class="label-xs">{sp.lineageLabel}</span>
					<select id="char-lineage" class="select select-sm" bind:value={ch.lineage}>
						<option value="">— choose —</option>
						{#each sp.lineages as l (l.id)}<option value={l.id}>{l.name}</option>{/each}
					</select>
				</label>
			{/if}
			<label class="flex flex-col">
				<span class="label-xs">Alignment</span>
				<input id="char-align" class="line-input" list="alignments" bind:value={ch.alignment} />
				<datalist id="alignments"
					>{#each ALIGNMENTS as a (a)}<option value={a}></option>{/each}</datalist
				>
			</label>

			{#if ch.classId === 'custom'}
				<div
					class="grid grid-cols-2 gap-2 rounded-box bg-base-200 p-2 sm:col-span-2 lg:col-span-4 lg:grid-cols-4"
				>
					<label class="flex flex-col text-xs"
						>Class name<input class="input input-sm" bind:value={ch.custom.className} /></label
					>
					<label class="flex flex-col text-xs"
						>Hit die
						<select class="select select-sm" bind:value={ch.custom.hd}
							>{#each [6, 8, 10, 12] as d (d)}<option value={d}>d{d}</option>{/each}</select
						>
					</label>
					<label class="flex flex-col text-xs"
						>Spellcasting
						<select class="select select-sm" bind:value={ch.custom.caster}>
							<option value="">None</option><option value="full">Full caster</option><option
								value="half">Half caster</option
							><option value="pact">Pact magic</option>
						</select>
					</label>
					<label class="flex flex-col text-xs"
						>Spell ability
						<select class="select select-sm" bind:value={ch.custom.castAbil}
							>{#each ABILITIES as a (a)}<option value={a}>{AB_NAMES[a]}</option>{/each}</select
						>
					</label>
					<p class="col-span-2 text-xs text-base-content/60 lg:col-span-4">
						Tick saving throw proficiencies below and add features in the Class & features tab.
					</p>
				</div>
			{/if}
			{#if ch.subclassId === 'custom'}
				<label class="flex flex-col text-xs sm:col-span-2"
					>Subclass name<input
						class="input input-sm"
						bind:value={ch.custom.subclassName}
						placeholder="e.g. Battle Master"
					/></label
				>
			{/if}
			{#if ch.speciesId === 'custom'}
				<div class="grid grid-cols-3 gap-2 rounded-box bg-base-200 p-2 sm:col-span-2">
					<label class="flex flex-col text-xs"
						>Species<input class="input input-sm" bind:value={ch.custom.speciesName} /></label
					>
					<label class="flex flex-col text-xs"
						>Size<input class="input input-sm" bind:value={ch.custom.size} /></label
					>
					<label class="flex flex-col text-xs"
						>Speed<input
							type="number"
							class="num input input-sm"
							bind:value={ch.custom.speed}
						/></label
					>
				</div>
			{/if}
			{#if ch.backgroundId === 'custom'}
				<label class="flex flex-col text-xs sm:col-span-2"
					>Background name<input
						class="input input-sm"
						bind:value={ch.custom.backgroundName}
					/></label
				>
			{/if}

			{#if bg}
				<div class="flex flex-wrap items-center gap-2 text-sm sm:col-span-2 lg:col-span-4">
					<span class="label-xs">Background ability scores</span>
					<span class="text-xs {bgAsiProblem ? 'text-warning' : 'text-base-content/60'}"
						>{bg.freeAsi
							? `+2 and +1, or +1/+1/+1: at least +1 to ${bg.abilities.map((a) => a.toUpperCase()).join(', ')} (one of them), the rest to any score`
							: `+2 and +1, or +1 to three of ${bg.abilities.map((a) => a.toUpperCase()).join(', ')}`}
						({bgPoints}/3){bgAsiProblem ? ` · ${bgAsiProblem}` : ''}</span
					>
					{#each bg.freeAsi ? ABILITIES : bg.abilities as ab (ab)}
						<label class="flex items-center gap-1">
							<span class="text-xs uppercase">{ab}</span>
							<select
								class="select w-14 select-xs"
								value={String(ch.bgAsi[ab] ?? 0)}
								onchange={(e) => (ch.bgAsi = { ...ch.bgAsi, [ab]: Number(e.currentTarget.value) })}
							>
								<option value="0">+0</option><option value="1">+1</option><option value="2"
									>+2</option
								>
							</select>
						</label>
					{/each}
					<button type="button" class="btn btn-ghost btn-xs" onclick={() => setBgAsi('111')}
						>+1 / +1 / +1</button
					>
				</div>
			{/if}
		</div>
	</section>

	<!-- Abilities, saves, skills -->
	<section class="panel" aria-labelledby="abilities-h">
		<h2 id="abilities-h" class="panel-title">Abilities · Saves · Skills</h2>
		<div class="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
			<span class="text-base-content/60">Base scores:</span>
			{#if isArray}<span class="tag">Standard array</span>
			{:else if pointBuy !== null}<span
					class="tag {pointBuy > 27 ? 'text-error' : ''}"
					title="Point buy: 8 costs 0, 13 costs 5, 14 costs 7, 15 costs 9"
					>Point buy {pointBuy}/27</span
				>
			{:else}<span class="tag">Rolled or custom</span>{/if}
			<button
				type="button"
				class="btn btn-ghost btn-xs"
				title="15, 14, 13, 12, 10, 8 placed where {cls?.name ?? 'your class'} usually wants them"
				onclick={useArray}>Standard array for {cls?.name ?? 'class'}</button
			>
			<button
				type="button"
				class="btn btn-ghost btn-xs"
				title="Set every score to 8 and spend 27 points"
				onclick={resetPointBuy}>Point buy from 8</button
			>
		</div>
		<div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
			{#each ABILITIES as ab (ab)}
				{@const s = sc[ab]}
				<div class="flex flex-col items-center rounded-box border border-base-300 p-2">
					<span class="label-xs">{AB_NAMES[ab]}</span>
					<span class="num text-3xl leading-tight" title={['Base ' + s.base, ...s.parts].join('\n')}
						>{signed(mod(s.total))}</span
					>
					<div class="flex items-center gap-1 text-xs">
						<span class="text-base-content/60">score</span>
						<input
							type="number"
							min="1"
							max="30"
							class="num input w-14 text-center input-xs"
							title="Base score (before background and feats)"
							bind:value={ch.abilities[ab]}
						/>
						{#if s.total !== s.base}<span class="num text-accent" title={s.parts.join('\n')}
								>→ {s.total}</span
							>{/if}
					</div>
					<label class="mt-1 flex items-center gap-1.5 text-sm">
						<input
							type="checkbox"
							class="checkbox checkbox-xs checkbox-primary"
							checked={sv[ab].prof}
							disabled={sv[ab].auto}
							title={sv[ab].auto ? 'From your class' : 'Proficient'}
							onchange={(e) => (ch.saveProf[ab] = e.currentTarget.checked)}
						/>
						Save <span class="num font-semibold">{signed(sv[ab].value)}</span>
						{#if saveMk[ab]}<span
								class="text-[0.65rem] font-bold {saveMk[ab]?.mode === 'dis'
									? 'text-error'
									: 'text-success'}"
								title={advForSave(adv, ab).map(describe).join('\n')}>{saveMk[ab]?.text}</span
							>{/if}
					</label>
				</div>
			{/each}
		</div>

		<ul class="mt-3 columns-1 gap-4 sm:columns-2">
			{#each Object.entries(SKILLS) as [id, s] (id)}
				{@const v = sk[id]}
				<li class="flex break-inside-avoid items-center gap-2 py-0.5 text-sm">
					<button
						type="button"
						class="size-4 shrink-0 rounded-full border-2 {v.prof === 2
							? 'border-secondary bg-secondary ring-2 ring-secondary ring-offset-1'
							: v.prof === 1
								? 'border-primary bg-primary'
								: 'border-base-content/40'}"
						title={v.fromBg || v.fromFeature
							? `Proficient from ${v.fromBg ? 'background' : v.fromFeature}. Click to toggle Expertise (PB added twice).`
							: 'Click: none → proficient → Expertise (PB added twice)'}
						aria-label="{s.name} proficiency"
						onclick={() => cycleSkill(id)}
					></button>
					<span class="num w-8 text-right font-semibold">{signed(v.value)}</span>
					<span
						class={classSkillList?.has(id)
							? 'underline decoration-primary/60 decoration-dotted underline-offset-2'
							: ''}
						title={classSkillList?.has(id) ? `${cls?.name} can choose this skill` : undefined}
						>{s.name}</span
					>
					{#if v.prof === 2}<span
							class="text-[0.65rem] font-semibold text-secondary"
							title="Expertise: Proficiency Bonus added twice">EXP</span
						>{/if}
					<span class="text-[0.65rem] text-base-content/45 uppercase">{s.ab}</span>
					{#if v.fromBg}<span class="text-[0.65rem] text-secondary" title="From background">BG</span
						>{/if}
					{#if v.fromFeature}<span
							class="text-[0.65rem] text-info"
							title="Chosen in {v.fromFeature} (Class & features tab)">FEAT</span
						>{/if}
					{#if v.fromChoice}<span
							class="text-[0.65rem] text-accent"
							title="Expertise chosen in a feature or feat">CHOSEN</span
						>{/if}
					{#if v.extra.length}<span class="text-[0.65rem] text-accent" title={v.extra.join(', ')}
							>+</span
						>{/if}
					{#if skillMk[id]}<span
							class="text-[0.65rem] font-bold {skillMk[id]?.mode === 'dis'
								? 'text-error'
								: 'text-success'}"
							title={advForSkill(adv, id).map(describe).join('\n')}>{skillMk[id]?.text}</span
						>{/if}
				</li>
			{/each}
		</ul>
		<p class="mt-2 flex flex-wrap items-center gap-x-3 text-xs text-base-content/55">
			<span class="flex items-center gap-1"
				><span class="inline-block size-3 rounded-full border-2 border-base-content/40"
				></span>none</span
			>
			<span class="flex items-center gap-1"
				><span class="inline-block size-3 rounded-full bg-primary"></span>proficient (+PB)</span
			>
			<span class="flex items-center gap-1"
				><span
					class="inline-block size-3 rounded-full bg-secondary ring-2 ring-secondary ring-offset-1"
				></span>Expertise (+2×PB)</span
			>
		</p>
		<p class="mt-1 text-xs">
			<span
				class="font-semibold {skillsPicked === skillsExpected
					? 'text-success'
					: skillsPicked > skillsExpected
						? 'text-warning'
						: ''}">Skills picked: {skillsPicked}/{skillsExpected}</span
			>
			<span class="text-base-content/55"
				>· {skillSources.map(([t, n]) => `${t} (${n})`).join(' · ')}{bg
					? ` · background skills, and skills chosen in species traits and feats (Class & features tab), are added for you`
					: ''}</span
			>
		</p>
		<div class="mt-3 border-t border-base-300 pt-2">
			<h3 class="label-xs">Advantage & disadvantage</h3>
			{#if adv.length}
				<ul class="mt-1 flex flex-col gap-0.5 text-sm">
					{#each adv as e, i (i)}
						<li class="flex items-baseline gap-2">
							<span
								class="w-8 shrink-0 text-[0.65rem] font-bold {e.mode === 'dis'
									? 'text-error'
									: 'text-success'}">{e.mode.toUpperCase()}</span
							>
							<span
								><b>{advLabel(e.target)}</b>{e.cond ? ` ${e.cond}` : ''}
								<span class="text-xs text-base-content/55">· {e.source}</span></span
							>
							{#if e.source === 'Your note'}
								<button
									type="button"
									class="btn ml-auto btn-ghost btn-xs"
									aria-label="Remove"
									onclick={() =>
										(ch.advCustom = ch.advCustom.filter(
											(c) =>
												!(
													c.target === e.target &&
													c.mode === e.mode &&
													(c.cond || undefined) === e.cond
												)
										))}>×</button
								>
							{/if}
						</li>
					{/each}
				</ul>
				<p class="mt-1 text-xs text-base-content/50">
					ADV/DIS = always; adv*/dis* next to a roll = only in that situation. Hover a marker to see
					why.
				</p>
			{:else}
				<p class="text-xs text-base-content/55">Nothing from your class, species or feats.</p>
			{/if}
			<div class="mt-2 flex flex-wrap items-center gap-1.5 text-sm">
				<span class="text-xs text-base-content/60">Add your own:</span>
				<select
					class="select select-xs"
					bind:value={newAdv.mode}
					aria-label="Advantage or disadvantage"
					><option value="adv">Advantage</option><option value="dis">Disadvantage</option></select
				>
				<select class="select select-xs" bind:value={newAdv.target} aria-label="On which roll"
					>{#each ADV_TARGETS as t (t)}<option value={t}>{advLabel(t)}</option>{/each}</select
				>
				<input
					class="input min-w-0 flex-1 input-xs"
					placeholder="when (optional), e.g. in dim light"
					bind:value={newAdv.cond}
				/>
				<button type="button" class="btn btn-xs" onclick={addAdv}>Add</button>
			</div>
		</div>
	</section>

	<div class="flex flex-col gap-3">
		<!-- Combat numbers -->
		<section class="panel" aria-labelledby="combat-h">
			<h2 id="combat-h" class="panel-title">In combat</h2>
			<div class="grid grid-cols-3 gap-y-3 sm:grid-cols-6">
				<Stat label="Armor Class" value={ac.value} key="ac" parts={ac.parts} />
				<div class="flex flex-col items-center">
					<Stat label="Initiative" value={initiative(ch, sc)} key="init" sign />
					{#if initAdv}<span
							class="text-[0.65rem] font-bold {initAdv.mode === 'dis'
								? 'text-error'
								: 'text-success'}"
							title={adv
								.filter((e) => e.target === 'init')
								.map(describe)
								.join('\n')}>{initAdv.text}</span
						>{/if}
				</div>
				<Stat label="Speed" value={speed(ch)} key="speed" suffix=" ft" />
				<Stat label="Prof. bonus" value={c.pb} key="pb" sign />
				<Stat label="Passive Perc." value={pp} key="pp" />
				<div class="flex flex-col items-center text-center">
					<span class="label-xs">Size</span>
					<span class="text-lg">{sp?.size ?? '—'}</span>
				</div>
			</div>
			<div
				class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-base-300 pt-2 text-sm"
			>
				<label class="flex items-center gap-2"
					><span class="label-xs">Armor</span>
					<select class="select w-44 select-xs" bind:value={ch.gear.armor}>
						<option value="">None</option>
						{#each ['light', 'medium', 'heavy'] as t (t)}
							<optgroup label="{t[0].toUpperCase()}{t.slice(1)} armor">
								{#each Object.entries(ARMOR).filter(([, a]) => a.type === t) as [k, a] (k)}<option
										value={k}>{a.name}</option
									>{/each}
							</optgroup>
						{/each}
					</select></label
				>
				<label class="flex items-center gap-2"
					><input type="checkbox" class="checkbox checkbox-xs" bind:checked={ch.gear.shield} /> Shield
					(+2 AC)</label
				>
				<span class="text-xs text-base-content/55">{ac.parts.join(' · ')}</span>
			</div>
			{#if darkvision(ch) || ac.stealthDis}
				<p class="mt-2 text-xs text-base-content/65">
					{#if darkvision(ch)}Darkvision {darkvision(ch)} ft.{/if}
					{#if ac.stealthDis}Armor: disadvantage on Stealth.{/if}
					{#if ac.strReq && sc.str.total < ac.strReq}<span class="text-warning"
							>Needs Str {ac.strReq}: −10 ft Speed.</span
						>{/if}
				</p>
			{/if}

			<div class="mt-3 flex flex-wrap items-end gap-x-8 gap-y-2 border-t border-base-300 pt-3">
				<Stat label="Max HP" value={maxHp} key="hpMax" />
				<div class="flex flex-col items-center">
					<span class="label-xs">Hit dice</span>
					<span class="num text-lg">{ch.level} × d{cls?.hd ?? 8}</span>
				</div>
				<p class="max-w-md text-xs text-base-content/60">
					Current and temporary HP, hit dice spent, death saves, Heroic Inspiration and Exhaustion
					are printed empty on the PDF, to fill in during play.
				</p>
			</div>
		</section>

		<!-- Proficiencies -->
		<section class="panel" aria-labelledby="prof-h">
			<h2 id="prof-h" class="panel-title">Training & proficiencies</h2>
			<dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
				<dt class="label-xs pt-1">Armor</dt>
				<dd>
					<span class="text-base-content/70">{armorTraining}</span>
					<input class="line-input" placeholder="extra armor training" bind:value={ch.prof.armor} />
				</dd>
				<dt class="label-xs pt-1">Weapons</dt>
				<dd>
					<span class="text-base-content/70"
						>{[cls?.weapons, ...training.weapons].filter(Boolean).join(', ') || '—'}</span
					>
					<input
						class="line-input"
						placeholder="extra weapon training"
						bind:value={ch.prof.weapons}
					/>
				</dd>
				<dt class="label-xs pt-1">Tools</dt>
				<dd>
					<span class="text-base-content/70">{toolProficiencies(ch).join(', ') || '—'}</span>
					{#if startingChoices(ch).some((cd) => (ch.choices[cd.key]?.length ?? 0) < cd.count)}
						<a href="#features" class="link text-xs text-warning"
							>Skills and tools still to choose: Class & features tab</a
						>
					{/if}
					<input class="line-input" placeholder="other tools" bind:value={ch.prof.tools} />
				</dd>
				<dt class="label-xs pt-1">Languages</dt>
				<dd>
					<input
						class="line-input"
						bind:value={ch.prof.languages}
						placeholder="Common + 2 of your choice"
						title="Every character knows Common and two more languages of your choice"
					/>
					{#if !ch.prof.languages.includes(',')}<span class="text-xs text-base-content/55"
							>Every character knows Common and two more languages of your choice.</span
						>{/if}
				</dd>
				<dt class="label-xs pt-1">Senses</dt>
				<dd>
					<input
						class="line-input"
						placeholder="Blindsight, Tremorsense…"
						bind:value={ch.prof.senses}
					/>
				</dd>
			</dl>
		</section>
	</div>
</div>
