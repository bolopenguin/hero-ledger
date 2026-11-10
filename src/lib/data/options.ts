// Built-in option lists for class choices (D&D 2024 rules, SRD 5.2). Some lists are generated
// for the character: weapon masteries, skills for Expertise, and spells of a class and level.
import type { OptionItem, OptionList, SpellDef } from '../types';
import { SKILLS, WEAPONS } from './srd';

export const STATIC_OPTIONS: Record<string, OptionList> = {
	'land-type': {
		label: 'Land',
		items: {
			arid: {
				name: 'Arid',
				d: "Nature's Ward resistance: Fire.",
				spellGrants: [
					{ l: 3, names: ['Blur', 'Burning Hands', 'Fire Bolt'] },
					{ l: 5, names: ['Fireball'] },
					{ l: 7, names: ['Blight'] },
					{ l: 9, names: ['Wall of Stone'] }
				]
			},
			polar: {
				name: 'Polar',
				d: "Nature's Ward resistance: Cold.",
				spellGrants: [
					{ l: 3, names: ['Fog Cloud', 'Hold Person', 'Ray of Frost'] },
					{ l: 5, names: ['Sleet Storm'] },
					{ l: 7, names: ['Ice Storm'] },
					{ l: 9, names: ['Cone of Cold'] }
				]
			},
			temperate: {
				name: 'Temperate',
				d: "Nature's Ward resistance: Lightning.",
				spellGrants: [
					{ l: 3, names: ['Misty Step', 'Shocking Grasp', 'Sleep'] },
					{ l: 5, names: ['Lightning Bolt'] },
					{ l: 7, names: ['Freedom of Movement'] },
					{ l: 9, names: ['Tree Stride'] }
				]
			},
			tropical: {
				name: 'Tropical',
				d: "Nature's Ward resistance: Poison.",
				spellGrants: [
					{ l: 3, names: ['Acid Splash', 'Ray of Sickness', 'Web'] },
					{ l: 5, names: ['Stinking Cloud'] },
					{ l: 7, names: ['Polymorph'] },
					{ l: 9, names: ['Insect Plague'] }
				]
			}
		}
	},
	'divine-order': {
		label: 'Divine Order',
		items: {
			protector: {
				name: 'Protector',
				d: 'Trained for battle: proficiency with Martial weapons and training with Heavy armor.',
				effects: { armor: ['heavy'], weapons: 'Martial weapons' }
			},
			thaumaturge: {
				name: 'Thaumaturge',
				d: 'One extra Cleric cantrip, and add your Wisdom modifier (min +1) to Arcana and Religion checks.',
				effects: { cantrips: 1, skillBonus: { arcana: 'wis', religion: 'wis' } }
			}
		}
	},
	'primal-order': {
		label: 'Primal Order',
		items: {
			magician: {
				name: 'Magician',
				d: 'One extra Druid cantrip, and add your Wisdom modifier (min +1) to Arcana and Nature checks.',
				effects: { cantrips: 1, skillBonus: { arcana: 'wis', nature: 'wis' } }
			},
			warden: {
				name: 'Warden',
				d: 'Trained for battle: proficiency with Martial weapons and training with Medium armor.',
				effects: { armor: ['medium'], weapons: 'Martial weapons' }
			}
		}
	},
	'blessed-strikes': {
		label: 'Blessed Strikes',
		items: {
			'divine-strike': {
				name: 'Divine Strike',
				d: 'Once on each of your turns when you hit with a weapon, deal +1d8 Necrotic or Radiant (2d8 from level 14).',
				effects: {
					rider: {
						name: 'Divine Strike',
						dmg: '{1 + (lvl >= 14)}d8',
						type: 'Radiant/Necrotic',
						hit: 0,
						applies: 'weapon',
						when: 'Once per turn'
					}
				}
			},
			'potent-spellcasting': {
				name: 'Potent Spellcasting',
				d: 'Add your Wisdom modifier to the damage of your Cleric cantrips (from level 14, a damaging cantrip also gives Temporary HP equal to twice that modifier).'
			}
		}
	},
	'elemental-fury': {
		label: 'Elemental Fury',
		items: {
			'potent-spellcasting': {
				name: 'Potent Spellcasting',
				d: 'Add your Wisdom modifier to the damage of your Druid cantrips (from level 15, cantrips with 10+ ft range gain +300 ft).'
			},
			'primal-strike': {
				name: 'Primal Strike',
				d: 'Once on each of your turns when you hit with a weapon or a Beast form attack, deal +1d8 Cold, Fire, Lightning or Thunder (2d8 from level 15).',
				effects: {
					rider: {
						name: 'Primal Strike',
						dmg: '{1 + (lvl >= 15)}d8',
						type: 'Elemental',
						hit: 0,
						applies: 'weapon',
						when: 'Once per turn'
					}
				}
			}
		}
	},
	'hunters-prey': {
		label: "Hunter's Prey",
		items: {
			'colossus-slayer': {
				name: 'Colossus Slayer',
				d: 'Once per turn, +1d8 on a weapon hit against a creature that is missing any HP.',
				effects: {
					rider: {
						name: 'Colossus Slayer',
						dmg: '1d8',
						type: '',
						hit: 0,
						applies: 'weapon',
						when: 'Once per turn, target is missing HP'
					}
				}
			},
			'horde-breaker': {
				name: 'Horde Breaker',
				d: 'Once per turn, make another attack with the same weapon against a different creature within 5 ft of the original target.'
			}
		}
	},
	'defensive-tactics': {
		label: 'Defensive Tactics',
		items: {
			'escape-the-horde': {
				name: 'Escape the Horde',
				d: 'Opportunity Attacks against you have disadvantage.'
			},
			'multiattack-defense': {
				name: 'Multiattack Defense',
				d: 'After a creature hits you, its other attack rolls against you this turn have disadvantage.'
			}
		}
	}
};

