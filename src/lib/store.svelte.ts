import type { Attack, AttackExtra, Character, Item, Spell } from './types';
import { ARMOR, WEAPONS } from './data/srd';

export const uid = () => Math.random().toString(36).slice(2, 10);

export function blankCharacter(): Character {
	return {
		id: uid(),
		version: 1,
		updated: Date.now(),
		name: '',
		player: '',
		classId: 'fighter',
		subclassId: '',
		level: 1,
		xp: 0,
		speciesId: 'human',
		lineage: '',
		backgroundId: 'soldier',
		alignment: '',
		custom: {
			className: '',
			hd: 8,
			caster: '',
			castAbil: 'int',
			subclassName: '',
			speciesName: '',
			size: 'Medium',
			speed: 30,
			backgroundName: ''
		},
		abilities: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
		bgAsi: {},
		saveProf: {},
		skills: {},
		overrides: {},
		bonus: {},
		hp: { current: 0, temp: 0 },
		hitDiceUsed: 0,
		death: { s: 0, f: 0 },
		exhaustion: 0,
		inspiration: false,
		prof: { armor: '', weapons: '', tools: '', languages: 'Common', senses: '' },
		attacks: [],
		picks: {},
		choices: {},
		advCustom: [],
		edits: {},
		features: [],
		used: {},
		spells: { ability: '', slotsUsed: [0, 0, 0, 0, 0, 0, 0, 0, 0], pactUsed: 0, list: [] },
		gear: {
			acMisc: 0,
			items: [],
			coins: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 }
		}
	};
}

export function newAttack(p: Partial<Attack> = {}): Attack {
	return {
		id: uid(),
		name: 'New attack',
		weapon: '',
		kind: 'melee',
		ability: 'auto',
		proficient: true,
		dice: '1d6',
		versatile: '',
		twoHanded: false,
		type: '',
		addMod: true,
		magic: 0,
		hitMisc: 0,
		dmgMisc: '',
		mastery: '',
		props: '',
		range: '',
		notes: '',
		riders: {},
		extras: [],
		...p
	};
}

export function newExtra(p: Partial<AttackExtra> = {}): AttackExtra {
	return { id: uid(), dmg: '1d6', type: '', when: '', always: false, ...p };
}

export function newItem(p: Partial<Item> = {}): Item {
	return {
		id: uid(),
		name: '',
		qty: 1,
		weight: 0,
		value: 0,
		location: 'Backpack',
		equipped: false,
		attuned: false,
		magic: false,
		charges: 0,
		chargesMax: 0,
		notes: '',
		kind: 'item',
		...p
	};
}

/** A weapon for the equipment list, from the rules' weapon table (or a blank one). */
export function newWeaponItem(key = '', p: Partial<Item> = {}): Item {
	const w = WEAPONS[key];
	return newItem({
		name: w?.name ?? 'New weapon',
		kind: 'weapon',
		location: 'Worn',
		equipped: true,
		weight: w?.weight ?? 0,
		value: w?.cost ?? 0,
		atk: newAttack(
			w
				? {
						name: w.name,
						weapon: key,
						kind: w.kind,
						dice: w.dice,
						versatile: w.versatile ?? '',
						type: w.type,
						mastery: w.mastery,
						props: w.props.join(', '),
						range: w.range ?? ''
					}
				: { name: 'New weapon' }
		),
		...p
	});
}

/** Armor or a shield for the equipment list, from the rules' armor table (or a blank one). */
export function newArmorItem(key = '', p: Partial<Item> = {}): Item {
	const a = ARMOR[key];
	const shield = key === 'shield';
	return newItem({
		name: shield ? 'Shield' : (a?.name ?? 'New armor'),
		kind: 'armor',
		location: 'Worn',
		equipped: true,
		weight: shield ? 6 : (a?.weight ?? 0),
		value: shield ? 10 : (a?.cost ?? 0),
		armor: shield
			? { type: 'shield', base: 2, dexCap: null, str: 0, stealthDis: false, bonus: 0 }
			: {
					type: a?.type ?? 'light',
					base: a?.base ?? 11,
					dexCap: a ? a.dexCap : null,
					str: a?.str ?? 0,
					stealthDis: !!a?.stealthDis,
					bonus: 0
				},
		...p
	});
}

