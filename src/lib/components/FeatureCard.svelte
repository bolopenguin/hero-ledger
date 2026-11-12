<script lang="ts">
	import { Pencil, Eye, EyeOff, Trash2, RotateCcw } from 'lucide-svelte';
	import { currentChar } from '$lib/current.svelte';
	import { allFeats, featAbilities, featAsiPoints, featureAnchor, type RFeature } from '$lib/calc';
	import { rulesText } from '$lib/packs.svelte';
	import RulesText from './RulesText.svelte';
	import OptionChooser from './OptionChooser.svelte';
	import { ACTION_LABELS, AB_NAMES } from '$lib/data/srd';
	import { ABILITIES, type ActionType, type PickKind, type Recharge } from '$lib/types';

	let { f, compact = false }: { f: RFeature; compact?: boolean } = $props();
	const ch = $derived(currentChar());
	let editing = $state(false);

	const full = $derived(f.tkey && !f.edited ? rulesText(f.tkey) : null);
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

	const catLabel: Record<string, string> = {
		origin: 'Origin',
		general: 'General',
		style: 'Fighting Style',
		epic: 'Epic Boon'
	};
	function featOptions(kind: PickKind) {
		const feats = allFeats();
		const cats: PickKind[] =
			kind === 'origin'
				? ['origin']
				: kind === 'style'
					? ['style']
					: kind === 'epic'
						? ['epic', 'general', 'origin']
						: ['general', 'origin', 'style'];
		const only = f.pickFrom ? new Set(f.pickFrom) : null;
		return Object.entries(feats)
			.filter(
				([k, d]) =>
					k !== 'asi' &&
					(only ? only.has(k) : cats.includes(d.cat)) &&
					(!d.forClass || d.forClass === ch.classId)
			)
			.sort(
				(a, b) =>
					cats.indexOf(a[1].cat) - cats.indexOf(b[1].cat) || a[1].name.localeCompare(b[1].name)
			);
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

	// Fighting Style: some classes may take a class-specific alternative (Blessed or Druidic
	// Warrior) instead of a Fighting Style feat.
	const styleAlt = $derived(
		f.pick === 'style'
			? Object.entries(allFeats()).find(([, d]) => d.cat === 'style' && d.forClass === ch.classId)
			: undefined
	);
	const styleMode = $derived(!pick?.feat ? '' : pick.feat === styleAlt?.[0] ? 'alt' : 'feat');
	function setStyleMode(m: 'alt' | 'feat') {
		ch.picks[f.key] = { feat: m === 'alt' && styleAlt ? styleAlt[0] : '', asi: {} };
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

<article
	id={compact ? undefined : featureAnchor(f.key)}
	class="scroll-mt-28 border-b border-base-300 py-2.5 last:border-b-0 {f.hidden
		? 'opacity-50'
		: ''}"
>
	<header class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
		<h4 class="font-display text-base font-bold">{f.n}</h4>
		{#if !compact}<span class="text-xs font-semibold tracking-wide uppercase {srcColor[f.src]}"
				>{f.src}</span
			>{/if}
		{#if f.a !== 'passive'}<span class="tag">{ACTION_LABELS[f.a]}</span>{/if}
		{#if f.edited}<span class="tag !text-accent">edited</span>{/if}
		<span class="ml-auto flex items-center gap-2">
			{#if f.uses}
				<span class="tag" title="Uses; tick them off on the printed sheet"
					>{f.pool ? `${f.uses} pool` : `${f.uses}×`}{f.r ? ` · ${rechargeLabel[f.r]}` : ''}</span
				>
			{/if}
			{#if !compact}
				<button
					type="button"
					class="btn btn-square btn-ghost btn-xs"
					title="Edit text or add notes"
					onclick={() => (editing = !editing)}><Pencil class="size-3.5" /></button
				>
				{#if !custom}
					<button
						type="button"
						class="btn btn-square btn-ghost btn-xs"
						title={f.hidden ? 'Show' : 'Hide (keeps it out of the PDF)'}
						onclick={toggleHidden}
					>
						{#if f.hidden}<EyeOff class="size-3.5" />{:else}<Eye class="size-3.5" />{/if}
					</button>
				{/if}
			{/if}
		</span>
	</header>

	{#if f.placeholder && !f.edited && !compact}
		<p class="mt-1 text-sm text-base-content/60 italic">
			Choose a subclass above, or click the pencil to write this feature in yourself.
		</p>
	{/if}
	{#if f.d}<p class="desc mt-1 whitespace-pre-line">{f.d}</p>{/if}
	{#if full && !compact}<RulesText text={full} />{/if}
	{#if f.notes}<p
			class="mt-1 border-l-2 border-secondary pl-2 text-sm whitespace-pre-line text-base-content/80"
		>
			{f.notes}
		</p>{/if}

	{#if f.pick && !compact}
		<div class="mt-2 flex flex-col gap-2 rounded-box bg-base-200 p-2">
			{#if asiSlot}
				<div
					class="flex flex-wrap items-center gap-4 text-sm"
					role="radiogroup"
					aria-label="{f.n} choice"
				>
					<label class="flex items-center gap-1.5"
						><input
							type="radio"
							class="radio radio-xs radio-primary"
							checked={mode === 'asi'}
							onchange={() => setMode('asi')}
						/> Ability scores (+2, or +1/+1)</label
					>
					<label class="flex items-center gap-1.5"
						><input
							type="radio"
							class="radio radio-xs radio-primary"
							checked={mode === 'feat'}
							onchange={() => setMode('feat')}
						/> Feat</label
					>
				</div>
			{/if}
			{#if styleAlt}
				<div
					class="flex flex-wrap items-center gap-4 text-sm"
					role="radiogroup"
					aria-label="{f.n} choice"
				>
					<label class="flex items-center gap-1.5"
						><input
							type="radio"
							class="radio radio-xs radio-primary"
							checked={styleMode === 'feat' || (!!pick && !pick.feat)}
							onchange={() => setStyleMode('feat')}
						/> Fighting Style feat</label
					>
					<label class="flex items-center gap-1.5"
						><input
							type="radio"
							class="radio radio-xs radio-primary"
							checked={styleMode === 'alt'}
							onchange={() => setStyleMode('alt')}
						/>
						{styleAlt[1].name}</label
					>
				</div>
			{/if}
			{#if styleMode === 'alt'}
				<p class="text-xs text-base-content/60">
					Pick the cantrips in the {styleAlt?.[1].name} entry below.
				</p>
			{:else if !asiSlot || mode === 'feat'}
				<label class="flex flex-wrap items-center gap-2 text-sm">
					<span class="font-medium">Feat</span>
					<select
						class="select min-w-0 flex-1 select-sm"
						value={pick?.feat ?? ''}
						onchange={(e) => setPick(e.currentTarget.value)}
					>
						<option value="">— choose —</option>
						{#each featOptions(f.pick).filter(([k]) => k !== styleAlt?.[0]) as [k, d] (k)}
							<option value={k}>{d.name} · {catLabel[d.cat]}</option>
						{/each}
						<option value="custom">Other feat (write it in)</option>
					</select>
				</label>
				{#if chosenDef?.prereq}<p class="text-xs text-base-content/60">
						Prerequisite: {chosenDef.prereq}
					</p>{/if}
			{/if}
			{#if pick?.feat === 'custom'}
				<input class="input w-full input-sm" placeholder="Feat name" bind:value={pick.n} />
				<textarea
					class="textarea w-full textarea-sm"
					rows="3"
					placeholder="What it does. Use {'{pb}'}, {'{wis}'}, {'{lvl}'} for numbers that update."
					bind:value={pick.d}
				></textarea>
			{/if}
			{#if pick && points === 2}
				<div class="flex flex-wrap items-center gap-2 text-sm">
					<span class="font-medium">Increase</span>
					<span class={spent > 2 ? 'text-error' : 'text-base-content/60'}>({spent}/2 points)</span>
					{#each ABILITIES as ab (ab)}
						<label class="flex items-center gap-1">
							<span class="text-xs uppercase">{ab}</span>
							<select
								class="select w-14 select-xs"
								title={AB_NAMES[ab]}
								value={String(pick.asi?.[ab] ?? 0)}
								onchange={(e) => {
									pick.asi = { ...(pick.asi ?? {}), [ab]: Number(e.currentTarget.value) };
								}}
							>
								<option value="0">+0</option><option value="1">+1</option><option value="2"
									>+2</option
								>
							</select>
						</label>
					{/each}
				</div>
			{:else if pick && points === 1}
				<div
					class="flex flex-wrap items-center gap-3 text-sm"
					role="radiogroup"
					aria-label="Ability increase"
				>
					<span class="font-medium">+1 to</span>
					{#each allowed as ab (ab)}
						<label class="flex items-center gap-1"
							><input
								type="radio"
								class="radio radio-xs"
								checked={(pick.asi?.[ab] ?? 0) > 0}
								onchange={() => setOne(ab)}
							/>
							{AB_NAMES[ab]}</label
						>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	{#each f.choose ?? [] as cd (cd.key)}<OptionChooser choice={cd} {compact} />{/each}

	{#if editing}
		<div class="mt-2 flex flex-col gap-2 rounded-box bg-base-200 p-2">
			{#if custom}
				<div class="grid grid-cols-2 gap-2 sm:grid-cols-5">
					<label class="col-span-2 flex flex-col text-xs"
						>Name<input class="input input-sm" bind:value={custom.n} /></label
					>
					<label class="flex flex-col text-xs"
						>Level<input
							type="number"
							min="1"
							max="20"
							class="num input input-sm"
							bind:value={custom.l}
						/></label
					>
					<label class="flex flex-col text-xs"
						>Source<input
							class="input input-sm"
							bind:value={custom.src}
							placeholder="Feat, Item…"
						/></label
					>
					<label class="flex flex-col text-xs"
						>Type
						<select class="select select-sm" bind:value={custom.a}>
							{#each Object.entries(ACTION_LABELS) as [k, v] (k)}<option value={k as ActionType}
									>{v}</option
								>{/each}
						</select>
					</label>
					<label class="col-span-2 flex flex-col text-xs sm:col-span-3"
						>Uses (number or formula, e.g. max(1, wis) or pb)<input
							class="num input input-sm"
							bind:value={custom.uses}
						/></label
					>
					<label class="col-span-2 flex flex-col text-xs"
						>Recharge
						<select class="select select-sm" bind:value={custom.r}>
							<option value={'' as Recharge}>—</option>
							<option value={'short' as Recharge}>Short Rest</option>
							<option value={'short1' as Recharge}>1 per Short, all per Long</option>
							<option value={'long' as Recharge}>Long Rest</option>
						</select>
					</label>
				</div>
				<textarea
					class="textarea w-full textarea-sm"
					rows="4"
					bind:value={custom.d}
					placeholder="Description. Use {'{pb}'}, {'{str}'}, {'{lvl}'}, {'{8 + wis + pb}'} for numbers that update."
				></textarea>
				<button
					type="button"
					class="btn self-start btn-outline btn-error btn-xs"
					onclick={() => (ch.features = ch.features.filter((x) => x.id !== custom.id))}
					><Trash2 class="size-3" /> Delete feature</button
				>
			{:else}
				<label class="flex flex-col text-xs"
					>Name<input
						class="input input-sm"
						value={f.n}
						oninput={(e) => setEdit('n', e.currentTarget.value)}
					/></label
				>
				<label class="flex flex-col text-xs"
					>Description (replaces the built-in text; {'{pb}'}, {'{wis}'}, {'{lvl}'} work)
					<textarea
						class="textarea w-full textarea-sm"
						rows="4"
						value={ch.edits[f.key]?.d ?? f.d}
						oninput={(e) => setEdit('d', e.currentTarget.value)}
					></textarea>
				</label>
				{#if f.edited}<button
						type="button"
						class="btn self-start btn-ghost btn-xs"
						onclick={resetEdit}><RotateCcw class="size-3" /> Restore original text</button
					>{/if}
			{/if}
			{#if !custom}
				<label class="flex flex-col text-xs"
					>Your notes (house rules, reminders)
					<textarea
						class="textarea w-full textarea-sm"
						rows="2"
						value={ch.edits[f.key]?.notes ?? ''}
						oninput={(e) => setEdit('notes', e.currentTarget.value)}
					></textarea>
				</label>
			{/if}
		</div>
	{/if}
</article>
