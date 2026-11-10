// Derived values: everything the sheet calculates from the character's choices.
import { by, CLASSES } from './data/classes';
import { ARMOR, BACKGROUNDS, FEATS, FULL_SLOTS, SKILLS, SPECIES, WEAPONS } from './data/srd';
import { dynamicOptions, STATIC_OPTIONS } from './data/options';
import { STATES, type StateCtx, type StateDef } from './data/states';
import {
	avgDice,
	critTerms,
	evalFormula,
	fillTemplate,
	formatDice,
	parseDice,
	type DiceTerm
} from './formula';
import {
	allPackBackgrounds,
	allPackFeats,
	allPackOptions,
	allPackSpecies,
	allPackSpells,
	findPackSubclass
} from './packs.svelte';
import {
	ABILITIES,
	type Ab,
	type ActionType,
	type Attack,
	type BackgroundDef,
	type Character,
	type ClassDef,
	type Ctx,
	type FeatDef,
	type Feature,
	type PickKind,
	type Recharge,
	type Rider,
	type OptionItem,
	type OptionList,
	type SpeciesDef,
	type SpellGrant,
	type SpellKind
} from './types';

export const mod = (score: number) => Math.floor((score - 10) / 2);
export const pbFor = (l: number) => Math.ceil(l / 4) + 1;
export const signed = (n: number) => (n >= 0 ? `+${n}` : `−${-n}`);

// ---------- Registry lookups (built-in + content packs) ----------

export function getClass(ch: Character): ClassDef | null {
	if (ch.classId === 'custom') {
		return {
			name: ch.custom.className || 'Custom class',
			hd: ch.custom.hd || 8,
			saves: [],
			armor: [],
			weapons: '',
			tools: '',
			skills: { n: 0, list: 'any' },
			caster: ch.custom.caster || undefined,
			castAbil: ch.custom.castAbil,
			subLevels: [],
			features: [],
			sub: { name: '', features: [] }
		};
	}
	return CLASSES[ch.classId] ?? null;
}

export function getSpecies(ch: Character): SpeciesDef | null {
	if (ch.speciesId === 'custom')
		return {
			name: ch.custom.speciesName || 'Custom species',
			size: ch.custom.size || 'Medium',
			speed: ch.custom.speed || 30,
			features: []
		};
	return SPECIES[ch.speciesId] ?? allPackSpecies()[ch.speciesId] ?? null;
}

export function getBackground(ch: Character): BackgroundDef | null {
	if (ch.backgroundId === 'custom')
		return {
			name: ch.custom.backgroundName || 'Custom background',
			abilities: [...ABILITIES],
			feat: '',
			skills: [],
			tool: '',
			equipment: ''
		};
	return BACKGROUNDS[ch.backgroundId] ?? allPackBackgrounds()[ch.backgroundId] ?? null;
}

export function allFeats(): Record<string, FeatDef> {
	return { ...FEATS, ...allPackFeats() };
}

export function subclassName(ch: Character): string {
	const c = getClass(ch);
	if (!c) return '';
	if (ch.subclassId === 'srd') return c.sub.name;
	if (ch.subclassId === 'custom') return ch.custom.subclassName || 'Custom subclass';
	if (ch.subclassId.startsWith('pack:'))
		return findPackSubclass(ch.subclassId)?.name ?? 'Missing pack subclass';
	return '';
}

// ---------- Ability scores ----------

/** Points of ability increase a feat gives through its picker. */
export function featAsiPoints(featKey: string): number {
	if (featKey === 'asi' || featKey === 'custom') return 2;
	return allFeats()[featKey]?.abilities?.length ? 1 : 0;
}

/** Abilities a feat's increase can go to. */
export function featAbilities(featKey: string): Ab[] {
	if (featKey === 'asi' || featKey === 'custom') return [...ABILITIES];
	return allFeats()[featKey]?.abilities ?? [];
}

/** Feats the character currently has: picked at a reached level, or from the background. */
export function activeFeats(ch: Character): { key: string; def: FeatDef; pickKey?: string }[] {
	const out: { key: string; def: FeatDef; pickKey?: string }[] = [];
	const all = allFeats();
	for (const k of visibleFeatureKeys(ch)) {
		const p = ch.picks[k];
		if (p?.feat && all[p.feat]) out.push({ key: p.feat, def: all[p.feat], pickKey: k });
	}
	const bg = getBackground(ch);
	if (bg?.feat && all[bg.feat]) out.push({ key: bg.feat, def: all[bg.feat] });
	return out;
}

/** Read "Always prepared. 3: A, B. 5: C." style text into spell grants. */
export function parseGrants(text: string): SpellGrant[] | undefined {
	if (!/always (have .* )?prepared/i.test(text)) return undefined;
	const out: SpellGrant[] = [];
	for (const m of text.matchAll(/\b(\d{1,2}): ([^.:]+)\./g)) {
		const names = m[2]
			.split(/,\s*/)
			.map((s) => s.trim())
			.filter(Boolean);
		if (names.length) out.push({ l: Number(m[1]), names });
	}
	return out.length ? out : undefined;
}

