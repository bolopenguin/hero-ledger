<script lang="ts">
	// The full wording of a rule from a content pack, folded away under a toggle.
	import { runIn, type RulesText } from '$lib/packs.svelte';

	let { text }: { text: RulesText } = $props();
</script>

<details class="mt-1 text-sm">
	<summary class="cursor-pointer text-xs text-base-content/60 select-none">
		Full rules text{text.page ? ` (p. ${text.page})` : ''}
	</summary>
	<div
		class="mt-1 flex max-w-3xl flex-col gap-1 border-l-2 border-base-300 pl-2 text-base-content/85"
	>
		{#each text.full.split('\n') as para, i (i)}
			{#if para.startsWith('# ')}
				<p class="font-semibold">{para.slice(2)}</p>
			{:else}
				{@const bullet = para.startsWith('• ')}
				{@const [lead, rest] = runIn(bullet ? para.slice(2) : para)}
				<p class={bullet ? 'pl-3 -indent-3' : ''}>
					{bullet ? '• ' : ''}<b>{lead}</b>{lead ? ' ' : ''}{rest}
				</p>
			{/if}
		{/each}
	</div>
</details>
