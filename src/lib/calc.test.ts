import { describe, expect, it } from 'vitest';
import { PDFDocument, PDFCheckBox } from 'pdf-lib';
import {
	allOptions,
	availableStates,
	armorClass,
	extraTraining,
	masteredWeapons,
	attack,
	attackFromSpell,
	hitText,
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
	startingChoices,
	startingToolChoices,
	backgroundTool,
	stateSummary,
	toolProficiencies,
	spellcasting
} from './calc';
import {
	installPack,
	recapAddsNothing,
	removePack,
	rulesKey,
	rulesText,
	runIn
} from './packs.svelte';
import { avgDice, evalFormula, fillTemplate, formatDice, parseDice } from './formula';
import { blankCharacter, newAttack, newSpell, sampleCharacter } from './store.svelte';
import { buildPdf } from './pdf/export';
import { readEmbedded, readPdf } from './pdf/import';
import { CLASSES } from './data/classes';
import { attacksPerAction, classStats } from './classStats';
import { turnSummary } from './turn';
import { advantages, advForSave, advForSkill, advMarker } from './advantage';

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
		const two = attack(ch, ch.attacks[0], sc);
		// Riders that apply only sometimes are listed with the attack, not added in.
		expect(two.total).toBe('1d10 + 4');
		expect(two.crit).toBe('2d10 + 4');
		expect(two.riders.find((x) => x.r.id === ch.riders[0].id)?.on).toBe(false);
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
		ch.attacks = [newAttack({ weapon: 'rapier', dice: '1d8', props: 'Finesse' })];
		const sneak = attack(ch, ch.attacks[0]).riders.find((x) => x.r.id === 'auto:sneak');
		expect(sneak?.r.dmg).toBe('5d6');
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
		const ab = (u: Uint8Array) =>
			u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer;
		const map = (await readEmbedded(ab(bytes)))!.fieldMap;
		const hpName = Object.entries(map).find(([, e]) => e.path.join('.') === 'hp.current')![0];
		const hp = form.getTextField(hpName);
		expect(hp.getText() ?? '').toBe(''); // printed empty, to fill in at the table
		hp.setText('31');
		const gpName = Object.entries(map).find(([, e]) => e.path.join('.') === 'gear.coins.gp')![0];
		form.getTextField(gpName).setText('123');
		const boxes = fields.filter((f) => f instanceof PDFCheckBox) as PDFCheckBox[];
		boxes.forEach((b) => b.uncheck());
		const edited = await doc.save();

		const r = await readPdf(
			edited.buffer.slice(edited.byteOffset, edited.byteOffset + edited.byteLength) as ArrayBuffer
		);
		expect(r.character.name).toBe(ch.name);
		expect(r.character.hp.current).toBe(31);
		expect(r.character.gear.coins.gp).toBe(123);
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
		expect(inv.choose).toEqual([
			{ key: inv.key, list: 'invocations', count: 3, grant: undefined, label: undefined }
		]);
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
		expect(wm.choose?.[0].count).toBe(2);
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
});

