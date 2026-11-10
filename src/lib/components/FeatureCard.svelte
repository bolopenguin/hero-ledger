<script lang="ts">
	import { Pencil, Eye, EyeOff, Trash2, RotateCcw } from 'lucide-svelte';
	import { currentChar } from '$lib/current.svelte';
	import { allFeats, featAsiPoints, type RFeature } from '$lib/calc';
	import { ACTION_LABELS, AB_NAMES } from '$lib/data/srd';
	import { ABILITIES, type ActionType, type PickKind, type Recharge } from '$lib/types';
	import Pips from './Pips.svelte';

	let { f, compact = false }: { f: RFeature; compact?: boolean } = $props();
	const ch = $derived(currentChar());
	let editing = $state(false);

	const custom = $derived(f.customId ? ch.features.find((x) => x.id === f.customId) : undefined);
	const pick = $derived(ch.picks[f.key]);
	const rechargeLabel: Record<string, string> = {
		short: 'Short Rest',
		short1: '1 per Short, all per Long',
		long: 'Long Rest',
		'': ''
	};
	const srcColor: Record<string, string> = {
		Class: 'text-primary',
		Subclass: 'text-accent',
		Species: 'text-info',
		Background: 'text-secondary',
		Feat: 'text-success',
		Custom: 'text-base-content/70'
	};

	function featOptions(kind: PickKind) {
		const feats = allFeats();
		const cats: PickKind[] =
			kind === 'origin' ? ['origin'] : kind === 'style' ? ['style'] : kind === 'epic' ? ['epic', 'general', 'origin'] : ['general', 'origin', 'style'];
		return Object.entries(feats)
			.filter(([, d]) => cats.includes(d.cat))
			.sort((a, b) => cats.indexOf(a[1].cat) - cats.indexOf(b[1].cat) || a[1].name.localeCompare(b[1].name));
	}
	const catLabel: Record<string, string> = { origin: 'Origin', general: 'General', style: 'Fighting Style', epic: 'Epic Boon' };

	function setPick(v: string) {
		if (!v) delete ch.picks[f.key];
		else ch.picks[f.key] = { feat: v, asi: v === 'asi' ? {} : (pick?.asi ?? {}) };
	}
	const points = $derived(pick ? featAsiPoints(pick.feat) : 0);
	const spent = $derived(pick?.asi ? Object.values(pick.asi).reduce((a, b) => a + (b ?? 0), 0) : 0);

	function setEdit(field: 'n' | 'd' | 'notes', v: string) {
		ch.edits[f.key] = { ...(ch.edits[f.key] ?? {}), [field]: v };
	}
	function resetEdit() {
		const e = ch.edits[f.key];
		if (!e) return;
		delete e.n;
		delete e.d;
	}
	function toggleHidden() {
		ch.edits[f.key] = { ...(ch.edits[f.key] ?? {}), hidden: !f.hidden };
	}
</script>

