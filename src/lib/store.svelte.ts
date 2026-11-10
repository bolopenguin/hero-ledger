import type { Attack, Character, Item, Spell } from './types';

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
		riders: [],
		picks: {},
		choices: {},
		active: {},
		advCustom: [],
		edits: {},
		features: [],
		used: {},
		spells: { ability: '', slotsUsed: [0, 0, 0, 0, 0, 0, 0, 0, 0], pactUsed: 0, list: [] },
		gear: {
			armor: '',
			shield: false,
			acMisc: 0,
			items: [],
			coins: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 }
		},
		notes: {
			appearance: '',
			personality: '',
			ideals: '',
			bonds: '',
			flaws: '',
			backstory: '',
			allies: '',
			other: ''
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
		...p
	};
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
		...p
	};
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
		gear: { ...merge(base.gear, o.gear), coins: merge(base.gear.coins, o.gear?.coins) },
		notes: merge(base.notes, o.notes)
	};
	ch.attacks = (ch.attacks ?? []).map((a) => newAttack(a));
	ch.gear.items = (ch.gear.items ?? []).map((i) => newItem(i));
	ch.spells.list = (ch.spells.list ?? []).map((s) => newSpell(s));
	while (ch.spells.slotsUsed.length < 9) ch.spells.slotsUsed.push(0);
	ch.level = Math.min(20, Math.max(1, Math.floor(Number(ch.level) || 1)));
	if (!ch.id) ch.id = uid();
	return ch;
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
	ch.attacks = [
		newAttack({
			name: 'Longsword',
			weapon: 'longsword',
			dice: '1d8',
			versatile: '1d10',
			type: 'Slashing',
			mastery: 'Sap',
			props: 'Versatile'
		}),
		newAttack({
			name: 'Greataxe',
			weapon: 'greataxe',
			dice: '1d12',
			type: 'Slashing',
			mastery: 'Cleave',
			props: 'Heavy, Two-Handed',
			notes: 'Great Weapon Fighting: treat 1s and 2s as 3.'
		}),
		newAttack({
			name: 'Javelin',
			weapon: 'javelin',
			dice: '1d6',
			type: 'Piercing',
			mastery: 'Slow',
			props: 'Thrown',
			range: '30/120',
			kind: 'melee'
		})
	];
	ch.riders = [
		{
			id: uid(),
			name: 'Flame Tongue command word',
			dmg: '2d6',
			type: 'Fire',
			hit: 0,
			applies: 'melee',
			when: 'Bonus Action to ignite (example custom rider)'
		}
	];
	ch.gear.armor = 'chainmail';
	ch.gear.shield = false;
	ch.gear.items = [
		newItem({ name: 'Longsword', weight: 3, value: 15, location: 'Worn', equipped: true }),
		newItem({ name: 'Greataxe', weight: 7, value: 30, location: 'Worn', equipped: true }),
		newItem({ name: 'Javelin', qty: 4, weight: 2, value: 0.5, location: 'Worn' }),
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
			notes: '+1 AC and saving throws'
		})
	];
	ch.gear.acMisc = 1;
	ch.gear.coins = { cp: 12, sp: 30, ep: 0, gp: 64, pp: 0 };
	ch.notes.appearance =
		'Broad-shouldered, braided copper beard, a notched shield-maiden tattoo on the left forearm.';
	ch.notes.backstory =
		'Served ten years in the Ironwatch garrison before her company was disbanded. Now she sells her axe to whoever pays in honest coin.';
	ch.notes.personality = 'Blunt and steady. Hums marching songs when nervous.';
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
