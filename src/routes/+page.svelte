<script lang="ts">
	import { onMount } from 'svelte';
	import {
		FileDown,
		FileUp,
		Braces,
		Plus,
		Copy,
		Trash2,
		Package,
		SunMoon,
		X
	} from 'lucide-svelte';
	import { app, addCharacter, blankCharacter, deleteCharacter, initStore, normalize, persist, uid } from '$lib/store.svelte';
	import { EXAMPLE_PACK, initPacks, installPack, packs, packsUsedBy, removePack, validatePack, type ContentPack } from '$lib/packs.svelte';
	import { currentChar } from '$lib/current.svelte';
	import { getClass, subclassName } from '$lib/calc';
	import SheetTab from '$lib/components/SheetTab.svelte';
	import CombatTab from '$lib/components/CombatTab.svelte';
	import FeaturesTab from '$lib/components/FeaturesTab.svelte';
	import SpellsTab from '$lib/components/SpellsTab.svelte';
	import InventoryTab from '$lib/components/InventoryTab.svelte';
	import NotesTab from '$lib/components/NotesTab.svelte';

	let ready = $state(false);
	const tabs = [
		['sheet', 'Sheet'],
		['combat', 'Combat'],
		['features', 'Features'],
		['spells', 'Spells'],
		['inventory', 'Inventory'],
		['notes', 'Notes']
	] as const;
	type Tab = (typeof tabs)[number][0];
	let tab = $state<Tab>('sheet');
	let toast = $state<{ msg: string; kind: 'ok' | 'err' } | null>(null);
	let confirmDelete = $state(false);
	let showPacks = $state(false);
	let packText = $state('');
	let busy = $state(false);
	let theme = $state<'' | 'ledger' | 'ledger-dark'>('');

	onMount(() => {
		initPacks();
		initStore();
		try {
			theme = (localStorage.getItem('hero-ledger:theme') as typeof theme) ?? '';
		} catch {
			/* ignore */
		}
		const fromHash = () => {
			const h = location.hash.slice(1);
			if (tabs.some(([k]) => k === h)) tab = h as Tab;
		};
		fromHash();
		addEventListener('hashchange', fromHash);
		ready = true;
		return () => removeEventListener('hashchange', fromHash);
	});

	$effect(() => {
		if (!ready) return;
		JSON.stringify(app.chars);
		void app.currentId;
		persist();
	});
	$effect(() => {
		if (theme) document.documentElement.dataset.theme = theme;
		else delete document.documentElement.dataset.theme;
	});

	const ch = $derived(ready ? currentChar() : null);

	function say(msg: string, kind: 'ok' | 'err' = 'ok') {
		toast = { msg, kind };
		setTimeout(() => (toast = null), kind === 'err' ? 8000 : 3500);
	}
	function setTab(t: Tab) {
		tab = t;
		if (location.hash !== '#' + t) location.hash = t;
	}
	function cycleTheme() {
		const sys = matchMedia('(prefers-color-scheme: dark)').matches;
		theme = (theme || (sys ? 'ledger-dark' : 'ledger')) === 'ledger' ? 'ledger-dark' : 'ledger';
		try {
			localStorage.setItem('hero-ledger:theme', theme);
		} catch {
			/* ignore */
		}
	}
	function fileName(ext: string) {
		const base = (ch?.name || 'character').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'character';
		return `${base}-lvl${ch?.level ?? 1}.${ext}`;
	}
	function download(data: BlobPart, name: string, type: string) {
		const url = URL.createObjectURL(new Blob([data], { type }));
		const a = document.createElement('a');
		a.href = url;
		a.download = name;
		document.body.appendChild(a);
		a.click();
		a.remove();
		setTimeout(() => URL.revokeObjectURL(url), 2000);
	}
	function usedPacks(): ContentPack[] {
		if (!ch) return [];
		return packsUsedBy([ch.subclassId, ch.speciesId, ch.backgroundId, ...Object.values(ch.picks).map((p) => p.feat)]);
	}

	async function exportPdf() {
		if (!ch) return;
		busy = true;
		try {
			const { buildPdf } = await import('$lib/pdf/export');
			const bytes = await buildPdf($state.snapshot(ch), usedPacks());
			download(bytes as BlobPart, fileName('pdf'), 'application/pdf');
			say('PDF saved. You can fill it in any PDF reader and load it back here later.');
		} catch (e) {
			console.error(e);
			say(`Couldn't create the PDF: ${(e as Error).message}`, 'err');
		} finally {
			busy = false;
		}
	}
	function exportJson() {
		if (!ch) return;
		const data = { app: 'hero-ledger', version: 1, character: $state.snapshot(ch), packs: usedPacks() };
		download(JSON.stringify(data, null, 2), fileName('json'), 'application/json');
		say('Character file saved.');
	}

	function adopt(raw: unknown, packsIn: ContentPack[] = []) {
		for (const p of packsIn) if (!packs.list.some((x) => x.id === p.id)) installPack(validatePack(p));
		const c = normalize(raw);
		const existing = app.chars.findIndex((x) => x.id === c.id);
		if (existing >= 0) {
			app.chars[existing] = c;
			app.currentId = c.id;
			return 'updated';
		}
		addCharacter(c);
		return 'added';
	}

	async function importFile(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;
		busy = true;
		try {
			if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
				const { readPdf } = await import('$lib/pdf/import');
				const r = await readPdf(await file.arrayBuffer());
				const how = adopt(r.character, r.packs);
				say(`${r.character.name || 'Character'} ${how} from PDF (${r.changedFields} form fields read).`);
			} else {
				const data = JSON.parse(await file.text());
				if (data?.app === 'hero-ledger' && data.character) {
					const how = adopt(data.character, data.packs ?? []);
					say(`${data.character.name || 'Character'} ${how}.`);
				} else if (data?.subclasses || data?.feats || data?.species || data?.backgrounds) {
					installPack(validatePack(data));
					say(`Content pack "${data.name}" installed.`);
				} else if (data?.abilities && data?.classId) {
					const how = adopt(data);
					say(`Character ${how}.`);
				} else throw new Error('This JSON is not a character or a content pack.');
			}
			setTab('sheet');
		} catch (err) {
			say((err as Error).message, 'err');
		} finally {
			busy = false;
		}
	}

	function newChar() {
		const c = blankCharacter();
		c.name = '';
		addCharacter(c);
		setTab('sheet');
	}
	function duplicate() {
		if (!ch) return;
		const c = normalize({ ...$state.snapshot(ch), id: uid(), name: (ch.name || 'Character') + ' (copy)' });
		addCharacter(c);
		say('Copy created.');
	}
	function installFromText() {
		try {
			const p = validatePack(JSON.parse(packText));
			installPack(p);
			packText = '';
			say(`Content pack "${p.name}" installed.`);
		} catch (e) {
			say((e as Error).message, 'err');
		}
	}
