<script lang="ts">
	// Situational switches: flip what is true right now and the sheet follows.
	import { currentChar } from '$lib/current.svelte';
	import { activeStates, availableStates, scores, stateCtx } from '$lib/calc';

	let { compact = false }: { compact?: boolean } = $props();
	const ch = $derived(currentChar());
	const sc = $derived(scores(ch));
	const states = $derived(availableStates(ch, sc));
	const on = $derived(activeStates(ch, sc));
	const ctx = $derived(stateCtx(ch, sc));
	function toggle(id: string) {
		ch.active = { ...(ch.active ?? {}), [id]: !ch.active?.[id] };
	}
</script>

<div class="flex flex-col gap-1.5">
	<div class="flex flex-wrap items-center gap-1.5" role="group" aria-label="Right now">
		{#if !compact}<span class="label-xs mr-1">Right now</span>{/if}
		<button
			type="button"
			class="btn btn-xs {ch.gear.shield ? 'btn-primary' : 'btn-outline'}"
			aria-pressed={ch.gear.shield}
			title="Holding a Shield (+2 AC)"
			onclick={() => (ch.gear.shield = !ch.gear.shield)}>Shield</button
		>
		{#each states as st (st.id)}
			<button
				type="button"
				class="btn btn-xs {ch.active?.[st.id] ? 'btn-primary' : 'btn-outline'}"
				aria-pressed={!!ch.active?.[st.id]}
				title={st.hint}
				onclick={() => toggle(st.id)}>{st.name}</button
			>
		{/each}
		{#if on.length}<button
				type="button"
				class="btn btn-ghost btn-xs"
				onclick={() => (ch.active = {})}>All off</button
			>{/if}
	</div>
	{#if !compact}
		<p class="text-xs text-base-content/55">
			The PDF uses these switches as you set them: the ones on are ticked and counted in AC and
			damage, the others print as empty tick boxes.
		</p>
	{/if}
	{#each on as st (st.id)}
		{#if st.notes}<p class="text-xs text-base-content/75"><b>{st.name}:</b> {st.notes(ctx)}</p>{/if}
	{/each}
</div>
