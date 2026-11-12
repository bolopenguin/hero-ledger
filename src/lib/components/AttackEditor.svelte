<script lang="ts">
	// The form for one attack: a weapon in your equipment, or a spell attack.
	import { Plus, Trash2 } from 'lucide-svelte';
	import { currentChar } from '$lib/current.svelte';
	import { attack } from '$lib/calc';
	import { AB_NAMES, MASTERIES, WEAPONS } from '$lib/data/srd';
	import { newExtra } from '$lib/store.svelte';
	import { ABILITIES, type Attack } from '$lib/types';

	let { a, weapon = true }: { a: Attack; weapon?: boolean } = $props();
	const ch = $derived(currentChar());
	const r = $derived(attack(ch, a));

	function applyWeapon(key: string) {
		a.weapon = key;
		const w = WEAPONS[key];
		if (!w) return;
		a.kind = w.kind;
		a.dice = w.dice;
		a.versatile = w.versatile ?? '';
		a.type = w.type;
		a.mastery = w.mastery;
		a.props = w.props.join(', ');
		a.range = w.range ?? '';
		a.twoHanded = false;
	}
</script>

<div class="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
	{#if weapon}
		<label class="col-span-2 flex flex-col"
			>Based on
			<select
				class="select select-sm"
				value={a.weapon}
				onchange={(e) => applyWeapon(e.currentTarget.value)}
			>
				<option value="">Custom weapon</option>
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
	{:else}
		<label class="col-span-2 flex flex-col"
			>Name<input class="input input-sm" bind:value={a.name} /></label
		>
	{/if}
	<label class="flex flex-col"
		>Kind
		<select class="select select-sm" bind:value={a.kind}>
			{#if weapon}<option value="melee">Melee</option><option value="ranged">Ranged</option
				>{:else}<option value="spell">Spell</option><option value="melee">Melee</option><option
					value="ranged">Ranged</option
				>{/if}
		</select>
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
			{#each ABILITIES as ab (ab)}<option value={ab}>{AB_NAMES[ab]} save (DC)</option>{/each}
		</select>
	</label>
	<label class="flex flex-col"
		>Damage dice<input class="num input input-sm" bind:value={a.dice} placeholder="1d8" /></label
	>
	<label class="flex flex-col"
		>Versatile (two hands)<input
			class="num input input-sm"
			bind:value={a.versatile}
			placeholder="—"
		/></label
	>
	<label class="flex flex-col"
		>Damage type<input class="input input-sm" bind:value={a.type} placeholder="Slashing" /></label
	>
	<label class="flex flex-col"
		>Magic bonus<input type="number" class="num input input-sm" bind:value={a.magic} />
		<span class="text-base-content/55">added to hit and damage</span></label
	>
	<label class="flex flex-col"
		>Extra to hit<input type="number" class="num input input-sm" bind:value={a.hitMisc} /></label
	>
	<label class="flex flex-col"
		>Extra damage (flat)<input
			class="num input input-sm"
			bind:value={a.dmgMisc}
			placeholder="2"
		/></label
	>
	<label class="flex flex-col"
		>Mastery
		<select class="select select-sm" bind:value={a.mastery}
			><option value="">—</option>{#each Object.keys(MASTERIES) as m (m)}<option value={m}
					>{m}</option
				>{/each}</select
		>
	</label>
	<label class="flex flex-col"
		>Range<input class="input input-sm" bind:value={a.range} placeholder="20/60" /></label
	>
	<label class="col-span-2 flex flex-col"
		>Properties<input
			class="input input-sm"
			bind:value={a.props}
			placeholder="Finesse, Light"
		/></label
	>
	<label class="flex items-center gap-2 self-end pb-1"
		><input type="checkbox" class="checkbox checkbox-xs" bind:checked={a.proficient} /> Proficient</label
	>
	<label class="flex items-center gap-2 self-end pb-1"
		><input type="checkbox" class="checkbox checkbox-xs" bind:checked={a.addMod} /> Add ability mod to
		damage</label
	>

	<div class="col-span-2 flex flex-col gap-1 sm:col-span-4">
		<div class="flex items-center gap-2">
			<span class="font-medium">Extra damage dice</span>
			<span class="text-base-content/55"
				>For example a Flame Tongue's 2d6 Fire. Tick "always" to count it in the damage line;
				otherwise it is listed under the attack.</span
			>
			<button type="button" class="btn ml-auto btn-xs" onclick={() => a.extras.push(newExtra())}
				><Plus class="size-3" /> Add</button
			>
		</div>
		{#each a.extras as e (e.id)}
			<div class="grid grid-cols-[5rem_7rem_minmax(0,1fr)_auto_auto] items-center gap-2">
				<input class="num input input-xs" bind:value={e.dmg} placeholder="2d6" aria-label="Dice" />
				<input class="input input-xs" bind:value={e.type} placeholder="Fire" aria-label="Type" />
				<input
					class="input input-xs"
					bind:value={e.when}
					placeholder="when it applies"
					aria-label="When"
				/>
				<label class="flex items-center gap-1"
					><input type="checkbox" class="checkbox checkbox-xs" bind:checked={e.always} /> always</label
				>
				<button
					type="button"
					class="btn btn-square btn-ghost btn-xs"
					aria-label="Remove extra damage"
					onclick={() => (a.extras = a.extras.filter((x) => x.id !== e.id))}
					><Trash2 class="size-3" /></button
				>
			</div>
		{/each}
	</div>
	<label class="col-span-2 flex flex-col sm:col-span-4"
		>Notes<input class="input input-sm" bind:value={a.notes} /></label
	>
</div>
