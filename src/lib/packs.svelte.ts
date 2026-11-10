// Content packs: extra subclasses, feats, species and backgrounds loaded from a JSON file.
// They live in the user's browser and travel inside the files they export.
import type { Ab, BackgroundDef, FeatDef, Feature, SpeciesDef, SpellDef } from './types';

export interface PackSubclass {
	id: string;
	class: string;
	name: string;
	features: Feature[];
	/** For subclasses that add spellcasting to a non-caster class (e.g. Eldritch Knight). */
	caster?: 'third' | 'half' | 'full' | 'pact';
	castAbil?: Ab;
	cantrips?: [number, number][];
	/** Prepared spells by class level (20 entries). */
	prepared?: number[];
	/** Class whose spell list the subclass casts from, e.g. "wizard". */
	spellList?: string;
}

export interface ContentPack {
	id: string;
	name: string;
	description?: string;
	subclasses?: PackSubclass[];
	feats?: Record<string, FeatDef>;
	species?: Record<string, SpeciesDef>;
	backgrounds?: Record<string, BackgroundDef>;
	spells?: SpellDef[];
}

const KEY = 'hero-ledger:packs';

function load(): ContentPack[] {
	try {
		const raw = localStorage.getItem(KEY);
		return raw ? (JSON.parse(raw) as ContentPack[]) : [];
	} catch {
		return [];
	}
}

export const packs = $state<{ list: ContentPack[] }>({ list: [] });

export function initPacks() {
	packs.list = load();
}

function save() {
	try {
		localStorage.setItem(KEY, JSON.stringify(packs.list));
	} catch {
		/* storage unavailable */
	}
}

export function validatePack(p: unknown): ContentPack {
	const o = p as ContentPack;
	if (!o || typeof o !== 'object' || typeof o.id !== 'string' || typeof o.name !== 'string')
		throw new Error('A content pack needs an "id" and a "name".');
	for (const s of o.subclasses ?? []) {
		if (!s.id || !s.class || !s.name || !Array.isArray(s.features))
			throw new Error(`Subclass "${s.name ?? s.id}" needs id, class, name and features.`);
		for (const f of s.features)
			if (typeof f.l !== 'number' || !f.n)
				throw new Error(`A feature of "${s.name}" needs "l" (level) and "n" (name).`);
	}
	for (const sp of o.spells ?? [])
		if (!sp.name || typeof sp.level !== 'number')
			throw new Error(`Spell "${sp.name ?? '?'}" needs a name and a numeric level.`);
	return o;
}

export function installPack(p: ContentPack) {
	const i = packs.list.findIndex((x) => x.id === p.id);
	if (i >= 0) packs.list[i] = p;
	else packs.list.push(p);
	save();
}

export function removePack(id: string) {
	packs.list = packs.list.filter((p) => p.id !== id);
	save();
}

export function packSubclasses(classId: string) {
	return packs.list.flatMap((p) =>
		(p.subclasses ?? [])
			.filter((s) => s.class === classId)
			.map((s) => ({ key: `pack:${p.id}:${s.id}`, name: s.name, pack: p.name, sub: s }))
	);
}

export function findPackSubclass(key: string): PackSubclass | null {
	const [, pid, sid] = key.split(':');
	const p = packs.list.find((x) => x.id === pid);
	return p?.subclasses?.find((s) => s.id === sid) ?? null;
}

export function allPackFeats(): Record<string, FeatDef> {
	const out: Record<string, FeatDef> = {};
	for (const p of packs.list)
		for (const [k, f] of Object.entries(p.feats ?? {})) out[`pack:${p.id}:${k}`] = f;
	return out;
}

export function allPackSpecies(): Record<string, SpeciesDef> {
	const out: Record<string, SpeciesDef> = {};
	for (const p of packs.list)
		for (const [k, s] of Object.entries(p.species ?? {})) out[`pack:${p.id}:${k}`] = s;
	return out;
}

/** Every spell from installed packs, deduplicated by name (later packs win). */
export function allPackSpells(): SpellDef[] {
	const byName = new Map<string, SpellDef>();
	for (const p of packs.list) for (const s of p.spells ?? []) byName.set(s.name.toLowerCase(), s);
	return [...byName.values()].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}

export function allPackBackgrounds(): Record<string, BackgroundDef> {
	const out: Record<string, BackgroundDef> = {};
	for (const p of packs.list)
		for (const [k, b] of Object.entries(p.backgrounds ?? {})) out[`pack:${p.id}:${k}`] = b;
	return out;
}

/** Packs that a character refers to, so they can travel inside exported files. */
export function packsUsedBy(refs: string[]): ContentPack[] {
	const ids = new Set(refs.filter((r) => r?.startsWith('pack:')).map((r) => r.split(':')[1]));
	return packs.list.filter((p) => ids.has(p.id));
}

export const EXAMPLE_PACK: ContentPack = {
	id: 'my-homebrew',
	name: 'My homebrew',
	description:
		'Example pack. Use {formula} in text and formulas in "u" (uses): lvl, pb, str..cha, min(), max(), floor(), ceil().',
	subclasses: [
		{
			id: 'storm-warden',
			class: 'fighter',
			name: 'Storm Warden (homebrew example)',
			features: [
				{
					l: 3,
					n: 'Thunder Strike',
					a: 'special',
					r: 'short',
					u: 'max(1, con)',
					d: 'Once per turn on a weapon hit, deal +1d8 Thunder damage. Uses: Con mod per Short Rest.'
				},
				{
					l: 7,
					n: 'Eye of the Storm',
					a: 'reaction',
					d: 'When a creature within 5 ft misses you, push it 10 ft. DC {8 + str + pb} Str save.'
				},
				{ l: 10, n: 'Lightning Reflexes', a: 'passive', d: '+{pb} to Initiative.' },
				{ l: 15, n: 'Stormborn', a: 'passive', d: 'Resistance to Lightning and Thunder damage.' },
				{
					l: 18,
					n: 'Avatar of the Storm',
					a: 'bonus',
					r: 'long',
					u: '1',
					d: 'Bonus Action, 1 min: Fly Speed 30 ft and your Thunder Strike costs no uses.'
				}
			]
		}
	],
	feats: {
		'tavern-brawler-hb': {
			name: 'Barroom Brawler (homebrew)',
			cat: 'origin',
			d: 'Unarmed Strikes deal 1d4 + Str. Reroll 1s on their damage once.'
		}
	}
};