export interface ScoreInfo {
	base: number;
	total: number;
	parts: string[];
}

export function scores(ch: Character): Record<Ab, ScoreInfo> {
	const out = {} as Record<Ab, ScoreInfo>;
	const featKeys = new Set(visibleFeatureKeys(ch));
	for (const ab of ABILITIES) {
		const parts: string[] = [];
		let total = ch.abilities[ab] ?? 10;
		const bg = ch.bgAsi[ab] ?? 0;
		if (bg) {
			total += bg;
			parts.push(`Background ${signed(bg)}`);
		}
		for (const [key, p] of Object.entries(ch.picks)) {
			if (!featKeys.has(key)) continue;
			const v = p.asi?.[ab] ?? 0;
			if (v) {
				total += v;
				parts.push(
					`${p.feat === 'custom' ? p.n || 'Feat' : (allFeats()[p.feat]?.name ?? 'Feat')} ${signed(v)}`
				);
			}
		}
		const epic = Object.entries(ch.picks).some(
			([k, p]) => featKeys.has(k) && allFeats()[p.feat]?.cat === 'epic'
		);
		total = Math.min(total, Math.max(epic ? 30 : 20, ch.abilities[ab] ?? 10));
		const capstone =
			ch.level >= 20 &&
			((ch.classId === 'barbarian' && (ab === 'str' || ab === 'con')) ||
				(ch.classId === 'monk' && (ab === 'dex' || ab === 'wis')));
		if (capstone) {
			total = Math.max(total, Math.min(total + 4, 25));
			parts.push(`${ch.classId === 'monk' ? 'Body and Mind' : 'Primal Champion'} +4 (max 25)`);
		}
		const o = ch.overrides[`score.${ab}`];
		out[ab] = { base: ch.abilities[ab] ?? 10, total: o ?? total, parts };
	}
	return out;
}

export function makeCtx(ch: Character, sc = scores(ch)): Ctx {
	const pb = ch.overrides.pb ?? pbFor(ch.level);
	return { l: ch.level, pb, m: (ab: Ab) => mod(sc[ab].total) };
}

function ov(ch: Character, key: string, computed: number): number {
	const o = ch.overrides[key];
	return (o ?? computed) + (ch.bonus[key] ?? 0);
}

// ---------- Features ----------

export interface RFeature {
	key: string;
	l: number;
	n: string;
	d: string;
	a: ActionType;
	src: 'Class' | 'Subclass' | 'Species' | 'Background' | 'Feat' | 'Custom';
	uses: number | null;
	r: Recharge;
	pool: boolean;
	pick?: PickKind;
	placeholder: boolean;
	edited: boolean;
	notes: string;
	hidden: boolean;
	customId?: string;
	/** Key of the feature whose picker produced this feat. */
	pickedBy?: string;
	/** Feat key when this entry is a feat. */
	featKey?: string;
	/** Always-prepared spells this feature gives. */
	spells?: SpellGrant[];
	/** Option list the player picks from, and how many. */
	choose?: { list: string; count: number; grant?: SpellKind };
}

function text(t: Feature['d'], c: Ctx) {
	return typeof t === 'function' ? t(c) : fillTemplate(t, c);
}

function usesOf(f: Feature, c: Ctx): number | null {
	if (f.u === undefined || f.u === '') return null;
	if (typeof f.u === 'function') return f.u(c);
	const v = evalFormula(f.u, c);
	return v === null ? null : Math.max(0, Math.floor(v));
}

function subclassFeatures(
	ch: Character,
	cls: ClassDef
): { feats: Feature[]; placeholders: boolean } {
	if (ch.subclassId === 'srd') return { feats: cls.sub.features, placeholders: false };
	if (ch.subclassId.startsWith('pack:'))
		return { feats: findPackSubclass(ch.subclassId)?.features ?? [], placeholders: false };
	return { feats: [], placeholders: true };
}

