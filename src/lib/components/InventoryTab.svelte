<script lang="ts">
	import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-svelte';
	import { currentChar } from '$lib/current.svelte';
	import {
		armorClass,
		attack,
		attunementMax,
		coinsWeight,
		hitText,
		scores,
		signed
	} from '$lib/calc';
	import {
		GEAR,
		GEAR_BY_NAME,
		GEAR_CAT_LABEL,
		type GearCat,
		type GearDef
	} from '$lib/data/equipment';
	import { ARMOR, WEAPONS } from '$lib/data/srd';
	import { newArmorItem, newItem, newWeaponItem } from '$lib/store.svelte';
	import type { Item } from '$lib/types';
	import AttackEditor from './AttackEditor.svelte';

	const ch = $derived(currentChar());
	const sc = $derived(scores(ch));
	const ac = $derived(armorClass(ch, sc));
	const coinLb = $derived(coinsWeight(ch));
	const attuned = $derived(ch.gear.items.filter((i) => i.attuned).length);
	const maxAttune = $derived(attunementMax(ch));
	const armorItems = $derived(ch.gear.items.filter((i) => i.kind === 'armor'));
	const weaponItems = $derived(ch.gear.items.filter((i) => i.kind === 'weapon'));
	const plainItems = $derived(ch.gear.items.filter((i) => i.kind === 'item'));
	const locations = $derived([...new Set(plainItems.map((i) => i.location || 'Backpack'))]);
	const gpTotal = $derived(
		Math.round(
			(ch.gear.coins.cp / 100 +
				ch.gear.coins.sp / 10 +
				ch.gear.coins.ep / 2 +
				ch.gear.coins.gp +
				ch.gear.coins.pp * 10) *
				100
		) / 100
	);
	const valueTotal = $derived(
		Math.round(ch.gear.items.reduce((a, i) => a + i.value * i.qty, 0) * 100) / 100
	);
	let newLoc = $state('');
	let editing = $state<Record<string, boolean>>({});

	// ---- Armor: one suit and one shield worn at a time
	function wear(it: Item, on: boolean) {
		it.equipped = on;
		if (!on || !it.armor) return;
		const shield = it.armor.type === 'shield';
		for (const o of armorItems)
			if (o !== it && o.armor && (o.armor.type === 'shield') === shield) o.equipped = false;
	}
	function addArmor(key: string) {
		const it =
			key === '__custom'
				? newArmorItem('', { name: 'Custom armor' })
				: key === '__shield'
					? newArmorItem('shield', { name: 'Custom shield' })
					: newArmorItem(key);
		ch.gear.items.push(it);
		wear(ch.gear.items[ch.gear.items.length - 1], true);
		editing[it.id] = key.startsWith('__');
	}
	const dexCapValue = (it: Item) =>
		it.armor?.dexCap === null ? 'any' : it.armor?.dexCap === 0 ? 'none' : String(it.armor?.dexCap);
	function setDexCap(it: Item, v: string) {
		if (it.armor) it.armor.dexCap = v === 'any' ? null : v === 'none' ? 0 : Number(v);
	}
	function armorSummary(it: Item) {
		const a = it.armor;
		if (!a) return '';
		if (a.type === 'shield') return `Shield, ${signed(a.base + a.bonus)} AC`;
		const dex = a.dexCap === null ? ' + Dex' : a.dexCap ? ` + Dex (max ${a.dexCap})` : '';
		return `${a.type[0].toUpperCase() + a.type.slice(1)} armor, AC ${a.base + a.bonus}${dex}${a.str ? `, Str ${a.str}` : ''}${a.stealthDis ? ', Stealth disadvantage' : ''}`;
	}

	// ---- Weapons
	function addWeapon(key: string) {
		const it = newWeaponItem(
			key === '__custom' ? '' : key,
			key === '__custom' ? { name: 'Custom weapon' } : {}
		);
		if (it.atk && key === '__custom') it.atk.name = 'Custom weapon';
		ch.gear.items.push(it);
		editing[it.id] = key === '__custom';
	}
	function weaponLine(it: Item) {
		if (!it.atk) return '';
		const r = attack(ch, it.atk, sc);
		return `${hitText(it.atk, r)} · ${r.total} ${r.types || it.atk.type}`;
	}

	// ---- Plain items
	function addItem(location: string) {
		ch.gear.items.push(newItem({ location }));
	}
	function remove(it: Item) {
		ch.gear.items = ch.gear.items.filter((x) => x.id !== it.id);
	}

	// ---- Catalog
	let catQuery = $state('');
	let catFilter = $state<GearCat | ''>('');
	let showCatalog = $state(false);
	let addedMsg = $state('');
	const catalog = $derived(
		GEAR.filter(
			(g) =>
				(!catFilter || g.cat === catFilter) &&
				(!catQuery.trim() || g.name.toLowerCase().includes(catQuery.trim().toLowerCase()))
		)
	);
	const fmtCost = (gp: number) =>
		gp >= 1 ? `${gp} GP` : gp >= 0.1 ? `${Math.round(gp * 10)} SP` : `${Math.round(gp * 100)} CP`;
	const weaponKeyOf = (name: string) =>
		Object.entries(WEAPONS).find(([, w]) => w.name.toLowerCase() === name.toLowerCase())?.[0];
	const armorKeyOf = (name: string) =>
		name === 'Shield'
			? 'shield'
			: Object.entries(ARMOR).find(([, a]) => a.name.toLowerCase() === name.toLowerCase())?.[0];
	function pushGear(name: string, qty: number, location: string) {
		const def = GEAR_BY_NAME.get(name.toLowerCase());
		if (def?.cat === 'weapon' && weaponKeyOf(name)) {
			ch.gear.items.push(newWeaponItem(weaponKeyOf(name)!, { qty, equipped: false }));
			return;
		}
		if (def?.cat === 'armor' && armorKeyOf(name)) {
			ch.gear.items.push(newArmorItem(armorKeyOf(name)!, { equipped: false }));
			return;
		}
		const existing = ch.gear.items.find(
			(i) =>
				i.kind === 'item' && i.name.toLowerCase() === name.toLowerCase() && i.location === location
		);
		if (existing && def) {
			existing.qty += qty;
			return;
		}
		ch.gear.items.push(
			newItem({
				name,
				qty,
				weight: def?.weight ?? 0,
				value: def?.cost ?? 0,
				location: def?.cat === 'focus' ? 'Worn' : location,
				notes: def?.d ?? '',
				magic: name.startsWith('Potion') || name.startsWith('Spell Scroll'),
				chargesMax: name === "Healer's Kit" ? 10 : 0,
				charges: name === "Healer's Kit" ? 10 : 0
			})
		);
	}
	function addGear(def: GearDef, qty = 1) {
		if (def.contents) for (const [n, q] of def.contents) pushGear(n, q * qty, 'Backpack');
		else pushGear(def.name, qty, 'Backpack');
		addedMsg = `Added ${def.name}${def.contents ? ' (unpacked)' : ''}${def.cat === 'weapon' || def.cat === 'armor' ? ' (tick it as equipped to use it)' : ''}.`;
		setTimeout(() => (addedMsg = ''), 3000);
	}

	const coinNames = [
		['cp', 'Copper'],
		['sp', 'Silver'],
		['ep', 'Electrum'],
		['gp', 'Gold'],
		['pp', 'Platinum']
	] as const;
