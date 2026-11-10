<script lang="ts">
	import { currentChar } from '$lib/current.svelte';
	import { turnSummary, TURN_HINT, TURN_LABEL, type TurnEntry, type TurnSlot } from '$lib/turn';

	const ch = $derived(currentChar());
	const t = $derived(turnSummary(ch));
	const main: TurnSlot[] = ['action', 'bonus', 'reaction'];
	const srcColor: Record<string, string> = {
		Attack: 'text-primary',
		Spell: 'text-info',
		Class: 'text-primary',
		Subclass: 'text-accent',
		Species: 'text-info',
		Background: 'text-secondary',
		Feat: 'text-success',
		Item: 'text-secondary',
		Custom: 'text-base-content/70',
		Basic: 'text-base-content/50'
	};
	const own = (list: TurnEntry[]) => list.filter((e) => e.source !== 'Basic' || e.name === 'Opportunity Attack');
	const basics = $derived(t.action.filter((e) => e.source === 'Basic'));
</script>

{#snippet entry(e: TurnEntry)}
	<li class="border-base-300 border-b py-2 last:border-b-0">
		<div class="flex flex-wrap items-baseline gap-x-2">
			<span class="font-display font-bold">{e.name}</span>
			<span class="text-[0.65rem] font-semibold uppercase {srcColor[e.source]}">{e.source}</span>
			{#if e.uses}<span class="text-base-content/60 ml-auto text-xs">{e.uses}</span>{/if}
		</div>
		{#if e.lines}
			<ul class="mt-0.5 text-sm">{#each e.lines as l (l)}<li>{l}</li>{/each}</ul>
			<p class="text-base-content/65 mt-0.5 text-xs">{e.detail}</p>
		{:else}
			<p class="text-base-content/80 text-sm">{e.detail}</p>
		{/if}
	</li>
{/snippet}

<div class="flex flex-col gap-3">
	<p class="text-base-content/70 text-sm">On your turn: move up to your Speed, take one <b>Action</b>, and one <b>Bonus Action</b> if something gives you one. You get one <b>Reaction</b> per round. This page is also printed in the PDF.</p>
	<div class="grid gap-3 lg:grid-cols-3">
		{#each main as slot (slot)}
			<section class="panel" aria-labelledby="turn-{slot}">
				<h2 id="turn-{slot}" class="panel-title mb-0">{TURN_LABEL[slot]}</h2>
				<p class="text-base-content/55 text-xs">{TURN_HINT[slot]}</p>
				<ul class="mt-1">
					{#each own(t[slot]) as e (e.source + e.name)}{@render entry(e)}{:else}<li class="text-base-content/55 py-2 text-sm">Nothing yet.</li>{/each}
				</ul>
			</section>
		{/each}
	</div>
	{#if t.onhit.length}
		<section class="panel" aria-labelledby="turn-onhit">
			<h2 id="turn-onhit" class="panel-title mb-0">{TURN_LABEL.onhit}</h2>
			<p class="text-base-content/55 text-xs">{TURN_HINT.onhit}</p>
			<ul class="mt-1 grid gap-x-6 md:grid-cols-2">{#each t.onhit as e (e.source + e.name)}{@render entry(e)}{/each}</ul>
		</section>
	{/if}
	<section class="panel" aria-labelledby="turn-basic">
		<h2 id="turn-basic" class="panel-title">Standard actions everyone has</h2>
		<dl class="grid gap-x-6 gap-y-1 text-sm md:grid-cols-2">
			{#each basics as b (b.name)}<div><dt class="inline font-semibold">{b.name}.</dt> <dd class="text-base-content/75 inline">{b.detail}</dd></div>{/each}
		</dl>
	</section>
	{#if t.long.length}
		<details class="panel">
			<summary class="panel-title mb-0 cursor-pointer">{TURN_LABEL.long} ({t.long.length})</summary>
			<ul class="mt-1 grid gap-x-6 md:grid-cols-2">{#each t.long as e (e.name)}{@render entry(e)}{/each}</ul>
		</details>
	{/if}
</div>
