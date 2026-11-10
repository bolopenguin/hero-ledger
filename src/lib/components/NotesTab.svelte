<script lang="ts">
	import { currentChar } from '$lib/current.svelte';
	const ch = $derived(currentChar());
	const fields = [
		['appearance', 'Appearance', 3],
		['personality', 'Personality traits', 3],
		['ideals', 'Ideals', 2],
		['bonds', 'Bonds', 2],
		['flaws', 'Flaws', 2],
		['allies', 'Allies & organizations', 3],
		['backstory', 'Backstory', 8],
		['other', 'Other notes', 6]
	] as const;
</script>

<div class="grid gap-3 md:grid-cols-2">
	{#each fields as [k, label, rows] (k)}
		<section class="panel {k === 'backstory' || k === 'other' ? 'md:col-span-2' : ''}">
			<label class="flex flex-col gap-1">
				<span class="panel-title mb-0">{label}</span>
				<textarea id="notes-{k}" class="textarea w-full" {rows} bind:value={ch.notes[k]}></textarea>
			</label>
		</section>
	{/each}
</div>