</script>

<svelte:head>
	<title>{ch?.name ? `${ch.name} · Hero Ledger` : 'Hero Ledger'}</title>
</svelte:head>

{#if ready && ch}
	<header class="border-base-300 bg-base-100 sticky top-0 z-40 border-b">
		<div class="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2">
			<a href="#sheet" class="font-display text-primary flex items-center gap-2 text-xl font-bold" onclick={() => setTab('sheet')}>
				<svg viewBox="0 0 32 32" class="size-6" aria-hidden="true"><path d="M16 2 29 9.5v13L16 30 3 22.5v-13z" fill="currentColor" /><path d="M16 7 24.5 21h-17z" fill="none" stroke="var(--color-base-100)" stroke-width="2" /></svg>
				Hero Ledger
			</a>
			<select class="select select-sm max-w-64 min-w-0 flex-1 sm:flex-none" bind:value={app.currentId} aria-label="Character">
				{#each app.chars as c (c.id)}
					<option value={c.id}>{c.name || 'Unnamed hero'} · {getClass(c)?.name ?? ''} {c.level}</option>
				{/each}
			</select>
			<div class="flex flex-wrap items-center gap-1">
				<button type="button" class="btn btn-sm btn-ghost" onclick={newChar} title="New character"><Plus class="size-4" /><span class="hidden md:inline">New</span></button>
				<button type="button" class="btn btn-sm btn-ghost" onclick={duplicate} title="Duplicate (e.g. before levelling up)"><Copy class="size-4" /><span class="hidden md:inline">Duplicate</span></button>
				<button type="button" class="btn btn-sm btn-ghost" onclick={() => (confirmDelete = true)} title="Delete character"><Trash2 class="size-4" /></button>
			</div>
			<div class="ml-auto flex flex-wrap items-center gap-1">
				<label class="btn btn-sm btn-ghost" title="Load a PDF exported from this app, a character file, or a content pack">
					<FileUp class="size-4" /><span class="hidden sm:inline">Open</span>
					<input type="file" accept=".pdf,.json,application/pdf,application/json" class="hidden" onchange={importFile} />
				</label>
				<button type="button" class="btn btn-sm btn-ghost" onclick={exportJson} title="Save as a character file (JSON)"><Braces class="size-4" /><span class="hidden lg:inline">Save file</span></button>
				<button type="button" class="btn btn-sm btn-ghost" onclick={() => (showPacks = true)} title="Content packs"><Package class="size-4" /><span class="hidden lg:inline">Packs</span></button>
				<button type="button" class="btn btn-sm btn-ghost btn-square" onclick={cycleTheme} title="Light / dark"><SunMoon class="size-4" /></button>
				<button type="button" class="btn btn-sm btn-primary" onclick={exportPdf} disabled={busy}><FileDown class="size-4" /> PDF</button>
			</div>
		</div>
		<nav class="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4" aria-label="Sections">
			{#each tabs as [k, label] (k)}
				<button
					type="button"
					class="font-display border-b-2 px-3 py-1.5 text-sm font-bold tracking-wide whitespace-nowrap {tab === k ? 'border-primary text-primary' : 'text-base-content/60 hover:text-base-content border-transparent'}"
					aria-current={tab === k ? 'page' : undefined}
					onclick={() => setTab(k)}>{label}</button
				>
			{/each}
			<span class="text-base-content/50 ml-auto hidden self-center text-xs md:inline">
				{getClass(ch)?.name} {ch.level}{subclassName(ch) ? ` · ${subclassName(ch)}` : ''} · saved in this browser
			</span>
		</nav>
	</header>

	<main class="mx-auto max-w-7xl px-4 py-4">
		{#if tab === 'sheet'}<SheetTab />
		{:else if tab === 'combat'}<CombatTab />
		{:else if tab === 'features'}<FeaturesTab />
		{:else if tab === 'spells'}<SpellsTab />
		{:else if tab === 'inventory'}<InventoryTab />
		{:else}<NotesTab />{/if}
		<footer class="text-base-content/50 mt-8 text-center text-xs">
			Rules summaries based on the System Reference Document 5.2 by Wizards of the Coast LLC, licensed under
			<a class="link" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>. Characters and
			content packs are stored only in your browser and in the files you save.
		</footer>
	</main>

	{#if toast}
		<div class="toast toast-end z-50" role="status">
			<div class="alert {toast.kind === 'err' ? 'alert-error' : 'alert-success'} max-w-md text-sm">{toast.msg}</div>
		</div>
	{/if}

	{#if confirmDelete}
		<div class="modal modal-open" role="dialog" aria-modal="true" aria-labelledby="del-h">
			<div class="modal-box">
				<h3 id="del-h" class="font-display text-lg font-bold">Delete {ch.name || 'this character'}?</h3>
				<p class="py-3 text-sm">It is removed from this browser. Save a PDF or character file first if you want to keep a copy.</p>
				<div class="modal-action">
					<button type="button" class="btn" onclick={() => (confirmDelete = false)}>Keep</button>
					<button type="button" class="btn btn-error" onclick={() => { deleteCharacter(ch.id); confirmDelete = false; }}>Delete</button>
				</div>
			</div>
			<button type="button" class="modal-backdrop" aria-label="Close" onclick={() => (confirmDelete = false)}></button>
		</div>
	{/if}

	{#if showPacks}
		<div class="modal modal-open" role="dialog" aria-modal="true" aria-labelledby="packs-h">
			<div class="modal-box max-w-2xl">
				<div class="flex items-center">
					<h3 id="packs-h" class="font-display text-lg font-bold">Content packs</h3>
					<button type="button" class="btn btn-ghost btn-sm btn-square ml-auto" aria-label="Close" onclick={() => (showPacks = false)}><X class="size-4" /></button>
				</div>
				<p class="text-base-content/75 mt-1 text-sm">
					A pack adds subclasses, feats, species or backgrounds that then appear in the dropdowns, with their features filled in by level. Packs stay in your browser and travel inside the PDFs and files you save.
				</p>
				<ul class="mt-3 flex flex-col gap-1">
					{#each packs.list as p (p.id)}
						<li class="bg-base-200 rounded-box flex items-center gap-2 px-3 py-2 text-sm">
							<span class="font-semibold">{p.name}</span>
							<span class="text-base-content/60 text-xs">{p.subclasses?.length ?? 0} subclasses · {Object.keys(p.feats ?? {}).length} feats · {Object.keys(p.species ?? {}).length} species · {Object.keys(p.backgrounds ?? {}).length} backgrounds</span>
							<button type="button" class="btn btn-ghost btn-xs ml-auto" onclick={() => removePack(p.id)}><Trash2 class="size-3" /> Remove</button>
						</li>
					{:else}
						<li class="text-base-content/60 text-sm">No packs installed.</li>
					{/each}
				</ul>
				<div class="mt-4 flex flex-wrap gap-2">
					<label class="btn btn-sm">
						<FileUp class="size-4" /> Load pack file
						<input type="file" accept=".json,application/json" class="hidden" onchange={importFile} />
					</label>
					<button type="button" class="btn btn-sm" onclick={() => download(JSON.stringify(EXAMPLE_PACK, null, 2), 'example-pack.json', 'application/json')}>Download example pack</button>
					<button type="button" class="btn btn-sm" onclick={() => { installPack(EXAMPLE_PACK); say('Example pack installed: try the Fighter subclass list.'); }}>Install example</button>
				</div>
				<label class="mt-4 flex flex-col gap-1 text-sm">
					Or paste pack JSON
					<textarea class="textarea textarea-sm num h-32 w-full text-xs" bind:value={packText} placeholder={'{ "id": "my-pack", "name": "My pack", "subclasses": [ … ] }'}></textarea>
				</label>
				<div class="modal-action">
					<button type="button" class="btn btn-primary btn-sm" disabled={!packText.trim()} onclick={installFromText}>Install pasted pack</button>
				</div>
			</div>
			<button type="button" class="modal-backdrop" aria-label="Close" onclick={() => (showPacks = false)}></button>
		</div>
	{/if}
{:else}
	<p class="text-base-content/60 p-8 text-center">Loading your characters…</p>
{/if}
