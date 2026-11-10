// Classes and their SRD subclasses (D&D 2024 rules, SRD 5.2, CC BY 4.0).
// Descriptions are short summaries written for this app, not the full rules text.
import type { ClassDef, Feature } from '../types';

export const by = <T>(l: number, t: [number, T][]): T => {
	let v = t[0][1];
	for (const [k, x] of t) if (l >= k) v = x;
	return v;
};
const ASI = (l: number): Feature => ({
	l,
	n: 'Ability Score Improvement',
	a: 'passive',
	pick: 'general',
	d: 'Take the Ability Score Improvement feat (+2 to one score or +1 to two, max 20) or another feat you qualify for.'
});
const BOON: Feature = {
	l: 19,
	n: 'Epic Boon',
	a: 'passive',
	pick: 'epic',
	d: 'Gain an Epic Boon feat or another feat of your choice for which you qualify.'
};
const SUB = (l: number, cls: string): Feature => ({
	l,
	n: cls + ' Subclass feature',
	a: 'passive',
	subslot: true,
	d: 'You gain a feature from your subclass.'
});
const PREP_FULL = [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22];
const PREP_HALF = [2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15];

export const CLASSES: Record<string, ClassDef> = {
	barbarian: {
		name: 'Barbarian',
		hd: 12,
		saves: ['str', 'con'],
		armor: ['light', 'medium', 'shields'],
		weapons: 'Simple and Martial weapons',
		tools: '',
		skills: {
			n: 2,
			list: ['animal', 'athletics', 'intimidation', 'nature', 'perception', 'survival']
		},
		unarmored: 'con',
		subLevels: [3, 6, 10, 14],
		features: [
			{
				l: 1,
				n: 'Rage',
				a: 'bonus',
				r: 'long',
				u: (c) =>
					by(c.l, [
						[1, 2],
						[3, 3],
						[6, 4],
						[12, 5],
						[17, 6]
					]),
				d: (c) =>
					`Bonus Action, no heavy armor. For 10 min: resistance to bludgeoning, piercing and slashing; +${by(
						c.l,
						[
							[1, 2],
							[9, 3],
							[16, 4]
						]
					)} damage on Strength weapon/unarmed attacks; advantage on Strength checks and saves; no spells or Concentration. Keep it going each turn by attacking, forcing a save, or a Bonus Action. Regain one use on a Short Rest, all on a Long Rest.`
			},
			{
				l: 1,
				n: 'Unarmored Defense',
				a: 'passive',
				d: 'Without armor, AC = 10 + Dex mod + Con mod. A Shield still applies.'
			},
			{
				l: 1,
				n: 'Weapon Mastery',
				a: 'passive',
				d: (c) =>
					`Use the mastery property of ${by(c.l, [
						[1, 2],
						[4, 3],
						[10, 4]
					])} kinds of Simple or Martial melee weapons. Change one choice on a Long Rest.`
			},
			{
				l: 2,
				n: 'Danger Sense',
				a: 'passive',
				d: 'Advantage on Dexterity saving throws unless you have the Incapacitated condition.'
			},
			{
				l: 2,
				n: 'Reckless Attack',
				a: 'special',
				d: 'When you make your first attack roll on your turn, you can attack recklessly: advantage on Strength attack rolls until your next turn, but attack rolls against you have advantage too.'
			},
			{
				l: 3,
				n: 'Primal Knowledge',
				a: 'passive',
				d: 'Gain one more Barbarian skill proficiency. While raging, you can make Acrobatics, Intimidation, Perception, Stealth and Survival checks as Strength checks.'
			},
			SUB(3, 'Barbarian'),
			ASI(4),
			{ l: 5, n: 'Extra Attack', a: 'action', d: 'Attack twice when you take the Attack action.' },
			{ l: 5, n: 'Fast Movement', a: 'passive', d: '+10 ft speed while not wearing Heavy armor.' },
			SUB(6, 'Barbarian'),
			{ l: 7, n: 'Feral Instinct', a: 'passive', d: 'Advantage on Initiative rolls.' },
			{
				l: 7,
				n: 'Instinctive Pounce',
				a: 'special',
				d: 'When you enter a Rage, you can move up to half your Speed as part of that Bonus Action.'
			},
			ASI(8),
			{
				l: 9,
				n: 'Brutal Strike',
				a: 'special',
				d: (c) =>
					`When you use Reckless Attack you can give up advantage on one Strength attack; on a hit it deals +${c.l >= 17 ? '2d10' : '1d10'} damage and a Brutal Strike effect. Forceful Blow: push 15 ft (you may follow half speed). Hamstring Blow: target Speed −15 ft until your next turn.`
			},
			SUB(10, 'Barbarian'),
			{
				l: 11,
				n: 'Relentless Rage',
				a: 'special',
				d: (c) =>
					`If you drop to 0 HP while raging, make a DC 10 Con save (DC +5 each time, resets on a rest). On a success your HP becomes ${c.l * 2}.`
			},
			ASI(12),
			{
				l: 13,
				n: 'Improved Brutal Strike',
				a: 'passive',
				d: "New Brutal Strike effects. Staggering Blow: target has disadvantage on its next save and can't make Opportunity Attacks until your next turn. Sundering Blow: the next attack by another creature against it gets +5."
			},
			SUB(14, 'Barbarian'),
			{
				l: 15,
				n: 'Persistent Rage',
				a: 'special',
				r: 'long',
				u: () => 1,
				d: 'When you roll Initiative you can regain all Rage uses (once per Long Rest). Your Rage now lasts 10 min without needing to be extended.'
			},
			ASI(16),
			{
				l: 17,
				n: 'Improved Brutal Strike',
				a: 'passive',
				d: 'Brutal Strike damage becomes 2d10, and you can apply two different effects.'
			},
			{
				l: 18,
				n: 'Indomitable Might',
				a: 'passive',
				d: 'If a Strength check or save totals less than your Strength score, use the score instead.'
			},
			BOON,
			{
				l: 20,
				n: 'Primal Champion',
				a: 'passive',
				d: 'Strength and Constitution +4, to a maximum of 25.'
			}
		],
		sub: {
			name: 'Path of the Berserker',
			features: [
				{
					l: 3,
					n: 'Frenzy',
					a: 'special',
					d: (c) =>
						`While raging with Reckless Attack, the first target you hit each turn with a Strength attack takes ${by(
							c.l,
							[
								[1, 2],
								[9, 3],
								[16, 4]
							]
						)}d6 extra damage (d6 count = your Rage damage bonus).`
				},
				{
					l: 6,
					n: 'Mindless Rage',
					a: 'passive',
					d: 'Immune to Charmed and Frightened while raging. Entering a Rage ends those conditions on you.'
				},
				{
					l: 10,
					n: 'Retaliation',
					a: 'reaction',
					d: 'When a creature within 5 ft damages you, make one melee attack against it with a weapon or Unarmed Strike.'
				},
				{
					l: 14,
					n: 'Intimidating Presence',
					a: 'bonus',
					r: 'long',
					u: () => 1,
					d: (c) =>
						`Each creature of your choice in a 30-ft Emanation makes a Wis save (DC ${8 + c.m('str') + c.pb}) or is Frightened for 1 min (repeat save each turn). Once per Long Rest, or spend a Rage use to do it again.`
				}
			]
		}
	},

	bard: {
		name: 'Bard',
		hd: 8,
		saves: ['dex', 'cha'],
		armor: ['light'],
		weapons: 'Simple weapons',
		tools: 'Three musical instruments',
		skills: { n: 3, list: 'any' },
		caster: 'full',
		castAbil: 'cha',
		cantrips: [
			[1, 2],
			[4, 3],
			[10, 4]
		],
		prepared: PREP_FULL,
		subLevels: [3, 6, 14],
		features: [
			{
				l: 1,
				n: 'Bardic Inspiration',
				a: 'bonus',
				r: 'long',
				u: (c) => Math.max(1, c.m('cha')),
				d: (c) =>
					`Bonus Action: give a creature within 60 ft a d${by(c.l, [
						[1, 6],
						[5, 8],
						[10, 10],
						[15, 12]
					])}. Within 1 hour, when it fails a D20 Test, it can roll the die and add it, possibly turning the failure into a success.`
			},
			{
				l: 1,
				n: 'Spellcasting',
				a: 'passive',
				d: 'Cast Bard spells using Charisma. Use a Musical Instrument as your focus. Change one cantrip or prepared spell when you gain a level.'
			},
			{
				l: 2,
				n: 'Expertise',
				a: 'passive',
				d: 'Gain Expertise in two skills you are proficient in.'
			},
			{
				l: 2,
				n: 'Jack of All Trades',
				a: 'passive',
				d: "Add half your Proficiency Bonus (rounded down) to ability checks that don't already use it."
			},
			SUB(3, 'Bard'),
			ASI(4),
			{
				l: 5,
				n: 'Font of Inspiration',
				a: 'passive',
				d: 'Bardic Inspiration also recovers on a Short Rest. You can spend a spell slot to regain one use.'
			},
			SUB(6, 'Bard'),
			{
				l: 7,
				n: 'Countercharm',
				a: 'reaction',
				d: 'When a creature within 30 ft fails a save against Charmed or Frightened, it rerolls the save with advantage.'
			},
			ASI(8),
			{
				l: 9,
				n: 'Expertise',
				a: 'passive',
				d: 'Gain Expertise in two more skills you are proficient in.'
			},
			{
				l: 10,
				n: 'Magical Secrets',
				a: 'passive',
				d: 'Your prepared spells can come from the Bard, Cleric, Druid and Wizard lists.'
			},
			ASI(12),
			SUB(14, 'Bard'),
			ASI(16),
			{
				l: 18,
				n: 'Superior Inspiration',
				a: 'passive',
				d: 'When you roll Initiative and have fewer than two Bardic Inspiration uses, you regain up to two.'
			},
			BOON,
			{
				l: 20,
				n: 'Words of Creation',
				a: 'passive',
				d: 'Power Word Heal and Power Word Kill are always prepared. Each can target a second creature within 10 ft of the first.'
			}
		],
		sub: {
			name: 'College of Lore',
			features: [
				{
					l: 3,
					n: 'Bonus Proficiencies',
					a: 'passive',
					d: 'Gain proficiency with three skills of your choice.'
				},
				{
					l: 3,
					n: 'Cutting Words',
					a: 'reaction',
					d: 'When a creature within 60 ft hits with a damage roll or succeeds on an ability check or attack roll, spend a Bardic Inspiration and subtract the die from the roll.'
				},
				{
					l: 6,
					n: 'Magical Discoveries',
					a: 'passive',
					d: 'Learn two spells from the Cleric, Druid or Wizard lists. They are always prepared and count as Bard spells.'
				},
				{
					l: 14,
					n: 'Peerless Skill',
					a: 'special',
					d: "When you fail an ability check or attack roll, spend a Bardic Inspiration and add the die. If you still fail, the use isn't spent."
				}
			]
		}
	},

	cleric: {
		name: 'Cleric',
		hd: 8,
		saves: ['wis', 'cha'],
		armor: ['light', 'medium', 'shields'],
		weapons: 'Simple weapons',
		tools: '',
		skills: { n: 2, list: ['history', 'insight', 'medicine', 'persuasion', 'religion'] },
		caster: 'full',
		castAbil: 'wis',
		cantrips: [
			[1, 3],
			[4, 4],
			[10, 5]
		],
		prepared: PREP_FULL,
		subLevels: [3, 6, 17],
		features: [
			{
				l: 1,
				n: 'Spellcasting',
				a: 'passive',
				d: 'Cast Cleric spells using Wisdom. Use a Holy Symbol as your focus. Change your prepared spells on a Long Rest.'
			},
			{
				l: 1,
				n: 'Divine Order',
				a: 'passive',
				d: 'Choose one. Protector: training with Martial weapons and Heavy armor. Thaumaturge: one extra cantrip, and add your Wis mod (min +1) to Arcana and Religion checks.'
			},
			{
				l: 2,
				n: 'Channel Divinity',
				a: 'action',
				r: 'short1',
				u: (c) =>
					by(c.l, [
						[2, 2],
						[6, 3],
						[18, 4]
					]),
				d: (c) =>
					`Regain one use on a Short Rest, all on a Long Rest. Divine Spark (Magic action): a creature within 30 ft regains ${by(
						c.l,
						[
							[1, 1],
							[7, 2],
							[13, 3],
							[18, 4]
						]
					)}d8 + Wis HP, or takes that much Necrotic or Radiant damage (Con save for half). Turn Undead (Magic action): Undead within 30 ft make a Wis save or are Frightened and Incapacitated for 1 min.`
			},
			SUB(3, 'Cleric'),
			ASI(4),
			{
				l: 5,
				n: 'Sear Undead',
				a: 'passive',
				d: (c) =>
					`When you Turn Undead, each Undead that fails takes ${Math.max(1, c.m('wis'))}d8 Radiant damage (doesn't end the turn effect).`
			},
			SUB(6, 'Cleric'),
			{
				l: 7,
				n: 'Blessed Strikes',
				a: 'passive',
				d: (c) =>
					`Choose one. Divine Strike: once per turn on a weapon hit, +${c.l >= 14 ? '2d8' : '1d8'} Necrotic or Radiant. Potent Spellcasting: add your Wis mod to Cleric cantrip damage.`
			},
			ASI(8),
			{
				l: 10,
				n: 'Divine Intervention',
				a: 'action',
				r: 'long',
				u: () => 1,
				d: 'Magic action: cast any Cleric spell of level 5 or lower that takes an action, without a slot or Material components.'
			},
			ASI(12),
			{
				l: 14,
				n: 'Improved Blessed Strikes',
				a: 'passive',
				d: (c) =>
					`Divine Strike becomes 2d8. Potent Spellcasting: when a cantrip deals damage, you or a creature within 60 ft gains ${2 * Math.max(1, c.m('wis'))} Temporary HP.`
			},
			ASI(16),
			BOON,
			{
				l: 20,
				n: 'Greater Divine Intervention',
				a: 'action',
				d: "Divine Intervention can cast Wish. If you do, you can't use Divine Intervention again until you finish 2d4 Long Rests."
			}
		],
		sub: {
			name: 'Life Domain',
			features: [
				{
					l: 3,
					n: 'Disciple of Life',
					a: 'passive',
					d: 'When a spell slot spell restores HP, the target regains extra HP = 2 + the slot level.'
				},
				{
					l: 3,
					n: 'Life Domain Spells',
					a: 'passive',
					d: 'Always prepared. 3: Aid, Bless, Cure Wounds, Lesser Restoration. 5: Mass Healing Word, Revivify. 7: Aura of Life, Death Ward. 9: Greater Restoration, Mass Cure Wounds.'
				},
				{
					l: 3,
					n: 'Preserve Life',
					a: 'action',
					d: (c) =>
						`Channel Divinity (Magic action): restore ${5 * c.l} HP split among Bloodied creatures within 30 ft, no one above half its HP max.`
				},
				{
					l: 6,
					n: 'Blessed Healer',
					a: 'passive',
					d: 'When you heal another creature with a spell slot, you regain HP = 2 + the slot level.'
				},
				{
					l: 17,
					n: 'Supreme Healing',
					a: 'passive',
					d: 'When you roll dice to restore HP with a spell or Channel Divinity, use the maximum for each die.'
				}
			]
		}
	},

	druid: {
		name: 'Druid',
		hd: 8,
		saves: ['int', 'wis'],
		armor: ['light', 'shields'],
		weapons: 'Simple weapons',
		tools: 'Herbalism Kit',
		skills: {
			n: 2,
			list: [
				'arcana',
				'animal',
				'insight',
				'medicine',
				'nature',
				'perception',
				'religion',
				'survival'
			]
		},
		caster: 'full',
		castAbil: 'wis',
		cantrips: [
			[1, 2],
			[4, 3],
			[10, 4]
		],
		prepared: PREP_FULL,
		subLevels: [3, 6, 10, 14],
		features: [
			{
				l: 1,
				n: 'Spellcasting',
				a: 'passive',
				d: 'Cast Druid spells using Wisdom. Use a Druidic Focus. Change your prepared spells on a Long Rest.'
			},
			{
				l: 1,
				n: 'Druidic',
				a: 'passive',
				d: 'You know Druidic, the secret language of druids. Speak with Animals is always prepared.'
			},
			{
				l: 1,
				n: 'Primal Order',
				a: 'passive',
				d: 'Choose one. Magician: one extra cantrip, add Wis mod (min +1) to Arcana and Nature checks. Warden: training with Martial weapons and Medium armor.'
			},
			{
				l: 2,
				n: 'Wild Shape',
				a: 'bonus',
				r: 'short1',
				u: (c) =>
					by(c.l, [
						[2, 2],
						[6, 3],
						[17, 4]
					]),
				d: (c) =>
					`Bonus Action: turn into a known Beast form for ${Math.floor(c.l / 2)} hours. Known forms: ${by(
						c.l,
						[
							[2, 4],
							[4, 6],
							[8, 8]
						]
					)}; max CR ${by(c.l, [
						[2, '1/4, no fly'],
						[4, '1/2, no fly'],
						[8, '1']
					])}. You gain ${c.l} Temporary HP. Regain one use on a Short Rest, all on a Long Rest.`
			},
			{
				l: 2,
				n: 'Wild Companion',
				a: 'action',
				d: 'Magic action: spend a spell slot or a Wild Shape use to cast Find Familiar without Material components. The familiar is a Fey and lasts until your next Long Rest.'
			},
			SUB(3, 'Druid'),
			ASI(4),
			{
				l: 5,
				n: 'Wild Resurgence',
				a: 'special',
				d: 'Once per turn, if you have no Wild Shape uses, spend a spell slot to regain one. Once per Long Rest, spend a Wild Shape use to gain a level 1 spell slot.'
			},
			SUB(6, 'Druid'),
			{
				l: 7,
				n: 'Elemental Fury',
				a: 'passive',
				d: (c) =>
					`Choose one. Potent Spellcasting: add Wis mod to Druid cantrip damage. Primal Strike: once per turn on a weapon or Beast-form hit, +${c.l >= 15 ? '2d8' : '1d8'} Cold, Fire, Lightning or Thunder.`
			},
			ASI(8),
			SUB(10, 'Druid'),
			ASI(12),
			SUB(14, 'Druid'),
			{
				l: 15,
				n: 'Improved Elemental Fury',
				a: 'passive',
				d: 'Potent Spellcasting: cantrips with 10+ ft range gain +300 ft range. Primal Strike becomes 2d8.'
			},
			ASI(16),
			{
				l: 18,
				n: 'Beast Spells',
				a: 'passive',
				d: 'You can cast spells in Wild Shape, except ones with a costly or consumed Material component.'
			},
			BOON,
			{
				l: 20,
				n: 'Archdruid',
				a: 'passive',
				d: 'Evergreen Wild Shape: on Initiative, regain a Wild Shape use if you have none. Nature Magician: once per Long Rest, turn Wild Shape uses into a spell slot (2 slot levels per use). You age only 1 year per 10.'
			}
		],
		sub: {
			name: 'Circle of the Land',
			features: [
				{
					l: 3,
					n: 'Circle of the Land Spells',
					a: 'passive',
					d: 'Choose a land on each Long Rest; its spells are always prepared. Arid: Blur, Burning Hands, Fire Bolt; 5 Fireball; 7 Blight; 9 Wall of Stone. Polar: Fog Cloud, Hold Person, Ray of Frost; Sleet Storm; Ice Storm; Cone of Cold. Temperate: Misty Step, Shocking Grasp, Sleep; Lightning Bolt; Freedom of Movement; Tree Stride. Tropical: Acid Splash, Ray of Sickness, Web; Stinking Cloud; Polymorph; Insect Plague.'
				},
				{
					l: 3,
					n: "Land's Aid",
					a: 'action',
					d: (c) =>
						`Magic action, spend a Wild Shape use: 10-ft-radius sphere within 60 ft. Creatures of your choice make a Con save, taking ${by(
							c.l,
							[
								[3, 2],
								[10, 3],
								[14, 4]
							]
						)}d6 Necrotic (half on success). One creature in it regains ${by(c.l, [
							[3, 2],
							[10, 3],
							[14, 4]
						])}d6 HP.`
				},
				{
					l: 6,
					n: 'Natural Recovery',
					a: 'special',
					r: 'long',
					u: () => 1,
					d: (c) =>
						`Once per Long Rest, cast a prepared Circle spell without a slot. Also once per Long Rest, on a Short Rest recover spell slots totalling up to ${Math.ceil(c.l / 2)} levels (none level 6+).`
				},
				{
					l: 10,
					n: "Nature's Ward",
					a: 'passive',
					d: 'Immune to Poisoned. Resistance by current land: Arid Fire, Polar Cold, Temperate Lightning, Tropical Poison.'
				},
				{
					l: 14,
					n: "Nature's Sanctuary",
					a: 'action',
					d: "Magic action, spend a Wild Shape use: 15-ft Cube of spectral trees within 120 ft for 1 min. You and allies in it have Half Cover and your Nature's Ward resistance. Bonus Action: move it 60 ft."
				}
			]
		}
	},

	fighter: {
		name: 'Fighter',
		hd: 10,
		saves: ['str', 'con'],
		armor: ['light', 'medium', 'heavy', 'shields'],
		weapons: 'Simple and Martial weapons',
		tools: '',
		skills: {
			n: 2,
			list: [
				'acrobatics',
				'animal',
				'athletics',
				'history',
				'insight',
				'intimidation',
				'persuasion',
				'perception',
				'survival'
			]
		},
		subLevels: [3, 7, 10, 15, 18],
		features: [
			{
				l: 1,
				n: 'Fighting Style',
				a: 'passive',
				pick: 'style',
				d: 'Gain a Fighting Style feat. You can swap it when you gain a Fighter level.'
			},
			{
				l: 1,
				n: 'Second Wind',
				a: 'bonus',
				r: 'short1',
				u: (c) =>
					by(c.l, [
						[1, 2],
						[4, 3],
						[10, 4]
					]),
				d: (c) =>
					`Bonus Action: regain 1d10 + ${c.l} HP. Regain one use on a Short Rest, all on a Long Rest.`
			},
			{
				l: 1,
				n: 'Weapon Mastery',
				a: 'passive',
				d: (c) =>
					`Use the mastery property of ${by(c.l, [
						[1, 3],
						[4, 4],
						[10, 5],
						[16, 6]
					])} kinds of Simple or Martial weapons. Change one choice on a Long Rest.`
			},
			{
				l: 2,
				n: 'Action Surge',
				a: 'special',
				r: 'short',
				u: (c) => (c.l >= 17 ? 2 : 1),
				d: 'Take one extra action (not Magic). Only once per turn.'
			},
			{
				l: 2,
				n: 'Tactical Mind',
				a: 'special',
				d: "When you fail an ability check, spend a Second Wind use to add 1d10. If you still fail, the use isn't spent."
			},
			SUB(3, 'Fighter'),
			ASI(4),
			{ l: 5, n: 'Extra Attack', a: 'action', d: 'Attack twice when you take the Attack action.' },
			{
				l: 5,
				n: 'Tactical Shift',
				a: 'passive',
				d: 'When you use Second Wind, move up to half your Speed without provoking Opportunity Attacks.'
			},
			ASI(6),
			SUB(7, 'Fighter'),
			ASI(8),
			{
				l: 9,
				n: 'Indomitable',
				a: 'special',
				r: 'long',
				u: (c) =>
					by(c.l, [
						[9, 1],
						[13, 2],
						[17, 3]
					]),
				d: (c) => `Reroll a failed saving throw with a bonus of +${c.l}. You must use the new roll.`
			},
			{
				l: 9,
				n: 'Tactical Master',
				a: 'passive',
				d: 'When you attack with a weapon whose mastery you use, you can swap its property for Push, Sap or Slow for that attack.'
			},
			SUB(10, 'Fighter'),
			{
				l: 11,
				n: 'Two Extra Attacks',
				a: 'action',
				d: 'Attack three times when you take the Attack action.'
			},
			ASI(12),
			{
				l: 13,
				n: 'Studied Attacks',
				a: 'passive',
				d: 'When you miss a creature, you have advantage on your next attack against it before the end of your next turn.'
			},
			ASI(14),
			SUB(15, 'Fighter'),
			ASI(16),
			SUB(18, 'Fighter'),
			BOON,
			{
				l: 20,
				n: 'Three Extra Attacks',
				a: 'action',
				d: 'Attack four times when you take the Attack action.'
			}
		],
		sub: {
			name: 'Champion',
			features: [
				{
					l: 3,
					n: 'Improved Critical',
					a: 'passive',
					d: 'Your weapon and Unarmed Strike attacks score a Critical Hit on a 19 or 20.'
				},
				{
					l: 3,
					n: 'Remarkable Athlete',
					a: 'passive',
					d: 'Advantage on Initiative and Athletics checks. After a Critical Hit, move up to half your Speed without provoking Opportunity Attacks.'
				},
				{
					l: 7,
					n: 'Additional Fighting Style',
					a: 'passive',
					pick: 'style',
					d: 'Gain another Fighting Style feat.'
				},
				{
					l: 10,
					n: 'Heroic Warrior',
					a: 'passive',
					d: "In combat, at the start of your turn you gain Heroic Inspiration if you don't have it."
				},
				{ l: 15, n: 'Superior Critical', a: 'passive', d: 'Critical Hit range becomes 18–20.' },
				{
					l: 18,
					n: 'Survivor',
					a: 'passive',
					d: (c) =>
						`Defy Death: advantage on Death Saves; 18–20 counts as a 20. Heroic Rally: at the start of your turn, if Bloodied with at least 1 HP, regain ${5 + c.m('con')} HP.`
				}
			]
		}
	},

	monk: {
		name: 'Monk',
		hd: 8,
		saves: ['str', 'dex'],
		armor: [],
		weapons: 'Simple weapons and Martial weapons with the Light property',
		tools: "One Artisan's Tool or Musical Instrument",
		skills: {
			n: 2,
			list: ['acrobatics', 'athletics', 'history', 'insight', 'religion', 'stealth']
		},
		unarmored: 'wis',
		subLevels: [3, 6, 11, 17],
		features: [
			{
				l: 1,
				n: 'Martial Arts',
				a: 'bonus',
				d: (c) =>
					`Without armor or shield, with Unarmed Strikes and Monk weapons: make an Unarmed Strike as a Bonus Action; use Dex instead of Str; damage die d${by(
						c.l,
						[
							[1, 6],
							[5, 8],
							[11, 10],
							[17, 12]
						]
					)}. You can Grapple or Shove with Dex.`
			},
			{
				l: 1,
				n: 'Unarmored Defense',
				a: 'passive',
				d: 'Without armor or shield, AC = 10 + Dex mod + Wis mod.'
			},
			{
				l: 2,
				n: "Monk's Focus",
				a: 'bonus',
				r: 'short',
				u: (c) => c.l,
				d: (c) =>
					`Focus Points, regained on a Short or Long Rest. Flurry of Blows (1 FP): ${c.l >= 10 ? 'three' : 'two'} Unarmed Strikes as a Bonus Action. Patient Defense: Disengage as a Bonus Action, or 1 FP for Disengage + Dodge. Step of the Wind: Dash as a Bonus Action, or 1 FP for Disengage + Dash and double jump distance. Save DC ${8 + c.m('wis') + c.pb}.`
			},
			{
				l: 2,
				n: 'Unarmored Movement',
				a: 'passive',
				d: (c) =>
					`+${by(c.l, [
						[2, 10],
						[6, 15],
						[10, 20],
						[14, 25],
						[18, 30]
					])} ft Speed without armor or shield.`
			},
			{
				l: 2,
				n: 'Uncanny Metabolism',
				a: 'special',
				r: 'long',
				u: () => 1,
				d: (c) =>
					`When you roll Initiative, regain all Focus Points and heal 1d${by(c.l, [
						[1, 6],
						[5, 8],
						[11, 10],
						[17, 12]
					])} + ${c.l} HP.`
			},
			{
				l: 3,
				n: 'Deflect Attacks',
				a: 'reaction',
				d: (c) =>
					`When hit by an attack dealing Bludgeoning, Piercing or Slashing${c.l >= 13 ? ' (any type from level 13)' : ''} damage, reduce it by 1d10 + ${c.m('dex') + c.l}. If reduced to 0, spend 1 FP to redirect: a creature within 5 ft (or 60 ft for ranged) makes a Dex save or takes two Martial Arts dice + Dex mod.`
			},
			SUB(3, 'Monk'),
			ASI(4),
			{ l: 4, n: 'Slow Fall', a: 'reaction', d: (c) => `Reduce falling damage by ${5 * c.l}.` },
			{ l: 5, n: 'Extra Attack', a: 'action', d: 'Attack twice when you take the Attack action.' },
			{
				l: 5,
				n: 'Stunning Strike',
				a: 'special',
				d: (c) =>
					`Once per turn on a Monk weapon or Unarmed Strike hit, spend 1 FP: Con save DC ${8 + c.m('wis') + c.pb} or Stunned until the start of your next turn. On a success its Speed is halved and the next attack against it has advantage.`
			},
			{
				l: 6,
				n: 'Empowered Strikes',
				a: 'passive',
				d: 'Your Unarmed Strikes can deal Force damage.'
			},
			SUB(6, 'Monk'),
			{
				l: 7,
				n: 'Evasion',
				a: 'passive',
				d: 'On a Dex save for half damage, take none on a success and half on a failure (not while Incapacitated).'
			},
			ASI(8),
			{
				l: 9,
				n: 'Acrobatic Movement',
				a: 'passive',
				d: 'Without armor or shield, move along vertical surfaces and across liquids on your turn.'
			},
			{
				l: 10,
				n: 'Heightened Focus',
				a: 'passive',
				d: 'Flurry of Blows makes three strikes. Patient Defense with FP also grants Temp HP equal to two Martial Arts dice. Step of the Wind with FP lets you carry a willing creature.'
			},
			{
				l: 10,
				n: 'Self-Restoration',
				a: 'passive',
				d: "At the end of each turn, end one Charmed, Frightened or Poisoned effect on you. Skipping food and water doesn't give you Exhaustion."
			},
			SUB(11, 'Monk'),
			ASI(12),
			{
				l: 13,
				n: 'Deflect Energy',
				a: 'passive',
				d: 'Deflect Attacks works against any damage type.'
			},
			{
				l: 14,
				n: 'Disciplined Survivor',
				a: 'passive',
				d: 'Proficiency in all saving throws. When you fail a save, spend 1 FP to reroll it.'
			},
			{
				l: 15,
				n: 'Perfect Focus',
				a: 'passive',
				d: "When you roll Initiative with 3 or fewer Focus Points (and don't use Uncanny Metabolism), regain up to 4."
			},
			ASI(16),
			SUB(17, 'Monk'),
			{
				l: 18,
				n: 'Superior Defense',
				a: 'special',
				d: 'Start of your turn, spend 3 FP: Resistance to all damage except Force for 1 min.'
			},
			BOON,
			{ l: 20, n: 'Body and Mind', a: 'passive', d: 'Dexterity and Wisdom +4, to a maximum of 25.' }
		],
		sub: {
			name: 'Warrior of the Open Hand',
			features: [
				{
					l: 3,
					n: 'Open Hand Technique',
					a: 'passive',
					d: 'When you hit with a Flurry of Blows strike, apply one: Addle (no Opportunity Attacks until its next turn), Push (Str save or pushed 15 ft), Topple (Dex save or Prone).'
				},
				{
					l: 6,
					n: 'Wholeness of Body',
					a: 'bonus',
					r: 'long',
					u: (c) => Math.max(1, c.m('wis')),
					d: (c) =>
						`Bonus Action: roll your Martial Arts die and regain that many HP + ${c.m('wis')}.`
				},
				{
					l: 11,
					n: 'Fleet Step',
					a: 'passive',
					d: 'When you take a Bonus Action other than Step of the Wind, you can also use Step of the Wind.'
				},
				{
					l: 17,
					n: 'Quivering Palm',
					a: 'special',
					d: 'On an Unarmed Strike hit, spend 4 FP to set lethal vibrations. Later, as part of an action, end them: Con save or 10d12 Force (half on success).'
				}
			]
		}
	},

	paladin: {
		name: 'Paladin',
		hd: 10,
		saves: ['wis', 'cha'],
		armor: ['light', 'medium', 'heavy', 'shields'],
		weapons: 'Simple and Martial weapons',
		tools: '',
		skills: {
			n: 2,
			list: ['athletics', 'insight', 'intimidation', 'medicine', 'persuasion', 'religion']
		},
		caster: 'half',
		castAbil: 'cha',
		prepared: PREP_HALF,
		subLevels: [3, 7, 15, 20],
		features: [
			{
				l: 1,
				n: 'Lay On Hands',
				a: 'bonus',
				r: 'long',
				u: (c) => 5 * c.l,
				pool: true,
				d: (c) =>
					`Pool of ${5 * c.l} HP. Bonus Action: touch a creature and restore HP from the pool, or spend 5 to remove Poisoned.`
			},
			{
				l: 1,
				n: 'Spellcasting',
				a: 'passive',
				d: 'Cast Paladin spells using Charisma. Use a Holy Symbol as your focus. Change one prepared spell on a Long Rest.'
			},
			{
				l: 1,
				n: 'Weapon Mastery',
				a: 'passive',
				d: 'Use the mastery property of two kinds of weapons. Change one on a Long Rest.'
			},
			{
				l: 2,
				n: 'Fighting Style',
				a: 'passive',
				pick: 'style',
				d: 'Gain a Fighting Style feat, or choose Blessed Warrior (two Cleric cantrips, cast with Charisma).'
			},
			{
				l: 2,
				n: "Paladin's Smite",
				a: 'bonus',
				r: 'long',
				u: () => 1,
				d: 'Divine Smite is always prepared. Once per Long Rest you can cast it without a slot.'
			},
			{
				l: 3,
				n: 'Channel Divinity',
				a: 'action',
				r: 'short1',
				u: (c) => (c.l >= 11 ? 3 : 2),
				d: 'Regain one use on a Short Rest, all on a Long Rest. Divine Sense (Bonus Action): for 10 min, sense Celestials, Fiends and Undead within 60 ft, and consecrated or desecrated places.'
			},
			SUB(3, 'Paladin'),
			ASI(4),
			{ l: 5, n: 'Extra Attack', a: 'action', d: 'Attack twice when you take the Attack action.' },
			{
				l: 5,
				n: 'Faithful Steed',
				a: 'action',
				r: 'long',
				u: () => 1,
				d: 'Find Steed is always prepared. Once per Long Rest you can cast it without a slot.'
			},
			{
				l: 6,
				n: 'Aura of Protection',
				a: 'passive',
				d: (c) =>
					`You and allies within ${c.l >= 18 ? 30 : 10} ft add +${Math.max(1, c.m('cha'))} to saving throws while you aren't Incapacitated.`
			},
			SUB(7, 'Paladin'),
			ASI(8),
			{
				l: 9,
				n: 'Abjure Foes',
				a: 'action',
				d: (c) =>
					`Channel Divinity (Magic action): up to ${Math.max(1, c.m('cha'))} creatures within 60 ft make a Wis save or are Frightened for 1 min; while Frightened they can only move, act, or take a Bonus Action each turn.`
			},
			{
				l: 10,
				n: 'Aura of Courage',
				a: 'passive',
				d: 'You and allies in your aura are immune to Frightened.'
			},
			{
				l: 11,
				n: 'Radiant Strikes',
				a: 'passive',
				d: 'Your melee weapon and Unarmed Strike hits deal an extra 1d8 Radiant.'
			},
			ASI(12),
			{
				l: 14,
				n: 'Restoring Touch',
				a: 'passive',
				d: 'Lay On Hands can also end Blinded, Charmed, Deafened, Frightened, Paralyzed or Stunned, spending 5 HP from the pool per condition.'
			},
			SUB(15, 'Paladin'),
			ASI(16),
			{ l: 18, n: 'Aura Expansion', a: 'passive', d: 'Your aura extends to 30 ft.' },
			BOON,
			SUB(20, 'Paladin')
		],
		sub: {
			name: 'Oath of Devotion',
			features: [
				{
					l: 3,
					n: 'Oath of Devotion Spells',
					a: 'passive',
					d: 'Always prepared. 3: Protection from Evil and Good, Shield of Faith. 5: Aid, Zone of Truth. 9: Beacon of Hope, Dispel Magic. 13: Freedom of Movement, Guardian of Faith. 17: Commune, Flame Strike.'
				},
				{
					l: 3,
					n: 'Sacred Weapon',
					a: 'special',
					d: (c) =>
						`Channel Divinity, when you take the Attack action: for 10 min one melee weapon adds +${Math.max(1, c.m('cha'))} to attack rolls, sheds light, and can deal Radiant damage.`
				},
				{
					l: 7,
					n: 'Aura of Devotion',
					a: 'passive',
					d: 'You and allies in your aura are immune to Charmed. A Charmed ally entering the aura stops being Charmed.'
				},
				{
					l: 15,
					n: 'Smite of Protection',
					a: 'passive',
					d: 'When you cast Divine Smite, you and allies in your aura have Half Cover until the start of your next turn.'
				},
				{
					l: 20,
					n: 'Holy Nimbus',
					a: 'bonus',
					r: 'long',
					u: () => 1,
					d: (c) =>
						`Bonus Action, 10 min: advantage on saves against Fiend and Undead effects; enemies starting their turn in your aura take ${c.m('cha') + c.pb} Radiant; bright light 30 ft. Once per Long Rest, or spend a level 5 slot.`
				}
			]
		}
	},

	ranger: {
		name: 'Ranger',
		hd: 10,
		saves: ['str', 'dex'],
		armor: ['light', 'medium', 'shields'],
		weapons: 'Simple and Martial weapons',
		tools: '',
		skills: {
			n: 3,
			list: [
				'animal',
				'athletics',
				'insight',
				'investigation',
				'nature',
				'perception',
				'stealth',
				'survival'
			]
		},
		caster: 'half',
		castAbil: 'wis',
		prepared: PREP_HALF,
		subLevels: [3, 7, 11, 15],
		features: [
			{
				l: 1,
				n: 'Spellcasting',
				a: 'passive',
				d: 'Cast Ranger spells using Wisdom. Use a Druidic Focus. Change one prepared spell on a Long Rest.'
			},
			{
				l: 1,
				n: 'Favored Enemy',
				a: 'bonus',
				r: 'long',
				u: (c) =>
					by(c.l, [
						[1, 2],
						[5, 3],
						[9, 4],
						[13, 5],
						[17, 6]
					]),
				d: (c) =>
					`Hunter's Mark is always prepared. Cast it without a slot this many times per Long Rest. Extra damage: 1d${c.l >= 20 ? 10 : 6} Force.`
			},
			{
				l: 1,
				n: 'Weapon Mastery',
				a: 'passive',
				d: 'Use the mastery property of two kinds of weapons. Change one on a Long Rest.'
			},
			{
				l: 2,
				n: 'Deft Explorer',
				a: 'passive',
				d: 'Expertise in one skill you are proficient in, and two extra languages.'
			},
			{
				l: 2,
				n: 'Fighting Style',
				a: 'passive',
				pick: 'style',
				d: 'Gain a Fighting Style feat, or choose Druidic Warrior (two Druid cantrips, cast with Wisdom).'
			},
			SUB(3, 'Ranger'),
			ASI(4),
			{ l: 5, n: 'Extra Attack', a: 'action', d: 'Attack twice when you take the Attack action.' },
			{
				l: 6,
				n: 'Roving',
				a: 'passive',
				d: '+10 ft Speed without Heavy armor. Climb and Swim Speed equal to your Speed.'
			},
			SUB(7, 'Ranger'),
			ASI(8),
			{
				l: 9,
				n: 'Expertise',
				a: 'passive',
				d: 'Expertise in two more skills you are proficient in.'
			},
			{
				l: 10,
				n: 'Tireless',
				a: 'action',
				r: 'long',
				u: (c) => Math.max(1, c.m('wis')),
				d: (c) =>
					`Magic action: gain 1d8 + ${c.m('wis')} Temporary HP. Each Short Rest reduces your Exhaustion by 1.`
			},
			SUB(11, 'Ranger'),
			ASI(12),
			{
				l: 13,
				n: 'Relentless Hunter',
				a: 'passive',
				d: "Taking damage can't break your Concentration on Hunter's Mark."
			},
			{
				l: 14,
				n: "Nature's Veil",
				a: 'bonus',
				r: 'long',
				u: (c) => Math.max(1, c.m('wis')),
				d: 'Bonus Action: become Invisible until the end of your next turn.'
			},
			SUB(15, 'Ranger'),
			ASI(16),
			{
				l: 17,
				n: 'Precise Hunter',
				a: 'passive',
				d: "Advantage on attack rolls against the target of your Hunter's Mark."
			},
			{ l: 18, n: 'Feral Senses', a: 'passive', d: 'Blindsight 30 ft.' },
			BOON,
			{ l: 20, n: 'Foe Slayer', a: 'passive', d: "Hunter's Mark damage die becomes a d10." }
		],
		sub: {
			name: 'Hunter',
			features: [
				{
					l: 3,
					n: "Hunter's Lore",
					a: 'passive',
					d: "While a creature is marked by your Hunter's Mark, you know its immunities, resistances and vulnerabilities."
				},
				{
					l: 3,
					n: "Hunter's Prey",
					a: 'passive',
					d: 'Choose one (swap on a rest). Colossus Slayer: once per turn, +1d8 on a weapon hit against a creature missing HP. Horde Breaker: once per turn, make another attack with the same weapon against a different creature within 5 ft of the target.'
				},
				{
					l: 7,
					n: 'Defensive Tactics',
					a: 'passive',
					d: 'Choose one (swap on a rest). Escape the Horde: Opportunity Attacks against you have disadvantage. Multiattack Defense: after a creature hits you, its other attacks this turn have disadvantage.'
				},
				{
					l: 11,
					n: "Superior Hunter's Prey",
					a: 'passive',
					d: "Once per turn when you damage your Hunter's Mark target, another creature within 30 ft of it also takes the mark's extra damage."
				},
				{
					l: 15,
					n: "Superior Hunter's Defense",
					a: 'reaction',
					d: 'When you take damage, gain Resistance to that and any other damage of that type until the end of the turn.'
				}
			]
		}
	},

	rogue: {
		name: 'Rogue',
		hd: 8,
		saves: ['dex', 'int'],
		armor: ['light'],
		weapons: 'Simple weapons and Martial weapons with the Finesse or Light property',
		tools: "Thieves' Tools",
		skills: {
			n: 4,
			list: [
				'acrobatics',
				'athletics',
				'deception',
				'insight',
				'intimidation',
				'investigation',
				'perception',
				'persuasion',
				'sleight',
				'stealth'
			]
		},
		subLevels: [3, 9, 13, 17],
		features: [
			{ l: 1, n: 'Expertise', a: 'passive', d: 'Expertise in two skills you are proficient in.' },
			{
				l: 1,
				n: 'Sneak Attack',
				a: 'special',
				d: (c) =>
					`Once per turn, +${Math.ceil(c.l / 2)}d6 damage on a Finesse or Ranged weapon hit if you have advantage, or an ally is within 5 ft of the target and you don't have disadvantage.`
			},
			{
				l: 1,
				n: "Thieves' Cant",
				a: 'passive',
				d: "You know Thieves' Cant and one other language."
			},
			{
				l: 1,
				n: 'Weapon Mastery',
				a: 'passive',
				d: 'Use the mastery property of two kinds of weapons. Change one on a Long Rest.'
			},
			{ l: 2, n: 'Cunning Action', a: 'bonus', d: 'Dash, Disengage or Hide as a Bonus Action.' },
			SUB(3, 'Rogue'),
			{
				l: 3,
				n: 'Steady Aim',
				a: 'bonus',
				d: "Bonus Action, if you haven't moved this turn: advantage on your next attack roll this turn. Your Speed is 0 until the end of the turn."
			},
			ASI(4),
			{
				l: 5,
				n: 'Cunning Strike',
				a: 'special',
				d: (c) =>
					`When you deal Sneak Attack, give up dice for an effect (save DC ${8 + c.m('dex') + c.pb}). Poison (1d6): Con save or Poisoned 1 min. Trip (1d6): Dex save or Prone (Large or smaller). Withdraw (1d6): you move half your Speed without provoking.`
			},
			{
				l: 5,
				n: 'Uncanny Dodge',
				a: 'reaction',
				d: "When an attacker you can see hits you, halve the attack's damage."
			},
			{ l: 6, n: 'Expertise', a: 'passive', d: 'Expertise in two more skills.' },
			{
				l: 7,
				n: 'Evasion',
				a: 'passive',
				d: 'On a Dex save for half damage, take none on a success and half on a failure.'
			},
			{
				l: 7,
				n: 'Reliable Talent',
				a: 'passive',
				d: 'On an ability check using a skill or tool you are proficient in, treat a d20 roll of 9 or lower as a 10.'
			},
			ASI(8),
			SUB(9, 'Rogue'),
			ASI(10),
			{
				l: 11,
				n: 'Improved Cunning Strike',
				a: 'passive',
				d: 'Use up to two Cunning Strike effects per Sneak Attack, paying for each.'
			},
			ASI(12),
			SUB(13, 'Rogue'),
			{
				l: 14,
				n: 'Devious Strikes',
				a: 'passive',
				d: 'New Cunning Strike effects. Daze (2d6): Con save or only one of move, action or Bonus Action next turn. Knock Out (6d6): Con save or Unconscious for 1 min (ends on damage). Obscure (3d6): Dex save or Blinded until the end of its next turn.'
			},
			{
				l: 15,
				n: 'Slippery Mind',
				a: 'passive',
				d: 'Proficiency in Wisdom and Charisma saving throws.'
			},
			ASI(16),
			SUB(17, 'Rogue'),
			{
				l: 18,
				n: 'Elusive',
				a: 'passive',
				d: 'No attack roll has advantage against you unless you are Incapacitated.'
			},
			BOON,
			{
				l: 20,
				n: 'Stroke of Luck',
				a: 'special',
				r: 'short',
				u: () => 1,
				d: 'Turn a failed D20 Test into a roll of 20.'
			}
		],
		sub: {
			name: 'Thief',
			features: [
				{
					l: 3,
					n: 'Fast Hands',
					a: 'bonus',
					d: "Bonus Action: a Sleight of Hand check, use Thieves' Tools to disarm a trap or open a lock, or take the Utilize action."
				},
				{
					l: 3,
					n: 'Second-Story Work',
					a: 'passive',
					d: 'Climb Speed equal to your Speed. You can use Dexterity instead of Strength to determine jump distance.'
				},
				{
					l: 9,
					n: 'Supreme Sneak',
					a: 'passive',
					d: "New Cunning Strike option. Stealth Attack (1d6): if you have the Invisible condition from Hide, this attack doesn't end it if you end the turn behind Three-Quarters or Total Cover."
				},
				{
					l: 13,
					n: 'Use Magic Device',
					a: 'passive',
					d: "Attune to up to 4 magic items. When you use a charge, roll 1d6: on a 6 it costs no charge. You can use any Spell Scroll, casting with Intelligence (check DC 10 + spell level if it isn't a Rogue-castable level)."
				},
				{
					l: 17,
					n: "Thief's Reflexes",
					a: 'passive',
					d: 'In the first round of combat you take two turns: one at your Initiative and one at your Initiative − 10.'
				}
			]
		}
	},

	sorcerer: {
		name: 'Sorcerer',
		hd: 6,
		saves: ['con', 'cha'],
		armor: [],
		weapons: 'Simple weapons',
		tools: '',
		skills: {
			n: 2,
			list: ['arcana', 'deception', 'insight', 'intimidation', 'persuasion', 'religion']
		},
		caster: 'full',
		castAbil: 'cha',
		cantrips: [
			[1, 4],
			[4, 5],
			[10, 6]
		],
		prepared: [2, 4, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
		subLevels: [3, 6, 14, 18],
		features: [
			{
				l: 1,
				n: 'Spellcasting',
				a: 'passive',
				d: 'Cast Sorcerer spells using Charisma. Use an Arcane Focus. Change one prepared spell when you gain a level.'
			},
			{
				l: 1,
				n: 'Innate Sorcery',
				a: 'bonus',
				r: 'long',
				u: () => 2,
				d: 'Bonus Action, 1 min: your Sorcerer spell save DC +1 and advantage on Sorcerer spell attack rolls.'
			},
			{
				l: 2,
				n: 'Font of Magic',
				a: 'bonus',
				r: 'long',
				u: (c) => c.l,
				d: 'Sorcery Points. Bonus Action: turn a slot into points equal to its level, or spend points to make a slot (L1: 2, L2: 3, L3: 5, L4: 6, L5: 7; max level 5). Created slots vanish on a Long Rest.'
			},
			{
				l: 2,
				n: 'Metamagic',
				a: 'passive',
				d: (c) =>
					`Know ${by(c.l, [
						[2, 2],
						[10, 4],
						[17, 6]
					])} Metamagic options. Normally one per spell. Swap one when you gain a level.`
			},
			SUB(3, 'Sorcerer'),
			ASI(4),
			{
				l: 5,
				n: 'Sorcerous Restoration',
				a: 'special',
				r: 'long',
				u: () => 1,
				d: (c) => `On a Short Rest, regain up to ${Math.floor(c.l / 2)} Sorcery Points.`
			},
			SUB(6, 'Sorcerer'),
			{
				l: 7,
				n: 'Sorcery Incarnate',
				a: 'passive',
				d: 'With no Innate Sorcery uses left, spend 2 Sorcery Points to activate it. While it is active you can use up to two Metamagic options per spell.'
			},
			ASI(8),
			ASI(12),
			SUB(14, 'Sorcerer'),
			ASI(16),
			SUB(18, 'Sorcerer'),
			BOON,
			{
				l: 20,
				n: 'Arcane Apotheosis',
				a: 'passive',
				d: 'While Innate Sorcery is active, use one Metamagic option per turn without spending Sorcery Points.'
			}
		],
		sub: {
			name: 'Draconic Sorcery',
			features: [
				{
					l: 3,
					n: 'Draconic Resilience',
					a: 'passive',
					d: 'HP max +1 per Sorcerer level (+3 at level 3). Without armor, AC = 10 + Dex mod + Cha mod.'
				},
				{
					l: 3,
					n: 'Draconic Spells',
					a: 'passive',
					d: "Always prepared. 3: Alter Self, Chromatic Orb, Command, Dragon's Breath. 5: Fear, Fly. 7: Arcane Eye, Charm Monster. 9: Legend Lore, Summon Dragon."
				},
				{
					l: 6,
					n: 'Elemental Affinity',
					a: 'passive',
					d: (c) =>
						`Choose Acid, Cold, Fire, Lightning or Poison: Resistance to it, and add +${c.m('cha')} to one damage roll of a Sorcerer spell dealing that type.`
				},
				{
					l: 14,
					n: 'Dragon Wings',
					a: 'bonus',
					r: 'long',
					u: () => 1,
					d: 'Bonus Action: wings for 1 hour, Fly Speed 60 ft. Once per Long Rest, or spend 3 Sorcery Points.'
				},
				{
					l: 18,
					n: 'Dragon Companion',
					a: 'action',
					r: 'long',
					u: () => 1,
					d: 'Summon Dragon without Material components. Once per Long Rest, cast it without a slot or Concentration (lasts 1 min).'
				}
			]
		}
	},

	warlock: {
		name: 'Warlock',
		hd: 8,
		saves: ['wis', 'cha'],
		armor: ['light'],
		weapons: 'Simple weapons',
		tools: '',
		skills: {
			n: 2,
			list: [
				'arcana',
				'deception',
				'history',
				'intimidation',
				'investigation',
				'nature',
				'religion'
			]
		},
		caster: 'pact',
		castAbil: 'cha',
		cantrips: [
			[1, 2],
			[4, 3],
			[10, 4]
		],
		prepared: [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
		subLevels: [3, 6, 10, 14],
		features: [
			{
				l: 1,
				n: 'Eldritch Invocations',
				a: 'passive',
				d: (c) =>
					`Know ${by(c.l, [
						[1, 1],
						[2, 3],
						[5, 5],
						[7, 6],
						[9, 7],
						[12, 8],
						[15, 9],
						[18, 10]
					])} invocations. Swap one when you gain a level. (Add each as a custom feature.)`
			},
			{
				l: 1,
				n: 'Pact Magic',
				a: 'passive',
				d: (c) =>
					`Cast Warlock spells using Charisma. ${by(c.l, [
						[1, 1],
						[2, 2],
						[11, 3],
						[17, 4]
					])} Pact slot(s) of level ${Math.min(5, Math.ceil(c.l / 2))}, regained on a Short or Long Rest.`
			},
			{
				l: 2,
				n: 'Magical Cunning',
				a: 'special',
				r: 'long',
				u: () => 1,
				d: (c) =>
					`1-minute rite: regain ${c.l >= 20 ? 'all' : 'half (rounded up) of'} your expended Pact slots.`
			},
			SUB(3, 'Warlock'),
			ASI(4),
			SUB(6, 'Warlock'),
			ASI(8),
			{
				l: 9,
				n: 'Contact Patron',
				a: 'action',
				r: 'long',
				u: () => 1,
				d: 'Contact Other Plane is always prepared. Once per Long Rest cast it without a slot to reach your patron; you automatically succeed on its save.'
			},
			SUB(10, 'Warlock'),
			{
				l: 11,
				n: 'Mystic Arcanum',
				a: 'special',
				r: 'long',
				d: (c) =>
					`Choose one spell each of level ${[6, 7, 8, 9].filter((x, i) => c.l >= [11, 13, 15, 17][i]).join(', ')}. Cast each once per Long Rest without a slot.`
			},
			ASI(12),
			SUB(14, 'Warlock'),
			ASI(16),
			BOON,
			{
				l: 20,
				n: 'Eldritch Master',
				a: 'passive',
				d: 'Magical Cunning regains all your expended Pact slots.'
			}
		],
		sub: {
			name: 'Fiend Patron',
			features: [
				{
					l: 3,
					n: 'Fiend Spells',
					a: 'passive',
					d: 'Always prepared. 3: Burning Hands, Command, Scorching Ray, Suggestion. 5: Fireball, Stinking Cloud. 7: Fire Shield, Wall of Fire. 9: Geas, Insect Plague.'
				},
				{
					l: 3,
					n: "Dark One's Blessing",
					a: 'passive',
					d: (c) =>
						`When you (or someone within 10 ft of you) reduce an enemy to 0 HP, gain ${Math.max(1, c.m('cha') + c.l)} Temporary HP.`
				},
				{
					l: 6,
					n: "Dark One's Own Luck",
					a: 'special',
					r: 'long',
					u: (c) => Math.max(1, c.m('cha')),
					d: 'After seeing the roll, add 1d10 to one of your ability checks or saving throws. Once per roll.'
				},
				{
					l: 10,
					n: 'Fiendish Resilience',
					a: 'passive',
					d: 'On a Short or Long Rest choose a damage type other than Force: you have Resistance to it.'
				},
				{
					l: 14,
					n: 'Hurl Through Hell',
					a: 'special',
					r: 'long',
					u: () => 1,
					d: 'Once per turn on an attack hit: Cha save or the target is hurled through the lower planes, taking 8d10 Psychic (unless a Fiend) and Incapacitated until the end of your next turn. Once per Long Rest, or spend a Pact slot.'
				}
			]
		}
	},

	wizard: {
		name: 'Wizard',
		hd: 6,
		saves: ['int', 'wis'],
		armor: [],
		weapons: 'Simple weapons',
		tools: '',
		skills: {
			n: 2,
			list: ['arcana', 'history', 'insight', 'investigation', 'medicine', 'nature', 'religion']
		},
		caster: 'full',
		castAbil: 'int',
		cantrips: [
			[1, 3],
			[4, 4],
			[10, 5]
		],
		prepared: [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 18, 19, 21, 22, 23, 24, 25],
		subLevels: [3, 6, 10, 14],
		features: [
			{
				l: 1,
				n: 'Spellcasting',
				a: 'passive',
				d: 'Cast Wizard spells using Intelligence from your spellbook (six level 1 spells at start, two more per level). Change your prepared spells on a Long Rest.'
			},
			{
				l: 1,
				n: 'Ritual Adept',
				a: 'passive',
				d: 'Cast any Ritual spell in your spellbook as a Ritual without preparing it.'
			},
			{
				l: 1,
				n: 'Arcane Recovery',
				a: 'special',
				r: 'long',
				u: () => 1,
				d: (c) =>
					`On a Short Rest, recover spell slots totalling up to ${Math.ceil(c.l / 2)} levels (none level 6+).`
			},
			{
				l: 2,
				n: 'Scholar',
				a: 'passive',
				d: 'Expertise in one of Arcana, History, Investigation, Medicine, Nature or Religion (must be proficient).'
			},
			SUB(3, 'Wizard'),
			ASI(4),
			{
				l: 5,
				n: 'Memorize Spell',
				a: 'special',
				d: 'On a Short Rest, swap one prepared spell for another in your spellbook.'
			},
			SUB(6, 'Wizard'),
			ASI(8),
			SUB(10, 'Wizard'),
			ASI(12),
			SUB(14, 'Wizard'),
			ASI(16),
			{
				l: 18,
				n: 'Spell Mastery',
				a: 'passive',
				d: 'Choose one level 1 and one level 2 spell that take an action. Cast them at their lowest level without a slot. Swap them on a Long Rest.'
			},
			BOON,
			{
				l: 20,
				n: 'Signature Spells',
				a: 'special',
				r: 'short',
				u: () => 2,
				d: 'Two level 3 spells are always prepared. Cast each once at level 3 without a slot per Short or Long Rest.'
			}
		],
		sub: {
			name: 'Evoker',
			features: [
				{
					l: 3,
					n: 'Evocation Savant',
					a: 'passive',
					d: 'Add two Evocation spells to your spellbook for free. Each new spell slot level adds one more free Evocation spell.'
				},
				{
					l: 3,
					n: 'Potent Cantrip',
					a: 'passive',
					d: 'When a damage cantrip misses or the target succeeds on its save, it still takes half the damage (no other effects).'
				},
				{
					l: 6,
					n: 'Sculpt Spells',
					a: 'passive',
					d: "When you cast an Evocation spell affecting others, choose 1 + the spell's level creatures: they succeed on the save and take no damage."
				},
				{
					l: 10,
					n: 'Empowered Evocation',
					a: 'passive',
					d: (c) => `Add +${c.m('int')} to one damage roll of a Wizard Evocation spell.`
				},
				{
					l: 14,
					n: 'Overchannel',
					a: 'special',
					r: 'long',
					u: () => 1,
					d: 'When you cast a level 1–5 Wizard damage spell, deal maximum damage. Using it again before a Long Rest deals 2d12 Necrotic per spell level to you, +1d12 per further use.'
				}
			]
		}
	}
};