/** All features up to `maxLevel` (default: character level), sorted by level. */
export function features(ch: Character, maxLevel = ch.level): RFeature[] {
	const sc = scores(ch);
	const out: RFeature[] = [];
	const seen = new Map<string, number>();
	const keyFor = (src: string, l: number, n: string) => {
		const base = `${src}|${l}|${n}`;
		const k = seen.get(base) ?? 0;
		seen.set(base, k + 1);
		return k ? `${base}#${k}` : base;
	};
	const push = (f: Feature, src: RFeature['src'], extra: Partial<RFeature> = {}) => {
		if (f.l > maxLevel) return;
		// Text depends on the level the character has now, even for upcoming features.
		const c = makeCtx(ch, sc);
		const key = extra.key ?? keyFor(src, f.l, f.n);
		const e = ch.edits[key] ?? {};
		const d = e.d !== undefined ? fillTemplate(e.d, c) : text(f.d, c);
		const count = f.choose
			? typeof f.choose.count === 'function'
				? f.choose.count(c)
				: (evalFormula(f.choose.count, c) ?? 0)
			: 0;
		const r: RFeature = {
			key,
			l: f.l,
			n: e.n ?? f.n,
			d,
			spells: f.spells ?? parseGrants(d),
			choose: f.choose
				? { list: f.choose.list, count: Math.max(0, Math.floor(count)), grant: f.choose.grant }
				: undefined,
			a: f.a,
			src,
			uses: usesOf(f, c),
			r: f.r ?? '',
			pool: !!f.pool,
			pick: f.pick,
			placeholder: false,
			edited: e.n !== undefined || e.d !== undefined,
			notes: e.notes ?? '',
			hidden: !!e.hidden,
			...extra
		};
		out.push(r);
		// The feat chosen through a picker becomes its own entry.
		if (f.pick) {
			const p = ch.picks[key];
			if (p?.feat) {
				const fd = allFeats()[p.feat];
				const name = p.feat === 'custom' ? p.n || 'Custom feat' : (fd?.name ?? p.feat);
				const desc = p.feat === 'custom' ? p.d || '' : fd ? text(fd.d, c) : '';
				const fk = `Feat|${key}`;
				const fe = ch.edits[fk] ?? {};
				out.push({
					key: fk,
					l: f.l,
					n: fe.n ?? name,
					d: fe.d !== undefined ? fillTemplate(fe.d, c) : desc,
					a: fd?.a ?? 'passive',
					src: 'Feat',
					featKey: p.feat,
					spells: fd?.spells,
					uses:
						fd?.u !== undefined
							? usesOf({ l: f.l, n: name, a: 'passive', d: '', u: fd.u }, c)
							: null,
					r: fd?.r ?? '',
					pool: !!fd?.pool,
					placeholder: false,
					edited: fe.n !== undefined || fe.d !== undefined,
					notes: fe.notes ?? '',
					hidden: !!fe.hidden,
					pickedBy: key
				});
			}
		}
	};

	const cls = getClass(ch);
	if (cls) {
		const sub = subclassFeatures(ch, cls);
		for (const f of cls.features) {
			if (f.subslot) {
				const real = sub.feats.filter((s) => s.l === f.l);
				if (real.length) {
					for (const s of real) push(s, 'Subclass');
				} else if (sub.placeholders) {
					push({ ...f, n: `${subclassName(ch) || 'Subclass'} feature`, d: '' }, 'Subclass', {
						placeholder: true
					});
				}
			} else push(f, 'Class');
		}
		// Pack subclasses may grant features at levels that have no slot in the base class.
		for (const s of sub.feats) if (!cls.subLevels.includes(s.l)) push(s, 'Subclass');
	}

	const sp = getSpecies(ch);
	if (sp) {
		for (const f of sp.features) push(f, 'Species');
		const lin = sp.lineages?.find((x) => x.id === ch.lineage);
		if (lin) push({ l: 1, n: lin.name, a: 'passive', d: lin.d, spells: lin.spells }, 'Species');
	}

	const bg = getBackground(ch);
	if (bg) {
		const fd = bg.feat ? allFeats()[bg.feat] : null;
		if (fd)
			push(
				{
					l: 1,
					n: fd.name,
					a: fd.a ?? 'passive',
					d: fd.d,
					u: fd.u,
					r: fd.r,
					pool: fd.pool,
					spells: fd.spells
				},
				'Background',
				{ featKey: bg.feat }
			);
		else
			push(
				{
					l: 1,
					n: 'Origin Feat',
					a: 'passive',
					pick: 'origin',
					d: 'Your background grants an Origin feat.'
				},
				'Background'
			);
	}

	for (const cf of ch.features) {
		if (cf.l > maxLevel) continue;
		const c = makeCtx(ch, sc);
		out.push({
			key: `Custom|${cf.id}`,
			l: cf.l,
			n: cf.n || 'New feature',
			d: fillTemplate(cf.d, c),
			a: cf.a,
			src: 'Custom',
			uses: cf.uses ? (evalFormula(cf.uses, c) ?? null) : null,
			r: cf.r,
			pool: false,
			placeholder: false,
			edited: false,
			notes: '',
			hidden: false,
			customId: cf.id
		});
	}

	const order = { Class: 0, Subclass: 1, Species: 2, Background: 3, Feat: 4, Custom: 5 };
	return out.sort((a, b) => a.l - b.l || order[a.src] - order[b.src]);
}

