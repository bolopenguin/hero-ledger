// Species, backgrounds, feats and equipment from the D&D 2024 rules (SRD 5.2, CC BY 4.0).
// Descriptions are short summaries written for this app.
import type { Ab, ArmorDef, BackgroundDef, FeatDef, SpeciesDef, WeaponDef } from '../types';
import { by } from './classes';

export const SKILLS: Record<string, { name: string; ab: Ab }> = {
	acrobatics: { name: 'Acrobatics', ab: 'dex' },
	animal: { name: 'Animal Handling', ab: 'wis' },
	arcana: { name: 'Arcana', ab: 'int' },
	athletics: { name: 'Athletics', ab: 'str' },
	deception: { name: 'Deception', ab: 'cha' },
	history: { name: 'History', ab: 'int' },
	insight: { name: 'Insight', ab: 'wis' },
	intimidation: { name: 'Intimidation', ab: 'cha' },
	investigation: { name: 'Investigation', ab: 'int' },
	medicine: { name: 'Medicine', ab: 'wis' },
	nature: { name: 'Nature', ab: 'int' },
	perception: { name: 'Perception', ab: 'wis' },
	performance: { name: 'Performance', ab: 'cha' },
	persuasion: { name: 'Persuasion', ab: 'cha' },
	religion: { name: 'Religion', ab: 'int' },
	sleight: { name: 'Sleight of Hand', ab: 'dex' },
	stealth: { name: 'Stealth', ab: 'dex' },
	survival: { name: 'Survival', ab: 'wis' }
};

export const AB_NAMES: Record<Ab, string> = {
	str: 'Strength',
	dex: 'Dexterity',
	con: 'Constitution',
	int: 'Intelligence',
	wis: 'Wisdom',
	cha: 'Charisma'
};

const breathDice = (l: number) =>
	by(l, [
		[1, 1],
		[5, 2],
		[11, 3],
		[17, 4]
	]);

