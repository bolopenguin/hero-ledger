<script lang="ts">
	import { ChevronDown, ChevronUp, Copy, Plus, Trash2, Swords, Info } from 'lucide-svelte';
	import { currentChar } from '$lib/current.svelte';
	import { attack, autoRiders, features, scores, signed } from '$lib/calc';
	import { AB_NAMES, ACTION_LABELS, MASTERIES, WEAPONS } from '$lib/data/srd';
	import { newAttack, uid } from '$lib/store.svelte';
	import { ABILITIES, type Attack, type Rider } from '$lib/types';
	import FeatureCard from './FeatureCard.svelte';

	const ch = $derived(currentChar());
	const sc = $derived(scores(ch));
	const auto = $derived(autoRiders(ch, sc));
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
		const a = newAttack(kind === 'spell' ? { name: 'Fire Bolt', kind: 'spell', dice: '1d10', type: 'Fire', addMod: false, range: '120 ft' } : {});
		ch.attacks.push(a);
		open[a.id] = true;
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
		ch.riders.push({ id: uid(), name: 'New rider', dmg: '1d6', type: '', hit: 0, applies: 'weapon', when: '' });
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

<div class="grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
	<section class="panel" aria-labelledby="attacks-h">
		<div class="mb-2 flex flex-wrap items-center gap-2">
			<h2 id="attacks-h" class="panel-title mb-0">Attacks</h2>
			<span class="text-base-content/60 text-xs">Tick the riders that apply in this situation to see the full damage.</span>
			<span class="ml-auto flex gap-1">
				<button type="button" class="btn btn-sm" onclick={() => add('melee')}><Plus class="size-4" /> Weapon</button>
				<button type="button" class="btn btn-sm" onclick={() => add('spell')}><Plus class="size-4" /> Spell attack</button>
			</span>
		</div>

		{#if !ch.attacks.length}
			<p class="text-base-content/60 py-6 text-center text-sm">No attacks yet. Add a weapon or a spell attack.</p>
		{/if}

		<div class="flex flex-col gap-2">
			{#each ch.attacks as a (a.id)}
				{@const r = attack(ch, a, sc)}
				<article class="rounded-box border-base-300 border">
					<header class="flex flex-wrap items-center gap-x-3 gap-y-1 p-2.5">
						<button type="button" class="flex min-w-0 flex-1 items-baseline gap-2 text-left" onclick={() => (open[a.id] = !open[a.id])} aria-expanded={!!open[a.id]}>
							<span class="font-display truncate text-lg font-bold">{a.name || 'Unnamed'}</span>
							<span class="num text-primary text-lg font-semibold" title="{AB_NAMES[r.ability]}{a.proficient ? ' + proficiency' : ''}">{signed(r.toHit)}</span>
							<span class="num text-sm">{r.base}</span>
							<span class="text-base-content/60 text-sm">{a.type}</span>
						</button>
						{#if a.mastery}<span class="tag" title={MASTERIES[a.mastery] ?? ''}>{a.mastery}</span>{/if}
						{#if a.range}<span class="text-base-content/60 text-xs">{a.range}</span>{/if}
						<button type="button" class="btn btn-ghost btn-xs btn-square" title="Edit" onclick={() => (open[a.id] = !open[a.id])}>
							{#if open[a.id]}<ChevronUp class="size-4" />{:else}<ChevronDown class="size-4" />{/if}
						</button>
					</header>

					<div class="border-base-300 border-t px-2.5 py-2">
						{#if a.versatile}
							<label class="mb-1 flex items-center gap-2 text-sm">
								<input type="checkbox" class="toggle toggle-xs toggle-primary" bind:checked={a.twoHanded} />
								Two hands (Versatile {a.versatile})
							</label>
						{/if}
						{#if r.riders.length}
							<ul class="flex flex-col gap-0.5">
								{#each r.riders as x (x.r.id)}
									<li class="flex items-baseline gap-2 text-sm">
										<label class="flex min-w-0 flex-1 items-baseline gap-2">
											<input type="checkbox" class="checkbox checkbox-xs checkbox-primary translate-y-0.5" checked={x.on} onchange={(e) => (a.riders[x.r.id] = e.currentTarget.checked)} />
											<span class="font-medium">{x.r.name}</span>
											<span class="num">{x.r.dmg ? '+' + x.r.dmg : ''}{x.r.hit ? ` ${signed(x.r.hit)} to hit` : ''}</span>
											<span class="text-base-content/55 truncate text-xs">{x.r.type} {x.r.when ? '· ' + x.r.when : ''}</span>
										</label>
									</li>
								{/each}
							</ul>
						{/if}
						<p class="mt-1.5 flex flex-wrap items-baseline gap-x-3 text-sm">
							<span><span class="label-xs">Hit</span> <span class="num font-semibold">{signed(r.toHit)}</span></span>
							<span><span class="label-xs">Damage</span> <span class="num font-semibold">{r.total}</span> <span class="text-base-content/60">{r.types}</span></span>
							<span class="text-base-content/60">avg <span class="num">{r.avg.toFixed(1)}</span></span>
							<span class="text-base-content/60">crit{r.critOn < 20 ? ` on ${r.critOn}–20` : ''}: <span class="num">{r.crit}</span></span>
						</p>
						{#if a.notes}<p class="text-base-content/70 mt-1 text-sm">{a.notes}</p>{/if}
						{#if a.mastery && MASTERIES[a.mastery]}<p class="text-base-content/60 mt-1 text-xs"><b>{a.mastery}:</b> {MASTERIES[a.mastery]}</p>{/if}
						{#if r.error}<p class="text-error mt-1 text-xs">{r.error}. Write dice like 1d8, 2d6+1 or {'{pb}'}.</p>{/if}
					</div>

					{#if open[a.id]}
						<div class="bg-base-200 border-base-300 grid grid-cols-2 gap-2 border-t p-2.5 text-xs sm:grid-cols-4">
							<label class="col-span-2 flex flex-col">Name<input class="input input-sm" bind:value={a.name} /></label>
							<label class="col-span-2 flex flex-col">Weapon template
								<select class="select select-sm" value={a.weapon} onchange={(e) => applyWeapon(a, e.currentTarget.value)}>
									<option value="">Custom</option>
									<optgroup label="Simple">{#each Object.entries(WEAPONS).filter(([, w]) => w.cat === 'simple') as [k, w] (k)}<option value={k}>{w.name}</option>{/each}</optgroup>
									<optgroup label="Martial">{#each Object.entries(WEAPONS).filter(([, w]) => w.cat === 'martial') as [k, w] (k)}<option value={k}>{w.name}</option>{/each}</optgroup>
								</select>
							</label>
							<label class="flex flex-col">Kind
								<select class="select select-sm" bind:value={a.kind}><option value="melee">Melee</option><option value="ranged">Ranged</option><option value="spell">Spell</option></select>
							</label>
							<label class="flex flex-col">Ability
								<select class="select select-sm" bind:value={a.ability}>
									<option value="auto">Auto ({r.ability.toUpperCase()})</option>
									{#each ABILITIES as ab (ab)}<option value={ab}>{AB_NAMES[ab]}</option>{/each}
								</select>
							</label>
							<label class="flex flex-col">Damage dice<input class="input input-sm num" bind:value={a.dice} placeholder="1d8" /></label>
							<label class="flex flex-col">Versatile dice<input class="input input-sm num" bind:value={a.versatile} placeholder="—" /></label>
							<label class="flex flex-col">Damage type<input class="input input-sm" bind:value={a.type} /></label>
							<label class="flex flex-col">Magic bonus (+hit, +dmg)<input type="number" class="input input-sm num" bind:value={a.magic} /></label>
							<label class="flex flex-col">Other to-hit bonus<input type="number" class="input input-sm num" bind:value={a.hitMisc} /></label>
							<label class="flex flex-col">Other damage<input class="input input-sm num" bind:value={a.dmgMisc} placeholder="e.g. 2 or 1d4" /></label>
							<label class="flex flex-col">Mastery
								<select class="select select-sm" bind:value={a.mastery}><option value="">—</option>{#each Object.keys(MASTERIES) as m (m)}<option value={m}>{m}</option>{/each}</select>
							</label>
							<label class="flex flex-col">Range<input class="input input-sm" bind:value={a.range} /></label>
							<label class="col-span-2 flex flex-col">Properties<input class="input input-sm" bind:value={a.props} /></label>
							<label class="flex items-center gap-2 self-end pb-1"><input type="checkbox" class="checkbox checkbox-xs" bind:checked={a.proficient} /> Proficient</label>
							<label class="flex items-center gap-2 self-end pb-1"><input type="checkbox" class="checkbox checkbox-xs" bind:checked={a.addMod} /> Add ability mod to damage</label>
							<label class="col-span-2 flex flex-col sm:col-span-4">Notes<input class="input input-sm" bind:value={a.notes} /></label>
							<div class="col-span-2 flex gap-1 sm:col-span-4">
								<button type="button" class="btn btn-xs" onclick={() => move(a, -1)}>Move up</button>
								<button type="button" class="btn btn-xs" onclick={() => move(a, 1)}>Move down</button>
								<button type="button" class="btn btn-xs" onclick={() => duplicate(a)}><Copy class="size-3" /> Duplicate as variant</button>
								<button type="button" class="btn btn-xs btn-error btn-outline ml-auto" onclick={() => (ch.attacks = ch.attacks.filter((x) => x.id !== a.id))}><Trash2 class="size-3" /> Delete</button>
							</div>
						</div>
					{/if}
				</article>
			{/each}
		</div>

		<!-- Riders -->
		<div class="border-base-300 mt-4 border-t pt-3">
			<div class="mb-2 flex items-center gap-2">
				<h3 class="panel-title mb-0">Damage riders</h3>
				<span class="text-base-content/60 text-xs">Extra damage that only applies sometimes. Each attack can switch them on or off.</span>
				<button type="button" class="btn btn-sm ml-auto" onclick={addRider}><Plus class="size-4" /> Rider</button>
			</div>
			{#if auto.length}
				<ul class="mb-2 flex flex-col gap-1 text-sm">
					{#each auto as x (x.id)}
						<li class="flex flex-wrap items-baseline gap-x-2">
							<Info class="text-base-content/40 size-3.5 translate-y-0.5" />
							<span class="font-medium">{x.name}</span>
							<span class="num">{x.dmg ? '+' + x.dmg : ''} {x.hit ? signed(x.hit) + ' to hit' : ''}</span>
							<span class="text-base-content/60">{x.type}</span>
							<span class="tag">{appliesLabel[x.applies]}</span>
							<span class="text-base-content/55 text-xs">{x.when} · from your class/species/feats</span>
						</li>
					{/each}
				</ul>
			{/if}
			<div class="flex flex-col gap-2">
				{#each ch.riders as x (x.id)}
					<div class="bg-base-200 rounded-box grid grid-cols-2 gap-2 p-2 text-xs sm:grid-cols-6">
						<label class="col-span-2 flex flex-col">Name<input class="input input-sm" bind:value={x.name} /></label>
						<label class="flex flex-col">Extra damage<input class="input input-sm num" bind:value={x.dmg} placeholder="1d6 or {'{pb}'}" /></label>
						<label class="flex flex-col">Type<input class="input input-sm" bind:value={x.type} /></label>
						<label class="flex flex-col">To-hit<input type="number" class="input input-sm num" bind:value={x.hit} /></label>
						<label class="flex flex-col">Applies to
							<select class="select select-sm" bind:value={x.applies}>{#each Object.entries(appliesLabel) as [k, v] (k)}<option value={k}>{v}</option>{/each}</select>
						</label>
						<label class="col-span-2 flex flex-col sm:col-span-5">When<input class="input input-sm" bind:value={x.when} placeholder="e.g. while concentrating on Hex" /></label>
						<button type="button" class="btn btn-xs btn-error btn-outline self-end" onclick={() => (ch.riders = ch.riders.filter((y) => y.id !== x.id))}><Trash2 class="size-3" /> Remove</button>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<section class="panel" aria-labelledby="actions-h">
		<h2 id="actions-h" class="panel-title flex items-center gap-2"><Swords class="size-4" /> What you can do on your turn</h2>
		{#each groups as g (g.a)}
			{@const list = feats.filter((f) => f.a === g.a)}
			{#if list.length}
				<h3 class="label-xs border-base-300 mt-3 border-b pb-1">{g.label}</h3>
				{#each list as f (f.key)}<FeatureCard {f} compact />{/each}
			{/if}
		{/each}
	</section>
</div>