/** Feature keys that currently apply (used to ignore picks from levels you no longer have). */
export function visibleFeatureKeys(ch: Character): string[] {
	// Lightweight version of features(): only keys for picker features.
	const keys: string[] = [];
	const cls = getClass(ch);
	const seen = new Map<string, number>();
	const keyFor = (src: string, l: number, n: string) => {
		const base = `${src}|${l}|${n}`;
		const k = seen.get(base) ?? 0;
		seen.set(base, k + 1);
		return k ? `${base}#${k}` : base;
	};
	if (cls) {
		const sub = subclassFeatures(ch, cls);
		for (const f of cls.features) {
			if (f.subslot) {
				const real = sub.feats.filter((s) => s.l === f.l);
				for (const s of real) {
					const k = keyFor('Subclass', s.l, s.n);
					if (s.l <= ch.level && s.pick) keys.push(k);
				}
				if (!real.length && sub.placeholders)
					keyFor('Subclass', f.l, `${subclassName(ch) || 'Subclass'} feature`);
			} else {
				const k = keyFor('Class', f.l, f.n);
				if (f.l <= ch.level && f.pick) keys.push(k);
			}
		}
	}
	const sp = getSpecies(ch);
	for (const f of sp?.features ?? []) {
		const k = keyFor('Species', f.l, f.n);
		if (f.l <= ch.level && f.pick) keys.push(k);
	}
	const bg = getBackground(ch);
	if (bg && !(bg.feat && allFeats()[bg.feat])) keys.push(keyFor('Background', 1, 'Origin Feat'));
	return keys;
}

export function hasFeat(ch: Character, featKey: string): boolean {
	return activeFeats(ch).some((f) => f.key === featKey || f.key.endsWith(':' + featKey));
}

// ---------- Class choices (option lists) ----------

/** Every option list available to this character: built-in, generated, and from packs. */
export function allOptions(ch: Character): Record<string, OptionList> {
	return { ...STATIC_OPTIONS, ...dynamicOptions(ch.classId, allPackSpells()), ...allPackOptions() };
}

export interface ChosenOption {
	featureKey: string;
	feature: string;
	list: string;
	key: string;
	item: OptionItem;
	grant?: SpellKind;
}

/** Options picked on features the character has, limited to each feature's count and level. */
export function chosenOptions(ch: Character, feats = features(ch)): ChosenOption[] {
	const lists = allOptions(ch);
	const out: ChosenOption[] = [];
	for (const f of feats) {
		if (!f.choose || f.hidden) continue;
		const list = lists[f.choose.list];
		const picked = (ch.choices[f.key] ?? []).slice(0, f.choose.count);
		for (const k of picked) {
			const item = list?.items[k];
			if (item && (item.l ?? 1) <= ch.level)
				out.push({
					featureKey: f.key,
					feature: f.n,
					list: f.choose.list,
					key: k,
					item,
					grant: f.choose.grant
				});
		}
	}
	return out;
}

/** Combined effects of the chosen options. */
export function optionEffects(ch: Character) {
	const fx = {
		armor: [] as string[],
		weapons: [] as string[],
		cantrips: 0,
		skillBonus: [] as [string, Ab, string][],
		expertise: new Set<string>(),
		mastery: new Set<string>(),
		riders: [] as Rider[]
	};
	for (const o of chosenOptions(ch)) {
		const e = o.item.effects;
		if (!e) continue;
		if (e.armor) fx.armor.push(...e.armor);
		if (e.weapons) fx.weapons.push(e.weapons);
		fx.cantrips += e.cantrips ?? 0;
		for (const [sk, ab] of Object.entries(e.skillBonus ?? {}))
			fx.skillBonus.push([sk, ab, o.item.name]);
		if (e.expertise) fx.expertise.add(e.expertise);
		if (e.mastery) fx.mastery.add(e.mastery);
		if (e.rider) fx.riders.push({ ...e.rider, id: `opt:${o.list}:${o.key}` });
	}
	return fx;
}

export interface GrantedSpell {
	name: string;
	source: string;
	kind: SpellKind;
}

export const SPELL_KIND_LABEL: Record<SpellKind, string> = {
	prepared: 'Always prepared',
	free: 'Prepared, free once per rest',
	atwill: 'At will, no slot',
	ritual: 'Ritual only'
};

/** Spells that features, feats, species and chosen options make available, and how. */
export function grantedSpells(ch: Character): GrantedSpell[] {
	const out = new Map<string, GrantedSpell>();
	const rank: Record<SpellKind, number> = { ritual: 0, prepared: 1, free: 2, atwill: 3 };
	const add = (name: string, source: string, kind: SpellKind = 'prepared') => {
		const k = name.toLowerCase();
		const cur = out.get(k);
		// The most generous way of casting wins (e.g. at will beats always prepared).
		if (!cur || rank[kind] > rank[cur.kind]) out.set(k, { name, source, kind });
	};
	const feats = features(ch);
	for (const f of feats) {
		if (f.hidden) continue;
		for (const g of f.spells ?? [])
			if (g.l <= ch.level) for (const n of g.names) add(n, f.n, g.kind);
	}
	for (const o of chosenOptions(ch, feats)) {
		for (const n of o.item.spells ?? [])
			add(n, `${o.feature}: ${o.item.name}`, o.item.spellKind ?? o.grant);
		for (const g of o.item.spellGrants ?? [])
			if (g.l <= ch.level)
				for (const n of g.names) add(n, `${o.feature}: ${o.item.name}`, g.kind ?? o.grant);
	}
	return [...out.values()];
}