export const SPECIES: Record<string, SpeciesDef> = {
	dragonborn: {
		name: 'Dragonborn',
		size: 'Medium',
		speed: 30,
		darkvision: 60,
		lineageLabel: 'Draconic Ancestry',
		lineages: [
			{ id: 'black', name: 'Black (Acid)', d: 'Acid' },
			{ id: 'blue', name: 'Blue (Lightning)', d: 'Lightning' },
			{ id: 'brass', name: 'Brass (Fire)', d: 'Fire' },
			{ id: 'bronze', name: 'Bronze (Lightning)', d: 'Lightning' },
			{ id: 'copper', name: 'Copper (Acid)', d: 'Acid' },
			{ id: 'gold', name: 'Gold (Fire)', d: 'Fire' },
			{ id: 'green', name: 'Green (Poison)', d: 'Poison' },
			{ id: 'red', name: 'Red (Fire)', d: 'Fire' },
			{ id: 'silver', name: 'Silver (Cold)', d: 'Cold' },
			{ id: 'white', name: 'White (Cold)', d: 'Cold' }
		],
		features: [
			{
				l: 1,
				n: 'Draconic Ancestry',
				a: 'passive',
				d: 'Your dragon ancestor sets the damage type of your Breath Weapon and Damage Resistance.'
			},
			{
				l: 1,
				n: 'Breath Weapon',
				a: 'special',
				r: 'long',
				u: (c) => c.pb,
				d: (c) =>
					`Replace one attack of the Attack action: 15-ft Cone or 30-ft Line. Dex save DC ${8 + c.m('con') + c.pb}, ${breathDice(c.l)}d10 damage of your ancestry type (half on success).`
			},
			{
				l: 1,
				n: 'Damage Resistance',
				a: 'passive',
				d: 'Resistance to the damage type of your Draconic Ancestry.'
			},
			{ l: 1, n: 'Darkvision', a: 'passive', d: 'Darkvision 60 ft.' },
			{
				l: 5,
				n: 'Draconic Flight',
				a: 'bonus',
				r: 'long',
				u: () => 1,
				d: 'Bonus Action: spectral wings for 10 min, Fly Speed equal to your Speed.'
			}
		]
	},
	dwarf: {
		name: 'Dwarf',
		size: 'Medium',
		speed: 30,
		darkvision: 120,
		features: [
			{ l: 1, n: 'Darkvision', a: 'passive', d: 'Darkvision 120 ft.' },
			{
				l: 1,
				n: 'Dwarven Resilience',
				a: 'passive',
				d: 'Resistance to Poison damage. Advantage on saves to avoid or end the Poisoned condition.'
			},
			{
				l: 1,
				n: 'Dwarven Toughness',
				a: 'passive',
				d: 'HP maximum +1 per level (already counted in your HP).'
			},
			{
				l: 1,
				n: 'Stonecunning',
				a: 'bonus',
				r: 'long',
				u: (c) => c.pb,
				d: 'Bonus Action: Tremorsense 60 ft for 10 min while on or touching stone.'
			}
		]
	},
	elf: {
		name: 'Elf',
		size: 'Medium',
		speed: 30,
		darkvision: 60,
		lineageLabel: 'Elven Lineage',
		lineages: [
			{
				id: 'drow',
				spells: [
					{ l: 1, names: ['Dancing Lights'] },
					{ l: 3, names: ['Faerie Fire'], kind: 'free' },
					{ l: 5, names: ['Darkness'], kind: 'free' }
				],
				name: 'Drow',
				d: 'Darkvision 120 ft; Dancing Lights cantrip. Level 3: Faerie Fire. Level 5: Darkness.'
			},
			{
				id: 'high',
				spells: [
					{ l: 1, names: ['Prestidigitation'] },
					{ l: 3, names: ['Detect Magic'], kind: 'free' },
					{ l: 5, names: ['Misty Step'], kind: 'free' }
				],
				name: 'High Elf',
				d: 'Prestidigitation cantrip (swap on a Long Rest for another Wizard cantrip). Level 3: Detect Magic. Level 5: Misty Step.'
			},
			{
				id: 'wood',
				spells: [
					{ l: 1, names: ['Druidcraft'] },
					{ l: 3, names: ['Longstrider'], kind: 'free' },
					{ l: 5, names: ['Pass without Trace'], kind: 'free' }
				],
				name: 'Wood Elf',
				d: 'Speed 35 ft; Druidcraft cantrip. Level 3: Longstrider. Level 5: Pass without Trace.'
			}
		],
		features: [
			{ l: 1, n: 'Darkvision', a: 'passive', d: 'Darkvision 60 ft (120 ft for Drow).' },
			{
				l: 1,
				n: 'Elven Lineage',
				a: 'passive',
				d: 'Lineage spells: cast the level 3 and 5 spells once per Long Rest without a slot, or with slots. Choose Int, Wis or Cha as the spellcasting ability.'
			},
			{
				l: 1,
				n: 'Fey Ancestry',
				a: 'passive',
				d: 'Advantage on saves to avoid or end the Charmed condition.'
			},
			{
				l: 1,
				n: 'Keen Senses',
				a: 'passive',
				d: 'Proficiency in Insight, Perception or Survival.'
			},
			{
				l: 1,
				n: 'Trance',
				a: 'passive',
				d: "You don't need sleep; a Long Rest takes 4 hours of meditation."
			}
		]
	},
	gnome: {
		name: 'Gnome',
		size: 'Small',
		speed: 30,
		darkvision: 60,
		lineageLabel: 'Gnomish Lineage',
		lineages: [
			{
				id: 'forest',
				spells: [{ l: 1, names: ['Minor Illusion', 'Speak with Animals'] }],
				name: 'Forest Gnome',
				d: 'Minor Illusion cantrip. Speak with Animals always prepared, cast without a slot PB times per Long Rest.'
			},
			{
				id: 'rock',
				spells: [{ l: 1, names: ['Mending', 'Prestidigitation'] }],
				name: 'Rock Gnome',
				d: 'Mending and Prestidigitation cantrips. Spend 10 min to build a Tiny clockwork device (AC 5, 1 HP) with a simple effect.'
			}
		],
		features: [
			{ l: 1, n: 'Darkvision', a: 'passive', d: 'Darkvision 60 ft.' },
			{
				l: 1,
				n: 'Gnomish Cunning',
				a: 'passive',
				d: 'Advantage on Intelligence, Wisdom and Charisma saving throws.'
			},
			{
				l: 1,
				n: 'Gnomish Lineage',
				a: 'passive',
				d: 'Choose Int, Wis or Cha as the spellcasting ability for your lineage spells.'
			}
		]
	},
	goliath: {
		name: 'Goliath',
		size: 'Medium',
		speed: 35,
		lineageLabel: 'Giant Ancestry',
		lineages: [
			{
				id: 'cloud',
				name: "Cloud's Jaunt",
				d: 'Bonus Action: teleport up to 30 ft to a space you can see.'
			},
			{
				id: 'fire',
				name: "Fire's Burn",
				d: 'When you hit with an attack, deal +1d10 Fire damage.'
			},
			{
				id: 'frost',
				name: "Frost's Chill",
				d: "When you hit with an attack, deal +1d6 Cold damage and reduce the target's Speed by 10 ft until your next turn."
			},
			{
				id: 'hill',
				name: "Hill's Tumble",
				d: 'When you hit a Large or smaller creature, give it the Prone condition.'
			},
			{
				id: 'stone',
				name: "Stone's Endurance",
				d: 'Reaction when you take damage: roll 1d12 + Con mod and reduce the damage by that amount.'
			},
			{
				id: 'storm',
				name: "Storm's Thunder",
				d: 'Reaction when a creature within 60 ft damages you: it takes 1d8 Thunder damage.'
			}
		],
		features: [
			{
				l: 1,
				n: 'Giant Ancestry',
				a: 'special',
				r: 'long',
				u: (c) => c.pb,
				d: 'Use your chosen supernatural boon a number of times equal to your Proficiency Bonus per Long Rest.'
			},
			{
				l: 5,
				n: 'Large Form',
				a: 'bonus',
				r: 'long',
				u: () => 1,
				d: 'Bonus Action: become Large for 10 min if there is room. Advantage on Strength checks, +10 ft Speed.'
			},
			{
				l: 1,
				n: 'Powerful Build',
				a: 'passive',
				d: 'Advantage on checks to end the Grappled condition. Count as one size larger for carrying capacity.'
			}
		]
	},
	halfling: {
		name: 'Halfling',
		size: 'Small',
		speed: 30,
		features: [
			{
				l: 1,
				n: 'Brave',
				a: 'passive',
				d: 'Advantage on saves to avoid or end the Frightened condition.'
			},
			{
				l: 1,
				n: 'Halfling Nimbleness',
				a: 'passive',
				d: "You can move through the space of any creature that is a size larger than you (you can't stop there)."
			},
			{
				l: 1,
				n: 'Luck',
				a: 'passive',
				d: 'When you roll a 1 on the d20 of a D20 Test, reroll it and use the new roll.'
			},
			{
				l: 1,
				n: 'Naturally Stealthy',
				a: 'passive',
				d: 'You can take the Hide action even when obscured only by a creature at least one size larger than you.'
			}
		]
	},
	human: {
		name: 'Human',
		size: 'Medium or Small',
		speed: 30,
		features: [
			{
				l: 1,
				n: 'Resourceful',
				a: 'passive',
				d: 'You gain Heroic Inspiration whenever you finish a Long Rest.'
			},
			{ l: 1, n: 'Skillful', a: 'passive', d: 'Proficiency in one skill of your choice.' },
			{
				l: 1,
				n: 'Versatile',
				a: 'passive',
				pick: 'origin',
				d: 'You gain an Origin feat of your choice.'
			}
		]
	},
	orc: {
		name: 'Orc',
		size: 'Medium',
		speed: 30,
		darkvision: 120,
		features: [
			{
				l: 1,
				n: 'Adrenaline Rush',
				a: 'bonus',
				r: 'short',
				u: (c) => c.pb,
				d: (c) => `Take the Dash action as a Bonus Action and gain ${c.pb} Temporary HP.`
			},
			{ l: 1, n: 'Darkvision', a: 'passive', d: 'Darkvision 120 ft.' },
			{
				l: 1,
				n: 'Relentless Endurance',
				a: 'special',
				r: 'long',
				u: () => 1,
				d: "When you drop to 0 HP but aren't killed outright, drop to 1 HP instead."
			}
		]
	},
	tiefling: {
		name: 'Tiefling',
		size: 'Medium or Small',
		speed: 30,
		darkvision: 60,
		lineageLabel: 'Fiendish Legacy',
		lineages: [
			{
				id: 'abyssal',
				spells: [
					{ l: 1, names: ['Poison Spray'] },
					{ l: 3, names: ['Ray of Sickness'], kind: 'free' },
					{ l: 5, names: ['Hold Person'], kind: 'free' }
				],
				name: 'Abyssal',
				d: 'Resistance to Poison; Poison Spray cantrip. Level 3: Ray of Sickness. Level 5: Hold Person.'
			},
			{
				id: 'chthonic',
				spells: [
					{ l: 1, names: ['Chill Touch'] },
					{ l: 3, names: ['False Life'], kind: 'free' },
					{ l: 5, names: ['Ray of Enfeeblement'], kind: 'free' }
				],
				name: 'Chthonic',
				d: 'Resistance to Necrotic; Chill Touch cantrip. Level 3: False Life. Level 5: Ray of Enfeeblement.'
			},
			{
				id: 'infernal',
				spells: [
					{ l: 1, names: ['Fire Bolt'] },
					{ l: 3, names: ['Hellish Rebuke'], kind: 'free' },
					{ l: 5, names: ['Darkness'], kind: 'free' }
				],
				name: 'Infernal',
				d: 'Resistance to Fire; Fire Bolt cantrip. Level 3: Hellish Rebuke. Level 5: Darkness.'
			}
		],
		features: [
			{ l: 1, n: 'Darkvision', a: 'passive', d: 'Darkvision 60 ft.' },
			{
				l: 1,
				n: 'Fiendish Legacy',
				a: 'passive',
				d: 'Legacy spells: cast the level 3 and 5 spells once per Long Rest without a slot, or with slots. Choose Int, Wis or Cha as the spellcasting ability.'
			},
			{
				l: 1,
				n: 'Otherworldly Presence',
				spells: [{ l: 1, names: ['Thaumaturgy'] }],
				a: 'passive',
				d: 'You know the Thaumaturgy cantrip.'
			}
		]
	}
};

