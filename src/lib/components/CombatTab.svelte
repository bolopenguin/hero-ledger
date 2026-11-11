<script lang="ts">
	import { ChevronDown, ChevronUp, Copy, Plus, Trash2, Swords, Info } from 'lucide-svelte';
	import { currentChar } from '$lib/current.svelte';
	import {
		attack,
		attackFromSpell,
		autoRiders,
		features,
		grantedSpells,
		hitText,
		masteredWeapons,
		scores,
		signed,
		spellDamage
	} from '$lib/calc';
	import { allPackSpells } from '$lib/packs.svelte';
	import { AB_NAMES, ACTION_LABELS, MASTERIES, WEAPONS } from '$lib/data/srd';
	import { newAttack, uid } from '$lib/store.svelte';
	import { ABILITIES, type Attack, type Rider } from '$lib/types';
	import FeatureCard from './FeatureCard.svelte';
	import RightNow from './RightNow.svelte';

	const ch = $derived(currentChar());
	const sc = $derived(scores(ch));
	const auto = $derived(autoRiders(ch, sc));
	const mastered = $derived(masteredWeapons(ch));
	const feats = $derived(features(ch).filter((f) => !f.hidden));
	let open = $state<Record<string, boolean>>({});

	function applyWeapon(a: Attack, key: string) {
		a.weapon = key;
		const w = WEAPONS[key];
		if (!w) return;
		a.name = w.name;
		a.kind = w.kind;
		a.dice = w.dice;
		a.versatile = w.versatile ?? '';
		a.type = w.type;
		a.mastery = w.mastery;
		a.props = w.props.join(', ');
		a.range = w.range ?? '';
		a.twoHanded = false;
	}
	function add(kind: Attack['kind']) {
		const a = newAttack(
			kind === 'spell'
				? { name: 'Spell attack', kind: 'spell', dice: '1d10', type: '', addMod: false }
				: {}
		);
		ch.attacks.push(a);
		open[a.id] = true;
	}
	// Damaging spells the character has (own list and always-prepared), not yet in the attacks.
	const spellOptions = $derived.by(() => {
		const lib = new Map(allPackSpells().map((d) => [d.name.toLowerCase(), d]));
		const have = new Set(ch.attacks.map((a) => (a.spell ?? a.name).toLowerCase()));
		const names = [...ch.spells.list.map((x) => x.name), ...grantedSpells(ch).map((g) => g.name)];
		const seen = new Set<string>();
		return names
			.map((n) => lib.get(n.toLowerCase()))
			.filter(
				(d): d is NonNullable<typeof d> =>
					!!d && !!spellDamage(d) && !have.has(d.name.toLowerCase())
			)
			.filter((d) => !seen.has(d.name) && !!seen.add(d.name))
			.sort((x, y) => x.level - y.level || x.name.localeCompare(y.name));
	});
	function addSpell(name: string) {
		if (name === '__blank') return add('spell');
		const d = allPackSpells().find((x) => x.name === name);
		const p = d && attackFromSpell(ch, d);
		if (p) ch.attacks.push(newAttack(p));
	}
	function duplicate(a: Attack) {
		const i = ch.attacks.indexOf(a);
		const b = { ...$state.snapshot(a), id: uid(), name: a.name + ' (variant)' } as Attack;
		ch.attacks.splice(i + 1, 0, b);
		open[b.id] = true;
	}
	function move(a: Attack, d: number) {
		const i = ch.attacks.indexOf(a);
		const j = i + d;
		if (j < 0 || j >= ch.attacks.length) return;
		ch.attacks.splice(i, 1);
		ch.attacks.splice(j, 0, a);
	}
	function addRider() {
		ch.riders.push({
			id: uid(),
			name: 'New rider',
			dmg: '1d6',
			type: '',
			hit: 0,
			applies: 'weapon',
			when: ''
		});
	}
	const groups: { a: string; label: string }[] = [
		{ a: 'action', label: ACTION_LABELS.action },
		{ a: 'bonus', label: ACTION_LABELS.bonus },
		{ a: 'reaction', label: ACTION_LABELS.reaction },
		{ a: 'special', label: 'Special & on-hit' }
	];
	const appliesLabel: Record<Rider['applies'], string> = {
		melee: 'Melee',
		ranged: 'Ranged',
		weapon: 'Any weapon',
		spell: 'Spells',
		all: 'Everything'
	};
</script>

<section class="panel mb-3" aria-label="Right now"><RightNow /></section>