// ---------- Core stats ----------

export function saves(ch: Character, sc = scores(ch)) {
	const c = makeCtx(ch, sc);
	const cls = getClass(ch);
	const aura = ch.classId === 'paladin' && ch.level >= 6 ? Math.max(1, c.m('cha')) : 0;
	// Resilient-style feats: the raised ability also gets save proficiency.
	const featSaves = new Set<Ab>();
	for (const f of activeFeats(ch))
		if (f.def.saveFromAsi && f.pickKey)
			for (const ab of ABILITIES) if ((ch.picks[f.pickKey]?.asi?.[ab] ?? 0) > 0) featSaves.add(ab);
	const out = {} as Record<Ab, { prof: boolean; auto: boolean; value: number }>;
	for (const ab of ABILITIES) {
		const auto =
			!!cls?.saves.includes(ab) ||
			(ch.classId === 'monk' && ch.level >= 14) ||
			(ch.classId === 'rogue' && ch.level >= 15 && (ab === 'wis' || ab === 'cha')) ||
			featSaves.has(ab);
		const prof = auto || !!ch.saveProf[ab];
		out[ab] = { prof, auto, value: ov(ch, `save.${ab}`, c.m(ab) + (prof ? c.pb : 0) + aura) };
	}
	return out;
}

export function skills(ch: Character, sc = scores(ch)) {
	const c = makeCtx(ch, sc);
	const bg = getBackground(ch);
	const jack = ch.classId === 'bard' && ch.level >= 2;
	const fx = optionEffects(ch);
	const out: Record<
		string,
		{ prof: number; fromBg: boolean; fromChoice: boolean; value: number; ab: Ab; extra: string[] }
	> = {};
	for (const [id, s] of Object.entries(SKILLS)) {
		const fromBg = !!bg?.skills.includes(id);
		const fromChoice = fx.expertise.has(id);
		const prof = fromChoice ? 2 : Math.max(ch.skills[id] ?? 0, fromBg ? 1 : 0);
		let add = prof === 2 ? c.pb * 2 : prof === 1 ? c.pb : jack ? Math.floor(c.pb / 2) : 0;
		const extra: string[] = [];
		for (const [sk, ab, from] of fx.skillBonus)
			if (sk === id) {
				const b = Math.max(1, c.m(ab));
				add += b;
				extra.push(`${from} ${signed(b)}`);
			}
		out[id] = {
			prof,
			fromBg,
			fromChoice,
			ab: s.ab,
			extra,
			value: ov(ch, `skill.${id}`, c.m(s.ab) + add)
		};
	}
	return out;
}

export function armorClass(ch: Character, sc = scores(ch)) {
	const c = makeCtx(ch, sc);
	const dex = c.m('dex');
	const states = activeStates(ch, sc);
	const sctx = stateCtx(ch, sc);
	const unarmored = states.some((st) => st.ac?.ignoreArmor);
	const armor = unarmored ? undefined : ARMOR[ch.gear.armor];
	const parts: string[] = [];
	let base: number;
	if (armor) {
		const d = armor.dexCap === null ? dex : Math.min(dex, armor.dexCap);
		base = armor.base + d;
		parts.push(`${armor.name} ${armor.base}${d ? ` ${signed(d)} Dex` : ''}`);
	} else {
		// Pick the best unarmored formula the character has.
		base = 10 + dex;
		let label = 'Unarmored 10 + Dex';
		const opts: [number, string][] = [];
		if (ch.classId === 'barbarian')
			opts.push([10 + dex + c.m('con'), 'Unarmored Defense (Dex + Con)']);
		if (ch.classId === 'monk' && !ch.gear.shield)
			opts.push([10 + dex + c.m('wis'), 'Unarmored Defense (Dex + Wis)']);
		if (ch.classId === 'sorcerer' && ch.level >= 3 && sctx.sub('srd'))
			opts.push([10 + dex + c.m('cha'), 'Draconic Resilience (Dex + Cha)']);
		if (ch.classId === 'bard' && ch.level >= 3 && sctx.sub('dance') && !ch.gear.shield)
			opts.push([10 + dex + c.m('cha'), 'Dazzling Footwork (Dex + Cha)']);
		for (const st of states)
			if (st.ac?.base) opts.push([st.ac.base(sctx), st.ac.baseLabel ?? st.name]);
		for (const [v, l] of opts)
			if (v > base) {
				base = v;
				label = l;
			}
		parts.push(label);
	}
	if (ch.gear.shield) {
		base += 2;
		parts.push('Shield +2');
	}
	if (armor && hasFeat(ch, 'defense')) {
		base += 1;
		parts.push('Defense +1');
	}
	if (ch.gear.acMisc) {
		base += ch.gear.acMisc;
		parts.push(`Items ${signed(ch.gear.acMisc)}`);
	}
	for (const st of states)
		if (st.ac?.bonus) {
			base += st.ac.bonus;
			parts.push(`${st.name} +${st.ac.bonus}`);
		}
	for (const st of states)
		if (st.ac?.min && base < st.ac.min) {
			base = st.ac.min;
			parts.push(`${st.name}: at least ${st.ac.min}`);
		}
	return {
		value: ov(ch, 'ac', base),
		parts,
		stealthDis: !!armor?.stealthDis,
		strReq: armor?.str ?? 0
	};
}