export const BACKGROUNDS: Record<string, BackgroundDef> = {
	acolyte: {
		name: 'Acolyte',
		abilities: ['int', 'wis', 'cha'],
		feat: 'magic-initiate-cleric',
		skills: ['insight', 'religion'],
		tool: "Calligrapher's Supplies",
		equipment:
			"Calligrapher's Supplies, Book (prayers), Holy Symbol, Parchment (10 sheets), Robe, 8 GP — or 50 GP"
	},
	criminal: {
		name: 'Criminal',
		abilities: ['dex', 'con', 'int'],
		feat: 'alert',
		skills: ['sleight', 'stealth'],
		tool: "Thieves' Tools",
		equipment: "2 Daggers, Thieves' Tools, Crowbar, 2 Pouches, Traveler's Clothes, 16 GP — or 50 GP"
	},
	sage: {
		name: 'Sage',
		abilities: ['con', 'int', 'wis'],
		feat: 'magic-initiate-wizard',
		skills: ['arcana', 'history'],
		tool: "Calligrapher's Supplies",
		equipment:
			"Quarterstaff, Calligrapher's Supplies, Book (history), Parchment (8 sheets), Robe, 8 GP — or 50 GP"
	},
	soldier: {
		name: 'Soldier',
		abilities: ['str', 'dex', 'con'],
		feat: 'savage-attacker',
		skills: ['athletics', 'intimidation'],
		tool: 'Gaming Set (choose one)',
		equipment:
			"Spear, Shortbow, 20 Arrows, Gaming Set, Healer's Kit, Quiver, Traveler's Clothes, 14 GP — or 50 GP"
	}
};

