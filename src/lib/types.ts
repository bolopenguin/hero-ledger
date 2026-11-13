export type Ab = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
export const ABILITIES: Ab[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

/** Context passed to level/ability dependent rules text and formulas. */
export interface Ctx {
	l: number;
	pb: number;
	m: (ab: Ab) => number;
}

export type ActionType = 'action' | 'bonus' | 'reaction' | 'special' | 'passive';
/** short: all uses back on a short rest; short1: one use back on a short rest, all on a long rest. */
export type Recharge = 'short' | 'short1' | 'long' | '';
export type PickKind = 'general' | 'origin' | 'style' | 'epic';

export type Text = string | ((c: Ctx) => string);

export interface Feature {
	l: number;
	n: string;
	a: ActionType;
	d: Text;
	u?: ((c: Ctx) => number) | string;
	r?: Recharge | ((c: Ctx) => Recharge);
	pick?: PickKind;
	/** Feats the picker offers (keys); absent means every feat of the pick's kind. */
	pickFrom?: string[];
	/** A placeholder that the chosen subclass fills in. */
	subslot?: boolean;
	/** Uses represent a pool of points (e.g. Lay On Hands) rather than checkboxes. */
	pool?: boolean;
	/** Spells this feature always prepares, by the level they arrive at. */
	spells?: SpellGrant[];
	/** Lets the player pick entries from named option lists (invocations, metamagic, cantrips…). */
	choose?: ChooseDef | ChooseDef[];
	/** Extra damage this feature adds to attacks, listed under situational effects. */
	rider?: Omit<Rider, 'id' | 'auto'>;
}

/**
 * A choice a feature or feat asks for: pick `count` entries from an option list.
 * Several lists can be offered together by joining their keys with "|".
 */
export interface ChooseDef {
	list: string;
	count: ((c: Ctx) => number) | string;
	/** How chosen spells are cast (cantrips are always known). */
	grant?: SpellKind;
	/** Heading shown above the choice, when the list's own label is not clear enough. */
	label?: string;
}

/**
 * How a feature makes a spell available:
 * prepared = always prepared; free = always prepared and castable once per rest without a slot;
 * atwill = castable without a slot, no limit; ritual = castable only as a Ritual.
 * Cantrips are always "known", whatever the kind says.
 */
export type SpellKind = 'prepared' | 'free' | 'atwill' | 'ritual';

export interface SpellGrant {
	l: number;
	names: string[];
	kind?: SpellKind;
}

/** What choosing an option changes on the sheet. */
export interface OptionEffects {
	armor?: string[];
	weapons?: string;
	cantrips?: number;
	/** Skill id -> ability whose modifier (min +1) is added to that skill. */
	skillBonus?: Record<string, Ab>;
	rider?: Omit<Rider, 'id' | 'auto'>;
	/** Skill id that gains Expertise. */
	expertise?: string;
	/** Weapon key whose mastery you can use. */
	mastery?: string;
	/** Tool (or instrument, gaming set) proficiency. */
	tool?: string;
	/** Skill id that gains proficiency. */
	skill?: string;
	/** Skill id that gains proficiency, or Expertise if already proficient. */
	skillUp?: string;
}

export interface OptionItem {
	name: string;
	d: string;
	/** Minimum character level. */
	l?: number;
	prereq?: string;
	repeatable?: boolean;
	spells?: string[];
	spellKind?: SpellKind;
	/** Spells by the level they arrive at (e.g. Circle of the Land). */
	spellGrants?: SpellGrant[];
	effects?: OptionEffects;
}

export interface OptionList {
	label: string;
	items: Record<string, OptionItem>;
}

export interface ClassDef {
	name: string;
	hd: number;
	saves: Ab[];
	armor: string[];
	weapons: string;
	tools: string;
	skills: { n: number; list: string[] | 'any' };
	caster?: 'full' | 'half' | 'pact';
	castAbil?: Ab;
	cantrips?: [number, number][];
	prepared?: number[];
	unarmored?: Ab;
	subLevels: number[];
	features: Feature[];
	sub: { name: string; features: Feature[] };
}

export interface SpeciesDef {
	name: string;
	size: string;
	speed: number;
	darkvision?: number;
	lineages?: { id: string; name: string; d: string; spells?: SpellGrant[] }[];
	lineageLabel?: string;
	features: Feature[];
}

export interface BackgroundDef {
	name: string;
	abilities: Ab[];
	/**
	 * true: at least +1 must go to one of `abilities`, the rest to any score (no score above +2).
	 * Otherwise all three points go to `abilities`.
	 */
	freeAsi?: boolean;
	/** Origin feat key; empty when the player chooses (see `feats`). */
	feat: string;
	/** Origin feats to choose one from; empty or absent means any Origin feat. */
	feats?: string[];
	skills: string[];
	/** More skills to choose: `count` (default 1) from `from` (absent means any skill). */
	skillChoice?: { count?: number; from?: string[] };
	/** A tool, or a choice such as "Disguise Kit or one kind of Gaming Set". */
	tool: string;
	equipment: string;
}

export interface FeatDef {
	name: string;
	cat: PickKind;
	prereq?: string;
	d: Text;
	repeatable?: boolean;
	/** Abilities the feat's +1 can go to. Absent means the feat gives no increase. */
	abilities?: Ab[];
	u?: ((c: Ctx) => number) | string;
	r?: Recharge;
	a?: ActionType;
	pool?: boolean;
	/** Extra damage the sheet can add to attacks. */
	rider?: Omit<Rider, 'id' | 'auto'>;
	/** HP maximum bonus per character level (Tough) and flat (Boon of Fortitude). */
	hp?: number;
	hpFlat?: number;
	speed?: number;
	/** The ability raised by this feat also gains saving throw proficiency (Resilient). */
	saveFromAsi?: boolean;
	spells?: SpellGrant[];
	/** Only offered to this class (e.g. Blessed Warrior for Paladins). */
	forClass?: string;
	/** Choices the feat asks for (cantrips, spells, tools…). */
	choose?: ChooseDef | ChooseDef[];
}

export interface WeaponDef {
	name: string;
	cat: 'simple' | 'martial';
	kind: 'melee' | 'ranged';
	dice: string;
	type: string;
	props: string[];
	versatile?: string;
	range?: string;
	mastery: string;
	weight: number;
	cost: number;
}

export interface ArmorDef {
	name: string;
	type: 'light' | 'medium' | 'heavy';
	base: number;
	dexCap: number | null;
	str?: number;
	stealthDis?: boolean;
	weight: number;
	cost: number;
}

// ---------- Character ----------

export interface Attack {
	id: string;
	name: string;
	weapon: string; // key in WEAPONS, or '' for custom / spell
	kind: 'melee' | 'ranged' | 'spell';
	ability: Ab | 'auto';
	proficient: boolean;
	dice: string;
	versatile: string;
	twoHanded: boolean;
	type: string;
	addMod: boolean;
	magic: number;
	hitMisc: number;
	dmgMisc: string;
	mastery: string;
	props: string;
	range: string;
	notes: string;
	/** Rider id -> active (no longer used: riders are listed, not ticked). */
	riders: Record<string, boolean>;
	/** Extra damage this weapon or spell adds: dice, a damage type, and when it applies. */
	extras: AttackExtra[];
	/** The target makes this saving throw instead of you rolling to hit (Sacred Flame, Burning Hands…). */
	save?: Ab | '';
	/** Spell this attack was made from, so it can be kept in sync. */
	spell?: string;
}

/** Extra damage on one attack, e.g. a Flame Tongue's 2d6 Fire. */
export interface AttackExtra {
	id: string;
	dmg: string;
	type: string;
	/** Free text: "while ignited", "against Undead". */
	when: string;
	/** Counted in the damage line; otherwise it is only listed under the attack. */
	always: boolean;
}

export interface Rider {
	id: string;
	name: string;
	dmg: string;
	/** Damage type of the extra damage, e.g. Radiant. */
	type: string;
	hit: number;
	applies: 'melee' | 'ranged' | 'spell' | 'weapon' | 'all';
	when: string;
	auto?: boolean;
	/** Controlled by these situational switches (all must be on) instead of per attack. */
	state?: string[];
}

export interface CustomFeature {
	id: string;
	l: number;
	n: string;
	d: string;
	a: ActionType;
	src: string;
	uses: string;
	r: Recharge;
	/** Where it is listed: the Origin block, its level, or the Custom Features section (default: level). */
	place?: 'origin' | 'level' | 'custom';
}

export interface FeatureEdit {
	n?: string;
	d?: string;
	notes?: string;
	hidden?: boolean;
}

export interface Pick {
	feat: string; // feat key or 'custom'
	n?: string;
	d?: string;
	asi?: Partial<Record<Ab, number>>;
}

/** A spell from a content pack. Descriptions are short summaries. */
export interface SpellDef {
	name: string;
	level: number;
	school: string;
	time: string;
	range: string;
	comp: string;
	/** What the Material component is, e.g. "a diamond worth 300+ GP". */
	material?: string;
	/** Gold cost of the Material component, if it has one. */
	cost?: number;
	/** The spell consumes the costly material. */
	consumed?: boolean;
	duration: string;
	conc: boolean;
	ritual: boolean;
	classes: string[];
	d: string;
	higher?: string;
}

export interface Spell {
	id: string;
	level: number;
	name: string;
	school: string;
	desc: string;
	prepared: boolean;
	always: boolean;
	time: string;
	range: string;
	duration: string;
	conc: boolean;
	ritual: boolean;
	comp: string;
	material: string;
	cost: number;
	consumed: boolean;
	notes: string;
}

/** What an armor or shield item does to Armor Class. */
export interface ArmorStats {
	type: 'light' | 'medium' | 'heavy' | 'shield';
	/** Armor: base AC. Shield: the AC bonus it gives. */
	base: number;
	/** Most Dexterity bonus allowed: null for no limit, 0 for none. Ignored for shields. */
	dexCap: number | null;
	/** Strength score needed to wear it without a Speed penalty (0 for none). */
	str: number;
	stealthDis: boolean;
	/** Magic bonus to AC, e.g. +1 for Chain Mail +1. */
	bonus: number;
}

export interface Item {
	id: string;
	name: string;
	/** Weapons and armor have their own section and stats; everything else is a plain item. */
	kind: 'item' | 'weapon' | 'armor';
	/** Weapon stats; the weapon makes an attack in the Combat tab while it is equipped. */
	atk?: Attack;
	armor?: ArmorStats;
	qty: number;
	weight: number;
	value: number;
	location: string;
	equipped: boolean;
	attuned: boolean;
	magic: boolean;
	charges: number;
	chargesMax: number;
	notes: string;
}

export interface Character {
	id: string;
	version: 1;
	updated: number;
	name: string;
	player: string;
	classId: string;
	subclassId: string; // 'srd' | 'custom' | 'pack:<id>' | ''
	level: number;
	xp: number;
	speciesId: string;
	lineage: string;
	backgroundId: string;
	alignment: string;
	custom: {
		className: string;
		hd: number;
		caster: '' | 'full' | 'half' | 'pact';
		castAbil: Ab;
		subclassName: string;
		speciesName: string;
		size: string;
		speed: number;
		backgroundName: string;
	};
	abilities: Record<Ab, number>;
	bgAsi: Partial<Record<Ab, number>>;
	saveProf: Partial<Record<Ab, boolean>>;
	skills: Record<string, number>;
	overrides: Record<string, number>;
	bonus: Record<string, number>;
	hp: { current: number; temp: number };
	hitDiceUsed: number;
	death: { s: number; f: number };
	exhaustion: number;
	inspiration: boolean;
	prof: { armor: string; weapons: string; tools: string; languages: string; senses: string };
	/** Spell attacks and anything else that is not a weapon in your equipment. */
	attacks: Attack[];
	picks: Record<string, Pick>;
	/** Feature key -> chosen option keys (invocations, metamagic, maneuvers…). */
	choices: Record<string, string[]>;
	/** Advantage or disadvantage the player adds by hand (items, house rules). */
	advCustom: { id: string; target: string; mode: 'adv' | 'dis'; cond: string }[];
	edits: Record<string, FeatureEdit>;
	features: CustomFeature[];
	used: Record<string, number>;
	spells: { ability: Ab | ''; slotsUsed: number[]; pactUsed: number; list: Spell[] };
	gear: {
		/** Other AC bonuses that are not an item's own (a feat, a spell, a house rule). */
		acMisc: number;
		items: Item[];
		coins: { cp: number; sp: number; ep: number; gp: number; pp: number };
	};
}