// ---------- Situational switches ----------

export function stateCtx(ch: Character, sc = scores(ch)): StateCtx {
	const c = makeCtx(ch, sc);
	let spellNames: Set<string> | null = null;
	return {
		classId: ch.classId,
		l: ch.level,
		pb: c.pb,
		m: c.m,
		sub: (id: string) => ch.subclassId === id || ch.subclassId.endsWith(`:${id}`),
		hasSpell: (name: string) => {
			spellNames ??= new Set([
				...ch.spells.list.map((x) => x.name.toLowerCase()),
				...grantedSpells(ch).map((g) => g.name.toLowerCase())
			]);
			return spellNames.has(name.toLowerCase());
		},
		speciesId: ch.speciesId,
		hasArmor: !!ARMOR[ch.gear.armor]
	};
}

/** Switches that make sense for this character. */
export function availableStates(ch: Character, sc = scores(ch)): StateDef[] {
	const ctx = stateCtx(ch, sc);
	return STATES.filter((st) => st.available(ctx));
}

/** Switches that are on and still apply. */
export function activeStates(ch: Character, sc = scores(ch)): StateDef[] {
	return availableStates(ch, sc).filter((st) => ch.active?.[st.id]);
}

export function hpMax(ch: Character, sc = scores(ch)) {
	const c = makeCtx(ch, sc);
	const hd = getClass(ch)?.hd ?? 8;
	let v = hd + (hd / 2 + 1) * (ch.level - 1) + c.m('con') * ch.level;
	if (ch.speciesId === 'dwarf') v += ch.level;
	if (ch.classId === 'sorcerer' && ch.subclassId === 'srd' && ch.level >= 3) v += ch.level;
	for (const f of activeFeats(ch)) v += (f.def.hp ?? 0) * ch.level + (f.def.hpFlat ?? 0);
	return Math.max(1, ov(ch, 'hpMax', v));
}

export function speed(ch: Character) {
	const sp = getSpecies(ch);
	let v = sp?.speed ?? 30;
	if (ch.speciesId === 'elf' && ch.lineage === 'wood') v = 35;
	const armor = ARMOR[ch.gear.armor];
	if (ch.classId === 'barbarian' && ch.level >= 5 && armor?.type !== 'heavy') v += 10;
	if (ch.classId === 'monk' && ch.level >= 2 && !armor && !ch.gear.shield)
		v += by(ch.level, [
			[2, 10],
			[6, 15],
			[10, 20],
			[14, 25],
			[18, 30]
		]);
	if (ch.classId === 'ranger' && ch.level >= 6 && armor?.type !== 'heavy') v += 10;
	for (const f of activeFeats(ch)) v += f.def.speed ?? 0;
	for (const st of activeStates(ch)) v += st.speed ?? 0;
	return Math.max(0, ov(ch, 'speed', v) - 5 * ch.exhaustion);
}

export function initiative(ch: Character, sc = scores(ch)) {
	const c = makeCtx(ch, sc);
	return ov(ch, 'init', c.m('dex') + (hasFeat(ch, 'alert') ? c.pb : 0));
}

export function darkvision(ch: Character) {
	const sp = getSpecies(ch);
	if (ch.speciesId === 'elf' && ch.lineage === 'drow') return 120;
	return sp?.darkvision ?? 0;
}

export function carrying(ch: Character, sc = scores(ch)) {
	const mult = ch.speciesId === 'goliath' ? 2 : 1;
	const cap = sc.str.total * 15 * mult;
	const coins = Object.values(ch.gear.coins).reduce((a, b) => a + (b || 0), 0);
	const items = ch.gear.items.reduce((a, i) => a + (i.weight || 0) * (i.qty || 0), 0);
	const armor = ARMOR[ch.gear.armor]?.weight ?? 0;
	const shield = ch.gear.shield ? 6 : 0;
	const total = items + armor + shield + coins / 50;
	return { cap, total: Math.round(total * 100) / 100, coinsWeight: coins / 50 };
}

export function attunementMax(ch: Character) {
	return ch.classId === 'rogue' && ch.subclassId === 'srd' && ch.level >= 13 ? 4 : 3;
}

// ---------- Spellcasting ----------