const magicInitiate = (list: string): FeatDef => ({
	name: `Magic Initiate (${list})`,
	cat: 'origin',
	repeatable: true,
	d: `Learn two ${list} cantrips and one level 1 ${list} spell (always prepared). Cast the level 1 spell once per Long Rest without a slot, or with slots. Spellcasting ability: Int, Wis or Cha (choose).`
});

export const FEATS: Record<string, FeatDef> = {
	alert: {
		name: 'Alert',
		cat: 'origin',
		d: (c) =>
			`Add your Proficiency Bonus (+${c.pb}) to Initiative. Right after rolling Initiative you can swap yours with a willing ally's.`
	},
	'magic-initiate-cleric': magicInitiate('Cleric'),
	'magic-initiate-druid': magicInitiate('Druid'),
	'magic-initiate-wizard': magicInitiate('Wizard'),
	'savage-attacker': {
		name: 'Savage Attacker',
		cat: 'origin',
		d: 'Once per turn when you hit with a weapon, roll its damage dice twice and use either roll.'
	},
	skilled: {
		name: 'Skilled',
		cat: 'origin',
		repeatable: true,
		d: 'Proficiency in any combination of three skills or tools.'
	},
	asi: {
		name: 'Ability Score Improvement',
		cat: 'general',
		repeatable: true,
		prereq: 'Level 4+',
		d: 'Increase one ability score by 2, or two scores by 1 (max 20).'
	},
	grappler: {
		name: 'Grappler',
		cat: 'general',
		abilities: ['str', 'dex'],
		prereq: 'Level 4+, Str or Dex 13+',
		d: 'Punch and Grab: once per turn, an Unarmed Strike hit during the Attack action can both damage and grapple. Advantage on attacks against creatures you grapple. Moving a grappled creature your size or smaller costs no extra movement.'
	},
	archery: { name: 'Archery', cat: 'style', d: '+2 bonus to attack rolls with Ranged weapons.' },
	defense: {
		name: 'Defense',
		cat: 'style',
		d: '+1 AC while wearing Light, Medium or Heavy armor.'
	},
	gwf: {
		name: 'Great Weapon Fighting',
		cat: 'style',
		d: 'With a Two-Handed or Versatile melee weapon held in two hands, treat any 1 or 2 on a damage die as a 3.'
	},
	'blessed-warrior': {
		name: 'Blessed Warrior',
		cat: 'style',
		forClass: 'paladin',
		d: 'Instead of a Fighting Style feat: learn two Cleric cantrips (they count as Paladin spells, Charisma). Swap one when you gain a Paladin level.'
	},
	'druidic-warrior': {
		name: 'Druidic Warrior',
		cat: 'style',
		forClass: 'ranger',
		d: 'Instead of a Fighting Style feat: learn two Druid cantrips (they count as Ranger spells, Wisdom). Swap one when you gain a Ranger level.'
	},
	twf: {
		name: 'Two-Weapon Fighting',
		cat: 'style',
		d: 'Add your ability modifier to the damage of the extra attack from the Light property.'
	},
	'boon-combat': {
		name: 'Boon of Combat Prowess',
		cat: 'epic',
		abilities: ['str', 'dex', 'con', 'int', 'wis', 'cha'],
		d: 'Ability score +1 (max 30). When you miss with an attack roll you can hit instead; usable again at the start of your next turn.'
	},
	'boon-dimensional': {
		name: 'Boon of Dimensional Travel',
		cat: 'epic',
		abilities: ['str', 'dex', 'con', 'int', 'wis', 'cha'],
		d: 'Ability score +1 (max 30). Right after the Attack or Magic action, teleport up to 30 ft to a space you can see.'
	},
	'boon-fate': {
		name: 'Boon of Fate',
		cat: 'epic',
		abilities: ['str', 'dex', 'con', 'int', 'wis', 'cha'],
		d: 'Ability score +1 (max 30). When you or a creature within 60 ft succeeds or fails a D20 Test, roll 2d4 and add or subtract it. Once per Initiative or rest.'
	},
	'boon-offense': {
		name: 'Boon of Irresistible Offense',
		cat: 'epic',
		abilities: ['str', 'dex'],
		d: 'Str or Dex +1 (max 30). Your Bludgeoning, Piercing and Slashing damage ignores Resistance. On a natural 20, add extra damage equal to the increased score.'
	},
	'boon-recall': {
		name: 'Boon of Spell Recall',
		cat: 'epic',
		abilities: ['int', 'wis', 'cha'],
		d: 'Int, Wis or Cha +1 (max 30). When you cast a spell with a level 1–4 slot, roll 1d4: if it equals the slot level, the slot is not spent.'
	},
	'boon-night': {
		name: 'Boon of the Night Spirit',
		cat: 'epic',
		abilities: ['str', 'dex', 'con', 'int', 'wis', 'cha'],
		d: 'Ability score +1 (max 30). In Dim Light or Darkness: Bonus Action to become Invisible, and Resistance to all damage except Psychic and Radiant.'
	},
	'boon-truesight': {
		name: 'Boon of Truesight',
		cat: 'epic',
		abilities: ['str', 'dex', 'con', 'int', 'wis', 'cha'],
		d: 'Ability score +1 (max 30). Truesight 60 ft.'
	}
};