<article class="border-base-300 border-b py-2.5 last:border-b-0 {f.hidden ? 'opacity-50' : ''}">
	<header class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
		<h4 class="font-display text-base font-bold">{f.n}</h4>
		{#if !compact}<span class="text-xs font-semibold tracking-wide uppercase {srcColor[f.src]}">{f.src}</span>{/if}
		{#if f.a !== 'passive'}<span class="tag">{ACTION_LABELS[f.a]}</span>{/if}
		{#if f.edited}<span class="tag !text-accent">edited</span>{/if}
		<span class="ml-auto flex items-center gap-2">
			{#if f.uses}
				<Pips max={f.uses} pool={f.pool} label={f.n} bind:used={ch.used[f.key]} />
				{#if f.r}<span class="text-base-content/55 text-xs">{rechargeLabel[f.r]}</span>{/if}
			{/if}
			{#if !compact}
				<button type="button" class="btn btn-ghost btn-xs btn-square" title="Edit text or add notes" onclick={() => (editing = !editing)}><Pencil class="size-3.5" /></button>
				{#if !custom}
					<button type="button" class="btn btn-ghost btn-xs btn-square" title={f.hidden ? 'Show' : 'Hide (keeps it out of the PDF)'} onclick={toggleHidden}>
						{#if f.hidden}<EyeOff class="size-3.5" />{:else}<Eye class="size-3.5" />{/if}
					</button>
				{/if}
			{/if}
		</span>
	</header>

	{#if f.placeholder && !f.edited && !compact}
		<p class="text-base-content/60 mt-1 text-sm italic">
			Choose a subclass above, or click the pencil to write this feature in yourself.
		</p>
	{/if}
	{#if f.d}<p class="desc mt-1 whitespace-pre-line">{f.d}</p>{/if}
	{#if f.notes}<p class="border-secondary text-base-content/80 mt-1 border-l-2 pl-2 text-sm whitespace-pre-line">{f.notes}</p>{/if}

	{#if f.pick && !compact}
		<div class="bg-base-200 rounded-box mt-2 flex flex-col gap-2 p-2">
			<label class="flex flex-wrap items-center gap-2 text-sm">
				<span class="font-medium">Chosen feat</span>
				<select class="select select-sm min-w-0 flex-1" value={pick?.feat ?? ''} onchange={(e) => setPick(e.currentTarget.value)}>
					<option value="">— choose —</option>
					{#each featOptions(f.pick) as [k, d] (k)}
						<option value={k}>{d.name} · {catLabel[d.cat]}</option>
					{/each}
					<option value="custom">Other feat (write it in)</option>
				</select>
			</label>
			{#if pick?.feat === 'custom'}
				<input class="input input-sm w-full" placeholder="Feat name" bind:value={pick.n} />
				<textarea class="textarea textarea-sm w-full" rows="3" placeholder="What it does. Use {'{pb}'}, {'{wis}'}, {'{lvl}'} for numbers that update." bind:value={pick.d}></textarea>
			{/if}
			{#if pick && points > 0}
				<div class="flex flex-wrap items-center gap-2 text-sm">
					<span class="font-medium">Ability increase</span>
					<span class="text-base-content/60">({spent}/{points} points)</span>
					{#each ABILITIES as ab (ab)}
						<label class="flex items-center gap-1">
							<span class="text-xs uppercase">{ab}</span>
							<select
								class="select select-xs w-14"
								title={AB_NAMES[ab]}
								value={String(pick.asi?.[ab] ?? 0)}
								onchange={(e) => {
									pick.asi = { ...(pick.asi ?? {}), [ab]: Number(e.currentTarget.value) };
								}}
							>
								{#each Array(points + 1) as _, v (v)}<option value={String(v)}>+{v}</option>{/each}
							</select>
						</label>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	{#if editing}
		<div class="bg-base-200 rounded-box mt-2 flex flex-col gap-2 p-2">
			{#if custom}
				<div class="grid grid-cols-2 gap-2 sm:grid-cols-5">
					<label class="col-span-2 flex flex-col text-xs">Name<input class="input input-sm" bind:value={custom.n} /></label>
					<label class="flex flex-col text-xs">Level<input type="number" min="1" max="20" class="input input-sm num" bind:value={custom.l} /></label>
					<label class="flex flex-col text-xs">Source<input class="input input-sm" bind:value={custom.src} placeholder="Feat, Item…" /></label>
					<label class="flex flex-col text-xs">Type
						<select class="select select-sm" bind:value={custom.a}>
							{#each Object.entries(ACTION_LABELS) as [k, v] (k)}<option value={k as ActionType}>{v}</option>{/each}
						</select>
					</label>
					<label class="col-span-2 flex flex-col text-xs sm:col-span-3">Uses (number or formula, e.g. max(1, wis) or pb)<input class="input input-sm num" bind:value={custom.uses} /></label>
					<label class="col-span-2 flex flex-col text-xs">Recharge
						<select class="select select-sm" bind:value={custom.r}>
							<option value={'' as Recharge}>—</option>
							<option value={'short' as Recharge}>Short Rest</option>
							<option value={'short1' as Recharge}>1 per Short, all per Long</option>
							<option value={'long' as Recharge}>Long Rest</option>
						</select>
					</label>
				</div>
				<textarea class="textarea textarea-sm w-full" rows="4" bind:value={custom.d} placeholder="Description. Use {'{pb}'}, {'{str}'}, {'{lvl}'}, {'{8 + wis + pb}'} for numbers that update."></textarea>
				<button type="button" class="btn btn-error btn-outline btn-xs self-start" onclick={() => (ch.features = ch.features.filter((x) => x.id !== custom.id))}><Trash2 class="size-3" /> Delete feature</button>
			{:else}
				<label class="flex flex-col text-xs">Name<input class="input input-sm" value={f.n} oninput={(e) => setEdit('n', e.currentTarget.value)} /></label>
				<label class="flex flex-col text-xs">Description (replaces the built-in text; {'{pb}'}, {'{wis}'}, {'{lvl}'} work)
					<textarea class="textarea textarea-sm w-full" rows="4" value={ch.edits[f.key]?.d ?? f.d} oninput={(e) => setEdit('d', e.currentTarget.value)}></textarea>
				</label>
				{#if f.edited}<button type="button" class="btn btn-ghost btn-xs self-start" onclick={resetEdit}><RotateCcw class="size-3" /> Restore original text</button>{/if}
			{/if}
			{#if !custom}
				<label class="flex flex-col text-xs">Your notes (house rules, reminders)
					<textarea class="textarea textarea-sm w-full" rows="2" value={ch.edits[f.key]?.notes ?? ''} oninput={(e) => setEdit('notes', e.currentTarget.value)}></textarea>
				</label>
			{/if}
		</div>
	{/if}
</article>