export function spellcasting(ch: Character, sc = scores(ch)) {
	const cls = getClass(ch);
	const c = makeCtx(ch, sc);
	// A pack subclass can grant spellcasting to a class that has none (third casters).
	const sub = ch.subclassId.startsWith('pack:') ? findPackSubclass(ch.subclassId) : null;
	const fromSub = !cls?.caster && !!sub?.caster && ch.level >= 3;
	const src = fromSub ? sub! : cls;
	const ability: Ab | null = (ch.spells.ability || src?.castAbil) ?? null;
	const caster = src?.caster;
	let slots: number[] = [];
	let pact: { n: number; level: number } | null = null;
	if (caster === 'full') slots = FULL_SLOTS[ch.level - 1];
	else if (caster === 'third') slots = FULL_SLOTS[Math.ceil(ch.level / 3) - 1];
	else if (caster === 'half') slots = FULL_SLOTS[Math.ceil(ch.level / 2) - 1];
	else if (caster === 'pact')
		pact = {
			n: by(ch.level, [
				[1, 1],
				[2, 2],
				[11, 3],
				[17, 4]
			]),
			level: Math.min(5, Math.ceil(ch.level / 2))
		};
	const m = ability ? c.m(ability) : 0;
	const innate = 0;
	return {
		ability,
		/** Spell list to draw from: the subclass's (e.g. Wizard for an Eldritch Knight) or the class's. */
		list: (fromSub && sub?.spellList) || cls?.name.toLowerCase() || '',
		caster: caster ?? null,
		mod: m,
		dc: ov(
			ch,
			'spellDc',
			8 + m + c.pb + innate + activeStates(ch, sc).reduce((t, st) => t + (st.spellDc ?? 0), 0)
		),
		atk: ov(ch, 'spellAtk', m + c.pb),
		slots: [...slots, 0, 0, 0, 0, 0, 0, 0, 0, 0].slice(0, 9),
		pact,
		cantrips: src?.cantrips ? by(ch.level, src.cantrips) + optionEffects(ch).cantrips : null,
		prepared: src?.prepared ? src.prepared[ch.level - 1] : null
	};
}

// ---------- Attacks and damage riders ----------

/** Riders the sheet knows from your class, subclass, species and feats. */
export function autoRiders(ch: Character, sc = scores(ch)): Rider[] {
	const c = makeCtx(ch, sc);
	const l = ch.level;
	const r: Rider[] = [];
	const add = (x: Omit<Rider, 'auto'>) => r.push({ ...x, auto: true });
	if (ch.classId === 'barbarian') {
		if (l >= 9)
			add({
				id: 'auto:brutal',
				name: 'Brutal Strike',
				dmg: l >= 17 ? '2d10' : '1d10',
				type: '',
				hit: 0,
				applies: 'melee',
				when: 'Reckless Attack, give up advantage on this attack'
			});
	}
	if (ch.classId === 'rogue')
		add({
			id: 'auto:sneak',
			name: 'Sneak Attack',
			dmg: `${Math.ceil(l / 2)}d6`,
			type: '',
			hit: 0,
			applies: 'weapon',
			when: 'Once per turn: Finesse or Ranged, with advantage or an ally next to the target'
		});
	if (ch.classId === 'paladin') {
		if (l >= 2)
			add({
				id: 'auto:smite',
				name: 'Divine Smite (L1 slot)',
				dmg: '2d8',
				type: 'Radiant',
				hit: 0,
				applies: 'melee',
				when: 'Bonus Action after a hit; +1d8 per slot level above 1, +1d8 vs Fiend/Undead'
			});
		if (l >= 11)
			add({
				id: 'auto:radiant',
				name: 'Radiant Strikes',
				dmg: '1d8',
				type: 'Radiant',
				hit: 0,
				applies: 'melee',
				when: 'Every melee weapon hit'
			});
	}

	if (ch.speciesId === 'goliath' && ch.lineage === 'fire')
		add({
			id: 'auto:fireburn',
			name: "Fire's Burn",
			dmg: '1d10',
			type: 'Fire',
			hit: 0,
			applies: 'all',
			when: `Giant Ancestry use (${c.pb}/Long Rest)`
		});
	if (ch.speciesId === 'goliath' && ch.lineage === 'frost')
		add({
			id: 'auto:frostchill',
			name: "Frost's Chill",
			dmg: '1d6',
			type: 'Cold',
			hit: 0,
			applies: 'all',
			when: `Giant Ancestry use, −10 ft Speed (${c.pb}/Long Rest)`
		});
	if (hasFeat(ch, 'archery'))
		add({
			id: 'auto:archery',
			name: 'Archery',
			dmg: '',
			type: '',
			hit: 2,
			applies: 'ranged',
			when: 'Always with Ranged weapons'
		});
	for (const r2 of optionEffects(ch).riders) add({ ...r2, dmg: fillTemplate(r2.dmg, c) });
	for (const st of availableStates(ch))
		for (const sr of st.riders?.(stateCtx(ch, sc)) ?? []) {
			const { with: also, ...rest } = sr;
			add({ ...rest, state: [st.id, ...(also ?? [])] });
		}
	for (const f of activeFeats(ch))
		if (f.def.rider)
			add({ ...f.def.rider, id: `feat:${f.key}`, dmg: fillTemplate(f.def.rider.dmg, c) });
	return r;
}

