// Key numbers for each class, shown at the top of the Class tab (D&D 2024 rules).
import { by } from './data/classes';
import { makeCtx, scores, signed, spellcasting } from './calc';
import type { Character } from './types';

export interface ClassStat {
	label: string;
	value: string;
	hint?: string;
}

const sub = (ch: Character, id: string) => ch.subclassId === id || ch.subclassId.endsWith(`:${id}`);

/** Attacks per Attack action. */
export function attacksPerAction(ch: Character): number {
	const l = ch.level;
	if (ch.classId === 'fighter')
		return by(l, [
			[1, 1],
			[5, 2],
			[11, 3],
			[20, 4]
		]);
	if (['barbarian', 'monk', 'paladin', 'ranger'].includes(ch.classId) && l >= 5) return 2;
	if (ch.classId === 'bard' && sub(ch, 'valor') && l >= 6) return 2;
	return 1;
}

export function classStats(ch: Character): ClassStat[] {
	const sc = scores(ch);
	const c = makeCtx(ch, sc);
	const l = ch.level;
	const m = c.m;
	const out: ClassStat[] = [];
	const add = (label: string, value: string | number, hint?: string) =>
		out.push({ label, value: String(value), hint });
	const atk = attacksPerAction(ch);
	switch (ch.classId) {
		case 'barbarian':
			add(
				'Rages',
				by(l, [
					[1, 2],
					[3, 3],
					[6, 4],
					[12, 5],
					[17, 6]
				]),
				'One back on a Short Rest, all on a Long Rest'
			);
			add(
				'Rage damage',
				signed(
					by(l, [
						[1, 2],
						[9, 3],
						[16, 4]
					])
				),
				'Strength attacks while raging'
			);
			add(
				'Weapon masteries',
				by(l, [
					[1, 2],
					[4, 3],
					[10, 4]
				])
			);
			if (l >= 9)
				add(
					'Brutal Strike',
					l >= 17 ? '2d10, two effects' : '1d10',
					'Give up Reckless advantage on one attack'
				);
			if (sub(ch, 'zealot'))
				add('Divine Fury', `1d6 ${signed(Math.floor(l / 2))}`, 'First hit each turn while raging');
			break;
		case 'bard': {
			add(
				'Bardic Inspiration',
				`d${by(l, [
					[1, 6],
					[5, 8],
					[10, 10],
					[15, 12]
				])}`,
				`${Math.max(1, m('cha'))} uses, ${l >= 5 ? 'Short or Long Rest' : 'Long Rest'}`
			);
			break;
		}
		case 'cleric':
			if (l >= 2)
				add(
					'Channel Divinity',
					by(l, [
						[2, 2],
						[6, 3],
						[18, 4]
					]),
					'One back on a Short Rest'
				);
			if (l >= 2)
				add(
					'Divine Spark',
					`${by(l, [
						[1, 1],
						[7, 2],
						[13, 3],
						[18, 4]
					])}d8 ${signed(m('wis'))}`
				);
			if (l >= 5) add('Sear Undead', `${Math.max(1, m('wis'))}d8 Radiant`);
			if (l >= 10) add('Divine Intervention', l >= 20 ? 'Wish possible' : '1 per Long Rest');
			break;
		case 'druid': {
			if (l >= 2) {
				const moon = sub(ch, 'moon');
				add(
					'Wild Shape',
					by(l, [
						[2, 2],
						[6, 3],
						[17, 4]
					]),
					'One back on a Short Rest'
				);
				add(
					'Max CR',
					moon
						? String(Math.max(1, Math.floor(l / 3)))
						: by(l, [
								[2, '1/4'],
								[4, '1/2'],
								[8, '1']
							]),
					moon ? 'Circle Forms' : l < 8 ? 'No Fly Speed' : ''
				);
				add(
					'Known forms',
					by(l, [
						[2, 4],
						[4, 6],
						[8, 8]
					])
				);
				add('Temp HP', moon ? 3 * l : l, `Lasts ${Math.floor(l / 2)} hours`);
			}
			break;
		}
		case 'fighter':
			add(
				'Second Wind',
				`${by(l, [
					[1, 2],
					[4, 3],
					[10, 4]
				])} × 1d10 + ${l}`,
				'One back on a Short Rest'
			);
			if (l >= 2) add('Action Surge', l >= 17 ? 2 : 1, 'Short Rest');
			if (l >= 9)
				add(
					'Indomitable',
					by(l, [
						[9, 1],
						[13, 2],
						[17, 3]
					]),
					`Reroll a save with +${l}`
				);
			add(
				'Weapon masteries',
				by(l, [
					[1, 3],
					[4, 4],
					[10, 5],
					[16, 6]
				])
			);
			if (sub(ch, 'srd') || sub(ch, 'champion'))
				add('Critical range', l >= 15 ? '18–20' : l >= 3 ? '19–20' : '20');
			if (sub(ch, 'battle-master') && l >= 3)
				add(
					'Superiority Dice',
					`${4 + (l >= 7 ? 1 : 0) + (l >= 15 ? 1 : 0)} × d${by(l, [
						[3, 8],
						[10, 10],
						[18, 12]
					])}`,
					`Save DC ${8 + Math.max(m('str'), m('dex')) + c.pb}`
				);
			if (sub(ch, 'psi-warrior') && l >= 3)
				add(
					'Psionic Energy Dice',
					`${by(l, [
						[3, 4],
						[5, 6],
						[9, 8],
						[13, 10],
						[17, 12]
					])} × d${by(l, [
						[3, 6],
						[5, 8],
						[11, 10],
						[17, 12]
					])}`,
					'One back on a Short Rest'
				);
			break;
		case 'monk': {
			const ma = by(l, [
				[1, 6],
				[5, 8],
				[11, 10],
				[17, 12]
			]);
			add(
				'Martial Arts',
				`d${ma}`,
				`Unarmed Strike 1d${ma} ${signed(Math.max(m('str'), m('dex')))}`
			);
			if (l >= 2) add('Focus Points', l, 'Short or Long Rest');
			if (l >= 2)
				add(
					'Unarmored Movement',
					`+${by(l, [
						[2, 10],
						[6, 15],
						[10, 20],
						[14, 25],
						[18, 30]
					])} ft`
				);
			if (l >= 2) add('Focus save DC', 8 + m('wis') + c.pb);
			if (l >= 3) add('Deflect Attacks', `1d10 ${signed(m('dex') + l)}`);
			break;
		}
		case 'paladin':
			add('Lay On Hands', `${5 * l} HP pool`, 'Long Rest');
			if (l >= 3) add('Channel Divinity', l >= 11 ? 3 : 2, 'One back on a Short Rest');
			if (l >= 6)
				add(
					'Aura of Protection',
					`${signed(Math.max(1, m('cha')))} saves, ${l >= 18 ? 30 : 10} ft`
				);
			if (l >= 11) add('Radiant Strikes', '+1d8 Radiant');
			break;
		case 'ranger':
			add(
				"Free Hunter's Mark",
				by(l, [
					[1, 2],
					[5, 3],
					[9, 4],
					[13, 5],
					[17, 6]
				]),
				'Casts without a slot per Long Rest'
			);
			add("Hunter's Mark die", l >= 20 ? 'd10' : 'd6');
			add('Weapon masteries', 2);
			if (l >= 10) add('Tireless', `${Math.max(1, m('wis'))} × 1d8 ${signed(m('wis'))} Temp HP`);
			break;
		case 'rogue':
			add('Sneak Attack', `${Math.ceil(l / 2)}d6`, 'Once per turn');
			if (l >= 5)
				add(
					'Cunning Strike DC',
					8 + m('dex') + c.pb,
					l >= 11 ? 'Two effects per Sneak Attack' : 'One effect per Sneak Attack'
				);
			add('Weapon masteries', 2);
			if (sub(ch, 'soulknife') && l >= 3)
				add(
					'Psionic Energy Dice',
					`${by(l, [
						[3, 4],
						[5, 6],
						[9, 8],
						[13, 10],
						[17, 12]
					])} × d${by(l, [
						[3, 6],
						[5, 8],
						[11, 10],
						[17, 12]
					])}`,
					'One back on a Short Rest'
				);
			break;
		case 'sorcerer':
			if (l >= 2) add('Sorcery Points', l, 'Long Rest');
			add('Innate Sorcery', 2, 'Long Rest; +1 DC and spell attack advantage for 1 min');
			if (l >= 2)
				add(
					'Metamagic known',
					by(l, [
						[2, 2],
						[10, 4],
						[17, 6]
					])
				);
			if (l >= 5)
				add(
					'Sorcerous Restoration',
					`${Math.floor(l / 2)} points`,
					'Once per Long Rest, on a Short Rest'
				);
			break;
		case 'warlock': {
			const s = spellcasting(ch, sc);
			if (s.pact) add('Pact slots', `${s.pact.n} × level ${s.pact.level}`, 'Short or Long Rest');
			add(
				'Invocations known',
				by(l, [
					[1, 1],
					[2, 3],
					[5, 5],
					[7, 6],
					[9, 7],
					[12, 8],
					[15, 9],
					[18, 10]
				])
			);
			if (l >= 2)
				add(
					'Magical Cunning',
					l >= 20
						? 'All slots'
						: `${Math.ceil(
								by(l, [
									[1, 1],
									[2, 2],
									[11, 3],
									[17, 4]
								]) / 2
							)} slots`,
					'1-minute rite, once per Long Rest'
				);
			break;
		}
		case 'wizard':
			add(
				'Spellbook',
				`${6 + 2 * (l - 1)}+ spells`,
				'Six at level 1, two more per level, plus any you copy'
			);
			add(
				'Arcane Recovery',
				`${Math.ceil(l / 2)} slot levels`,
				'Once per Long Rest, on a Short Rest'
			);
			break;
	}
	if (atk > 1) add('Attacks per Attack action', atk);
	return out;
}

/** When and how each class changes its prepared spells (2024 rules). */
export const PREP_RULE: Record<string, string> = {
	bard: 'Prepared from the Bard list. When you gain a Bard level, you can swap one spell.',
	cleric: 'Prepared from the whole Cleric list. Change the list after any Long Rest.',
	druid: 'Prepared from the whole Druid list. Change the list after any Long Rest.',
	paladin: 'Prepared from the Paladin list. After a Long Rest you can swap one spell.',
	ranger: 'Prepared from the Ranger list. After a Long Rest you can swap one spell.',
	sorcerer:
		'Prepared from the Sorcerer list. When you gain a Sorcerer level, you can swap one spell.',
	warlock:
		'Prepared from the Warlock list. When you gain a Warlock level, you can swap one spell. Pact slots are always your highest slot level and return on a Short Rest.',
	wizard:
		'Your spellbook is the list below; tick the spells you have prepared. Change them after any Long Rest. Rituals in your book can be cast without preparing them.'
};

/** Font of Magic: creating spell slots costs sorcery points (2024 table). */
export const FONT_OF_MAGIC: [number, number][] = [
	[1, 2],
	[2, 3],
	[3, 5],
	[4, 6],
	[5, 7]
];