describe('situational effects', () => {
	it('are listed, not counted: riders under the attack, AC with each effect', () => {
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
		const r = attack(ch, ch.attacks[0]);
		expect(r.total).toBe('1d12 + 3');
		expect(r.riders.filter((x) => !x.on).map((x) => x.r.name)).toEqual(
			expect.arrayContaining(['Rage', 'Frenzy'])
		);
		expect(armorClass(ch).value).toBe(14); // Hide 12 + Dex 2
		expect(armorClass(ch, scores(ch), ['unarmored']).value).toBe(15); // 10 + Dex 2 + Con 3
		const rage = availableStates(ch).find((s) => s.id === 'rage')!;
		expect(stateSummary(ch, rage)).toContain('+2');
	});

	it("Hunter's Mark, Mage Armor, Shield and Innate Sorcery", () => {
		const r = blankCharacter();
		r.classId = 'ranger';
		r.attacks = [newAttack({ name: 'Longbow', weapon: 'longbow', kind: 'ranged', dice: '1d8' })];
		const res = attack(r, r.attacks[0]);
		expect(res.total).not.toContain('1d6');
		expect(res.riders.some((x) => x.r.dmg === '1d6' && !x.on)).toBe(true);

		const w = blankCharacter();
		w.classId = 'wizard';
		w.spells.list = [
			newSpell({ name: 'Mage Armor', level: 1 }),
			newSpell({ name: 'Shield', level: 1 })
		];
		const base = armorClass(w).value;
		expect(armorClass(w, scores(w), ['mage-armor']).value).toBe(base + 3);
		expect(armorClass(w, scores(w), ['mage-armor', 'shield-spell']).value).toBe(base + 8);

		const s = blankCharacter();
		s.classId = 'sorcerer';
		const dc = spellcasting(s).dc;
		const innate = availableStates(s).find((x) => x.id === 'innate-sorcery')!;
		expect(stateSummary(s, innate)).toContain(`spell DC ${dc + 1}`);
	});

	it('a shield adds 2 to AC', () => {
		const ch = blankCharacter();
		ch.classId = 'fighter';
		ch.gear.armor = 'chainmail';
		const base = armorClass(ch).value;
		ch.gear.shield = true;
		expect(armorClass(ch).value).toBe(base + 2);
		expect(armorClass(ch).parts).toContain('Shield +2');
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

describe('choices on features and feats', () => {
	it('Druidic Warrior asks for two Druid cantrips', () => {
		installPack({
			id: 'cantrips',
			name: 'Cantrips',
			spells: [
				{
					name: 'Guidance',
					level: 0,
					school: 'Divination',
					time: '',
					range: '',
					comp: '',
					duration: '',
					conc: true,
					ritual: false,
					classes: ['Druid', 'Cleric'],
					d: ''
				},
				{
					name: 'Thorn Whip',
					level: 0,
					school: 'Transmutation',
					time: '',
					range: '',
					comp: '',
					duration: '',
					conc: false,
					ritual: false,
					classes: ['Druid'],
					d: ''
				}
			]
		});
		const ch = blankCharacter();
		ch.classId = 'ranger';
		ch.level = 2;
		const style = features(ch).find((f) => f.n === 'Fighting Style')!;
		ch.picks[style.key] = { feat: 'druidic-warrior', asi: {} };
		const all = features(ch);
		const i = all.findIndex((f) => f.key === style.key);
		const warrior = all[i + 1]; // the chosen feat follows its picker
		expect(warrior.n).toBe('Druidic Warrior');
		expect(warrior.choose?.[0]).toMatchObject({ list: 'spells:druid:0', count: 2 });
		ch.choices[warrior.choose![0].key] = ['guidance', 'thorn-whip'];
		expect(grantedSpells(ch).map((g) => g.name)).toEqual(
			expect.arrayContaining(['Guidance', 'Thorn Whip'])
		);
		removePack('cantrips');
	});

	it('Magic Initiate has two choices; Skillful and Skilled give proficiencies', () => {
		const ch = blankCharacter();
		ch.backgroundId = 'sage';
		const mi = features(ch).find((f) => f.n === 'Magic Initiate (Wizard)')!;
		expect(mi.choose?.map((c) => c.list)).toEqual(['spells:wizard:0', 'spells:wizard:1']);
		expect(mi.choose?.[1].key).toBe(`${mi.key}~1`);

		ch.speciesId = 'human';
		const skillful = features(ch).find((f) => f.n === 'Skillful')!;
		ch.choices[skillful.key] = ['stealth'];
		expect(skills(ch).stealth.prof).toBe(1);
		expect(skills(ch).stealth.fromFeature).toBe('Skillful');
	});

	it('background tool choices fill the tool proficiencies', () => {
		const ch = blankCharacter();
		ch.backgroundId = 'soldier';
		const cd = startingToolChoices(ch).find((x) => x.key === 'tools:background')!;
		expect(cd.list).toBe('tools:gaming');
		const first = Object.keys(allOptions(ch)['tools:gaming'].items)[0];
		ch.choices[cd.key] = [first];
		expect(toolProficiencies(ch)).toContain(allOptions(ch)['tools:gaming'].items[first].name);
	});
});

describe('backgrounds with choices', () => {
	it('a custom background asks for two skills, a tool and an Origin feat', () => {
		const ch = blankCharacter();
		ch.backgroundId = 'custom';
		const sc = startingChoices(ch);
		expect(sc.find((x) => x.key === 'skills:background')).toMatchObject({
			list: 'skills',
			count: 2
		});
		expect(sc.find((x) => x.key === 'tools:background')?.list).toBe('tools:any');
		ch.choices['skills:background'] = ['arcana', 'stealth'];
		expect(skills(ch).arcana.prof).toBe(1);
		expect(skills(ch).stealth.fromFeature).toBe('Custom background');
		expect(features(ch).some((f) => f.n === 'Origin Feat' && f.pick === 'origin')).toBe(true);
	});

	it('pack backgrounds can offer two feats, a skill choice and "X or Y" tools', () => {
		installPack({
			id: 'bgs',
			name: 'Backgrounds',
			backgrounds: {
				spy: {
					name: 'Spy',
					abilities: ['dex', 'int', 'cha'],
					freeAsi: true,
					feat: '',
					feats: ['alert', 'skilled'],
					skills: ['stealth'],
					skillChoice: { from: ['deception', 'insight'] },
					tool: 'Disguise Kit or one kind of Gaming Set',
					equipment: ''
				}
			}
		});
		const ch = blankCharacter();
		ch.backgroundId = 'pack:bgs:spy';
		const pick = features(ch).find((f) => f.n === 'Origin Feat')!;
		expect(pick.pickFrom).toEqual(['alert', 'skilled']);
		const tool = startingChoices(ch).find((x) => x.key === 'tools:background')!;
		expect(tool.list).toBe('toolset:disguise-kit|tools:gaming');
		ch.choices[tool.key] = ['disguise-kit'];
		expect(toolProficiencies(ch)).toContain('Disguise Kit');
		expect(backgroundTool(ch)).toBe('Disguise Kit');
		ch.choices['skills:background'] = ['insight'];
		expect(skills(ch).insight.prof).toBe(1);
		expect(skills(ch).stealth.fromBg).toBe(true);
		removePack('bgs');
	});
});

describe('rules details', () => {
	it('Rage regains one use per Short Rest; Bardic Inspiration recovers on Short Rests from level 5', () => {
		const b = blankCharacter();
		b.classId = 'barbarian';
		expect(features(b).find((f) => f.n === 'Rage')?.r).toBe('short1');
		const bard = blankCharacter();
		bard.classId = 'bard';
		bard.level = 4;
		expect(features(bard).find((f) => f.n === 'Bardic Inspiration')?.r).toBe('long');
		bard.level = 5;
		expect(features(bard).find((f) => f.n === 'Bardic Inspiration')?.r).toBe('short');
	});

	it("initiative adds a Bard's Jack of All Trades, but not on top of Alert", () => {
		const ch = blankCharacter();
		ch.classId = 'bard';
		ch.level = 6; // PB +3
		ch.abilities.dex = 14;
		expect(initiative(ch)).toBe(2 + 1);
		ch.level = 1;
		expect(initiative(ch)).toBe(2);
	});

	it('heavy armor you are too weak for slows you by 10 ft', () => {
		const ch = blankCharacter();
		ch.classId = 'fighter';
		ch.abilities.str = 10;
		ch.gear.armor = 'chainmail'; // Str 13
		expect(speed(ch)).toBe(20);
		ch.abilities.str = 13;
		expect(speed(ch)).toBe(30);
		ch.gear.armor = 'ringmail'; // no Strength requirement
		ch.abilities.str = 8;
		expect(speed(ch)).toBe(30);
	});

	it('a Forest Gnome casts Speak with Animals without a slot', () => {
		const ch = blankCharacter();
		ch.speciesId = 'gnome';
		ch.lineage = 'forest';
		const g = grantedSpells(ch);
		expect(g.find((x) => x.name === 'Speak with Animals')?.kind).toBe('free');
		expect(g.some((x) => x.name === 'Minor Illusion')).toBe(true);
	});

	it('a recap that only repeats the full text is recognised', () => {
		const full = 'You gain Heroic Inspiration whenever you finish a Long Rest.';
		expect(recapAddsNothing(full, full)).toBe(true);
		expect(
			recapAddsNothing(
				'Proficiency in one skill of your choice.',
				'You gain proficiency in one skill of your choice.'
			)
		).toBe(true);
		// a number worked out for your level is worth keeping
		expect(
			recapAddsNothing(
				'Bonus Action: regain 1d10 + 11 HP.',
				'As a Bonus Action, regain Hit Points equal to 1d10 plus your Fighter level.'
			)
		).toBe(false);
	});
});

describe('advantage and disadvantage', () => {
	it('collects sources and marks skills and saves', () => {
		const ch = blankCharacter();
		ch.classId = 'barbarian';
		ch.level = 7;
		ch.speciesId = 'gnome';
		ch.gear.armor = 'scale';
		const adv = advantages(ch);
		expect(advMarker(advForSave(adv, 'wis'))?.text).toBe('ADV'); // Gnomish Cunning
		expect(advMarker(advForSave(adv, 'dex'))?.text).toBe('adv*'); // Danger Sense, conditional
		expect(advMarker(advForSkill(adv, 'stealth'))?.text).toBe('DIS'); // Scale Mail
		expect(advMarker(advForSkill(adv, 'athletics'))?.text).toBe('adv*'); // only while raging
		ch.advCustom = [{ id: 'x', target: 'perception', mode: 'adv', cond: '' }];
		expect(advMarker(advForSkill(advantages(ch), 'perception'))?.text).toBe('ADV');
	});
});

describe('class structure', () => {
	it('every subclass level has a slot in the class features', () => {
		for (const [id, cls] of Object.entries(CLASSES)) {
			const slots = cls.features.filter((f) => f.subslot).map((f) => f.l);
			expect(slots, id).toEqual(cls.subLevels);
		}
	});
	it('gives the Life Domain its level 17 feature', () => {
		const ch = blankCharacter();
		ch.classId = 'cleric';
		ch.subclassId = 'srd';
		ch.level = 17;
		expect(features(ch).some((f) => f.n === 'Supreme Healing')).toBe(true);
	});
});

describe('spell attacks', () => {
	const fireBolt = {
		name: 'Fire Bolt',
		level: 0,
		school: 'Evocation',
		time: 'Action',
		range: '120 feet',
		comp: 'V, S',
		duration: 'Instantaneous',
		conc: false,
		ritual: false,
		classes: ['Wizard'],
		d: 'Ranged spell attack: 1d10 Fire.',
		higher: '2d10 at level 5, 3d10 at 11, 4d10 at 17.'
	};
	it('scales cantrip dice with level and uses the spell attack bonus', () => {
		const ch = blankCharacter();
		ch.classId = 'wizard';
		ch.level = 11;
		ch.abilities.int = 16;
		const a = newAttack(attackFromSpell(ch, fireBolt)!);
		const r = attack(ch, a);
		expect(r.base).toBe('3d10');
		expect(r.toHit).toBe(3 + 4);
		expect(a.range).toBe('120 ft');
	});
	it('shows a save DC for save spells', () => {
		const ch = blankCharacter();
		ch.classId = 'cleric';
		ch.level = 5;
		ch.abilities.wis = 16;
		const d = {
			...fireBolt,
			name: 'Sacred Flame',
			d: 'Dex save or 1d8 Radiant.',
			higher: '2d8 at level 5.'
		};
		const a = newAttack(attackFromSpell(ch, d)!);
		const r = attack(ch, a);
		expect(a.save).toBe('dex');
		expect(r.dc).toBe(8 + 3 + 3);
		expect(hitText(a, r)).toBe('DC 14 Dex save');
		expect(r.base).toBe('2d8');
	});
	it('skips spells without damage', () => {
		const ch = blankCharacter();
		expect(attackFromSpell(ch, { ...fireBolt, d: 'Whisper a message.' })).toBeNull();
	});
});

describe('warlock pact weapon', () => {
	it('Thirsting Blade gives a second attack', () => {
		const ch = blankCharacter();
		ch.classId = 'warlock';
		ch.level = 5;
		installPack({
			id: 'inv-test',
			name: 'Invocations',
			options: {
				invocations: {
					label: 'Invocations',
					items: { 'thirsting-blade': { name: 'Thirsting Blade', d: 'Extra Attack', l: 5 } }
				}
			}
		});
		const key = features(ch).find((f) => f.choose?.[0].list === 'invocations')!.key;
		ch.choices[key] = ['thirsting-blade'];
		expect(attacksPerAction(ch)).toBe(2);
		removePack('inv-test');
	});
});

describe('full rules texts', () => {
	it('links features to pack texts and still builds the PDF', async () => {
		installPack({
			id: 'texts',
			name: 'Texts',
			texts: {
				'class/fighter/second-wind': {
					full: 'Long Second Wind wording.\nUsing It. Details.',
					page: 91
				},
				'species/dwarf/stonecunning': { full: 'Full Stonecunning wording.' }
			}
		});
		const ch = sampleCharacter();
		const fs = features(ch);
		const sw = fs.find((f) => f.n === 'Second Wind')!;
		expect(sw.tkey).toBe('class/fighter/second-wind');
		expect(rulesText(sw.tkey!)?.page).toBe(91);
		expect(rulesKey('sub', "Dark One's Blessing", 'A/B')).toBe('sub/dark-ones-blessing/a-b');
		expect(runIn('Using It. Details.')).toEqual(['Using It.', 'Details.']);
		expect(runIn('You gain Resistance. More.')).toEqual(['', 'You gain Resistance. More.']);
		// The full text replaces nothing in the data, it is only printed.
		expect((await buildPdf(ch, [])).length).toBeGreaterThan(5000);
		removePack('texts');
	});
});
