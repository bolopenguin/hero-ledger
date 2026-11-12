// Built-in option lists for class choices (D&D 2024 rules, SRD 5.2). Some lists are generated
// for the character: weapon masteries, skills for Expertise, and spells of a class and level.
import type { OptionItem, OptionList, SpellDef } from '../types';
import { GEAR, type GearCat } from './equipment';
import { SKILLS, WEAPONS } from './srd';

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

const DAMAGE = (types: string[]) =>
	Object.fromEntries(types.map((t): [string, OptionItem] => [t.toLowerCase(), { name: t, d: '' }]));

export const STATIC_OPTIONS: Record<string, OptionList> = {
	'damage-adept': {
		label: 'Damage type',
		items: DAMAGE(['Acid', 'Cold', 'Fire', 'Lightning', 'Thunder'])
	},
	'damage-types': {
		label: 'Damage types',
		items: DAMAGE([
			'Acid',
			'Cold',
			'Fire',
			'Lightning',
			'Necrotic',
			'Poison',
			'Psychic',
			'Radiant',
			'Thunder'
		])
	},
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
	const profItems = (ids: string[]) =>
		Object.fromEntries(
			ids.map((id): [string, OptionItem] => [
				id,
				{ name: SKILLS[id].name, d: 'Proficiency.', effects: { skill: id } }
			])
		);
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
	out['skills'] = { label: 'Skill proficiency', items: profItems(Object.keys(SKILLS)) };
	out['weapon-mastery-any'] = {
		label: 'Weapon Mastery',
		items: Object.fromEntries(
			Object.entries(WEAPONS)
				.filter(([k, w]) => k !== 'unarmed' && w.mastery)
				.map(([k, w]): [string, OptionItem] => [
					k,
					{ name: w.name, d: `${w.mastery}.`, effects: { mastery: k } }
				])
		)
	};
	const tools = (cats: GearCat[]) =>
		Object.fromEntries(
			GEAR.filter((g) => cats.includes(g.cat)).map((g): [string, OptionItem] => [
				slug(g.name),
				{ name: g.name, d: g.d ?? '', effects: { tool: g.name } }
			])
		);
	out['tools:artisan'] = { label: "Artisan's Tools", items: tools(['artisan']) };
	out['tools:instrument'] = { label: 'Musical Instruments', items: tools(['instrument']) };
	out['tools:gaming'] = { label: 'Gaming Sets', items: tools(['gaming']) };
	out['tools:any'] = {
		label: 'Tools',
		items: tools(['artisan', 'tool', 'instrument', 'gaming'])
	};
	out['scholar'] = {
		label: 'Scholar',
		items: skillItems(['arcana', 'history', 'investigation', 'medicine', 'nature', 'religion'])
	};
	// spells:<class>:<level> (Mystic Arcanum, cantrips from feats…), school:<school>:<level>
	// (Fey-Touched…) and rituals:<level> (Ritual Caster).
	const addSpell = (key: string, label: string, sp: SpellDef) => {
		out[key] ??= { label, items: {} };
		out[key].items[slug(sp.name)] = { name: sp.name, d: sp.d, spells: [sp.name] };
	};
	const lvl = (l: number) => (l === 0 ? 'cantrips' : `spells, level ${l}`);
	for (const sp of spells) {
		for (const cls of sp.classes)
			addSpell(`spells:${cls.toLowerCase()}:${sp.level}`, `${cls} ${lvl(sp.level)}`, sp);
		if (sp.school)
			addSpell(
				`school:${sp.school.toLowerCase()}:${sp.level}`,
				`${sp.school} ${lvl(sp.level)}`,
				sp
			);
		if (sp.ritual) addSpell(`rituals:${sp.level}`, `Ritual spells, level ${sp.level}`, sp);
	}
	return out;
}

/**
 * Lists named by their parameters: "toolset:disguise-kit,forgery-kit" (one of these tools),
 * "skills:insight,perception" (proficiency in one of them) and
 * "skillup:arcana,history" (proficiency, or Expertise if you already have it).
 */
export function paramOptions(key: string): OptionList | undefined {
	const tm = key.match(/^toolset:([a-z0-9,-]+)$/);
	if (tm) {
		const want = new Set(tm[1].split(','));
		const items = GEAR.filter((g) => want.has(slug(g.name))).map((g): [string, OptionItem] => [
			slug(g.name),
			{ name: g.name, d: g.d ?? '', effects: { tool: g.name } }
		]);
		return items.length ? { label: 'Tools', items: Object.fromEntries(items) } : undefined;
	}
	const m = key.match(/^(skills|skillup):([a-z,]+)$/);
	if (!m) return undefined;
	const ids = m[2].split(',').filter((id) => SKILLS[id]);
	const up = m[1] === 'skillup';
	return {
		label: up ? 'Skill (proficiency, or Expertise if proficient)' : 'Skill proficiency',
		items: Object.fromEntries(
			ids.map((id): [string, OptionItem] => [
				id,
				{
					name: SKILLS[id].name,
					d: up ? 'Proficiency, or Expertise if you are already proficient.' : 'Proficiency.',
					effects: up ? { skillUp: id } : { skill: id }
				}
			])
		)
	};
}
