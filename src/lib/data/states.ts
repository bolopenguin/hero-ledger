// Situational switches: things that are true only some of the time (raging, unarmored,
// concentrating on Hunter's Mark…). Each one is offered only when it applies to the
// character, and while it is on it changes the numbers on the sheet.
import type { Ab, Rider } from '../types';

export interface StateCtx {
	classId: string;
	l: number;
	pb: number;
	m: (ab: Ab) => number;
	/** Subclass check by id (built-in "srd" or a pack id such as "zealot"). */
	sub: (id: string) => boolean;
	/** Spell in the character's list or given by a feature. */
	hasSpell: (name: string) => boolean;
	speciesId: string;
	hasArmor: boolean;
}

export interface StateDef {
	id: string;
	name: string;
	/** Short reminder of what the switch represents. */
	hint: string;
	available: (c: StateCtx) => boolean;
	ac?: {
		bonus?: number;
		min?: number;
		ignoreArmor?: boolean;
		base?: (c: StateCtx) => number;
		baseLabel?: string;
	};
	speed?: number;
	spellDc?: number;
	/** Damage or to-hit riders controlled by this switch (and any others listed in `with`). */
	riders?: (c: StateCtx) => (Omit<Rider, 'id' | 'auto'> & { id: string; with?: string[] })[];
	/** Reminders shown while the switch is on. */
	notes?: (c: StateCtx) => string;
}

const by = <T>(l: number, t: [number, T][]): T => {
	let v = t[0][1];
	for (const [k, x] of t) if (l >= k) v = x;
	return v;
};