/** Weapon kinds whose mastery property the character can use. */
export function masteredWeapons(ch: Character): Set<string> {
	return optionEffects(ch).mastery;
}

/** Armor and weapon training granted by chosen options (e.g. Divine Order: Protector). */
export function extraTraining(ch: Character) {
	const fx = optionEffects(ch);
	return { armor: [...new Set(fx.armor)], weapons: [...new Set(fx.weapons)] };
}

export function allRiders(ch: Character, sc = scores(ch)): Rider[] {
	return [...autoRiders(ch, sc), ...ch.riders];
}

const ALWAYS_ON = new Set(['auto:radiant', 'auto:archery']);

export function riderApplies(r: Rider, a: Attack) {
	if (r.applies === 'all') return true;
	if (r.applies === 'weapon') return a.kind !== 'spell';
	return r.applies === a.kind;
}

export function riderActive(r: Rider, a: Attack, ch?: Character) {
	if (r.state && ch) return r.state.every((id) => !!ch.active?.[id]);
	const v = a.riders[r.id];
	return v === undefined ? ALWAYS_ON.has(r.id) : v;
}

export function attackAbility(ch: Character, a: Attack, sc = scores(ch)): Ab {
	if (a.ability !== 'auto') return a.ability;
	if (a.kind === 'spell') return spellcasting(ch, sc).ability ?? 'int';
	const w = WEAPONS[a.weapon];
	const props = (w?.props ?? []).concat(a.props.split(',').map((s) => s.trim()));
	const finesse = props.some((p) => /finesse/i.test(p));
	const best: Ab = mod(sc.dex.total) > mod(sc.str.total) ? 'dex' : 'str';
	const monkWeapon =
		ch.classId === 'monk' &&
		(a.weapon === 'unarmed' ||
			(w && (w.cat === 'simple' || props.includes('Light')) && w.kind === 'melee'));
	if (finesse || monkWeapon) return best;
	if (a.kind === 'ranged') return 'dex';
	return 'str';
}

export interface AttackResult {
	ability: Ab;
	toHit: number;
	base: string;
	baseAvg: number;
	total: string;
	avg: number;
	crit: string;
	critOn: number;
	types: string;
	riders: { r: Rider; on: boolean; terms: DiceTerm[] | null }[];
	error: string;
}

export function attack(ch: Character, a: Attack, sc = scores(ch)): AttackResult {
	const c = makeCtx(ch, sc);
	const ability = attackAbility(ch, a, sc);
	const m = c.m(ability);
	const riders = allRiders(ch, sc)
		.filter((r) => riderApplies(r, a))
		.map((r) => ({ r, on: riderActive(r, a, ch), terms: parseDice(fillTemplate(r.dmg, c)) }));
	let dice = a.twoHanded && a.versatile ? a.versatile : a.dice;
	const wd = WEAPONS[a.weapon];
	const monkWeapon =
		a.weapon === 'unarmed' ||
		(!!wd && wd.kind === 'melee' && (wd.cat === 'simple' || wd.props.includes('Light')));
	if (ch.classId === 'monk' && a.kind === 'melee' && monkWeapon) {
		const ma = by(ch.level, [
			[1, 6],
			[5, 8],
			[11, 10],
			[17, 12]
		]);
		const t = parseDice(dice);
		if (t && avgDice(t) < (ma + 1) / 2) dice = `1d${ma}`;
	}
	let error = '';
	const baseTerms = parseDice(fillTemplate(dice, c)) ?? [];
	if (!parseDice(fillTemplate(dice, c))) error = `Can't read damage "${dice}"`;
	const flat: DiceTerm[] = [];
	if (a.addMod) flat.push({ n: m, d: 0 });
	if (a.magic) flat.push({ n: a.magic, d: 0 });
	const misc = parseDice(fillTemplate(a.dmgMisc, c));
	if (a.dmgMisc && !misc) error = `Can't read extra damage "${a.dmgMisc}"`;
	const base = [...baseTerms, ...flat, ...(misc ?? [])];
	const all = [...base];
	const types = new Set<string>(a.type ? [a.type] : []);
	let hit = m + (a.proficient ? c.pb : 0) + a.magic + a.hitMisc;
	for (const x of riders) {
		if (!x.on) continue;
		hit += x.r.hit || 0;
		if (x.terms) all.push(...x.terms);
		if (x.r.type && x.terms?.length) types.add(x.r.type);
	}
	let critOn = 20;
	if (ch.classId === 'fighter' && ch.subclassId === 'srd')
		critOn = ch.level >= 15 ? 18 : ch.level >= 3 ? 19 : 20;
	return {
		ability,
		toHit: hit,
		base: formatDice(base),
		baseAvg: avgDice(base),
		total: formatDice(all),
		avg: avgDice(all),
		crit: formatDice(critTerms(all)),
		critOn,
		types: [...types].join(', '),
		riders,
		error
	};
}