export const MASTERIES: Record<string, string> = {
	Cleave:
		'On a melee hit, make one extra attack against a second creature within 5 ft of the first (no ability mod to damage unless negative). Once per turn.',
	Graze: 'On a miss, deal damage equal to the ability modifier used for the attack (same type).',
	Nick: 'The extra attack from the Light property can be part of the Attack action instead of a Bonus Action. Once per turn.',
	Push: 'On a hit, push a Large or smaller creature up to 10 ft straight away from you.',
	Sap: 'On a hit, the creature has disadvantage on its next attack roll before your next turn.',
	Slow: "On a hit that deals damage, reduce the creature's Speed by 10 ft until your next turn (doesn't stack).",
	Topple:
		'On a hit, the creature makes a Con save (DC 8 + ability mod + PB) or has the Prone condition.',
	Vex: 'On a hit that deals damage, you have advantage on your next attack against that creature before the end of your next turn.'
};

const w = (
	name: string,
	cat: 'simple' | 'martial',
	kind: 'melee' | 'ranged',
	dice: string,
	type: string,
	props: string[],
	mastery: string,
	weight: number,
	cost: number,
	extra: Partial<WeaponDef> = {}
): WeaponDef => ({ name, cat, kind, dice, type, props, mastery, weight, cost, ...extra });