export const STATES: StateDef[] = [
	{
		id: 'unarmored',
		name: 'Unarmored',
		hint: 'Your armor is off: AC uses your best unarmored formula.',
		available: (c) => c.hasArmor,
		ac: { ignoreArmor: true }
	},
	{
		id: 'rage',
		name: 'Rage',
		hint: 'You are raging.',
		available: (c) => c.classId === 'barbarian',
		riders: (c) => [
			{
				id: 'auto:rage',
				name: 'Rage',
				dmg: String(
					by(c.l, [
						[1, 2],
						[9, 3],
						[16, 4]
					])
				),
				type: '',
				hit: 0,
				applies: 'melee',
				when: 'Strength attacks while raging'
			},
			...(c.sub('zealot') && c.l >= 3
				? [
						{
							id: 'state:divine-fury',
							name: 'Divine Fury',
							dmg: `1d6 + ${Math.floor(c.l / 2)}`,
							type: 'Necrotic/Radiant',
							hit: 0,
							applies: 'weapon' as const,
							when: 'First hit each turn while raging'
						}
					]
				: [])
		],
		notes: (c) =>
			`Resistance to Bludgeoning, Piercing and Slashing. Advantage on Strength checks and saves. No spells or Concentration.${c.l >= 15 ? '' : ' Keep it going each turn by attacking, forcing a save, or a Bonus Action.'}`
	},
	{
		id: 'reckless',
		name: 'Reckless Attack',
		hint: 'You attacked recklessly this turn.',
		available: (c) => c.classId === 'barbarian' && c.l >= 2,
		riders: (c) =>
			c.sub('srd') || c.sub('berserker')
				? c.l >= 3
					? [
							{
								id: 'state:frenzy',
								with: ['rage'],
								name: 'Frenzy',
								dmg: `${by(c.l, [
									[1, 2],
									[9, 3],
									[16, 4]
								])}d6`,
								type: '',
								hit: 0,
								applies: 'melee',
								when: 'Raging + Reckless, first hit each turn'
							}
						]
					: []
				: [],
		notes: () =>
			'Advantage on Strength attack rolls until your next turn; attack rolls against you have advantage too.'
	},
	{
		id: 'hunters-mark',
		name: "Hunter's Mark",
		hint: "You are concentrating on Hunter's Mark and hitting the marked target.",
		available: (c) => c.hasSpell("Hunter's Mark"),
		riders: (c) => [
			{
				id: 'auto:mark',
				name: "Hunter's Mark",
				dmg: c.classId === 'ranger' && c.l >= 20 ? '1d10' : '1d6',
				type: 'Force',
				hit: 0,
				applies: 'weapon',
				when: 'Target is marked'
			}
		],
		notes: () => 'Concentration. Advantage on Perception and Survival checks to find the target.'
	},
	{
		id: 'hex',
		name: 'Hex',
		hint: 'You are concentrating on Hex and attacking the cursed target.',
		available: (c) => c.hasSpell('Hex'),
		riders: () => [
			{
				id: 'state:hex',
				name: 'Hex',
				dmg: '1d6',
				type: 'Necrotic',
				hit: 0,
				applies: 'all',
				when: 'Target is hexed'
			}
		],
		notes: () => 'Concentration. The target has disadvantage on checks with the chosen ability.'
	},
	{
		id: 'divine-favor',
		name: 'Divine Favor',
		hint: 'Divine Favor is active.',
		available: (c) => c.hasSpell('Divine Favor'),
		riders: () => [
			{
				id: 'state:divine-favor',
				name: 'Divine Favor',
				dmg: '1d4',
				type: 'Radiant',
				hit: 0,
				applies: 'weapon',
				when: 'Weapon hits'
			}
		]
	},
	{
		id: 'crusaders-mantle',
		name: "Crusader's Mantle",
		hint: "You are inside your Crusader's Mantle aura.",
		available: (c) => c.hasSpell("Crusader's Mantle"),
		riders: () => [
			{
				id: 'state:crusaders-mantle',
				name: "Crusader's Mantle",
				dmg: '1d4',
				type: 'Radiant',
				hit: 0,
				applies: 'weapon',
				when: 'Weapon and Unarmed Strike hits'
			}
		],
		notes: () => 'Concentration. Allies in the 30-ft aura get the same bonus.'
	},
	{
		id: 'enlarge',
		name: 'Enlarged',
		hint: 'Enlarge/Reduce is making you bigger.',
		available: (c) => c.hasSpell('Enlarge/Reduce'),
		riders: () => [
			{
				id: 'state:enlarge',
				name: 'Enlarge',
				dmg: '1d4',
				type: '',
				hit: 0,
				applies: 'weapon',
				when: 'While enlarged'
			}
		],
		notes: () => 'One size larger; advantage on Strength checks and saves.'
	},
	{
		id: 'sacred-weapon',
		name: 'Sacred Weapon',
		hint: 'Your Channel Divinity Sacred Weapon is active.',
		available: (c) => c.classId === 'paladin' && c.l >= 3 && (c.sub('srd') || c.sub('devotion')),
		riders: (c) => [
			{
				id: 'state:sacred-weapon',
				name: 'Sacred Weapon',
				dmg: '',
				type: 'Radiant',
				hit: Math.max(1, c.m('cha')),
				applies: 'melee',
				when: 'Imbued melee weapon'
			}
		],
		notes: () => 'The weapon sheds light and can deal Radiant damage.'
	},
	{
		id: 'innate-sorcery',
		name: 'Innate Sorcery',
		hint: 'Innate Sorcery is active (1 minute).',
		available: (c) => c.classId === 'sorcerer',
		spellDc: 1,
		notes: (c) =>
			`Advantage on Sorcerer spell attacks.${c.l >= 7 ? ' Up to two Metamagic options per spell.' : ''}`
	},
	{
		id: 'mage-armor',
		name: 'Mage Armor',
		hint: 'Mage Armor is on you (no armor worn).',
		available: (c) => c.hasSpell('Mage Armor'),
		ac: { base: (c) => 13 + c.m('dex'), baseLabel: 'Mage Armor 13 + Dex' }
	},
	{
		id: 'shield-spell',
		name: 'Shield (spell)',
		hint: 'You cast Shield; it lasts until the start of your next turn.',
		available: (c) => c.hasSpell('Shield'),
		ac: { bonus: 5 }
	},
	{
		id: 'shield-of-faith',
		name: 'Shield of Faith',
		hint: 'Shield of Faith is on you.',
		available: (c) => c.hasSpell('Shield of Faith'),
		ac: { bonus: 2 }
	},
	{
		id: 'haste',
		name: 'Hasted',
		hint: 'Haste is on you.',
		available: (c) => c.hasSpell('Haste'),
		ac: { bonus: 2 },
		notes: () =>
			'Speed doubled, advantage on Dex saves, one extra limited action. Lose your next turn when it ends.'
	},
	{
		id: 'barkskin',
		name: 'Barkskin',
		hint: 'Barkskin is on you.',
		available: (c) => c.hasSpell('Barkskin'),
		ac: { min: 17 }
	},
	{
		id: 'large-form',
		name: 'Large Form',
		hint: 'Your Goliath Large Form is active.',
		available: (c) => c.speciesId === 'goliath' && c.l >= 5,
		speed: 10,
		notes: () => 'You are Large; advantage on Strength checks.'
	},
	{
		id: 'wild-shape',
		name: 'Wild Shape',
		hint: 'You are in a Beast form.',
		available: (c) => c.classId === 'druid' && c.l >= 2,
		notes: (c) =>
			`Use the Beast's stat block but keep your Int, Wis, Cha, skills and saves. ${c.sub('moon') ? `AC at least ${13 + c.m('wis')}; ` : ''}Temporary HP ${c.sub('moon') ? 3 * c.l : c.l}.${c.l >= 18 ? ' You can cast spells.' : " You can't cast spells."}`
	}
];
