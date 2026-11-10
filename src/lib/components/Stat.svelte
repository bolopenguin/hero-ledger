<script lang="ts">
	// A calculated number that the player can adjust (misc bonus) or replace (override).
	import { Pencil, RotateCcw } from 'lucide-svelte';
	import { currentChar } from '$lib/current.svelte';
	import { signed } from '$lib/calc';

	let {
		label,
		value,
		key,
		sign = false,
		suffix = '',
		parts = [],
		size = 'lg'
	}: {
		label: string;
		value: number;
		key: string;
		sign?: boolean;
		suffix?: string;
		parts?: string[];
		size?: 'lg' | 'sm';
	} = $props();

	const ch = $derived(currentChar());
	let open = $state(false);
	const custom = $derived(ch.overrides[key] !== undefined || !!ch.bonus[key]);

	function setOverride(v: string) {
		if (v === '') delete ch.overrides[key];
		else ch.overrides[key] = Number(v);
	}
	function setBonus(v: string) {
		if (v === '' || Number(v) === 0) delete ch.bonus[key];
		else ch.bonus[key] = Number(v);
	}
</script>

<div class="relative flex flex-col items-center text-center">
	<span class="label-xs">{label}</span>
	<button
		type="button"
		class="group flex items-center gap-1 rounded px-1 whitespace-nowrap {size === 'lg'
			? 'text-2xl'
			: 'text-lg'} num hover:bg-base-200 {custom ? 'text-accent' : ''}"
		title={[...parts, custom ? 'Custom value set' : '', 'Click to adjust'].filter(Boolean).join('\n')}
		onclick={() => (open = !open)}
	>
		{sign ? signed(value) : value}{suffix}
		<Pencil class="size-3 opacity-0 group-hover:opacity-50" />
	</button>
	{#if open}
		<div
			class="rounded-box border-base-300 bg-base-100 absolute top-full z-30 mt-1 w-56 border p-3 text-left shadow-lg"
		>
			{#if parts.length}
				<ul class="text-base-content/70 mb-2 text-xs">
					{#each parts as p (p)}<li>{p}</li>{/each}
				</ul>
			{/if}
			<label class="mb-2 flex items-center justify-between gap-2 text-sm">
				Misc bonus
				<input
					type="number"
					class="input input-sm num w-20"
					value={ch.bonus[key] ?? ''}
					oninput={(e) => setBonus(e.currentTarget.value)}
				/>
			</label>
			<label class="flex items-center justify-between gap-2 text-sm">
				Replace with
				<input
					type="number"
					class="input input-sm num w-20"
					placeholder="auto"
					value={ch.overrides[key] ?? ''}
					oninput={(e) => setOverride(e.currentTarget.value)}
				/>
			</label>
			<div class="mt-3 flex justify-between">
				<button
					type="button"
					class="btn btn-ghost btn-xs"
					onclick={() => {
						delete ch.overrides[key];
						delete ch.bonus[key];
					}}><RotateCcw class="size-3" /> Auto</button
				>
				<button type="button" class="btn btn-primary btn-xs" onclick={() => (open = false)}>Done</button>
			</div>
		</div>
	{/if}
</div>
