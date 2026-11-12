// Where the character rolls with advantage or disadvantage, and why (D&D 2024 rules).
// Targets: a skill id, "save:<ab>", "save:all", "check:<ab>" (every check with that ability),
// "init", "death" (Death Saving Throws) or "conc" (Concentration saves).
import { ARMOR, AB_NAMES, SKILLS } from './data/srd';
import { armorClass, availableStates, hasFeat, scores } from './calc';
import type { Ab, Character } from './types';

export type AdvMode = 'adv' | 'dis';

export interface AdvEntry {
	target: string;
	mode: AdvMode;
	/** Only in some situations ("vs Charmed", "while raging"). */
	cond?: string;
	source: string;
}

export interface CustomAdv {
	id: string;
	target: string;
	mode: AdvMode;
	cond: string;
}

interface Rule {
	applies: (ch: Character, sub: (id: string) => boolean) => boolean;
	targets: string[];
	mode?: AdvMode;
	cond?: string;
	source: string;
}

const isSub = (ch: Character) => (id: string) =>
	ch.subclassId === id || ch.subclassId.endsWith(`:${id}`);

const RULES: Rule[] = [
	{
		applies: (ch) => ch.classId === 'barbarian' && ch.level >= 2,
		targets: ['save:dex'],
		cond: 'unless Incapacitated',
		source: 'Danger Sense'
	},
	{
		applies: (ch) => ch.classId === 'barbarian' && ch.level >= 7,
		targets: ['init'],
		source: 'Feral Instinct'
	},
	{
		applies: (ch, s) => ch.classId === 'fighter' && ch.level >= 3 && (s('srd') || s('champion')),
		targets: ['init', 'athletics'],
		source: 'Remarkable Athlete'
	},
	{
		applies: (ch, s) => ch.classId === 'fighter' && ch.level >= 18 && (s('srd') || s('champion')),
		targets: ['death'],
		source: 'Survivor'
	},
	{
		applies: (ch, s) => ch.classId === 'rogue' && ch.level >= 3 && s('assassin'),
		targets: ['init'],
		source: 'Assassinate'
	},
	{
		applies: (ch, s) => ch.classId === 'bard' && ch.level >= 3 && s('dance'),
		targets: ['performance'],
		cond: 'when dancing, no armor or Shield',
		source: 'Dazzling Footwork'
	},
	{
		applies: (ch, s) => ch.classId === 'ranger' && ch.level >= 7 && s('fey-wanderer'),
		targets: ['save:all'],
		cond: 'vs Charmed or Frightened',
		source: 'Beguiling Twist'
	},
	{
		applies: (ch, s) => ch.classId === 'sorcerer' && ch.level >= 6 && s('aberrant'),
		targets: ['save:all'],
		cond: 'vs Charmed or Frightened',
		source: 'Psychic Defenses'
	},
	{
		applies: (ch, s) => ch.classId === 'wizard' && ch.level >= 14 && s('abjurer'),
		targets: ['save:all'],
		cond: 'vs spells',
		source: 'Spell Resistance'
	},
	{
		applies: (ch, s) => ch.classId === 'cleric' && ch.level >= 3 && s('trickery'),
		targets: ['stealth'],
		cond: 'while Blessing of the Trickster is on you',
		source: 'Blessing of the Trickster'
	},
	{
		applies: (ch) => ch.speciesId === 'dwarf',
		targets: ['save:all'],
		cond: 'vs Poisoned',
		source: 'Dwarven Resilience'
	},
	{
		applies: (ch) => ch.speciesId === 'elf',
		targets: ['save:all'],
		cond: 'vs Charmed',
		source: 'Fey Ancestry'
	},
	{
		applies: (ch) => ch.speciesId === 'gnome',
		targets: ['save:int', 'save:wis', 'save:cha'],
		source: 'Gnomish Cunning'
	},
	{
		applies: (ch) => ch.speciesId === 'halfling',
		targets: ['save:all'],
		cond: 'vs Frightened',
		source: 'Brave'
	},
	{
		applies: (ch) => ch.speciesId === 'goliath',
		targets: ['athletics', 'acrobatics'],
		cond: 'to escape a grapple',
		source: 'Powerful Build'
	},
	{ applies: (ch) => hasFeat(ch, 'durable'), targets: ['death'], source: 'Durable' },
	{ applies: (ch) => hasFeat(ch, 'war-caster'), targets: ['conc'], source: 'War Caster' },
	{
		applies: (ch) => hasFeat(ch, 'skulker'),
		targets: ['stealth'],
		cond: 'to Hide in combat',
		source: 'Skulker'
	},
	{
		applies: (ch) => hasFeat(ch, 'actor'),
		targets: ['deception', 'performance'],
		cond: 'to pass as someone while disguised',
		source: 'Actor'
	}
];