export const WEAPONS: Record<string, WeaponDef> = {
	unarmed: w('Unarmed Strike', 'simple', 'melee', '1', 'Bludgeoning', [], '', 0, 0),
	club: w('Club', 'simple', 'melee', '1d4', 'Bludgeoning', ['Light'], 'Slow', 2, 0.1),
	dagger: w(
		'Dagger',
		'simple',
		'melee',
		'1d4',
		'Piercing',
		['Finesse', 'Light', 'Thrown'],
		'Nick',
		1,
		2,
		{ range: '20/60' }
	),
	greatclub: w(
		'Greatclub',
		'simple',
		'melee',
		'1d8',
		'Bludgeoning',
		['Two-Handed'],
		'Push',
		10,
		0.2
	),
	handaxe: w('Handaxe', 'simple', 'melee', '1d6', 'Slashing', ['Light', 'Thrown'], 'Vex', 2, 5, {
		range: '20/60'
	}),
	javelin: w('Javelin', 'simple', 'melee', '1d6', 'Piercing', ['Thrown'], 'Slow', 2, 0.5, {
		range: '30/120'
	}),
	lighthammer: w(
		'Light Hammer',
		'simple',
		'melee',
		'1d4',
		'Bludgeoning',
		['Light', 'Thrown'],
		'Nick',
		2,
		2,
		{ range: '20/60' }
	),
	mace: w('Mace', 'simple', 'melee', '1d6', 'Bludgeoning', [], 'Sap', 4, 5),
	quarterstaff: w(
		'Quarterstaff',
		'simple',
		'melee',
		'1d6',
		'Bludgeoning',
		['Versatile'],
		'Topple',
		4,
		0.2,
		{ versatile: '1d8' }
	),
	sickle: w('Sickle', 'simple', 'melee', '1d4', 'Slashing', ['Light'], 'Nick', 2, 1),
	spear: w('Spear', 'simple', 'melee', '1d6', 'Piercing', ['Thrown', 'Versatile'], 'Sap', 3, 1, {
		range: '20/60',
		versatile: '1d8'
	}),
	dart: w('Dart', 'simple', 'ranged', '1d4', 'Piercing', ['Finesse', 'Thrown'], 'Vex', 0.25, 0.05, {
		range: '20/60'
	}),
	lightcrossbow: w(
		'Light Crossbow',
		'simple',
		'ranged',
		'1d8',
		'Piercing',
		['Ammunition', 'Loading', 'Two-Handed'],
		'Slow',
		5,
		25,
		{ range: '80/320' }
	),
	shortbow: w(
		'Shortbow',
		'simple',
		'ranged',
		'1d6',
		'Piercing',
		['Ammunition', 'Two-Handed'],
		'Vex',
		2,
		25,
		{ range: '80/320' }
	),
	sling: w('Sling', 'simple', 'ranged', '1d4', 'Bludgeoning', ['Ammunition'], 'Slow', 0, 0.1, {
		range: '30/120'
	}),
	battleaxe: w('Battleaxe', 'martial', 'melee', '1d8', 'Slashing', ['Versatile'], 'Topple', 4, 10, {
		versatile: '1d10'
	}),
	flail: w('Flail', 'martial', 'melee', '1d8', 'Bludgeoning', [], 'Sap', 2, 10),
	glaive: w(
		'Glaive',
		'martial',
		'melee',
		'1d10',
		'Slashing',
		['Heavy', 'Reach', 'Two-Handed'],
		'Graze',
		6,
		20
	),
	greataxe: w(
		'Greataxe',
		'martial',
		'melee',
		'1d12',
		'Slashing',
		['Heavy', 'Two-Handed'],
		'Cleave',
		7,
		30
	),
	greatsword: w(
		'Greatsword',
		'martial',
		'melee',
		'2d6',
		'Slashing',
		['Heavy', 'Two-Handed'],
		'Graze',
		6,
		50
	),
	halberd: w(
		'Halberd',
		'martial',
		'melee',
		'1d10',
		'Slashing',
		['Heavy', 'Reach', 'Two-Handed'],
		'Cleave',
		6,
		20
	),
	lance: w(
		'Lance',
		'martial',
		'melee',
		'1d10',
		'Piercing',
		['Heavy', 'Reach', 'Two-Handed (unless mounted)'],
		'Topple',
		6,
		10
	),
	longsword: w('Longsword', 'martial', 'melee', '1d8', 'Slashing', ['Versatile'], 'Sap', 3, 15, {
		versatile: '1d10'
	}),
	maul: w(
		'Maul',
		'martial',
		'melee',
		'2d6',
		'Bludgeoning',
		['Heavy', 'Two-Handed'],
		'Topple',
		10,
		10
	),
	morningstar: w('Morningstar', 'martial', 'melee', '1d8', 'Piercing', [], 'Sap', 4, 15),
	pike: w(
		'Pike',
		'martial',
		'melee',
		'1d10',
		'Piercing',
		['Heavy', 'Reach', 'Two-Handed'],
		'Push',
		18,
		5
	),
	rapier: w('Rapier', 'martial', 'melee', '1d8', 'Piercing', ['Finesse'], 'Vex', 2, 25),
	scimitar: w(
		'Scimitar',
		'martial',
		'melee',
		'1d6',
		'Slashing',
		['Finesse', 'Light'],
		'Nick',
		3,
		25
	),
	shortsword: w(
		'Shortsword',
		'martial',
		'melee',
		'1d6',
		'Piercing',
		['Finesse', 'Light'],
		'Vex',
		2,
		10
	),
	trident: w(
		'Trident',
		'martial',
		'melee',
		'1d8',
		'Piercing',
		['Thrown', 'Versatile'],
		'Topple',
		4,
		5,
		{ range: '20/60', versatile: '1d10' }
	),
	warhammer: w(
		'Warhammer',
		'martial',
		'melee',
		'1d8',
		'Bludgeoning',
		['Versatile'],
		'Push',
		5,
		15,
		{ versatile: '1d10' }
	),
	warpick: w('War Pick', 'martial', 'melee', '1d8', 'Piercing', ['Versatile'], 'Sap', 2, 5, {
		versatile: '1d10'
	}),
	whip: w('Whip', 'martial', 'melee', '1d4', 'Slashing', ['Finesse', 'Reach'], 'Slow', 3, 2),
	blowgun: w(
		'Blowgun',
		'martial',
		'ranged',
		'1',
		'Piercing',
		['Ammunition', 'Loading'],
		'Vex',
		1,
		10,
		{ range: '25/100' }
	),
	handcrossbow: w(
		'Hand Crossbow',
		'martial',
		'ranged',
		'1d6',
		'Piercing',
		['Ammunition', 'Light', 'Loading'],
		'Vex',
		3,
		75,
		{ range: '30/120' }
	),
	heavycrossbow: w(
		'Heavy Crossbow',
		'martial',
		'ranged',
		'1d10',
		'Piercing',
		['Ammunition', 'Heavy', 'Loading', 'Two-Handed'],
		'Push',
		18,
		50,
		{ range: '100/400' }
	),
	longbow: w(
		'Longbow',
		'martial',
		'ranged',
		'1d8',
		'Piercing',
		['Ammunition', 'Heavy', 'Two-Handed'],
		'Slow',
		2,
		50,
		{ range: '150/600' }
	),
	musket: w(
		'Musket',
		'martial',
		'ranged',
		'1d12',
		'Piercing',
		['Ammunition', 'Loading', 'Two-Handed'],
		'Slow',
		10,
		500,
		{ range: '40/120' }
	),
	pistol: w(
		'Pistol',
		'martial',
		'ranged',
		'1d10',
		'Piercing',
		['Ammunition', 'Loading'],
		'Vex',
		3,
		250,
		{ range: '30/90' }
	)
};

