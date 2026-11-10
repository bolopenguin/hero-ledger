<script lang="ts">
	import { Plus, Trash2, Swords } from 'lucide-svelte';
	import { currentChar } from '$lib/current.svelte';
	import { armorClass, attunementMax, carrying, scores } from '$lib/calc';
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
		Math.round((ch.gear.coins.cp / 100 + ch.gear.coins.sp / 10 + ch.gear.coins.ep / 2 + ch.gear.coins.gp + ch.gear.coins.pp * 10) * 100) / 100
	);
	const valueTotal = $derived(Math.round(ch.gear.items.reduce((a, i) => a + i.value * i.qty, 0) * 100) / 100);
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
					? { name: i.name, weapon: k!, kind: w.kind, dice: w.dice, versatile: w.versatile ?? '', type: w.type, mastery: w.mastery, props: w.props.join(', '), range: w.range ?? '' }
					: { name: i.name }
			)
		);
	}
	function addItem(location: string) {
		ch.gear.items.push(newItem({ location }));
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
							{#each Object.entries(ARMOR).filter(([, a]) => a.type === t) as [k, a] (k)}<option value={k}>{a.name} (AC {a.base}{a.dexCap === null ? ' + Dex' : a.dexCap ? ' + Dex max 2' : ''})</option>{/each}
						</optgroup>
					{/each}
				</select>
			</label>
			<div class="mt-2 flex items-center gap-4 text-sm">
				<label class="flex items-center gap-2"><input type="checkbox" class="checkbox checkbox-sm" bind:checked={ch.gear.shield} /> Shield (+2)</label>
				<label class="flex items-center gap-2">Other AC <input type="number" class="input input-xs num w-14" bind:value={ch.gear.acMisc} /></label>
			</div>
			<p class="mt-3 flex items-baseline gap-2"><span class="label-xs">AC</span><span class="num text-3xl">{ac.value}</span></p>
			<p class="text-base-content/60 text-xs">{ac.parts.join(' · ')}</p>
		</section>

		<section class="panel" aria-labelledby="coins-h">
			<h2 id="coins-h" class="panel-title">Coins</h2>
			<div class="grid grid-cols-5 gap-1.5">
				{#each coinNames as [k, label] (k)}
					<label class="flex flex-col items-center">
						<span class="label-xs" title={label}>{k}</span>
						<input type="number" min="0" class="input input-sm num w-full px-1 text-center" bind:value={ch.gear.coins[k]} />
					</label>
				{/each}
			</div>
			<p class="mt-3 text-sm">Worth <span class="num font-semibold">{gpTotal}</span> GP · weighs <span class="num">{carry.coinsWeight.toFixed(1)}</span> lb</p>
			<p class="text-base-content/60 text-xs">1 PP = 10 GP = 20 EP = 100 SP = 1,000 CP. 50 coins weigh 1 lb.</p>
		</section>

		<section class="panel" aria-labelledby="load-h">
			<h2 id="load-h" class="panel-title">Load & attunement</h2>
			<p class="text-sm">Carrying <span class="num font-semibold">{carry.total}</span> / <span class="num">{carry.cap}</span> lb</p>
			<progress class="progress {carry.total > carry.cap ? 'progress-error' : 'progress-primary'} mt-1 w-full" value={Math.min(carry.total, carry.cap)} max={carry.cap}></progress>
			<p class="mt-3 text-sm">Attuned <span class="num font-semibold {attuned > maxAttune ? 'text-error' : ''}">{attuned}</span> / {maxAttune}</p>
			<p class="mt-1 text-sm">Gear value <span class="num">{valueTotal}</span> GP</p>
		</section>
	</div>

	<section class="panel" aria-labelledby="items-h">
		<div class="mb-2 flex flex-wrap items-center gap-2">
			<h2 id="items-h" class="panel-title mb-0">Equipment</h2>
			<span class="text-base-content/60 text-xs">Grouped by where you carry it. Weapons can be turned into attacks.</span>
			<span class="ml-auto flex gap-1">
				<input class="input input-sm w-36" placeholder="New container…" bind:value={newLoc} />
				<button type="button" class="btn btn-sm" onclick={() => { addItem(newLoc.trim() || 'Backpack'); newLoc = ''; }}><Plus class="size-4" /> Item</button>
			</span>
		</div>
		<datalist id="locations">{#each locations as l (l)}<option value={l}></option>{/each}<option value="Worn"></option><option value="Backpack"></option><option value="Belt pouch"></option><option value="Bag of Holding"></option><option value="Mount"></option><option value="Stash"></option></datalist>

		{#each locations as loc (loc)}
			{@const items = ch.gear.items.filter((i) => (i.location || 'Backpack') === loc)}
			<h3 class="font-display text-primary mt-3 flex items-baseline gap-2 font-bold">
				{loc}
				<span class="text-base-content/50 num text-xs font-normal">{Math.round(items.reduce((a, i) => a + i.weight * i.qty, 0) * 100) / 100} lb</span>
				<button type="button" class="btn btn-ghost btn-xs ml-auto font-sans" onclick={() => addItem(loc)}><Plus class="size-3" /> Add here</button>
			</h3>
			<div class="overflow-x-auto">
				<table class="table-sm table min-w-[50rem]">
					<thead>
						<tr class="label-xs"><th>Item</th><th class="w-16">Qty</th><th class="w-20">Weight</th><th class="w-20">Value GP</th><th class="w-10" title="Equipped">Eq</th><th class="w-10" title="Attuned">Att</th><th class="w-10" title="Magic">Mag</th><th class="w-28">Charges</th><th>Notes</th><th class="w-28">Container</th><th></th></tr>
					</thead>
					<tbody>
						{#each items as it (it.id)}
							<tr>
								<td><input class="input input-xs w-full min-w-36 {it.magic ? 'text-accent font-semibold' : ''}" bind:value={it.name} placeholder="Item name" /></td>
								<td><input type="number" min="0" class="input input-xs num w-14" bind:value={it.qty} /></td>
								<td><input type="number" min="0" step="0.25" class="input input-xs num w-16" bind:value={it.weight} /></td>
								<td><input type="number" min="0" step="0.01" class="input input-xs num w-16" bind:value={it.value} /></td>
								<td><input type="checkbox" class="checkbox checkbox-xs" bind:checked={it.equipped} /></td>
								<td><input type="checkbox" class="checkbox checkbox-xs checkbox-secondary" bind:checked={it.attuned} /></td>
								<td><input type="checkbox" class="checkbox checkbox-xs checkbox-accent" bind:checked={it.magic} /></td>
								<td class="whitespace-nowrap"><input type="number" min="0" class="input input-xs num w-11" bind:value={it.charges} /> / <input type="number" min="0" class="input input-xs num w-11" bind:value={it.chargesMax} /></td>
								<td><input class="input input-xs w-full min-w-40" bind:value={it.notes} /></td>
								<td><input class="input input-xs w-28" list="locations" bind:value={it.location} /></td>
								<td class="whitespace-nowrap">
									{#if weaponKey(it)}<button type="button" class="btn btn-ghost btn-xs btn-square" title="Add as attack" onclick={() => addAttackFrom(it)}><Swords class="size-3.5" /></button>{/if}
									<button type="button" class="btn btn-ghost btn-xs btn-square" aria-label="Delete {it.name}" onclick={() => (ch.gear.items = ch.gear.items.filter((x) => x.id !== it.id))}><Trash2 class="size-3.5" /></button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/each}
		{#if !ch.gear.items.length}<p class="text-base-content/60 py-4 text-center text-sm">No equipment yet.</p>{/if}
	</section>
</div>
