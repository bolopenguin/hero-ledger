import { describe, expect, it } from 'vitest';
import { PDFDocument, PDFTextField, PDFCheckBox } from 'pdf-lib';
import {
	armorClass,
	attack,
	features,
	hpMax,
	initiative,
	makeCtx,
	saves,
	scores,
	skills,
	spellcasting
} from './calc';
import { avgDice, evalFormula, fillTemplate, formatDice, parseDice } from './formula';
import { blankCharacter, newAttack, sampleCharacter } from './store.svelte';
import { buildPdf } from './pdf/export';
import { readPdf } from './pdf/import';
import { CLASSES } from './data/classes';

describe('formulas and dice', () => {
	const c = { l: 5, pb: 3, m: (ab: string) => (ab === 'wis' ? 2 : 0) } as Parameters<
		typeof evalFormula
	>[1];
	it('evaluates formulas', () => {
		expect(evalFormula('max(1, wis)', c)).toBe(2);
		expect(evalFormula('8 + wis + pb', c)).toBe(13);
		expect(evalFormula('ceil(lvl / 2)', c)).toBe(3);
		expect(evalFormula('nonsense(', c)).toBeNull();
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