export const ARMOR: Record<string, ArmorDef> = {
	padded: {
		name: 'Padded Armor',
		type: 'light',
		base: 11,
		dexCap: null,
		stealthDis: true,
		weight: 8,
		cost: 5
	},
	leather: { name: 'Leather Armor', type: 'light', base: 11, dexCap: null, weight: 10, cost: 10 },
	studded: {
		name: 'Studded Leather Armor',
		type: 'light',
		base: 12,
		dexCap: null,
		weight: 13,
		cost: 45
	},
	hide: { name: 'Hide Armor', type: 'medium', base: 12, dexCap: 2, weight: 12, cost: 10 },
	chainshirt: { name: 'Chain Shirt', type: 'medium', base: 13, dexCap: 2, weight: 20, cost: 50 },
	scale: {
		name: 'Scale Mail',
		type: 'medium',
		base: 14,
		dexCap: 2,
		stealthDis: true,
		weight: 45,
		cost: 50
	},
	breastplate: { name: 'Breastplate', type: 'medium', base: 14, dexCap: 2, weight: 20, cost: 400 },
	halfplate: {
		name: 'Half Plate Armor',
		type: 'medium',
		base: 15,
		dexCap: 2,
		stealthDis: true,
		weight: 40,
		cost: 750
	},
	ringmail: {
		name: 'Ring Mail',
		type: 'heavy',
		base: 14,
		dexCap: 0,
		stealthDis: true,
		weight: 40,
		cost: 30
	},
	chainmail: {
		name: 'Chain Mail',
		type: 'heavy',
		base: 16,
		dexCap: 0,
		str: 13,
		stealthDis: true,
		weight: 55,
		cost: 75
	},
	splint: {
		name: 'Splint Armor',
		type: 'heavy',
		base: 17,
		dexCap: 0,
		str: 15,
		stealthDis: true,
		weight: 60,
		cost: 200
	},
	plate: {
		name: 'Plate Armor',
		type: 'heavy',
		base: 18,
		dexCap: 0,
		str: 15,
		stealthDis: true,
		weight: 65,
		cost: 1500
	}
};

