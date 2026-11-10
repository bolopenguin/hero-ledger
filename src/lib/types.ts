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
	lineages?: { id: string; name: string; d: string }[];
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

export interface Spell {
	id: string;
	level: number;
	name: string;
	prepared: boolean;
	always: boolean;
	time: string;
	range: string;
	duration: string;
	conc: boolean;
	ritual: boolean;
	comp: string;
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