export function newSpell(p: Partial<Spell> = {}): Spell {
	return {
		id: uid(),
		level: 0,
		name: '',
		school: '',
		desc: '',
		prepared: true,
		always: false,
		time: '1 action',
		range: '',
		duration: 'Instantaneous',
		conc: false,
		ritual: false,
		comp: 'V, S',
		material: '',
		cost: 0,
		consumed: false,
		notes: '',
		...p
	};
}

/** Fill in fields that older saves or hand-written files may lack. */
export function normalize(raw: unknown): Character {
	const base = blankCharacter();
	const o = (raw ?? {}) as Partial<Character>;
	const merge = <T extends object>(a: T, b: unknown): T => ({ ...a, ...((b as object) ?? {}) });
	const ch: Character = {
		...base,
		...o,
		version: 1,
		custom: merge(base.custom, o.custom),
		abilities: merge(base.abilities, o.abilities),
		hp: merge(base.hp, o.hp),
		death: merge(base.death, o.death),
		prof: merge(base.prof, o.prof),
		spells: merge(base.spells, o.spells),
		gear: { ...merge(base.gear, o.gear), coins: merge(base.gear.coins, o.gear?.coins) }
	};
	// Fields from older versions: notes and the situational switches are no longer kept.
	const legacy = ch as Character & { notes?: unknown; active?: unknown };
	delete legacy.notes;
	delete legacy.active;
	ch.attacks = (ch.attacks ?? []).map((a) => newAttack(a));
	ch.gear.items = (ch.gear.items ?? []).map((i) => {
		const it = newItem(i);
		if (it.atk) it.atk = newAttack(it.atk);
		return it;
	});
	migrateEquipment(ch, o as Record<string, unknown>);
	ch.spells.list = (ch.spells.list ?? []).map((s) => newSpell(s));
	while (ch.spells.slotsUsed.length < 9) ch.spells.slotsUsed.push(0);
	ch.level = Math.min(20, Math.max(1, Math.floor(Number(ch.level) || 1)));
	if (!ch.id) ch.id = uid();
	return ch;
}

/**
 * Older saves kept the worn armor, the shield, the weapons (as attacks) and custom damage riders
 * outside the equipment list. Turn them into equipment items.
 */
const appliesTo = (applies: string, a: Attack) =>
	applies === 'all' || (applies === 'weapon' ? a.kind !== 'spell' : applies === a.kind);

function migrateEquipment(ch: Character, raw: Record<string, unknown>) {
	const gear = ch.gear as Character['gear'] & { armor?: string; shield?: boolean };
	const items = ch.gear.items;
	if (gear.armor && ARMOR[gear.armor] && !items.some((i) => i.kind === 'armor'))
		items.push(newArmorItem(gear.armor));
	if (gear.shield && !items.some((i) => i.armor?.type === 'shield'))
		items.push(newArmorItem('shield'));
	delete gear.armor;
	delete gear.shield;
	const riders = (raw.riders ?? []) as {
		name: string;
		dmg: string;
		type: string;
		applies: 'melee' | 'ranged' | 'spell' | 'weapon' | 'all';
		when: string;
		hit: number;
	}[];
	const weapons = ch.attacks.filter((a) => a.kind !== 'spell' && !a.spell);
	for (const a of weapons) {
		// A weapon already in the list by name becomes that weapon; otherwise it is added.
		const same = items.find(
			(i) => i.kind === 'item' && i.name.toLowerCase() === a.name.toLowerCase()
		);
		const it = same ?? newItem({ name: a.name, location: 'Worn' });
		it.kind = 'weapon';
		it.equipped = true;
		it.atk = a;
		if (!same) {
			const w = WEAPONS[a.weapon];
			it.weight = w?.weight ?? 0;
			it.value = w?.cost ?? 0;
			items.push(it);
		}
		for (const r of riders)
			if (r.dmg && appliesTo(r.applies, a))
				a.extras.push(
					newExtra({ dmg: r.dmg, type: r.type, when: [r.name, r.when].filter(Boolean).join(': ') })
				);
	}
	ch.attacks = ch.attacks.filter((a) => !weapons.includes(a));
	delete (ch as Character & { riders?: unknown }).riders;
}