export const FULL_SLOTS: number[][] = [
	[2],
	[3],
	[4, 2],
	[4, 3],
	[4, 3, 2],
	[4, 3, 3],
	[4, 3, 3, 1],
	[4, 3, 3, 2],
	[4, 3, 3, 3, 1],
	[4, 3, 3, 3, 2],
	[4, 3, 3, 3, 2, 1],
	[4, 3, 3, 3, 2, 1],
	[4, 3, 3, 3, 2, 1, 1],
	[4, 3, 3, 3, 2, 1, 1],
	[4, 3, 3, 3, 2, 1, 1, 1],
	[4, 3, 3, 3, 2, 1, 1, 1],
	[4, 3, 3, 3, 2, 1, 1, 1, 1],
	[4, 3, 3, 3, 3, 1, 1, 1, 1],
	[4, 3, 3, 3, 3, 2, 1, 1, 1],
	[4, 3, 3, 3, 3, 2, 2, 1, 1]
];

export const ALIGNMENTS = [
	'Lawful Good',
	'Neutral Good',
	'Chaotic Good',
	'Lawful Neutral',
	'Neutral',
	'Chaotic Neutral',
	'Lawful Evil',
	'Neutral Evil',
	'Chaotic Evil',
	'Unaligned'
];

export const ACTION_LABELS: Record<string, string> = {
	action: 'Action',
	bonus: 'Bonus Action',
	reaction: 'Reaction',
	special: 'Special',
	passive: 'Passive'
};