/** Which weapons each class may pick for Weapon Mastery. */
const MASTERY_FILTER: Record<string, (k: string) => boolean> = {
	barbarian: (k) => WEAPONS[k].kind === 'melee',
	rogue: (k) =>
		WEAPONS[k].cat === 'simple' || WEAPONS[k].props.some((p) => p === 'Finesse' || p === 'Light')
};

export function dynamicOptions(classId: string, spells: SpellDef[]): Record<string, OptionList> {
	const out: Record<string, OptionList> = {};
	const filter = MASTERY_FILTER[classId] ?? (() => true);
	out['weapon-mastery'] = {
		label: 'Weapon Mastery',
		items: Object.fromEntries(
			Object.entries(WEAPONS)
				.filter(([k, w]) => k !== 'unarmed' && w.mastery && filter(k))
				.map(([k, w]): [string, OptionItem] => [
					k,
					{ name: w.name, d: `${w.mastery}.`, effects: { mastery: k } }
				])
		)
	};
	const skillItems = (ids: string[]) =>
		Object.fromEntries(
			ids.map((id): [string, OptionItem] => [
				id,
				{
					name: SKILLS[id].name,
					d: 'Expertise: Proficiency Bonus added twice (you need proficiency in it).',
					effects: { expertise: id }
				}
			])
		);
	out['expertise'] = { label: 'Expertise', items: skillItems(Object.keys(SKILLS)) };
	out['scholar'] = {
		label: 'Scholar',
		items: skillItems(['arcana', 'history', 'investigation', 'medicine', 'nature', 'religion'])
	};
	// spells:<class>:<level>, used by Mystic Arcanum, Spell Mastery, Signature Spells
	for (const sp of spells)
		for (const cls of sp.classes) {
			const key = `spells:${cls.toLowerCase()}:${sp.level}`;
			out[key] ??= { label: `${cls} spells, level ${sp.level}`, items: {} };
			out[key].items[sp.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')] = {
				name: sp.name,
				d: sp.d,
				spells: [sp.name]
			};
		}
	return out;
}
