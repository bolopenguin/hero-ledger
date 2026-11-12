<script lang="ts">
	import { ChevronDown, ChevronUp, Info, Trash2 } from 'lucide-svelte';
	import { currentChar } from '$lib/current.svelte';
	import {
		allAttacks,
		attack,
		attackFromSpell,
		autoRiders,
		availableStates,
		grantedSpells,
		hitText,
		masteredWeapons,
		scores,
		signed,
		spellDamage,
		stateSummary
	} from '$lib/calc';
	import { allPackSpells } from '$lib/packs.svelte';
	import { AB_NAMES, MASTERIES } from '$lib/data/srd';
	import { newAttack } from '$lib/store.svelte';
	import type { Rider } from '$lib/types';
	import AttackEditor from './AttackEditor.svelte';

	const ch = $derived(currentChar());
	const sc = $derived(scores(ch));
	const auto = $derived(autoRiders(ch, sc).filter((x) => !x.state));
	const situational = $derived(availableStates(ch, sc));
	const mastered = $derived(masteredWeapons(ch));
	const attacks = $derived(allAttacks(ch));
	/** Spell attacks are edited here; weapons are edited in the Inventory. */
	const own = $derived(new Set(ch.attacks.map((x) => x.id)));
	let open = $state<Record<string, boolean>>({});

	function addBlank() {
		const a = newAttack({
			name: 'Spell attack',
			kind: 'spell',
			dice: '1d10',
			type: '',
			addMod: false
		});
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
		if (name === '__blank') return addBlank();
		const d = allPackSpells().find((x) => x.name === name);
		const p = d && attackFromSpell(ch, d);
		if (p) ch.attacks.push(newAttack(p));
	}
	const appliesLabel: Record<Rider['applies'], string> = {
		melee: 'Melee',
		ranged: 'Ranged',
		weapon: 'Any weapon',
		spell: 'Spells',
		all: 'Everything'
	};
</script>

<div class="grid gap-3">
	<section class="panel" aria-labelledby="attacks-h">
		<div class="mb-2 flex flex-wrap items-center gap-2">
			<h2 id="attacks-h" class="panel-title mb-0">Attacks</h2>
			<span class="text-xs text-base-content/60"
				>Your equipped weapons (set them up in the Inventory) and your spell attacks. Damage counts
				bonuses that always apply; extra damage that only applies sometimes is listed under the
				attack.</span
			>
			<select
				class="select ml-auto w-44 select-sm"
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
		</div>

		{#if !attacks.length}
			<p class="py-6 text-center text-sm text-base-content/60">
				No attacks yet. Equip a weapon in the Inventory tab, or add a spell attack.
			</p>
		{/if}

		<div class="flex flex-col gap-2">
			{#each attacks as a (a.id)}
				{@const r = attack(ch, a, sc)}
				<article class="rounded-box border border-base-300">
					<header class="flex flex-wrap items-center gap-x-3 gap-y-1 p-2.5">
						<span class="flex min-w-0 flex-1 items-baseline gap-2">
							<span class="truncate font-display text-lg font-bold">{a.name || 'Unnamed'}</span>
							<span
								class="num text-lg font-semibold text-primary"
								title="{AB_NAMES[r.ability]}{a.proficient ? ' + proficiency' : ''}"
								>{r.dc !== null ? hitText(a, r) : signed(r.toHit)}</span
							>
							<span class="num text-sm">{r.total}</span>
							<span class="text-sm text-base-content/60">{r.types || a.type}</span>
						</span>
						{#if a.mastery}<span
								class="tag {mastered.has(a.weapon) ? '' : 'line-through opacity-60'}"
								title={mastered.has(a.weapon)
									? (MASTERIES[a.mastery] ?? '')
									: 'You can use this mastery only if you pick this weapon in Weapon Mastery (Class & features tab)'}
								>{a.mastery}</span
							>{/if}
						{#if a.range}<span class="text-xs text-base-content/60">{a.range}</span>{/if}
						{#if own.has(a.id)}
							<button
								type="button"
								class="btn btn-square btn-ghost btn-xs"
								title="Edit"
								aria-label="Edit {a.name}"
								onclick={() => (open[a.id] = !open[a.id])}
							>
								{#if open[a.id]}<ChevronUp class="size-4" />{:else}<ChevronDown
										class="size-4"
									/>{/if}
							</button>
						{:else}
							<a href="#inventory" class="link text-xs text-base-content/55">edit in Inventory</a>
						{/if}
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
						{#if r.riders.some((x) => !x.on)}
							<ul class="flex flex-col gap-0.5">
								{#each r.riders.filter((x) => !x.on) as x (x.r.id)}
									<li class="flex items-baseline gap-2 text-sm">
										<span class="text-base-content/50">+</span>
										<span class="font-medium">{x.r.name}</span>
										<span class="num"
											>{x.r.dmg ? '+' + x.r.dmg : ''}{x.r.hit
												? ` ${signed(x.r.hit)} to hit`
												: ''}</span
										>
										<span class="truncate text-xs text-base-content/55"
											>{x.r.type} {x.r.when ? '· ' + x.r.when : ''}</span
										>
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

					{#if own.has(a.id) && open[a.id]}
						<div class="flex flex-col gap-2 border-t border-base-300 bg-base-200 p-2.5">
							<AttackEditor {a} weapon={false} />
							<button
								type="button"
								class="btn self-end btn-outline btn-error btn-xs"
								onclick={() => (ch.attacks = ch.attacks.filter((x) => x.id !== a.id))}
								><Trash2 class="size-3" /> Delete</button
							>
						</div>
					{/if}
				</article>
			{/each}
		</div>

		{#if auto.length}
			<div class="mt-4 border-t border-base-300 pt-3">
				<h3 class="panel-title mb-1">Extra damage you can add</h3>
				<p class="mb-2 text-xs text-base-content/60">
					From your class, species and feats. Each applies only in the situation described.
				</p>
				<ul class="flex flex-col gap-1 text-sm">
					{#each auto as x (x.id)}
						<li class="flex flex-wrap items-baseline gap-x-2">
							<Info class="size-3.5 translate-y-0.5 text-base-content/40" />
							<span class="font-medium">{x.name}</span>
							<span class="num"
								>{x.dmg ? '+' + x.dmg : ''} {x.hit ? signed(x.hit) + ' to hit' : ''}</span
							>
							<span class="text-base-content/60">{x.type}</span>
							<span class="tag">{appliesLabel[x.applies]}</span>
							<span class="text-xs text-base-content/55">{x.when}</span>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</section>

	{#if situational.length}
		<section class="panel" aria-labelledby="sit-h">
			<h2 id="sit-h" class="panel-title mb-0">Situational effects</h2>
			<p class="text-xs text-base-content/60">
				What changes while these last. The sheet's numbers leave them out; the PDF lists them with a
				tick box to mark during play.
			</p>
			<dl class="mt-2 grid gap-x-6 gap-y-1.5 text-sm md:grid-cols-2">
				{#each situational as st (st.id)}
					<div>
						<dt class="inline font-semibold">{st.name}.</dt>
						<dd class="inline text-base-content/75">{stateSummary(ch, st, sc) || st.hint}</dd>
					</div>
				{/each}
			</dl>
		</section>
	{/if}
</div>
