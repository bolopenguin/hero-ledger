import { describe, expect, it } from 'vitest';
import { PDFDocument, PDFTextField, PDFCheckBox } from 'pdf-lib';
import {
	allOptions,
	availableStates,
	armorClass,
	extraTraining,
	masteredWeapons,
	attack,
	autoRiders,
	features,
	grantedSpells,
	hpMax,
	initiative,
	makeCtx,
	saves,
	scores,
	skills,
	speed,
	spellcasting
} from './calc';
import { installPack, removePack } from './packs.svelte';
import { avgDice, evalFormula, fillTemplate, formatDice, parseDice } from './formula';
import { blankCharacter, newAttack, newSpell, sampleCharacter } from './store.svelte';
import { buildPdf } from './pdf/export';
import { readPdf } from './pdf/import';
import { CLASSES } from './data/classes';
import { attacksPerAction, classStats } from './classStats';
import { turnSummary } from './turn';
import { CLASS_STARTING, GEAR_BY_NAME, parseBackgroundEquipment } from './data/equipment';

describe('formulas and dice', () => {
	const c = { l: 5, pb: 3, m: (ab: string) => (ab === 'wis' ? 2 : 0) } as Parameters<
		typeof evalFormula
	>[1];
	it('evaluates formulas', () => {
		expect(evalFormula('max(1, wis)', c)).toBe(2);
		expect(evalFormula('8 + wis + pb', c)).toBe(13);
		expect(evalFormula('ceil(lvl / 2)', c)).toBe(3);
		expect(evalFormula('nonsense(', c)).toBeNull();
		expect(evalFormula('4 + 2 * (lvl >= 5) + 2 * (lvl >= 9)', c)).toBe(6);
		expect(fillTemplate('DC {8 + wis + pb}', c)).toBe('DC 13');
	});
	it('parses and averages dice', () => {
		expect(avgDice(parseDice('2d6+3')!)).toBe(10);
		expect(formatDice(parseDice('1d8+1d8+2-1')!)).toBe('2d8 + 1');
		expect(parseDice('1x8')).toBeNull();
	});
});

describe('sample fighter (level 5 Champion, dwarf)', () => {
	const ch = sampleCharacter();
	const sc = scores(ch);
	it('applies background and ASI to scores', () => {
		expect(sc.str.total).toBe(19); // 15 + 2 bg + 2 ASI
		expect(sc.con.total).toBe(15);
	});
	it('derives core numbers', () => {
		expect(makeCtx(ch, sc).pb).toBe(3);
		expect(saves(ch, sc).str.value).toBe(7);
		expect(skills(ch, sc).athletics.value).toBe(7); // background skill
		expect(armorClass(ch, sc).value).toBe(17); // chain mail 16 + cloak 1
		expect(initiative(ch, sc)).toBe(1);
		// d10: 10 + 6*4 + con(+2)*5 + dwarf 5
		expect(hpMax(ch, sc)).toBe(49);
	});
	it('applies Expertise as double proficiency', () => {
		const c2 = sampleCharacter();
		c2.skills.athletics = 2; // background skill raised to Expertise
		c2.skills.stealth = 2;
		const sk = skills(c2, scores(c2));
		expect(sk.athletics.value).toBe(4 + 6);
		expect(sk.stealth.value).toBe(1 + 6);
		expect(sk.athletics.prof).toBe(2);
	});
	it('computes attacks with riders and crit range', () => {
		const ls = attack(ch, ch.attacks[0], sc);
		expect(ls.toHit).toBe(7);
		expect(ls.base).toBe('1d8 + 4');
		expect(ls.critOn).toBe(19);
		ch.attacks[0].twoHanded = true;
		ch.attacks[0].riders[ch.riders[0].id] = true;
		const two = attack(ch, ch.attacks[0], sc);
		expect(two.total).toBe('1d10 + 2d6 + 4');
		expect(two.crit).toBe('2d10 + 4d6 + 4');
	});
	it('lists features by level with the chosen feats', () => {
		const f = features(ch);
		expect(f.some((x) => x.n === 'Improved Critical' && x.src === 'Subclass')).toBe(true);
		expect(f.some((x) => x.n === 'Great Weapon Fighting' && x.src === 'Feat')).toBe(true);
		expect(f.find((x) => x.n === 'Second Wind')?.uses).toBe(3);
		expect(f.every((x) => x.l <= 5)).toBe(true);
	});
});