</script>

<div class="flex flex-col gap-3">
	<div class="grid gap-3 md:grid-cols-3">
		<section class="panel" aria-labelledby="ac-h">
			<h2 id="ac-h" class="panel-title">Armor Class</h2>
			<p class="flex items-baseline gap-2">
				<span class="num text-3xl">{ac.value}</span>
			</p>
			<p class="text-xs text-base-content/60">{ac.parts.join(' · ')}</p>
			<label class="mt-2 flex items-center gap-2 text-sm"
				>Other AC bonus <input
					type="number"
					class="num input w-14 input-xs"
					bind:value={ch.gear.acMisc}
				/></label
			>
			<p class="mt-1 text-xs text-base-content/55">
				For bonuses that are not on an armor item: a ring, a spell, a house rule. Wear armor and a
				shield in the Armor list below.
			</p>
		</section>

		<section class="panel" aria-labelledby="coins-h">
			<h2 id="coins-h" class="panel-title">Money</h2>
			<div class="grid grid-cols-5 gap-1.5">
				{#each coinNames as [k, label] (k)}
					<label class="flex flex-col items-center">
						<span class="label-xs" title={label}>{k}</span>
						<input
							type="number"
							min="0"
							class="num input w-full px-1 text-center input-sm"
							bind:value={ch.gear.coins[k]}
						/>
					</label>
				{/each}
			</div>
			<p class="mt-3 text-sm">
				Worth <span class="num font-semibold">{gpTotal}</span> GP · weighs
				<span class="num">{coinLb.toFixed(1)}</span> lb
			</p>
			<p class="text-xs text-base-content/60">
				1 PP = 10 GP = 20 EP = 100 SP = 1,000 CP. 50 coins weigh 1 lb.
			</p>
		</section>

		<section class="panel" aria-labelledby="load-h">
			<h2 id="load-h" class="panel-title">Attunement</h2>
			<p class="text-sm">
				Attuned <span class="num font-semibold {attuned > maxAttune ? 'text-error' : ''}"
					>{attuned}</span
				>
				/ {maxAttune}
			</p>
			<p class="mt-1 text-sm">Gear value <span class="num">{valueTotal}</span> GP</p>
		</section>
	</div>

	<!-- Armor -->
	<section class="panel" aria-labelledby="armor-h">
		<div class="mb-2 flex flex-wrap items-center gap-2">
			<h2 id="armor-h" class="panel-title mb-0">Armor & shields</h2>
			<span class="text-xs text-base-content/60"
				>Tick "worn" for the one you have on. Its AC and any magic bonus count straight away.</span
			>
			<select
				class="select ml-auto w-48 select-sm"
				aria-label="Add armor"
				value=""
				onchange={(e) => {
					if (e.currentTarget.value) addArmor(e.currentTarget.value);
					e.currentTarget.value = '';
				}}
			>
				<option value="" disabled>+ Add armor…</option>
				{#each ['light', 'medium', 'heavy'] as t (t)}
					<optgroup label="{t[0].toUpperCase() + t.slice(1)} armor">
						{#each Object.entries(ARMOR).filter(([, a]) => a.type === t) as [k, a] (k)}<option
								value={k}>{a.name}</option
							>{/each}
					</optgroup>
				{/each}
				<optgroup label="Shields and custom">
					<option value="shield">Shield</option>
					<option value="__custom">Custom armor…</option>
					<option value="__shield">Custom shield…</option>
				</optgroup>
			</select>
		</div>
		{#each armorItems as it (it.id)}
			<article class="border-t border-base-300 py-1.5">
				<div class="flex flex-wrap items-center gap-x-3 gap-y-1">
					<label class="flex items-center gap-1.5 text-sm"
						><input
							type="checkbox"
							class="checkbox checkbox-xs checkbox-primary"
							checked={it.equipped}
							onchange={(e) => wear(it, e.currentTarget.checked)}
						/> worn</label
					>
					<span class="font-display font-bold {it.magic ? 'text-accent' : ''}">{it.name}</span>
					<span class="text-xs text-base-content/65">{armorSummary(it)}</span>
					<button
						type="button"
						class="btn ml-auto btn-square btn-ghost btn-xs"
						title="Edit"
						aria-label="Edit {it.name}"
						onclick={() => (editing[it.id] = !editing[it.id])}
						>{#if editing[it.id]}<ChevronUp class="size-4" />{:else}<ChevronDown
								class="size-4"
							/>{/if}</button
					>
					<button
						type="button"
						class="btn btn-square btn-ghost btn-xs"
						aria-label="Delete {it.name}"
						onclick={() => remove(it)}><Trash2 class="size-3.5" /></button
					>
				</div>
				{#if it.notes && !editing[it.id]}<p class="text-xs text-base-content/65">{it.notes}</p>{/if}
				{#if editing[it.id] && it.armor}
					<div
						class="mt-1 grid grid-cols-2 gap-2 rounded-box bg-base-200 p-2.5 text-xs sm:grid-cols-4"
					>
						<label class="col-span-2 flex flex-col"
							>Name<input class="input input-sm" bind:value={it.name} /></label
						>
						<label class="flex flex-col"
							>Type
							<select class="select select-sm" bind:value={it.armor.type}>
								<option value="light">Light armor</option>
								<option value="medium">Medium armor</option>
								<option value="heavy">Heavy armor</option>
								<option value="shield">Shield</option>
							</select>
						</label>
						<label class="flex flex-col"
							>{it.armor.type === 'shield' ? 'AC bonus' : 'Base AC'}<input
								type="number"
								class="num input input-sm"
								bind:value={it.armor.base}
							/></label
						>
						{#if it.armor.type !== 'shield'}
							<label class="flex flex-col"
								>Dexterity bonus
								<select
									class="select select-sm"
									value={dexCapValue(it)}
									onchange={(e) => setDexCap(it, e.currentTarget.value)}
								>
									<option value="any">Full Dex modifier</option>
									<option value="2">Dex up to +2</option>
									<option value="none">No Dex</option>
								</select>
							</label>
							<label class="flex flex-col"
								>Strength needed<input
									type="number"
									min="0"
									class="num input input-sm"
									bind:value={it.armor.str}
								/></label
							>
						{/if}
						<label class="flex flex-col"
							>Magic bonus to AC<input
								type="number"
								class="num input input-sm"
								bind:value={it.armor.bonus}
							/></label
						>
						<label class="flex flex-col"
							>Weight (lb)<input
								type="number"
								min="0"
								step="0.25"
								class="num input input-sm"
								bind:value={it.weight}
							/></label
						>
						<label class="flex flex-col"
							>Value (GP)<input
								type="number"
								min="0"
								step="0.01"
								class="num input input-sm"
								bind:value={it.value}
							/></label
						>
						{#if it.armor.type !== 'shield'}
							<label class="flex items-center gap-2 self-end pb-1"
								><input
									type="checkbox"
									class="checkbox checkbox-xs"
									bind:checked={it.armor.stealthDis}
								/> Stealth disadvantage</label
							>
						{/if}
						<label class="flex items-center gap-2 self-end pb-1"
							><input
								type="checkbox"
								class="checkbox checkbox-xs checkbox-secondary"
								bind:checked={it.attuned}
							/> Attuned</label
						>
						<label class="flex items-center gap-2 self-end pb-1"
							><input
								type="checkbox"
								class="checkbox checkbox-xs checkbox-accent"
								bind:checked={it.magic}
							/> Magic</label
						>
						<label class="col-span-2 flex flex-col sm:col-span-4"
							>Effects and notes<input
								class="input input-sm"
								bind:value={it.notes}
								placeholder="e.g. resistance to Fire while worn"
							/></label
						>
					</div>
				{/if}
			</article>
		{:else}
			<p class="border-t border-base-300 py-3 text-center text-sm text-base-content/60">
				No armor. Add some above; you can also make your own.
			</p>
		{/each}
	</section>

	<!-- Weapons -->
	<section class="panel" aria-labelledby="weapons-h">
		<div class="mb-2 flex flex-wrap items-center gap-2">
			<h2 id="weapons-h" class="panel-title mb-0">Weapons</h2>
			<span class="text-xs text-base-content/60"
				>Equipped weapons appear as attacks in the Combat tab.</span
			>
			<select
				class="select ml-auto w-48 select-sm"
				aria-label="Add a weapon"
				value=""
				onchange={(e) => {
					if (e.currentTarget.value) addWeapon(e.currentTarget.value);
					e.currentTarget.value = '';
				}}
			>
				<option value="" disabled>+ Add weapon…</option>
				<optgroup label="Simple"
					>{#each Object.entries(WEAPONS).filter(([k, w]) => k !== 'unarmed' && w.cat === 'simple') as [k, w] (k)}<option
							value={k}>{w.name}</option
						>{/each}</optgroup
				>
				<optgroup label="Martial"
					>{#each Object.entries(WEAPONS).filter(([, w]) => w.cat === 'martial') as [k, w] (k)}<option
							value={k}>{w.name}</option
						>{/each}</optgroup
				>
				<optgroup label="Custom"><option value="__custom">Custom weapon…</option></optgroup>
			</select>
		</div>
		{#each weaponItems as it (it.id)}
			<article class="border-t border-base-300 py-1.5">
				<div class="flex flex-wrap items-center gap-x-3 gap-y-1">
					<label class="flex items-center gap-1.5 text-sm"
						><input
							type="checkbox"
							class="checkbox checkbox-xs checkbox-primary"
							bind:checked={it.equipped}
						/> equipped</label
					>
					<span class="font-display font-bold {it.magic ? 'text-accent' : ''}"
						>{it.name}{it.qty > 1 ? ` ×${it.qty}` : ''}</span
					>
					<span class="num text-sm text-base-content/75">{weaponLine(it)}</span>
					<button
						type="button"
						class="btn ml-auto btn-square btn-ghost btn-xs"
						title="Edit"
						aria-label="Edit {it.name}"
						onclick={() => (editing[it.id] = !editing[it.id])}
						>{#if editing[it.id]}<ChevronUp class="size-4" />{:else}<ChevronDown
								class="size-4"
							/>{/if}</button
					>
					<button
						type="button"
						class="btn btn-square btn-ghost btn-xs"
						aria-label="Delete {it.name}"
						onclick={() => remove(it)}><Trash2 class="size-3.5" /></button
					>
				</div>
				{#if it.notes && !editing[it.id]}<p class="text-xs text-base-content/65">{it.notes}</p>{/if}
				{#if editing[it.id] && it.atk}
					<div class="mt-1 flex flex-col gap-2 rounded-box bg-base-200 p-2.5 text-xs">
						<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
							<label class="col-span-2 flex flex-col"
								>Name<input
									class="input input-sm"
									bind:value={it.name}
									oninput={(e) => it.atk && (it.atk.name = e.currentTarget.value)}
								/></label
							>
							<label class="flex flex-col"
								>Quantity<input
									type="number"
									min="1"
									class="num input input-sm"
									bind:value={it.qty}
								/></label
							>
							<label class="flex flex-col"
								>Weight (lb)<input
									type="number"
									min="0"
									step="0.25"
									class="num input input-sm"
									bind:value={it.weight}
								/></label
							>
							<label class="flex flex-col"
								>Value (GP)<input
									type="number"
									min="0"
									step="0.01"
									class="num input input-sm"
									bind:value={it.value}
								/></label
							>
							<label class="flex items-center gap-2 self-end pb-1"
								><input
									type="checkbox"
									class="checkbox checkbox-xs checkbox-secondary"
									bind:checked={it.attuned}
								/> Attuned</label
							>
							<label class="flex items-center gap-2 self-end pb-1"
								><input
									type="checkbox"
									class="checkbox checkbox-xs checkbox-accent"
									bind:checked={it.magic}
								/> Magic</label
							>
						</div>
						<AttackEditor a={it.atk} />
						<label class="flex flex-col"
							>Item notes<input class="input input-sm" bind:value={it.notes} /></label
						>
					</div>
				{/if}
			</article>
		{:else}
			<p class="border-t border-base-300 py-3 text-center text-sm text-base-content/60">
				No weapons. Add one above; you can also make your own.
			</p>
		{/each}
	</section>

	<section class="panel" aria-labelledby="cat-h">
		<div class="flex flex-wrap items-center gap-2">
			<h2 id="cat-h" class="panel-title mb-0">Equipment catalog</h2>
			<span class="text-xs text-base-content/60"
				>{GEAR.length} items from the rules, with cost, weight and what they do. Weapons and armor go
				to their own lists above.</span
			>
			<button type="button" class="btn ml-auto btn-sm" onclick={() => (showCatalog = !showCatalog)}
				>{showCatalog ? 'Close' : 'Browse'}</button
			>
		</div>
		{#if addedMsg}<p role="status" class="mt-1 text-xs text-success">{addedMsg}</p>{/if}
		{#if showCatalog}
			<div class="mt-2 flex flex-wrap gap-2">
				<input
					class="input min-w-0 flex-1 input-sm"
					placeholder="Search equipment…"
					bind:value={catQuery}
					aria-label="Search equipment"
				/>
				<select class="select select-sm" bind:value={catFilter} aria-label="Category">
					<option value="">All categories</option>
					{#each Object.entries(GEAR_CAT_LABEL) as [k, v] (k)}<option value={k}>{v}</option>{/each}
				</select>
			</div>
			<ul class="mt-2 flex max-h-96 flex-col overflow-y-auto">
				{#each catalog as gi (gi.name)}
					<li>
						<button
							type="button"
							class="flex w-full items-baseline gap-2 rounded px-2 py-1 text-left text-sm hover:bg-base-200"
							onclick={() => addGear(gi)}
						>
							<Plus class="size-3.5 shrink-0 translate-y-0.5" />
							<span class="font-semibold">{gi.name}</span>
							<span class="num text-xs whitespace-nowrap text-base-content/60"
								>{fmtCost(gi.cost)} · {gi.weight} lb</span
							>
							<span class="truncate text-xs text-base-content/60"
								>{gi.contents
									? gi.contents.map(([n, q]) => (q > 1 ? `${q} ${n}` : n)).join(', ')
									: gi.d}</span
							>
						</button>
					</li>
				{:else}
					<li class="px-2 py-1 text-sm text-base-content/60">Nothing matches.</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section class="panel" aria-labelledby="items-h">
		<div class="mb-2 flex flex-wrap items-center gap-2">
			<h2 id="items-h" class="panel-title mb-0">Other equipment</h2>
			<span class="text-xs text-base-content/60">Grouped by where you carry it.</span>
			<span class="ml-auto flex gap-1">
				<input class="input w-36 input-sm" placeholder="New container…" bind:value={newLoc} />
				<button
					type="button"
					class="btn btn-sm"
					onclick={() => {
						addItem(newLoc.trim() || 'Backpack');
						newLoc = '';
					}}><Plus class="size-4" /> Item</button
				>
			</span>
		</div>
		<datalist id="locations"
			>{#each locations as l (l)}<option value={l}></option>{/each}<option value="Worn"
			></option><option value="Backpack"></option><option value="Belt pouch"></option><option
				value="Bag of Holding"
			></option><option value="Mount"></option><option value="Stash"></option></datalist
		>

		{#each locations as loc (loc)}
			{@const items = plainItems.filter((i) => (i.location || 'Backpack') === loc)}
			<h3 class="mt-3 flex items-baseline gap-2 font-display font-bold text-primary">
				{loc}
				<span class="num text-xs font-normal text-base-content/50"
					>{Math.round(items.reduce((a, i) => a + i.weight * i.qty, 0) * 100) / 100} lb</span
				>
				<button
					type="button"
					class="btn ml-auto btn-ghost font-sans btn-xs"
					onclick={() => addItem(loc)}><Plus class="size-3" /> Add here</button
				>
			</h3>
			<div class="overflow-x-auto">
				<table class="table min-w-[50rem] table-sm">
					<thead>
						<tr class="label-xs"
							><th>Item</th><th class="w-16">Qty</th><th class="w-20">Weight</th><th class="w-20"
								>Value GP</th
							><th class="w-10" title="Equipped">Eq</th><th class="w-10" title="Attuned">Att</th><th
								class="w-10"
								title="Magic">Mag</th
							><th class="w-28">Charges</th><th>Notes</th><th class="w-28">Container</th><th
							></th></tr
						>
					</thead>
					<tbody>
						{#each items as it (it.id)}
							<tr>
								<td
									><input
										class="input w-full min-w-36 input-xs {it.magic
											? 'font-semibold text-accent'
											: ''}"
										bind:value={it.name}
										placeholder="Item name"
									/></td
								>
								<td
									><input
										type="number"
										min="0"
										class="num input w-14 input-xs"
										bind:value={it.qty}
									/></td
								>
								<td
									><input
										type="number"
										min="0"
										step="0.25"
										class="num input w-16 input-xs"
										bind:value={it.weight}
									/></td
								>
								<td
									><input
										type="number"
										min="0"
										step="0.01"
										class="num input w-16 input-xs"
										bind:value={it.value}
									/></td
								>
								<td
									><input
										type="checkbox"
										class="checkbox checkbox-xs"
										bind:checked={it.equipped}
									/></td
								>
								<td
									><input
										type="checkbox"
										class="checkbox checkbox-xs checkbox-secondary"
										bind:checked={it.attuned}
									/></td
								>
								<td
									><input
										type="checkbox"
										class="checkbox checkbox-xs checkbox-accent"
										bind:checked={it.magic}
									/></td
								>
								<td class="whitespace-nowrap"
									><input
										type="number"
										min="0"
										class="num input w-11 input-xs"
										bind:value={it.charges}
									/>
									/
									<input
										type="number"
										min="0"
										class="num input w-11 input-xs"
										bind:value={it.chargesMax}
									/></td
								>
								<td><input class="input w-full min-w-40 input-xs" bind:value={it.notes} /></td>
								<td
									><input
										class="input w-28 input-xs"
										list="locations"
										bind:value={it.location}
									/></td
								>
								<td class="whitespace-nowrap">
									<button
										type="button"
										class="btn btn-square btn-ghost btn-xs"
										aria-label="Delete {it.name}"
										onclick={() => remove(it)}><Trash2 class="size-3.5" /></button
									>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/each}
		{#if !plainItems.length}<p class="py-4 text-center text-sm text-base-content/60">
				No other equipment yet.
			</p>{/if}
	</section>
</div>