export function sampleCharacter(): Character {
	const ch = blankCharacter();
	Object.assign(ch, {
		name: 'Brenna Stonehelm (example)',
		player: '',
		classId: 'fighter',
		subclassId: 'srd',
		level: 5,
		speciesId: 'dwarf',
		backgroundId: 'soldier',
		alignment: 'Lawful Good',
		abilities: { str: 15, dex: 12, con: 14, int: 10, wis: 13, cha: 8 },
		bgAsi: { str: 2, con: 1 },
		skills: { perception: 1, survival: 1 },
		hp: { current: 49, temp: 0 },
		prof: { armor: '', weapons: '', tools: 'Dice set', languages: 'Common, Dwarvish', senses: '' }
	});
	ch.picks = {
		'Class|1|Fighting Style': { feat: 'gwf' },
		'Class|4|Ability Score Improvement': { feat: 'asi', asi: { str: 2 } }
	};
	ch.gear.items = [
		newArmorItem('chainmail'),
		newWeaponItem('longsword', { notes: 'Versatile: 1d10 in two hands.' }),
		newWeaponItem('greataxe', { notes: 'Great Weapon Fighting: treat 1s and 2s as 3.' }),
		newWeaponItem('javelin', { qty: 4, equipped: false }),
		newItem({
			name: 'Flame Tongue Longsword',
			kind: 'weapon',
			weight: 3,
			value: 0,
			location: 'Worn',
			magic: true,
			attuned: true,
			equipped: false,
			atk: newAttack({
				name: 'Flame Tongue Longsword',
				weapon: 'longsword',
				dice: '1d8',
				versatile: '1d10',
				type: 'Slashing',
				mastery: 'Sap',
				props: 'Versatile',
				extras: [
					newExtra({
						dmg: '2d6',
						type: 'Fire',
						when: 'while ignited (Bonus Action)',
						always: false
					})
				]
			}),
			notes: 'Example custom weapon with extra damage.'
		}),
		newItem({
			name: "Healer's Kit",
			weight: 3,
			value: 5,
			location: 'Backpack',
			charges: 10,
			chargesMax: 10
		}),
		newItem({ name: 'Rations (1 day)', qty: 5, weight: 2, value: 0.5, location: 'Backpack' }),
		newItem({
			name: 'Potion of Healing',
			qty: 2,
			weight: 0.5,
			value: 50,
			location: 'Belt pouch',
			magic: true,
			notes: '2d4 + 2 HP, Bonus Action'
		}),
		newItem({
			name: 'Cloak of Protection',
			weight: 1,
			value: 0,
			location: 'Worn',
			magic: true,
			attuned: true,
			equipped: true,
			notes: '+1 AC and saving throws (counted in Other AC)'
		})
	];
	ch.gear.acMisc = 1;
	ch.gear.coins = { cp: 12, sp: 30, ep: 0, gp: 64, pp: 0 };
	return ch;
}

// ---------- Persistence ----------

const KEY = 'hero-ledger:characters';
const CUR = 'hero-ledger:current';

export const app = $state<{ chars: Character[]; currentId: string }>({ chars: [], currentId: '' });

export function initStore() {
	let chars: Character[] = [];
	let cur = '';
	try {
		const raw = localStorage.getItem(KEY);
		if (raw) chars = (JSON.parse(raw) as unknown[]).map(normalize);
		cur = localStorage.getItem(CUR) ?? '';
	} catch {
		/* storage unavailable: start fresh */
	}
	if (!chars.length) chars = [sampleCharacter()];
	app.chars = chars;
	app.currentId = chars.some((c) => c.id === cur) ? cur : chars[0].id;
}

let timer: ReturnType<typeof setTimeout> | undefined;
export function persist() {
	clearTimeout(timer);
	timer = setTimeout(() => {
		try {
			localStorage.setItem(KEY, JSON.stringify(app.chars));
			localStorage.setItem(CUR, app.currentId);
		} catch {
			/* storage full or blocked */
		}
	}, 300);
}

export function addCharacter(ch: Character) {
	app.chars.push(ch);
	app.currentId = ch.id;
}

export function deleteCharacter(id: string) {
	app.chars = app.chars.filter((c) => c.id !== id);
	if (!app.chars.length) app.chars = [blankCharacter()];
	if (!app.chars.some((c) => c.id === app.currentId)) app.currentId = app.chars[0].id;
}