describe('every class builds at every level', () => {
	it('has features and sane numbers', () => {
		for (const id of Object.keys(CLASSES))
			for (let l = 1; l <= 20; l++) {
				const ch = blankCharacter();
				ch.classId = id;
				ch.subclassId = l >= 3 ? 'srd' : '';
				ch.level = l;
				const f = features(ch);
				expect(f.length).toBeGreaterThan(0);
				for (const x of f) expect(typeof x.d).toBe('string');
				expect(hpMax(ch)).toBeGreaterThan(0);
				const s = spellcasting(ch);
				expect(s.slots.length).toBe(9);
			}
	});
	it('rogue sneak attack scales', () => {
		const ch = blankCharacter();
		ch.classId = 'rogue';
		ch.level = 9;
		ch.attacks = [
			newAttack({ weapon: 'rapier', dice: '1d8', props: 'Finesse', riders: { 'auto:sneak': true } })
		];
		expect(attack(ch, ch.attacks[0]).total).toContain('5d6');
	});
});

describe('PDF round trip', () => {
	it('exports, accepts edits made in a PDF reader, and loads back', async () => {
		const ch = sampleCharacter();
		const bytes = await buildPdf(ch, []);
		expect(bytes.length).toBeGreaterThan(5000);

		// Simulate a player filling the PDF in a reader.
		const doc = await PDFDocument.load(bytes);
		const form = doc.getForm();
		const fields = form.getFields();
		const text = fields.filter((f) => f instanceof PDFTextField) as PDFTextField[];
		const hp = text.find((f) => f.getText() === String(ch.hp.current))!;
		hp.setText('31');
		const notes = text.find((f) => f.getText() === ch.notes.backstory)!;
		notes.setText('Rewritten at the table.');
		const boxes = fields.filter((f) => f instanceof PDFCheckBox) as PDFCheckBox[];
		boxes.forEach((b) => b.uncheck());
		const edited = await doc.save();

		const r = await readPdf(
			edited.buffer.slice(edited.byteOffset, edited.byteOffset + edited.byteLength) as ArrayBuffer
		);
		expect(r.character.name).toBe(ch.name);
		expect(r.character.hp.current).toBe(31);
		expect(r.character.notes.backstory).toBe('Rewritten at the table.');
		expect(r.character.attacks.length).toBe(3);
		expect(r.changedFields).toBeGreaterThan(10);
	});
	it('rejects PDFs without character data', async () => {
		const doc = await PDFDocument.create();
		doc.addPage();
		const b = await doc.save();
		await expect(readPdf(b.buffer as ArrayBuffer)).rejects.toThrow(/no character data/);
	});
});

