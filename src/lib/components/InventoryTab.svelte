<script lang="ts">
	import { Plus, Trash2, Swords } from 'lucide-svelte';
	import { currentChar } from '$lib/current.svelte';
	import { armorClass, attunementMax, carrying, scores } from '$lib/calc';
	import {
		GEAR,
		GEAR_BY_NAME,
		GEAR_CAT_LABEL,
		type GearCat,
		type GearDef
	} from '$lib/data/equipment';
	import { ARMOR, WEAPONS } from '$lib/data/srd';
	import { newAttack, newItem } from '$lib/store.svelte';
	import type { Item } from '$lib/types';

	const ch = $derived(currentChar());
	const sc = $derived(scores(ch));
	const ac = $derived(armorClass(ch, sc));
	const carry = $derived(carrying(ch, sc));
	const attuned = $derived(ch.gear.items.filter((i) => i.attuned).length);
	const maxAttune = $derived(attunementMax(ch));
	const locations = $derived([...new Set(ch.gear.items.map((i) => i.location || 'Backpack'))]);
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

	function weaponKey(i: Item) {
		const n = i.name.trim().toLowerCase();
		return Object.entries(WEAPONS).find(([, w]) => w.name.toLowerCase() === n)?.[0];
	}
	function addAttackFrom(i: Item) {
		const k = weaponKey(i);
		const w = k ? WEAPONS[k] : null;
		ch.attacks.push(
			newAttack(
				w
					? {
							name: i.name,
							weapon: k!,
							kind: w.kind,
							dice: w.dice,
							versatile: w.versatile ?? '',
							type: w.type,
							mastery: w.mastery,
							props: w.props.join(', '),
							range: w.range ?? ''
						}
					: { name: i.name }
			)
		);
	}
	function addItem(location: string) {
		ch.gear.items.push(newItem({ location }));
	}
	// ---- Catalog and starting equipment ----
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
	function pushGear(name: string, qty: number, location: string) {
		const def = GEAR_BY_NAME.get(name.toLowerCase());
		const existing = ch.gear.items.find(
			(i) => i.name.toLowerCase() === name.toLowerCase() && i.location === location
		);
		if (existing && def && def.cat !== 'weapon' && def.cat !== 'armor') {
			existing.qty += qty;
			return;
		}
		const worn = def?.cat === 'armor' || def?.cat === 'weapon' || def?.cat === 'focus';
		ch.gear.items.push(
			newItem({
				name,
				qty,
				weight: def?.weight ?? 0,
				value: def?.cost ?? 0,
				location: worn ? 'Worn' : location,
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
		addedMsg = `Added ${def.name}${def.contents ? ' (unpacked)' : ''}.`;
		setTimeout(() => (addedMsg = ''), 2500);
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
		<section class="panel" aria-labelledby="armor-h">
			<h2 id="armor-h" class="panel-title">Armor</h2>
			<label class="flex flex-col text-sm">
				<span class="label-xs">Worn armor</span>
				<select class="select select-sm" bind:value={ch.gear.armor}>
					<option value="">None</option>
					{#each ['light', 'medium', 'heavy'] as t (t)}
						<optgroup label="{t[0].toUpperCase() + t.slice(1)} armor">
							{#each Object.entries(ARMOR).filter(([, a]) => a.type === t) as [k, a] (k)}<option
									value={k}
									>{a.name} (AC {a.base}{a.dexCap === null
										? ' + Dex'
										: a.dexCap
											? ' + Dex max 2'
											: ''})</option
								>{/each}
						</optgroup>
					{/each}
				</select>
			</label>
			<div class="mt-2 flex items-center gap-4 text-sm">
				<label class="flex items-center gap-2"
					><input type="checkbox" class="checkbox checkbox-sm" bind:checked={ch.gear.shield} /> Shield
					(+2)</label
				>
				<label class="flex items-center gap-2"
					>Other AC <input
						type="number"
						class="num input w-14 input-xs"
						bind:value={ch.gear.acMisc}
					/></label
				>
			</div>
			<p class="mt-3 flex items-baseline gap-2">
				<span class="label-xs">AC</span><span class="num text-3xl">{ac.value}</span>
			</p>
			<p class="text-xs text-base-content/60">{ac.parts.join(' · ')}</p>
		</section>

		<section class="panel" aria-labelledby="coins-h">
			<h2 id="coins-h" class="panel-title">Coins</h2>
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
				<span class="num">{carry.coinsWeight.toFixed(1)}</span> lb
			</p>
			<p class="text-xs text-base-content/60">
				1 PP = 10 GP = 20 EP = 100 SP = 1,000 CP. 50 coins weigh 1 lb.
			</p>
		</section>

		<section class="panel" aria-labelledby="load-h">
			<h2 id="load-h" class="panel-title">Load & attunement</h2>
			<p class="text-sm">
				Carrying <span class="num font-semibold">{carry.total}</span> /
				<span class="num">{carry.cap}</span> lb
			</p>
			<progress
				class="progress {carry.total > carry.cap
					? 'progress-error'
					: 'progress-primary'} mt-1 w-full"
				value={Math.min(carry.total, carry.cap)}
				max={carry.cap}
			></progress>
			<p class="mt-3 text-sm">
				Attuned <span class="num font-semibold {attuned > maxAttune ? 'text-error' : ''}"
					>{attuned}</span
				>
				/ {maxAttune}
			</p>
			<p class="mt-1 text-sm">Gear value <span class="num">{valueTotal}</span> GP</p>
		</section>
	</div>

	<section class="panel" aria-labelledby="cat-h">
		<div class="flex flex-wrap items-center gap-2">
			<h2 id="cat-h" class="panel-title mb-0">Equipment catalog</h2>
			<span class="text-xs text-base-content/60"
				>{GEAR.length} items from the rules, with cost, weight and what they do.</span
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
			<h2 id="items-h" class="panel-title mb-0">Equipment</h2>
			<span class="text-xs text-base-content/60"
				>Grouped by where you carry it. Weapons can be turned into attacks.</span
			>
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
			{@const items = ch.gear.items.filter((i) => (i.location || 'Backpack') === loc)}
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
									{#if weaponKey(it)}<button
											type="button"
											class="btn btn-square btn-ghost btn-xs"
											title="Add as attack"
											onclick={() => addAttackFrom(it)}><Swords class="size-3.5" /></button
										>{/if}
									<button
										type="button"
										class="btn btn-square btn-ghost btn-xs"
										aria-label="Delete {it.name}"
										onclick={() => (ch.gear.items = ch.gear.items.filter((x) => x.id !== it.id))}
										><Trash2 class="size-3.5" /></button
									>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/each}
		{#if !ch.gear.items.length}<p class="py-4 text-center text-sm text-base-content/60">
				No equipment yet.
			</p>{/if}
	</section>
</div>
