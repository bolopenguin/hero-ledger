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
	r?: Recharge;
	pick?: PickKind;
	/** A placeholder that the chosen subclass fills in. */
	subslot?: boolean;
	/** Uses represent a pool of points (e.g. Lay On Hands) rather than checkboxes. */
	pool?: boolean;
	/** Spells this feature always prepares, by the level they arrive at. */
	spells?: SpellGrant[];
	/** Lets the player pick entries from a named option list (invocations, metamagic…). */
	choose?: { list: string; count: ((c: Ctx) => number) | string; grant?: SpellKind };
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
	feat: string;
	skills: string[];
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
	/** Rider id -> active. */
	riders: Record<string, boolean>;
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

export interface Item {
	id: string;
	name: string;
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
	attacks: Attack[];
	riders: Rider[];
	picks: Record<string, Pick>;
	/** Feature key -> chosen option keys (invocations, metamagic, maneuvers…). */
	choices: Record<string, string[]>;
	edits: Record<string, FeatureEdit>;
	features: CustomFeature[];
	used: Record<string, number>;
	spells: { ability: Ab | ''; slotsUsed: number[]; pactUsed: number; list: Spell[] };
	gear: {
		armor: string;
		shield: boolean;
		acMisc: number;
		items: Item[];
		coins: { cp: number; sp: number; ep: number; gp: number; pp: number };
	};
	notes: {
		appearance: string;
		personality: string;
		ideals: string;
		bonds: string;
		flaws: string;
		backstory: string;
		allies: string;
		other: string;
	};
}