describe('always-prepared spells, feat effects and option choices', () => {
	it('reads domain spells and explicit grants by level', () => {
		const ch = blankCharacter();
		ch.classId = 'cleric';
		ch.subclassId = 'srd';
		ch.level = 5;
		const names = grantedSpells(ch).map((g) => g.name);
		expect(names).toEqual(
			expect.arrayContaining(['Aid', 'Bless', 'Mass Healing Word', 'Revivify'])
		);
		expect(names).not.toContain('Death Ward'); // level 7
		const r = blankCharacter();
		r.classId = 'ranger';
		expect(grantedSpells(r).map((g) => g.name)).toContain("Hunter's Mark");
		const t = blankCharacter();
		t.speciesId = 'tiefling';
		t.lineage = 'infernal';
		t.level = 3;
		expect(grantedSpells(t).map((g) => g.name)).toEqual(
			expect.arrayContaining(['Fire Bolt', 'Hellish Rebuke', 'Thaumaturgy'])
		);
	});

	it('applies feat effects and option list choices from a pack', () => {
		installPack({
			id: 'test-pack',
			name: 'Test pack',
			feats: {
				sturdy: {
					name: 'Sturdy',
					cat: 'general',
					abilities: ['con'],
					hp: 2,
					speed: 10,
					saveFromAsi: true,
					d: 'x',
					rider: { name: 'Bonk', dmg: '{pb}', type: '', hit: 0, applies: 'melee', when: 'always' }
				}
			},
			options: {
				invocations: {
					label: 'Eldritch Invocations',
					items: { mask: { name: 'Mask', d: 'Disguise', l: 2, spells: ['Disguise Self'] } }
				}
			}
		});
		const ch = blankCharacter();
		ch.classId = 'fighter';
		ch.level = 4;
		const base = { hp: hpMax(ch), speed: speed(ch), con: saves(ch).con.prof };
		ch.picks['Class|4|Ability Score Improvement'] = {
			feat: 'pack:test-pack:sturdy',
			asi: { con: 1 }
		};
		expect(hpMax(ch)).toBe(base.hp + 8 + 4); // +2/level, and Con 13 -> 14 raises the mod by 1
		expect(speed(ch)).toBe(base.speed + 10);
		expect(saves(ch).con.prof).toBe(true);
		expect(autoRiders(ch).some((r) => r.name === 'Bonk' && r.dmg === '2')).toBe(true);
		// ASI instead of the feat removes the effects
		ch.picks['Class|4|Ability Score Improvement'] = { feat: 'asi', asi: { str: 2 } };
		expect(speed(ch)).toBe(base.speed);

		const w = blankCharacter();
		w.classId = 'warlock';
		w.level = 2;
		const inv = features(w).find((f) => f.n === 'Eldritch Invocations')!;
		expect(inv.choose).toEqual({ list: 'invocations', count: 3 });
		w.choices[inv.key] = ['mask'];
		expect(grantedSpells(w).map((g) => g.name)).toContain('Disguise Self');
		removePack('test-pack');
	});
});

describe('class choices with real effects', () => {
	it('Divine Order, Blessed Strikes and Expertise change the sheet', () => {
		const ch = blankCharacter();
		ch.classId = 'cleric';
		ch.level = 7;
		ch.abilities.wis = 16;
		const order = features(ch).find((f) => f.n === 'Divine Order')!;
		ch.choices[order.key] = ['thaumaturge'];
		expect(spellcasting(ch).cantrips).toBe(5); // 4 at level 7, +1 Thaumaturge
		expect(skills(ch).religion.value).toBe(1 + 3); // Int +1 (12) + Wis mod 3
		ch.choices[order.key] = ['protector'];
		expect(extraTraining(ch).armor).toContain('heavy');
		const strikes = features(ch).find((f) => f.n === 'Blessed Strikes')!;
		expect(autoRiders(ch).some((r) => r.name === 'Divine Strike')).toBe(false);
		ch.choices[strikes.key] = ['divine-strike'];
		expect(autoRiders(ch).find((r) => r.name === 'Divine Strike')?.dmg).toBe('1d8');

		const rogue = blankCharacter();
		rogue.classId = 'rogue';
		const exp = features(rogue).find((f) => f.n === 'Expertise')!;
		rogue.choices[exp.key] = ['stealth'];
		expect(skills(rogue).stealth.prof).toBe(2);
	});

	it('Weapon Mastery is limited by class and gates attack masteries', () => {
		const ch = blankCharacter();
		ch.classId = 'barbarian';
		const wm = features(ch).find((f) => f.n === 'Weapon Mastery')!;
		expect(wm.choose?.count).toBe(2);
		const list = allOptions(ch)['weapon-mastery'].items;
		expect(list.greataxe).toBeTruthy();
		expect(list.longbow).toBeUndefined(); // Barbarians master melee weapons only
		ch.choices[wm.key] = ['greataxe'];
		expect(masteredWeapons(ch).has('greataxe')).toBe(true);
		expect(masteredWeapons(ch).has('longsword')).toBe(false);
	});

	it('Circle of the Land and Mystic Arcanum give the right spells', () => {
		const d = blankCharacter();
		d.classId = 'druid';
		d.subclassId = 'srd';
		d.level = 5;
		const land = features(d).find((f) => f.n === 'Circle of the Land Spells')!;
		d.choices[land.key] = ['polar'];
		const names = grantedSpells(d).map((g) => g.name);
		expect(names).toEqual(
			expect.arrayContaining(['Fog Cloud', 'Hold Person', 'Ray of Frost', 'Sleet Storm'])
		);
		expect(names).not.toContain('Ice Storm');

		installPack({
			id: 'arc',
			name: 'arc',
			spells: [
				{
					name: 'Circle of Death',
					level: 6,
					school: 'Necromancy',
					time: 'Action',
					range: '150 feet',
					comp: 'V, S, M',
					duration: 'Instantaneous',
					conc: false,
					ritual: false,
					classes: ['Warlock', 'Wizard'],
					d: 'x'
				}
			]
		});
		const w = blankCharacter();
		w.classId = 'warlock';
		w.level = 11;
		const arc = features(w).find((f) => f.n === 'Mystic Arcanum (level 6 spell)')!;
		w.choices[arc.key] = ['circle-of-death'];
		expect(grantedSpells(w).find((g) => g.name === 'Circle of Death')?.kind).toBe('free');
		removePack('arc');
	});

	it('lineage level 3+ spells are free once per rest', () => {
		const t = blankCharacter();
		t.speciesId = 'tiefling';
		t.lineage = 'infernal';
		t.level = 5;
		const g = grantedSpells(t);
		expect(g.find((x) => x.name === 'Hellish Rebuke')?.kind).toBe('free');
		expect(g.find((x) => x.name === 'Fire Bolt')?.kind).toBe('prepared');
	});
});

