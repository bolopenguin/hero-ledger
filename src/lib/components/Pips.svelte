<script lang="ts">
	// A row of checkboxes for limited uses. Large pools fall back to a number field.
	let {
		max,
		used = $bindable(),
		label = 'uses',
		pool = false
	}: { max: number; used?: number; label?: string; pool?: boolean } = $props();
	// Never-used features have no stored count yet.
	const u = $derived(used ?? 0);
</script>

{#if pool || max > 12}
	<span class="inline-flex items-center gap-1 text-sm">
		<input
			type="number"
			class="input input-xs num w-16"
			min="0"
			{max}
			value={u}
			oninput={(e) => (used = Number(e.currentTarget.value) || 0)}
			aria-label="{label} spent"
		/>
		<span class="text-base-content/60">/ {max} spent</span>
	</span>
{:else}
	<span class="inline-flex flex-wrap gap-1" role="group" aria-label={label}>
		{#each Array(max) as _, i (i)}
			<button
				type="button"
				class="border-base-content/40 size-4 rounded-full border-2 transition-colors {i < u
					? 'bg-primary border-primary'
					: 'hover:border-primary'}"
				aria-label="{label} {i + 1} {i < u ? 'spent' : 'available'}"
				onclick={() => (used = i < u ? i : i + 1)}
			></button>
		{/each}
	</span>
{/if}
