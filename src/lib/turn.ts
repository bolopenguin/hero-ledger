// "Your turn": everything a character can do, grouped by Action, Bonus Action and Reaction,
// plus what triggers when you hit. Used by the Your turn tab and the PDF.
import {
	allAttacks,
	allRiders,
	attack,
	features,
	grantedSpells,
	hitText,
	masteredWeapons,
	scores,
	signed,
	SPELL_KIND_LABEL
} from './calc';
import { attacksPerAction } from './classStats';
import { allPackSpells } from './packs.svelte';
import { WEAPONS } from './data/srd';
import type { Character } from './types';

export type TurnSlot = 'action' | 'bonus' | 'reaction' | 'onhit' | 'long';

export interface TurnEntry {
	name: string;
	detail: string;
	source:
		| 'Basic'
		| 'Attack'
		| 'Class'
		| 'Subclass'
		| 'Species'
		| 'Background'
		| 'Feat'
		| 'Custom'
		| 'Spell'
		| 'Item';
	/** Extra lines, e.g. one per weapon for the Attack action. */
	lines?: string[];
	uses?: string;
}

const BASIC_ACTIONS: [string, string][] = [
	['Dash', 'Extra movement equal to your Speed this turn.'],
	['Disengage', "Your movement doesn't provoke Opportunity Attacks this turn."],
	[
		'Dodge',
		'Until your next turn, attacks against you have disadvantage and you have advantage on Dex saves (lost if Incapacitated or Speed 0).'
	],
	[
		'Help',
		"Give an ally advantage on its next check, or distract a creature within 5 ft so an ally's next attack against it has advantage."
	],
	[
		'Hide',
		'Dex (Stealth) DC 15 while out of sight and heavily obscured or behind cover: you become Invisible until you make noise, attack or are found.'
	],
	[
		'Influence',
		'Charisma or Wisdom check to sway a creature’s attitude (Deception, Intimidation, Performance, Persuasion, Animal Handling).'
	],
	[
		'Ready',
		'Choose a trigger and an action (or a spell, holding Concentration); use your Reaction when it happens.'
	],
	['Search', 'Wisdom check (Insight, Medicine, Perception, Survival) to find something.'],
	[
		'Study',
		'Intelligence check (Arcana, History, Investigation, Nature, Religion) to recall or work something out.'
	],
	['Utilize', 'Use a nonmagical object: open a door, drink from a flask, light a torch…']
];

const ITEM_ACTIONS: Record<string, [TurnSlot, string]> = {
	'potion of healing': ['bonus', 'Drink or give to a creature within 5 ft: regain 2d4 + 2 HP.'],
	antitoxin: ['bonus', 'Drink: advantage on saves against Poisoned for 1 hour.'],
	"healer's kit": ['action', 'Utilize: stabilize a creature at 0 HP (no check).'],
	'ball bearings': ['action', 'Utilize: 10-ft square, DC 10 Dex save or Prone.'],
	caltrops: ['action', 'Utilize: 5-ft square, DC 15 Dex save or 1 Piercing and Speed 0.'],
	acid: ['action', 'Replaces one attack: 20 ft, Dex save or 2d6 Acid.'],
	"alchemist's fire": ['action', 'Replaces one attack: 20 ft, Dex save or 1d4 Fire and burning.'],
	'holy water': [
		'action',
		'Replaces one attack: 20 ft, Dex save or 2d8 Radiant to a Fiend or Undead.'
	],
	net: ['action', 'Replaces one attack: 15 ft, Dex save or Restrained.'],
	oil: ['action', 'Replaces one attack: 20 ft, Dex save or doused (+5 Fire if it burns).'],
	'poison, basic': [
		'bonus',
		'Coat a weapon or three pieces of ammunition: +1d4 Poison on hits for 1 minute.'
	]
};

const slotOfTime = (time: string): TurnSlot =>
	/^bonus/i.test(time)
		? 'bonus'
		: /^reaction/i.test(time)
			? 'reaction'
			: /^action/i.test(time)
				? 'action'
				: 'long';