describe('class tab and equipment', () => {
	it('builds key numbers for every class at every level', () => {
		for (const id of Object.keys(CLASSES))
			for (let l = 1; l <= 20; l++) {
				const ch = blankCharacter();
				ch.classId = id;
				ch.subclassId = l >= 3 ? 'srd' : '';
				ch.level = l;
				const st = classStats(ch);
				for (const s of st) expect(s.value).not.toMatch(/undefined|NaN/);
				expect(attacksPerAction(ch)).toBeGreaterThan(0);
			}
	});
	it('parses background equipment and every class option uses known items', () => {
		const o = parseBackgroundEquipment(
			"2 Daggers, Thieves' Tools, Parchment (8 sheets), 20 Arrows, 16 GP — or 50 GP"
		);
		expect(o[0].items).toEqual([
			['Dagger', 2],
			["Thieves' Tools", 1],
			['Parchment', 8],
			['Arrows', 1]
		]);
		expect(o[0].gp).toBe(16);
		expect(o[1].gp).toBe(50);
		const unknown = Object.values(CLASS_STARTING)
			.flatMap((opts) => opts.flatMap((op) => op.items.map(([n]) => n)))
			.filter((n) => !GEAR_BY_NAME.has(n.toLowerCase()) && !/your|occult/i.test(n));
		expect(unknown).toEqual([]);
	});
});

describe('situational switches', () => {
	it('Rage and Reckless drive riders; Unarmored and spells change AC', () => {
		const ch = blankCharacter();
		ch.classId = 'barbarian';
		ch.subclassId = 'srd';
		ch.level = 5;
		ch.abilities = { str: 16, dex: 14, con: 16, int: 10, wis: 10, cha: 8 };
		ch.gear.armor = 'hide';
		ch.attacks = [
			newAttack({ name: 'Greataxe', weapon: 'greataxe', dice: '1d12', props: 'Heavy, Two-Handed' })
		];
		const ids = availableStates(ch).map((s) => s.id);
		expect(ids).toEqual(expect.arrayContaining(['rage', 'reckless', 'unarmored']));
		expect(ids).not.toContain('hunters-mark');
		expect(attack(ch, ch.attacks[0]).total).toBe('1d12 + 3');
		ch.active = { rage: true };
		expect(attack(ch, ch.attacks[0]).total).toBe('1d12 + 5');
		ch.active = { rage: true, reckless: true };
		expect(attack(ch, ch.attacks[0]).total).toBe('1d12 + 2d6 + 5'); // Frenzy
		ch.active = { reckless: true };
		expect(attack(ch, ch.attacks[0]).total).toBe('1d12 + 3'); // Frenzy needs Rage too
		expect(armorClass(ch).value).toBe(14); // Hide 12 + Dex 2
		ch.active = { unarmored: true };
		expect(armorClass(ch).value).toBe(15); // 10 + Dex 2 + Con 3
	});

	it("Hunter's Mark, Mage Armor, Shield and Innate Sorcery", () => {
		const r = blankCharacter();
		r.classId = 'ranger';
		r.attacks = [newAttack({ name: 'Longbow', weapon: 'longbow', kind: 'ranged', dice: '1d8' })];
		expect(attack(r, r.attacks[0]).total).not.toContain('1d6');
		r.active = { 'hunters-mark': true };
		expect(attack(r, r.attacks[0]).total).toContain('1d6');

		const w = blankCharacter();
		w.classId = 'wizard';
		w.spells.list = [
			newSpell({ name: 'Mage Armor', level: 1 }),
			newSpell({ name: 'Shield', level: 1 })
		];
		const base = armorClass(w).value;
		w.active = { 'mage-armor': true };
		expect(armorClass(w).value).toBe(base + 3);
		w.active = { 'mage-armor': true, 'shield-spell': true };
		expect(armorClass(w).value).toBe(base + 8);

		const s = blankCharacter();
		s.classId = 'sorcerer';
		const dc = spellcasting(s).dc;
		s.active = { 'innate-sorcery': true };
		expect(spellcasting(s).dc).toBe(dc + 1);
	});
});

