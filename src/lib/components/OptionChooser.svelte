<script lang="ts">
	// One choice on a feature or feat: pick a number of entries from an option list
	// (invocations, cantrips, skills for Expertise, tools…).
	import { currentChar } from '$lib/current.svelte';
	import { allOptions, makeCtx, optionList, scores, type RChoice } from '$lib/calc';
	import { fillTemplate } from '$lib/formula';

	let { choice, compact = false }: { choice: RChoice; compact?: boolean } = $props();
	const ch = $derived(currentChar());
	const ctx = $derived(makeCtx(ch, scores(ch)));
	const list = $derived(optionList(allOptions(ch), choice.list));
	const chosen = $derived(ch.choices[choice.key] ?? []);
	// Keep the list open until every pick is made, unless the player opens or closes it.
	let open = $state<boolean | null>(null);
	const showList = $derived(open ?? chosen.length < choice.count);
	const isSpells = $derived(/^(spells|school|rituals):/.test(choice.list));

	function toggle(k: string) {
		const cur = ch.choices[choice.key] ?? [];
		if (cur.includes(k)) ch.choices[choice.key] = cur.filter((x) => x !== k);
		else if (choice.count === 1) ch.choices[choice.key] = [k];
		else ch.choices[choice.key] = [...cur, k];
	}
</script>

{#if choice.count > 0}
	<div class="mt-2 flex flex-col gap-1.5 {compact ? '' : 'rounded-box bg-base-200 p-2'}">
		{#if !compact}
			<div class="flex flex-wrap items-center gap-2 text-sm">
				<span class="font-medium">{choice.label ?? list?.label ?? choice.list}</span>
				<span
					class={chosen.length > choice.count
						? 'text-error'
						: chosen.length < choice.count
							? 'text-warning'
							: 'text-base-content/60'}>{chosen.length}/{choice.count} chosen</span
				>
				{#if list && Object.keys(list.items).length}<button
						type="button"
						class="btn ml-auto btn-xs"
						onclick={() => (open = !showList)}>{showList ? 'Done' : 'Change'}</button
					>{/if}
			</div>
			{#if !list || !Object.keys(list.items).length}<p class="text-xs text-base-content/60">
					{isSpells
						? 'No spells for this list yet: load a content pack with spells, or add them in the Spells tab.'
						: 'Load a content pack with this option list to pick them here, or write it in with the pencil.'}
				</p>{/if}
		{/if}
		{#each chosen as k (k)}
			{@const it = list?.items[k]}
			{#if it}<p class="text-sm">
					<b>{it.name}.</b>
					{#if isSpells}<span class="text-base-content/60">Added to your spells.</span>{:else}<span
							class="text-base-content/80">{fillTemplate(it.d, ctx)}</span
						>{/if}
				</p>{/if}
		{/each}
		{#if showList && list && !compact}
			<ul class="mt-1 flex max-h-80 flex-col gap-1 overflow-y-auto border-t border-base-300 pt-2">
				{#each Object.entries(list.items) as [k, it] (k)}
					{@const on = chosen.includes(k)}
					{@const tooLow = (it.l ?? 1) > ch.level}
					<li>
						<label class="flex items-start gap-2 text-sm {tooLow ? 'opacity-50' : ''}">
							<input
								type={choice.count === 1 ? 'radio' : 'checkbox'}
								name={choice.key}
								class="{choice.count === 1 ? 'radio radio-xs' : 'checkbox checkbox-xs'} mt-0.5"
								checked={on}
								disabled={!on && (tooLow || (choice.count > 1 && chosen.length >= choice.count))}
								onchange={() => toggle(k)}
							/>
							<span
								><b>{it.name}</b>{#if (it.l ?? 1) > 1}<span class="text-xs text-base-content/60">
										· level {it.l}+</span
									>{/if}{#if it.prereq}<span class="text-xs text-base-content/60">
										· needs {it.prereq}</span
									>{/if}
								<span class="text-base-content/75">{fillTemplate(it.d, ctx)}</span></span
							>
						</label>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
{/if}