/** Situational effects that give advantage while they last. */
const STATE_ADV: Record<string, { targets: string[]; cond: string }> = {
	rage: { targets: ['check:str', 'save:str'], cond: 'while raging' },
	enlarge: { targets: ['check:str', 'save:str'], cond: 'while enlarged' },
	'large-form': { targets: ['check:str'], cond: 'in Large Form' },
	haste: { targets: ['save:dex'], cond: 'while hasted' },
	'hunters-mark': { targets: ['perception', 'survival'], cond: 'to find the marked target' }
};

export function advantages(ch: Character): AdvEntry[] {
	const out: AdvEntry[] = [];
	const s = isSub(ch);
	for (const r of RULES)
		if (r.applies(ch, s))
			for (const t of r.targets)
				out.push({ target: t, mode: r.mode ?? 'adv', cond: r.cond, source: r.source });
	const sc = scores(ch);
	for (const st of availableStates(ch, sc)) {
		const a = STATE_ADV[st.id];
		if (a)
			for (const t of a.targets)
				out.push({
					target: t,
					mode: 'adv',
					cond: a.cond,
					source: st.name
				});
	}
	// Armor that hinders Stealth .
	const armor = ARMOR[ch.gear.armor];
	if (armor && armorClass(ch, sc).stealthDis)
		out.push({ target: 'stealth', mode: 'dis', source: armor.name });
	for (const c of ch.advCustom ?? [])
		out.push({ target: c.target, mode: c.mode, cond: c.cond || undefined, source: 'Your note' });
	return out;
}

/** Entries that apply to a skill (including "all checks with its ability"). */
export function advForSkill(list: AdvEntry[], id: string): AdvEntry[] {
	const ab = SKILLS[id]?.ab;
	return list.filter((e) => e.target === id || e.target === `check:${ab}`);
}

export function advForSave(list: AdvEntry[], ab: Ab): AdvEntry[] {
	return list.filter((e) => e.target === `save:${ab}` || e.target === 'save:all');
}

/** Short marker: ADV / DIS when always true, adv* / dis* when only sometimes. */
export function advMarker(
	list: AdvEntry[]
): { text: string; mode: AdvMode | 'both'; always: boolean } | null {
	if (!list.length) return null;
	const always = list.filter((e) => !e.cond);
	const pick = always.length ? always : list;
	const adv = pick.some((e) => e.mode === 'adv');
	const dis = pick.some((e) => e.mode === 'dis');
	const mode = adv && dis ? 'both' : adv ? 'adv' : 'dis';
	const text = mode === 'both' ? 'ADV/DIS' : mode.toUpperCase();
	return { text: always.length ? text : `${text.toLowerCase()}*`, mode, always: always.length > 0 };
}

export function advLabel(target: string): string {
	if (SKILLS[target]) return SKILLS[target].name;
	if (target === 'init') return 'Initiative';
	if (target === 'death') return 'Death Saving Throws';
	if (target === 'conc') return 'Concentration saves';
	if (target === 'save:all') return 'All saving throws';
	const [k, ab] = target.split(':');
	if (k === 'save') return `${AB_NAMES[ab as Ab]} saves`;
	if (k === 'check') return `${AB_NAMES[ab as Ab]} checks`;
	return target;
}

export const ADV_TARGETS: string[] = [
	...Object.keys(SKILLS),
	'save:str',
	'save:dex',
	'save:con',
	'save:int',
	'save:wis',
	'save:cha',
	'save:all',
	'check:str',
	'check:dex',
	'check:con',
	'check:int',
	'check:wis',
	'check:cha',
	'init',
	'death',
	'conc'
];

export const describe = (e: AdvEntry) =>
	`${e.mode === 'adv' ? 'Advantage' : 'Disadvantage'}${e.cond ? ` ${e.cond}` : ''} (${e.source})`;