describe('your turn summary', () => {
	it('groups attacks, features, spells and items by action type', () => {
		const ch = sampleCharacter();
		ch.spells.list = [
			newSpell({ name: 'Shield', level: 1, time: 'Reaction (when hit)', prepared: true }),
			newSpell({ name: 'Misty Step', level: 2, time: 'Bonus Action', prepared: true }),
			newSpell({ name: 'Fire Bolt', level: 0, time: 'Action' }),
			newSpell({ name: 'Alarm', level: 1, time: '1 minute', prepared: false })
		];
		const t = turnSummary(ch);
		const names = (slot: keyof typeof t) => t[slot].map((e) => e.name);
		expect(names('action')).toEqual(
			expect.arrayContaining(['Attack (2 attacks)', 'Fire Bolt', 'Dash', 'Dodge'])
		);
		expect(names('action')).not.toContain('Extra Attack');
		expect(names('bonus')).toEqual(
			expect.arrayContaining(['Second Wind', 'Misty Step', 'Potion of Healing (2)'])
		);
		expect(names('reaction')).toEqual(expect.arrayContaining(['Opportunity Attack', 'Shield']));
		expect(names('onhit')).toContain('Action Surge');
		expect(names('long')).not.toContain('Alarm'); // not prepared
		expect(t.action[0].lines?.[0]).toBe('Longsword: +7 to hit, 1d8 + 4 Slashing');
	});
});

describe('switches in the PDF', () => {
	it('exports the switches as set in the app', async () => {
		const ch = blankCharacter();
		ch.classId = 'wizard';
		ch.spells.list = [
			newSpell({ name: 'Mage Armor', level: 1 }),
			newSpell({ name: 'Shield', level: 1 })
		];
		ch.active = { 'mage-armor': true, 'shield-spell': true };
		const bytes = await buildPdf(ch, []);
		const r = await readPdf(
			bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
		);
		expect(r.character.active['mage-armor']).toBe(true);
		expect(r.character.active['shield-spell']).toBe(true);
		ch.active = {};
		const b2 = await buildPdf(ch, []);
		const r2 = await readPdf(
			b2.buffer.slice(b2.byteOffset, b2.byteOffset + b2.byteLength) as ArrayBuffer
		);
		expect(r2.character.active['mage-armor']).toBeFalsy();
	});
});

describe('turn summary follows switches', () => {
	it('includes active riders in the weapon line', () => {
		const ch = blankCharacter();
		ch.classId = 'barbarian';
		ch.level = 5;
		ch.abilities = { str: 16, dex: 14, con: 16, int: 10, wis: 10, cha: 8 };
		ch.attacks = [
			newAttack({ name: 'Greataxe', weapon: 'greataxe', dice: '1d12', type: 'Slashing' })
		];
		ch.active = { rage: true };
		expect(turnSummary(ch).action[0].lines?.[0]).toBe(
			'Greataxe: +6 to hit, 1d12 + 5 Slashing (with Rage)'
		);
	});
});
