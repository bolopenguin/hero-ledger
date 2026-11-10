<script lang="ts">
	import { Pencil, Eye, EyeOff, Trash2, RotateCcw } from 'lucide-svelte';
	import { currentChar } from '$lib/current.svelte';
	import { allFeats, allOptions, featAbilities, featAsiPoints, makeCtx, scores, type RFeature } from '$lib/calc';
	import { fillTemplate } from '$lib/formula';
	import { ACTION_LABELS, AB_NAMES } from '$lib/data/srd';
	import { ABILITIES, type ActionType, type PickKind, type Recharge } from '$lib/types';

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

	const catLabel: Record<string, string> = { origin: 'Origin', general: 'General', style: 'Fighting Style', epic: 'Epic Boon' };
	function featOptions(kind: PickKind) {
		const feats = allFeats();
		const cats: PickKind[] =
			kind === 'origin' ? ['origin'] : kind === 'style' ? ['style'] : kind === 'epic' ? ['epic', 'general', 'origin'] : ['general', 'origin', 'style'];
		return Object.entries(feats)
			.filter(([k, d]) => k !== 'asi' && cats.includes(d.cat) && (!d.forClass || d.forClass === ch.classId))
			.sort((a, b) => cats.indexOf(a[1].cat) - cats.indexOf(b[1].cat) || a[1].name.localeCompare(b[1].name));
	}
	// ASI levels offer a choice between raising ability scores and taking a feat.
	const asiSlot = $derived(f.pick === 'general' || f.pick === 'epic');
	const mode = $derived(!pick ? '' : pick.feat === 'asi' ? 'asi' : 'feat');
	function setMode(m: 'asi' | 'feat') {
		ch.picks[f.key] = m === 'asi' ? { feat: 'asi', asi: {} } : { feat: '', asi: {} };
	}
	function setPick(v: string) {
		if (!v && !asiSlot) delete ch.picks[f.key];
		else ch.picks[f.key] = { feat: v, asi: {} };
	}
	const points = $derived(pick?.feat ? featAsiPoints(pick.feat) : 0);
	const allowed = $derived(pick?.feat ? featAbilities(pick.feat) : []);
	const spent = $derived(pick?.asi ? Object.values(pick.asi).reduce((a, b) => a + (b ?? 0), 0) : 0);
	const chosenDef = $derived(pick?.feat ? allFeats()[pick.feat] : undefined);
	function setOne(ab: string) {
		if (pick) pick.asi = { [ab]: 1 };
	}

	// Option lists: invocations, metamagic, maneuvers…
	const ctx = $derived(makeCtx(ch, scores(ch)));
	const optList = $derived(f.choose ? allOptions(ch)[f.choose.list] : undefined);
	const chosen = $derived(f.choose ? (ch.choices[f.key] ?? []) : []);
	let showOptions = $state(false);
	function toggleOption(k: string) {
		const cur = ch.choices[f.key] ?? [];
		ch.choices[f.key] = cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k];
	}

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
				<span class="tag" title="Uses; tick them off on the printed sheet">{f.pool ? `${f.uses} pool` : `${f.uses}×`}{f.r ? ` · ${rechargeLabel[f.r]}` : ''}</span>
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
			{#if asiSlot}
				<div class="flex flex-wrap items-center gap-4 text-sm" role="radiogroup" aria-label="{f.n} choice">
					<label class="flex items-center gap-1.5"><input type="radio" class="radio radio-xs radio-primary" checked={mode === 'asi'} onchange={() => setMode('asi')} /> Ability scores (+2, or +1/+1)</label>
					<label class="flex items-center gap-1.5"><input type="radio" class="radio radio-xs radio-primary" checked={mode === 'feat'} onchange={() => setMode('feat')} /> Feat</label>
				</div>
			{/if}
			{#if !asiSlot || mode === 'feat'}
				<label class="flex flex-wrap items-center gap-2 text-sm">
					<span class="font-medium">Feat</span>
					<select class="select select-sm min-w-0 flex-1" value={pick?.feat ?? ''} onchange={(e) => setPick(e.currentTarget.value)}>
						<option value="">— choose —</option>
						{#each featOptions(f.pick) as [k, d] (k)}
							<option value={k}>{d.name} · {catLabel[d.cat]}</option>
						{/each}
						<option value="custom">Other feat (write it in)</option>
					</select>
				</label>
				{#if chosenDef?.prereq}<p class="text-base-content/60 text-xs">Prerequisite: {chosenDef.prereq}</p>{/if}
			{/if}
			{#if pick?.feat === 'custom'}
				<input class="input input-sm w-full" placeholder="Feat name" bind:value={pick.n} />
				<textarea class="textarea textarea-sm w-full" rows="3" placeholder="What it does. Use {'{pb}'}, {'{wis}'}, {'{lvl}'} for numbers that update." bind:value={pick.d}></textarea>
			{/if}
			{#if pick && points === 2}
				<div class="flex flex-wrap items-center gap-2 text-sm">
					<span class="font-medium">Increase</span>
					<span class="{spent > 2 ? 'text-error' : 'text-base-content/60'}">({spent}/2 points)</span>
					{#each ABILITIES as ab (ab)}
						<label class="flex items-center gap-1">
							<span class="text-xs uppercase">{ab}</span>
							<select class="select select-xs w-14" title={AB_NAMES[ab]} value={String(pick.asi?.[ab] ?? 0)} onchange={(e) => { pick.asi = { ...(pick.asi ?? {}), [ab]: Number(e.currentTarget.value) }; }}>
								<option value="0">+0</option><option value="1">+1</option><option value="2">+2</option>
							</select>
						</label>
					{/each}
				</div>
			{:else if pick && points === 1}
				<div class="flex flex-wrap items-center gap-3 text-sm" role="radiogroup" aria-label="Ability increase">
					<span class="font-medium">+1 to</span>
					{#each allowed as ab (ab)}
						<label class="flex items-center gap-1"><input type="radio" class="radio radio-xs" checked={(pick.asi?.[ab] ?? 0) > 0} onchange={() => setOne(ab)} /> {AB_NAMES[ab]}</label>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	{#if f.choose}
		<div class="mt-2 flex flex-col gap-1.5 {compact ? '' : 'bg-base-200 rounded-box p-2'}">
			{#if !compact}
				<div class="flex flex-wrap items-center gap-2 text-sm">
					<span class="font-medium">{optList?.label ?? f.choose.list}</span>
					<span class="{chosen.length > f.choose.count ? 'text-error' : 'text-base-content/60'}">{chosen.length}/{f.choose.count} chosen</span>
					{#if optList}<button type="button" class="btn btn-xs ml-auto" onclick={() => (showOptions = !showOptions)}>{showOptions ? 'Done' : 'Choose'}</button>{/if}
				</div>
				{#if !optList}<p class="text-base-content/60 text-xs">Load a content pack with this option list to pick them here, or add each one as a custom feature.</p>{/if}
			{/if}
			{#each chosen as k (k)}
				{@const it = optList?.items[k]}
				{#if it}<p class="text-sm"><b>{it.name}.</b> <span class="text-base-content/80">{fillTemplate(it.d, ctx)}</span></p>{/if}
			{/each}
			{#if showOptions && optList && !compact}
				<ul class="border-base-300 mt-1 flex max-h-80 flex-col gap-1 overflow-y-auto border-t pt-2">
					{#each Object.entries(optList.items) as [k, it] (k)}
						{@const on = chosen.includes(k)}
						{@const tooLow = (it.l ?? 1) > ch.level}
						<li>
							<label class="flex items-start gap-2 text-sm {tooLow ? 'opacity-50' : ''}">
								<input type="checkbox" class="checkbox checkbox-xs mt-0.5" checked={on} disabled={!on && (tooLow || chosen.length >= f.choose.count)} onchange={() => toggleOption(k)} />
								<span><b>{it.name}</b>{#if (it.l ?? 1) > 1}<span class="text-base-content/60 text-xs"> · level {it.l}+</span>{/if}{#if it.prereq}<span class="text-base-content/60 text-xs"> · needs {it.prereq}</span>{/if} <span class="text-base-content/75">{fillTemplate(it.d, ctx)}</span></span>
							</label>
						</li>
					{/each}
				</ul>
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