export function turnSummary(ch: Character): Record<TurnSlot, TurnEntry[]> {
	const out: Record<TurnSlot, TurnEntry[]> = {
		action: [],
		bonus: [],
		reaction: [],
		onhit: [],
		long: []
	};
	const sc = scores(ch);

	// ---- Attack action
	const n = attacksPerAction(ch);
	const mastered = masteredWeapons(ch);
	const weaponLines = allAttacks(ch)
		.filter((a) => a.kind !== 'spell')
		.map((a) => {
			const r = attack(ch, a, sc);
			const range = a.range ? `, ${a.range} ft` : a.props.includes('Reach') ? ', reach 10 ft' : '';
			const m = a.mastery && mastered.has(a.weapon) ? `, ${a.mastery}` : '';
			const extra =
				r.total !== r.base
					? ` (with ${r.riders
							.filter((x) => x.on)
							.map((x) => x.r.name)
							.join(', ')})`
					: '';
			return `${a.name}: ${signed(r.toHit)} to hit, ${r.total} ${r.types || a.type}${extra}${m}${range}`;
		});
	out.action.push({
		name: n > 1 ? `Attack (${n} attacks)` : 'Attack',
		detail:
			'One weapon attack or Unarmed Strike (damage, Grapple or Shove).' +
			(n > 1 ? ` You make ${n} attacks with one Attack action.` : ''),
		source: 'Attack',
		lines: weaponLines.length ? weaponLines : undefined
	});

	// Light weapons: the extra attack
	const light = allAttacks(ch).filter(
		(a) => (WEAPONS[a.weapon]?.props ?? []).includes('Light') || /\bLight\b/.test(a.props)
	);
	if (light.length >= 2)
		out.bonus.push({
			name: 'Extra attack (Light weapon)',
			detail:
				"After attacking with a Light weapon, attack with a different Light weapon. No ability modifier to its damage unless it's negative (or you have Two-Weapon Fighting). With the Nick mastery it is part of the Attack action instead.",
			source: 'Attack'
		});

	// ---- Spells
	const lib = new Map(allPackSpells().map((s) => [s.name.toLowerCase(), s]));
	const seen = new Set<string>();
	const spellEntry = (
		name: string,
		time: string,
		level: number,
		range: string,
		conc: boolean,
		d: string,
		how?: string
	) => {
		const key = name.toLowerCase();
		if (seen.has(key)) return;
		seen.add(key);
		const slot = slotOfTime(time);
		const atk = allAttacks(ch).filter(
			(a) => a.kind === 'spell' && (a.spell ?? a.name).toLowerCase() === key
		);
		out[slot].push({
			lines: atk.length
				? atk.map((a) => {
						const r = attack(ch, a, sc);
						return `${hitText(a, r)}, ${r.total} ${r.types || a.type}${a.notes ? ` (${a.notes})` : ''}`;
					})
				: undefined,
			name,
			detail:
				`${level === 0 ? 'Cantrip' : `Level ${level}`}${range ? `, ${range}` : ''}${conc ? ', Concentration' : ''}${slot === 'reaction' || slot === 'long' ? ` (${time})` : ''}. ${d}`.trim(),
			source: 'Spell',
			uses: how
		});
	};
	for (const s of ch.spells.list)
		if (s.level === 0 || s.prepared || s.always)
			spellEntry(
				s.name,
				s.time,
				s.level,
				s.range,
				s.conc,
				s.desc || lib.get(s.name.toLowerCase())?.d || ''
			);
	for (const g of grantedSpells(ch)) {
		const d = lib.get(g.name.toLowerCase());
		if (g.kind === 'ritual') continue;
		spellEntry(
			g.name,
			d?.time ?? 'Action',
			d?.level ?? 0,
			d?.range ?? '',
			!!d?.conc,
			d?.d ?? '',
			d?.level === 0 ? undefined : SPELL_KIND_LABEL[g.kind]
		);
	}

	// ---- Features with an action type
	for (const f of features(ch)) {
		if (f.hidden || f.a === 'passive') continue;
		// Already counted in the Attack entry.
		if (/^(Extra Attack|Two Extra Attacks|Three Extra Attacks)$/.test(f.n)) continue;
		const entry: TurnEntry = {
			name: f.n,
			detail: f.d,
			source: f.src,
			uses: f.uses
				? `${f.uses}${f.pool ? ' pool' : '×'}${f.r ? ` per ${f.r === 'long' ? 'Long Rest' : 'Short Rest'}` : ''}`
				: undefined
		};
		out[f.a === 'special' ? 'onhit' : f.a].push(entry);
	}

	// ---- Once-per-turn damage you can add (not tied to a switch)
	for (const r of allRiders(ch, sc)) {
		if (r.state || !r.dmg) continue;
		// A feature of the same name (Brutal Strike, Sneak Attack…) already explains it: just add the damage.
		const same = out.onhit.find((e) => e.name === r.name);
		if (same) {
			same.detail = `+${r.dmg}${r.type ? ` ${r.type}` : ''}. ${same.detail}`;
			continue;
		}
		out.onhit.push({
			name: r.name,
			detail: `+${r.dmg}${r.type ? ` ${r.type}` : ''}. ${r.when}`,
			source: r.auto ? 'Class' : 'Custom'
		});
	}

	// ---- Items
	for (const it of ch.gear.items) {
		const ia = ITEM_ACTIONS[it.name.toLowerCase()];
		if (ia && it.qty > 0)
			out[ia[0]].push({
				name: `${it.name}${it.qty > 1 ? ` (${it.qty})` : ''}`,
				detail: ia[1],
				source: 'Item'
			});
	}

	// ---- Always available
	out.action.push({
		name: 'Magic',
		detail:
			'Cast a spell with a casting time of an action, or use a magic item or magical feature.',
		source: 'Basic'
	});
	for (const [name, d] of BASIC_ACTIONS) out.action.push({ name, detail: d, source: 'Basic' });
	out.reaction.unshift({
		name: 'Opportunity Attack',
		detail: 'When a creature you can see leaves your reach, make one melee attack against it.',
		source: 'Basic'
	});
	return out;
}

export const TURN_LABEL: Record<TurnSlot, string> = {
	action: 'Action',
	bonus: 'Bonus Action',
	reaction: 'Reaction',
	onhit: 'When you hit & other triggers',
	long: 'Outside combat (longer casting)'
};

export const TURN_HINT: Record<TurnSlot, string> = {
	action: 'One per turn, plus your movement.',
	bonus: 'At most one per turn, only if something gives you one.',
	reaction: 'One per round, on your turn or anyone else’s.',
	onhit: 'Part of another action, usually once per turn.',
	long: 'Cast these when there is time.'
};