<div class="grid gap-3">
	<section class="panel" aria-labelledby="attacks-h">
		<div class="mb-2 flex flex-wrap items-center gap-2">
			<h2 id="attacks-h" class="panel-title mb-0">Attacks</h2>
			<span class="text-xs text-base-content/60"
				>Tick the riders that apply in this situation to see the full damage.</span
			>
			<span class="ml-auto flex gap-1">
				<button type="button" class="btn btn-sm" onclick={() => add('melee')}
					><Plus class="size-4" /> Weapon</button
				>
				<select
					class="select w-44 select-sm"
					aria-label="Add a spell attack"
					value=""
					onchange={(e) => {
						addSpell(e.currentTarget.value);
						e.currentTarget.value = '';
					}}
				>
					<option value="" disabled>+ Spell attack…</option>
					{#each spellOptions as d (d.name)}<option value={d.name}
							>{d.name} ({d.level ? `level ${d.level}` : 'cantrip'})</option
						>{/each}
					<option value="__blank">Blank spell attack</option>
				</select>
			</span>
		</div>

		{#if !ch.attacks.length}
			<p class="py-6 text-center text-sm text-base-content/60">
				No attacks yet. Add a weapon or a spell attack.
			</p>
		{/if}

		<div class="flex flex-col gap-2">
			{#each ch.attacks as a (a.id)}
				{@const r = attack(ch, a, sc)}
				<article class="rounded-box border border-base-300">
					<header class="flex flex-wrap items-center gap-x-3 gap-y-1 p-2.5">
						<button
							type="button"
							class="flex min-w-0 flex-1 items-baseline gap-2 text-left"
							onclick={() => (open[a.id] = !open[a.id])}
							aria-expanded={!!open[a.id]}
						>
							<span class="truncate font-display text-lg font-bold">{a.name || 'Unnamed'}</span>
							<span
								class="num text-lg font-semibold text-primary"
								title="{AB_NAMES[r.ability]}{a.proficient ? ' + proficiency' : ''}"
								>{r.dc !== null ? hitText(a, r) : signed(r.toHit)}</span
							>
							<span class="num text-sm">{r.base}</span>
							<span class="text-sm text-base-content/60">{a.type}</span>
						</button>
						{#if a.mastery}<span
								class="tag {mastered.has(a.weapon) ? '' : 'line-through opacity-60'}"
								title={mastered.has(a.weapon)
									? (MASTERIES[a.mastery] ?? '')
									: 'You can use this mastery only if you pick this weapon in Weapon Mastery (Class tab)'}
								>{a.mastery}</span
							>{/if}
						{#if a.range}<span class="text-xs text-base-content/60">{a.range}</span>{/if}
						<button
							type="button"
							class="btn btn-square btn-ghost btn-xs"
							title="Edit"
							onclick={() => (open[a.id] = !open[a.id])}
						>
							{#if open[a.id]}<ChevronUp class="size-4" />{:else}<ChevronDown class="size-4" />{/if}
						</button>
					</header>

					<div class="border-t border-base-300 px-2.5 py-2">
						{#if a.versatile}
							<label class="mb-1 flex items-center gap-2 text-sm">
								<input
									type="checkbox"
									class="toggle toggle-primary toggle-xs"
									bind:checked={a.twoHanded}
								/>
								Two hands (Versatile {a.versatile})
							</label>
						{/if}
						{#if r.riders.length}
							<ul class="flex flex-col gap-0.5">
								{#each r.riders as x (x.r.id)}
									<li class="flex items-baseline gap-2 text-sm">
										<label class="flex min-w-0 flex-1 items-baseline gap-2">
											<input
												type="checkbox"
												class="checkbox translate-y-0.5 checkbox-xs checkbox-primary"
												checked={x.on}
												disabled={!!x.r.state}
												title={x.r.state ? 'Turn it on with the switches at the top' : ''}
												onchange={(e) => (a.riders[x.r.id] = e.currentTarget.checked)}
											/>
											<span class="font-medium">{x.r.name}</span>
											<span class="num"
												>{x.r.dmg ? '+' + x.r.dmg : ''}{x.r.hit
													? ` ${signed(x.r.hit)} to hit`
													: ''}</span
											>
											<span class="truncate text-xs text-base-content/55"
												>{x.r.type} {x.r.when ? '· ' + x.r.when : ''}</span
											>
										</label>
									</li>
								{/each}
							</ul>
						{/if}
						<p class="mt-1.5 flex flex-wrap items-baseline gap-x-3 text-sm">
							<span
								><span class="label-xs">{r.dc !== null ? 'Save' : 'Hit'}</span>
								<span class="num font-semibold"
									>{r.dc !== null ? hitText(a, r) : signed(r.toHit)}</span
								></span
							>
							<span
								><span class="label-xs">Damage</span>
								<span class="num font-semibold">{r.total}</span>
								<span class="text-base-content/60">{r.types}</span></span
							>
							<span class="text-base-content/60"
								>avg <span class="num">{r.avg.toFixed(1)}</span></span
							>
							{#if r.dc === null}<span class="text-base-content/60"
									>crit{r.critOn < 20 ? ` on ${r.critOn}–20` : ''}:
									<span class="num">{r.crit}</span></span
								>{/if}
						</p>
						{#if a.notes}<p class="mt-1 text-sm text-base-content/70">{a.notes}</p>{/if}
						{#if a.mastery && MASTERIES[a.mastery] && mastered.has(a.weapon)}<p
								class="mt-1 text-xs text-base-content/60"
							>
								<b>{a.mastery}:</b>
								{MASTERIES[a.mastery]}
							</p>{/if}
						{#if r.error}<p class="mt-1 text-xs text-error">
								{r.error}. Write dice like 1d8, 2d6+1 or {'{pb}'}.
							</p>{/if}
					</div>

					{#if open[a.id]}
						<div
							class="grid grid-cols-2 gap-2 border-t border-base-300 bg-base-200 p-2.5 text-xs sm:grid-cols-4"
						>
							<label class="col-span-2 flex flex-col"
								>Name<input class="input input-sm" bind:value={a.name} /></label
							>
							<label class="col-span-2 flex flex-col"
								>Weapon template
								<select
									class="select select-sm"
									value={a.weapon}
									onchange={(e) => applyWeapon(a, e.currentTarget.value)}
								>
									<option value="">Custom</option>
									<optgroup label="Simple"
										>{#each Object.entries(WEAPONS).filter(([, w]) => w.cat === 'simple') as [k, w] (k)}<option
												value={k}>{w.name}</option
											>{/each}</optgroup
									>
									<optgroup label="Martial"
										>{#each Object.entries(WEAPONS).filter(([, w]) => w.cat === 'martial') as [k, w] (k)}<option
												value={k}>{w.name}</option
											>{/each}</optgroup
									>
								</select>
							</label>
							<label class="flex flex-col"
								>Kind
								<select class="select select-sm" bind:value={a.kind}
									><option value="melee">Melee</option><option value="ranged">Ranged</option><option
										value="spell">Spell</option
									></select
								>
							</label>
							<label class="flex flex-col"
								>Ability
								<select class="select select-sm" bind:value={a.ability}>
									<option value="auto">Auto ({r.ability.toUpperCase()})</option>
									{#each ABILITIES as ab (ab)}<option value={ab}>{AB_NAMES[ab]}</option>{/each}
								</select>
							</label>
							<label class="flex flex-col"
								>Roll
								<select class="select select-sm" bind:value={a.save}>
									<option value="">Attack roll</option>
									{#each ABILITIES as ab (ab)}<option value={ab}>{AB_NAMES[ab]} save (DC)</option
										>{/each}
								</select>
							</label>
							<label class="flex flex-col"
								>Damage dice<input
									class="num input input-sm"
									bind:value={a.dice}
									placeholder="1d8"
								/></label
							>
							<label class="flex flex-col"
								>Versatile dice<input
									class="num input input-sm"
									bind:value={a.versatile}
									placeholder="—"
								/></label
							>
							<label class="flex flex-col"
								>Damage type<input class="input input-sm" bind:value={a.type} /></label
							>
							<label class="flex flex-col"
								>Magic bonus (+hit, +dmg)<input
									type="number"
									class="num input input-sm"
									bind:value={a.magic}
								/></label
							>
							<label class="flex flex-col"
								>Other to-hit bonus<input
									type="number"
									class="num input input-sm"
									bind:value={a.hitMisc}
								/></label
							>
							<label class="flex flex-col"
								>Other damage<input
									class="num input input-sm"
									bind:value={a.dmgMisc}
									placeholder="e.g. 2 or 1d4"
								/></label
							>
							<label class="flex flex-col"
								>Mastery
								<select class="select select-sm" bind:value={a.mastery}
									><option value="">—</option>{#each Object.keys(MASTERIES) as m (m)}<option
											value={m}>{m}</option
										>{/each}</select
								>
							</label>
							<label class="flex flex-col"
								>Range<input class="input input-sm" bind:value={a.range} /></label
							>
							<label class="col-span-2 flex flex-col"
								>Properties<input class="input input-sm" bind:value={a.props} /></label
							>
							<label class="flex items-center gap-2 self-end pb-1"
								><input type="checkbox" class="checkbox checkbox-xs" bind:checked={a.proficient} /> Proficient</label
							>
							<label class="flex items-center gap-2 self-end pb-1"
								><input type="checkbox" class="checkbox checkbox-xs" bind:checked={a.addMod} /> Add ability
								mod to damage</label
							>
							<label class="col-span-2 flex flex-col sm:col-span-4"
								>Notes<input class="input input-sm" bind:value={a.notes} /></label
							>
							<div class="col-span-2 flex gap-1 sm:col-span-4">
								<button type="button" class="btn btn-xs" onclick={() => move(a, -1)}>Move up</button
								>
								<button type="button" class="btn btn-xs" onclick={() => move(a, 1)}
									>Move down</button
								>
								<button type="button" class="btn btn-xs" onclick={() => duplicate(a)}
									><Copy class="size-3" /> Duplicate as variant</button
								>
								<button
									type="button"
									class="btn ml-auto btn-outline btn-error btn-xs"
									onclick={() => (ch.attacks = ch.attacks.filter((x) => x.id !== a.id))}
									><Trash2 class="size-3" /> Delete</button
								>
							</div>
						</div>
					{/if}
				</article>
			{/each}
		</div>

		<!-- Riders -->
		<div class="mt-4 border-t border-base-300 pt-3">
			<div class="mb-2 flex items-center gap-2">
				<h3 class="panel-title mb-0">Damage riders</h3>
				<span class="text-xs text-base-content/60"
					>Extra damage that only applies sometimes. Each attack can switch them on or off.</span
				>
				<button type="button" class="btn ml-auto btn-sm" onclick={addRider}
					><Plus class="size-4" /> Rider</button
				>
			</div>
			{#if auto.length}
				<ul class="mb-2 flex flex-col gap-1 text-sm">
					{#each auto as x (x.id)}
						<li class="flex flex-wrap items-baseline gap-x-2">
							<Info class="size-3.5 translate-y-0.5 text-base-content/40" />
							<span class="font-medium">{x.name}</span>
							<span class="num"
								>{x.dmg ? '+' + x.dmg : ''} {x.hit ? signed(x.hit) + ' to hit' : ''}</span
							>
							<span class="text-base-content/60">{x.type}</span>
							<span class="tag">{appliesLabel[x.applies]}</span>
							<span class="text-xs text-base-content/55"
								>{x.when} · from your class/species/feats</span
							>
						</li>
					{/each}
				</ul>
			{/if}
			<div class="flex flex-col gap-2">
				{#each ch.riders as x (x.id)}
					<div class="grid grid-cols-2 gap-2 rounded-box bg-base-200 p-2 text-xs sm:grid-cols-6">
						<label class="col-span-2 flex flex-col"
							>Name<input class="input input-sm" bind:value={x.name} /></label
						>
						<label class="flex flex-col"
							>Extra damage<input
								class="num input input-sm"
								bind:value={x.dmg}
								placeholder="1d6 or {'{pb}'}"
							/></label
						>
						<label class="flex flex-col"
							>Type<input class="input input-sm" bind:value={x.type} /></label
						>
						<label class="flex flex-col"
							>To-hit<input type="number" class="num input input-sm" bind:value={x.hit} /></label
						>
						<label class="flex flex-col"
							>Applies to
							<select class="select select-sm" bind:value={x.applies}
								>{#each Object.entries(appliesLabel) as [k, v] (k)}<option value={k}>{v}</option
									>{/each}</select
							>
						</label>
						<label class="col-span-2 flex flex-col sm:col-span-5"
							>When<input
								class="input input-sm"
								bind:value={x.when}
								placeholder="e.g. while concentrating on Hex"
							/></label
						>
						<button
							type="button"
							class="btn self-end btn-outline btn-error btn-xs"
							onclick={() => (ch.riders = ch.riders.filter((y) => y.id !== x.id))}
							><Trash2 class="size-3" /> Remove</button
						>
					</div>
				{/each}
			</div>
		</div>
	</section>
</div>
