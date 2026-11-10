// Builds a printable, fillable PDF of a character. The full character (and any content
// packs it uses) is embedded as character.json so the PDF can be loaded back in the app.
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb, type PDFForm, type RGB } from 'pdf-lib';
import {
	armorClass,
	attack,
	attunementMax,
	carrying,
	darkvision,
	features,
	getBackground,
	getClass,
	getSpecies,
	hpMax,
	initiative,
	makeCtx,
	mod,
	saves,
	scores,
	signed,
	skills,
	speed,
	spellcasting,
	subclassName
} from '../calc';
import { AB_NAMES, ACTION_LABELS, ARMOR, SKILLS } from '../data/srd';
import type { ContentPack } from '../packs.svelte';
import { ABILITIES, type Character } from '../types';

export const PDF_DATA_NAME = 'character.json';
export const APP_ID = 'hero-ledger';

export type FieldKind = 'text' | 'number' | 'bool' | 'count';
export interface FieldMapEntry {
	path: (string | number)[];
	kind: FieldKind;
	fields: string[];
}
export interface EmbeddedData {
	app: typeof APP_ID;
	version: 1;
	character: Character;
	packs: ContentPack[];
	fieldMap: Record<string, FieldMapEntry>;
}

const A4: [number, number] = [595.28, 841.89];
const M = 34; // page margin
const INK = rgb(0.13, 0.15, 0.2);
const MUTED = rgb(0.42, 0.44, 0.5);
const ACCENT = rgb(0.47, 0.12, 0.16);
const RULE = rgb(0.8, 0.81, 0.84);
const FILL = rgb(0.95, 0.955, 0.965);

const EXTRA = '‘’“”–—•…€™';
/** Standard PDF fonts only cover WinAnsi; replace what they can't draw. */
export function clean(s: string): string {
	return (s ?? '')
		.replace(/[−‐‑]/g, '-')
		.replace(/→/g, '->')
		.replace(/[✓✔]/g, 'v')
		.replace(/[✗✘]/g, 'x')
		.replace(/ /g, ' ')
		.replace(/\r/g, '')
		.split('')
		.filter(
			(c) => c === '\n' || (c.charCodeAt(0) >= 32 && c.charCodeAt(0) < 256) || EXTRA.includes(c)
		)
		.join('');
}

class Writer {
	doc: PDFDocument;
	form: PDFForm;
	page!: PDFPage;
	y = 0;
	pageNo = 0;
	f!: PDFFont;
	b!: PDFFont;
	i!: PDFFont;
	fieldMap: Record<string, FieldMapEntry> = {};
	private n = 0;
	title = '';

	constructor(doc: PDFDocument) {
		this.doc = doc;
		this.form = doc.getForm();
	}
	async init() {
		this.f = await this.doc.embedFont(StandardFonts.Helvetica);
		this.b = await this.doc.embedFont(StandardFonts.HelveticaBold);
		this.i = await this.doc.embedFont(StandardFonts.HelveticaOblique);
	}
	get W() {
		return A4[0] - 2 * M;
	}
	newPage() {
		this.page = this.doc.addPage(A4);
		this.pageNo++;
		this.y = A4[1] - M;
		if (this.pageNo > 1) {
			this.text(clean(this.title), M, A4[1] - 22, 8, this.b, MUTED);
			this.text(String(this.pageNo), A4[0] - M - 10, A4[1] - 22, 8, this.f, MUTED);
			this.y = A4[1] - M - 6;
		}
	}
	ensure(h: number) {
		if (this.y - h < M) this.newPage();
	}
	text(s: string, x: number, y: number, size = 9, font = this.f, color: RGB = INK) {
		this.page.drawText(clean(s), { x, y, size, font, color });
	}
	width(s: string, size = 9, font = this.f) {
		return font.widthOfTextAtSize(clean(s), size);
	}
	wrap(s: string, w: number, size = 9, font = this.f): string[] {
		const out: string[] = [];
		for (const para of clean(s).split('\n')) {
			let line = '';
			for (const word of para.split(/\s+/)) {
				if (!word) continue;
				const t = line ? line + ' ' + word : word;
				if (font.widthOfTextAtSize(t, size) <= w) line = t;
				else {
					if (line) out.push(line);
					line = word;
					while (font.widthOfTextAtSize(line, size) > w && line.length > 1) {
						let k = line.length - 1;
						while (k > 1 && font.widthOfTextAtSize(line.slice(0, k), size) > w) k--;
						out.push(line.slice(0, k));
						line = line.slice(k);
					}
				}
			}
			out.push(line);
		}
		return out;
	}
	/** Draw wrapped text at the cursor, adding pages as needed. */
	para(s: string, x: number, w: number, size = 9, font = this.f, color: RGB = INK, lead = 1.3) {
		for (const line of this.wrap(s, w, size, font)) {
			this.ensure(size * lead);
			this.y -= size * lead;
			this.text(line, x, this.y + 2, size, font, color);
		}
	}
	heading(s: string) {
		this.ensure(30);
		this.y -= 20;
		this.text(s.toUpperCase(), M, this.y, 11, this.b, ACCENT);
		this.page.drawLine({
			start: { x: M, y: this.y - 4 },
			end: { x: M + this.W, y: this.y - 4 },
			thickness: 0.8,
			color: ACCENT
		});
		this.y -= 8;
	}
	box(x: number, y: number, w: number, h: number, fill = false) {
		this.page.drawRectangle({
			x,
			y,
			width: w,
			height: h,
			borderColor: RULE,
			borderWidth: 0.8,
			color: fill ? FILL : undefined
		});
	}
	label(s: string, x: number, y: number) {
		this.text(s.toUpperCase(), x, y, 6.5, this.b, MUTED);
	}
	center(s: string, cx: number, y: number, size: number, font = this.f, color: RGB = INK) {
		this.text(s, cx - this.width(s, size, font) / 2, y, size, font, color);
	}

	private fname() {
		return `hl_${this.n++}`;
	}
	/** A fillable text field bound to a character path. */
	field(
		path: (string | number)[],
		kind: 'text' | 'number',
		value: string | number,
		x: number,
		y: number,
		w: number,
		h: number,
		opts: { size?: number; multiline?: boolean; align?: 'center' | 'left' } = {}
	) {
		const name = this.fname();
		const tf = this.form.createTextField(name);
		if (opts.multiline) tf.enableMultiline();
		tf.setText(clean(String(value ?? '')));
		tf.addToPage(this.page, {
			x,
			y,
			width: w,
			height: h,
			font: this.f,
			borderWidth: 0,
			backgroundColor: FILL,
			textColor: INK
		});
		tf.setFontSize(opts.size ?? 9);
		if (opts.align === 'center') tf.setAlignment(1);
		this.fieldMap[name] = { path, kind, fields: [name] };
		return name;
	}
	check(path: (string | number)[], checked: boolean, x: number, y: number, s = 8) {
		const name = this.fname();
		const cb = this.form.createCheckBox(name);
		cb.addToPage(this.page, {
			x,
			y,
			width: s,
			height: s,
			borderColor: MUTED,
			borderWidth: 0.8,
			backgroundColor: rgb(1, 1, 1)
		});
		if (checked) cb.check();
		this.fieldMap[name] = { path, kind: 'bool', fields: [name] };
	}
	/** A row of checkboxes whose checked count is a number in the character. */
	counter(
		path: (string | number)[],
		max: number,
		used: number,
		x: number,
		y: number,
		s = 7.5,
		gap = 2.5
	): number {
		const id = this.fname();
		const fields: string[] = [];
		for (let k = 0; k < max; k++) {
			const name = `${id}_${k}`;
			const cb = this.form.createCheckBox(name);
			cb.addToPage(this.page, {
				x: x + k * (s + gap),
				y,
				width: s,
				height: s,
				borderColor: MUTED,
				borderWidth: 0.8,
				backgroundColor: rgb(1, 1, 1)
			});
			if (k < used) cb.check();
			fields.push(name);
		}
		this.fieldMap[id] = { path, kind: 'count', fields };
		return max * (s + gap);
	}
}

export async function buildPdf(ch: Character, packsUsed: ContentPack[]): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	doc.setTitle(`${ch.name || 'Character'} - Character Sheet`);
	doc.setCreator('Hero Ledger');
	doc.setProducer('Hero Ledger (pdf-lib)');
	doc.setSubject('D&D 2024 character sheet');
	const w = new Writer(doc);
	await w.init();

	const sc = scores(ch);
	const c = makeCtx(ch, sc);
	const cls = getClass(ch);
	const sp = getSpecies(ch);
	const bg = getBackground(ch);
	const sv = saves(ch, sc);
	const sk = skills(ch, sc);
	const ac = armorClass(ch, sc);
	const maxHp = hpMax(ch, sc);
	const sub = subclassName(ch);
	const lineage = sp?.lineages?.find((l) => l.id === ch.lineage)?.name;
	w.title = `${ch.name || 'Unnamed hero'} - ${cls?.name ?? ''} ${ch.level}`;

	// ---------------- Page 1 ----------------
	w.newPage();
	const top = A4[1] - M;
	w.text(ch.name || 'Unnamed hero', M, top - 18, 20, w.b, INK);
	const line2 = [
		`${cls?.name ?? ''} ${ch.level}${sub ? ` (${sub})` : ''}`,
		[sp?.name, lineage].filter(Boolean).join(' - '),
		bg?.name,
		ch.alignment
	]
		.filter(Boolean)
		.join('   |   ');
	w.text(line2, M, top - 34, 9.5, w.f, MUTED);
	w.label('XP', A4[0] - M - 110, top - 8);
	w.field(['xp'], 'number', ch.xp, A4[0] - M - 110, top - 24, 50, 13);
	w.label('Player', A4[0] - M - 55, top - 8);
	w.text(ch.player || '-', A4[0] - M - 55, top - 20, 9);
	w.page.drawLine({
		start: { x: M, y: top - 42 },
		end: { x: A4[0] - M, y: top - 42 },
		thickness: 1.2,
		color: ACCENT
	});

	// Abilities column
	let y = top - 52;
	const colA = M;
	const abW = 92;
	for (const ab of ABILITIES) {
		const h = 64;
		w.box(colA, y - h, abW, h);
		w.label(AB_NAMES[ab], colA + 6, y - 10);
		w.center(signed(mod(sc[ab].total)), colA + 30, y - 38, 22, w.b);
		w.text(`score ${sc[ab].total}`, colA + 54, y - 32, 7.5, w.f, MUTED);
		w.check(['saveProf', ab], sv[ab].prof, colA + 6, y - h + 7, 7);
		w.text(`Save ${signed(sv[ab].value)}`, colA + 17, y - h + 8, 8.5, w.b);
		y -= h + 5;
	}

	// Skills column
	const colS = colA + abW + 8;
	const skW = 140;
	let ys = top - 52;
	w.box(colS, ys - 410, skW, 410);
	w.label('Skills', colS + 6, ys - 11);
	ys -= 24;
	for (const [id, s] of Object.entries(SKILLS)) {
		const v = sk[id];
		const cx = colS + 10;
		w.page.drawCircle({
			x: cx,
			y: ys + 3,
			size: 3,
			borderColor: MUTED,
			borderWidth: 0.8,
			color: v.prof ? ACCENT : undefined
		});
		if (v.prof === 2)
			w.page.drawCircle({ x: cx, y: ys + 3, size: 5, borderColor: ACCENT, borderWidth: 0.8 });
		w.text(signed(v.value), colS + 18, ys, 8.5, w.b);
		w.text(s.name, colS + 38, ys, 8.5);
		w.text(s.ab.toUpperCase(), colS + skW - 22, ys, 6.5, w.f, MUTED);
		ys -= 21.2;
	}

	// Right column: combat numbers
	const colR = colS + skW + 8;
	const rW = A4[0] - M - colR;
	let yr = top - 52;
	const stats: [string, string][] = [
		['Armor Class', String(ac.value)],
		['Initiative', signed(initiative(ch, sc))],
		['Speed', `${speed(ch)} ft`],
		['Prof. Bonus', signed(c.pb)],
		['Passive Perc.', String(10 + sk.perception.value + (ch.bonus.pp ?? 0))],
		['Size', sp?.size?.replace(' or ', '/') ?? '-']
	];
	const sw = (rW - 10) / 3;
	stats.forEach(([l, v], k) => {
		const x = colR + (k % 3) * (sw + 5);
		const yy = yr - Math.floor(k / 3) * 46;
		w.box(x, yy - 41, sw, 41);
		w.label(l, x + 5, yy - 10);
		w.center(v, x + sw / 2, yy - 32, v.length > 6 ? 11 : 16, w.b);
	});
	yr -= 97;
	if (ac.parts.length) {
		w.text(ac.parts.join(', '), colR, yr, 6.5, w.f, MUTED);
		yr -= 9;
	}
	// HP
	w.box(colR, yr - 70, rW, 70, true);
	w.label('Hit points', colR + 6, yr - 11);
	w.text(`max ${maxHp}`, colR + rW - 46, yr - 11, 8, w.b, MUTED);
	w.label('Current', colR + 6, yr - 24);
	w.field(['hp', 'current'], 'number', ch.hp.current, colR + 6, yr - 64, rW * 0.55, 36, {
		size: 20,
		align: 'center'
	});
	w.label('Temp', colR + rW * 0.55 + 14, yr - 24);
	w.field(
		['hp', 'temp'],
		'number',
		ch.hp.temp || '',
		colR + rW * 0.55 + 14,
		yr - 64,
		rW * 0.45 - 20,
		36,
		{ size: 16, align: 'center' }
	);
	yr -= 78;
	// Hit dice, death saves, inspiration, exhaustion
	w.label(`Hit dice d${cls?.hd ?? 8} spent (of ${ch.level})`, colR, yr - 8);
	const perRow = Math.floor(rW / 10);
	const hdRows = Math.ceil(ch.level / perRow);
	w.counter(['hitDiceUsed'], ch.level, ch.hitDiceUsed, colR, yr - 20, 7.5, 2.5);
	yr -= 22 + (hdRows - 1) * 10;
	w.label('Death saves', colR, yr - 10);
	w.text('success', colR + 58, yr - 10, 7, w.f, MUTED);
	w.counter(['death', 's'], 3, ch.death.s, colR + 88, yr - 11);
	w.text('fail', colR + 125, yr - 10, 7, w.f, MUTED);
	w.counter(['death', 'f'], 3, ch.death.f, colR + 140, yr - 11);
	yr -= 22;
	w.check(['inspiration'], ch.inspiration, colR, yr - 9);
	w.text('Heroic Inspiration', colR + 12, yr - 8, 8.5, w.b);
	w.label('Exhaustion', colR + 108, yr - 8);
	w.field(['exhaustion'], 'number', ch.exhaustion, colR + 152, yr - 12, 22, 12, {
		align: 'center'
	});
	yr -= 22;
	// Proficiencies
	w.label('Training & proficiencies', colR, yr - 8);
	yr -= 12;
	const profLines = [
		`Armor: ${[(cls?.armor ?? []).join(', '), ch.prof.armor].filter(Boolean).join(', ') || 'none'}`,
		`Weapons: ${[cls?.weapons, ch.prof.weapons].filter(Boolean).join(', ') || '-'}`,
		`Tools: ${[cls?.tools, bg?.tool, ch.prof.tools].filter(Boolean).join(', ') || '-'}`,
		`Languages: ${ch.prof.languages || '-'}`,
		`Senses: ${[darkvision(ch) ? `Darkvision ${darkvision(ch)} ft` : '', ch.prof.senses].filter(Boolean).join(', ') || '-'}`
	];
	for (const l of profLines)
		for (const t of w.wrap(l, rW, 7.5)) {
			w.text(t, colR, yr - 7, 7.5);
			yr -= 9.5;
		}

	// Attacks (flow below the columns)
	w.y = Math.min(y, ys, yr) - 6;
	w.heading('Attacks');
	if (!ch.attacks.length) w.para('No attacks recorded.', M, w.W, 8.5, w.i, MUTED);
	for (const a of ch.attacks) {
		const r = attack(ch, a, sc);
		w.ensure(30);
		w.y -= 13;
		w.text(a.name || 'Attack', M, w.y, 10, w.b);
		const hitX = M + 150;
		w.text(`${signed(r.toHit)} to hit`, hitX, w.y, 10, w.b, ACCENT);
		w.text(`${r.base} ${a.type}`, hitX + 62, w.y, 9.5);
		const extra = [
			a.mastery && `Mastery: ${a.mastery}`,
			a.range && `Range ${a.range}`,
			a.twoHanded ? 'two-handed' : '',
			r.critOn < 20 ? `crit ${r.critOn}-20` : ''
		]
			.filter(Boolean)
			.join(' | ');
		w.text(extra, M + 340, w.y, 7.5, w.f, MUTED);
		w.y -= 3;
		for (const x of r.riders) {
			const t = `${x.on ? '[x]' : '[ ]'} ${x.r.name}: ${x.r.dmg ? '+' + x.r.dmg : ''}${x.r.hit ? ` ${signed(x.r.hit)} to hit` : ''} ${x.r.type}${x.r.when ? ` - ${x.r.when}` : ''}`;
			w.para(t, M + 12, w.W - 12, 7.5, w.f, MUTED, 1.25);
		}
		if (r.riders.some((x) => x.on))
			w.para(
				`With ticked riders: ${r.total} (avg ${r.avg.toFixed(1)}), crit ${r.crit}`,
				M + 12,
				w.W - 12,
				8,
				w.b,
				INK,
				1.3
			);
		if (a.notes) w.para(a.notes, M + 12, w.W - 12, 7.5, w.i, INK, 1.25);
		w.y -= 3;
		w.page.drawLine({
			start: { x: M, y: w.y },
			end: { x: M + w.W, y: w.y },
			thickness: 0.4,
			color: RULE
		});
	}

	// ---------------- Features ----------------
	w.newPage();
	w.heading('Features & feats by level');
	const feats = features(ch).filter((f) => !f.hidden);
	let lastL = 0;
	for (const f of feats) {
		if (f.l !== lastL) {
			w.ensure(40);
			w.y -= 14;
			w.text(`LEVEL ${f.l}`, M, w.y, 9, w.b, ACCENT);
			lastL = f.l;
		}
		w.ensure(24);
		w.y -= 13;
		const tags = [f.src, f.a !== 'passive' ? ACTION_LABELS[f.a] : ''].filter(Boolean).join(' | ');
		w.text(f.n, M + 8, w.y, 9.5, w.b);
		let tx = M + 8 + w.width(f.n, 9.5, w.b) + 8;
		w.text(tags, tx, w.y, 7, w.f, MUTED);
		tx += w.width(tags, 7) + 8;
		if (f.uses) {
			const rl =
				f.r === 'short' ? 'SR' : f.r === 'short1' ? '1/SR, all/LR' : f.r === 'long' ? 'LR' : '';
			if (f.pool || f.uses > 20) {
				w.text(`spent`, A4[0] - M - 95, w.y, 7, w.f, MUTED);
				w.field(['used', f.key], 'number', ch.used[f.key] ?? 0, A4[0] - M - 72, w.y - 3, 28, 11, {
					align: 'center'
				});
				w.text(`/ ${f.uses} ${rl}`, A4[0] - M - 40, w.y, 7, w.f, MUTED);
			} else {
				const width = f.uses * 10;
				const rlw = w.width(rl, 7);
				const x0 = Math.max(tx, A4[0] - M - width - rlw - 6);
				w.counter(['used', f.key], f.uses, ch.used[f.key] ?? 0, x0, w.y - 1, 7.5, 2.5);
				w.text(rl, x0 + width + 4, w.y, 7, w.f, MUTED);
			}
		}
		if (f.d) w.para(f.d, M + 8, w.W - 8, 8.5, w.f, INK, 1.3);
		if (f.notes) w.para(`Note: ${f.notes}`, M + 8, w.W - 8, 8, w.i, ACCENT, 1.3);
		w.y -= 3;
	}

	// ---------------- Spells ----------------
	const s = spellcasting(ch, sc);
	if (s.ability || ch.spells.list.length) {
		w.newPage();
		w.heading('Spellcasting');
		w.y -= 16;
		const bits = [
			`Ability: ${s.ability ? AB_NAMES[s.ability] : '-'} (${signed(s.mod)})`,
			`Save DC ${s.dc}`,
			`Spell attack ${signed(s.atk)}`,
			s.cantrips !== null ? `Cantrips ${s.cantrips}` : '',
			s.prepared !== null ? `Prepared ${s.prepared}` : ''
		].filter(Boolean);
		w.text(bits.join('     '), M, w.y, 10, w.b);
		w.y -= 8;
		let sx = M;
		const slotY = w.y - 22;
		s.slots.forEach((n, k) => {
			if (!n) return;
			w.label(`Level ${k + 1}`, sx, slotY + 12);
			w.counter(['spells', 'slotsUsed', k], n, ch.spells.slotsUsed[k] ?? 0, sx, slotY, 8, 3);
			sx += Math.max(48, n * 11 + 10);
		});
		if (s.pact) {
			w.label(`Pact slots (level ${s.pact.level})`, sx, slotY + 12);
			w.counter(['spells', 'pactUsed'], s.pact.n, ch.spells.pactUsed, sx, slotY, 8, 3);
		}
		w.y = slotY - 8;
		const cols = [
			['Lvl', 0],
			['Name', 24],
			['Time', 170],
			['Range', 238],
			['Duration', 296],
			['C/R', 372],
			['Comp.', 398],
			['Notes', 440]
		] as const;
		w.ensure(20);
		w.y -= 12;
		for (const [l, x] of cols) w.label(l, M + x, w.y);
		const list = [...ch.spells.list].sort(
			(a, b) => a.level - b.level || a.name.localeCompare(b.name)
		);
		for (const spl of list) {
			const notes = w.wrap(spl.notes, w.W - 440, 7.5);
			w.ensure(12 + (notes.length - 1) * 9);
			w.y -= 12;
			w.page.drawLine({
				start: { x: M, y: w.y - 3 - (notes.length - 1) * 9 },
				end: { x: M + w.W, y: w.y - 3 - (notes.length - 1) * 9 },
				thickness: 0.3,
				color: RULE
			});
			w.text(spl.level === 0 ? 'C' : String(spl.level), M, w.y, 8, w.b);
			w.text(
				(spl.always ? '* ' : spl.prepared || spl.level === 0 ? '' : '( ) ') + spl.name,
				M + 24,
				w.y,
				8.5,
				w.b
			);
			w.text(spl.time, M + 170, w.y, 7.5);
			w.text(spl.range, M + 238, w.y, 7.5);
			w.text(spl.duration, M + 296, w.y, 7.5);
			w.text([spl.conc ? 'C' : '', spl.ritual ? 'R' : ''].join(' '), M + 372, w.y, 7.5, w.b);
			w.text(
				spl.cost ? `${spl.comp} ${spl.cost}gp${spl.consumed ? '*' : ''}` : spl.comp,
				M + 398,
				w.y,
				7.5,
				spl.cost ? w.b : w.f
			);
			notes.forEach((t, k) => w.text(t, M + 440, w.y - k * 9, 7.5));
			w.y -= (notes.length - 1) * 9;
			if (spl.desc) {
				w.y += 3;
				w.para(spl.desc, M + 24, 400, 7, w.f, MUTED, 1.25);
				w.y -= 2;
			}
		}
		w.y -= 6;
		w.para(
			'* always prepared   ( ) not prepared today   NNgp = material cost (gp* = consumed)',
			M,
			w.W,
			7,
			w.i,
			MUTED
		);
	}

	// ---------------- Equipment ----------------
	w.newPage();
	w.heading('Equipment');
	const carry = carrying(ch, sc);
	w.y -= 14;
	const armorName = ARMOR[ch.gear.armor]?.name ?? 'No armor';
	w.text(`${armorName}${ch.gear.shield ? ' + Shield' : ''} - AC ${ac.value}`, M, w.y, 9.5, w.b);
	w.text(
		`Carrying ${carry.total} / ${carry.cap} lb   |   Attuned ${ch.gear.items.filter((i) => i.attuned).length} / ${attunementMax(ch)}`,
		M + 260,
		w.y,
		8.5,
		w.f,
		MUTED
	);
	w.y -= 26;
	const coins = ['cp', 'sp', 'ep', 'gp', 'pp'] as const;
	coins.forEach((k, idx) => {
		const x = M + idx * 70;
		w.label(k, x, w.y + 14);
		w.field(['gear', 'coins', k], 'number', ch.gear.coins[k], x, w.y, 60, 13, { align: 'center' });
	});
	w.y -= 8;
	const locs = [...new Set(ch.gear.items.map((i) => i.location || 'Backpack'))];
	for (const loc of locs) {
		w.ensure(36);
		w.y -= 16;
		w.text(loc, M, w.y, 9.5, w.b, ACCENT);
		w.y -= 2;
		w.label('Qty', M + 230, w.y - 9);
		w.label('Lb', M + 262, w.y - 9);
		w.label('GP', M + 292, w.y - 9);
		w.label('Notes', M + 326, w.y - 9);
		w.y -= 10;
		for (const it of ch.gear.items.filter((i) => (i.location || 'Backpack') === loc)) {
			const flags = [
				it.equipped ? 'equipped' : '',
				it.attuned ? 'attuned' : '',
				it.magic ? 'magic' : ''
			]
				.filter(Boolean)
				.join(', ');
			const noteText = [
				it.notes,
				it.chargesMax ? `charges ${it.charges}/${it.chargesMax}` : '',
				flags
			]
				.filter(Boolean)
				.join(' - ');
			const notes = w.wrap(noteText, w.W - 326, 7.5);
			w.ensure(13 + (notes.length - 1) * 9);
			w.y -= 12;
			w.field(['gear', 'items', `#${it.id}`, 'qty'], 'number', it.qty, M + 226, w.y - 3, 26, 11, {
				align: 'center',
				size: 8
			});
			w.text(it.name, M, w.y, 8.5, it.magic ? w.b : w.f);
			w.text(String(it.weight), M + 262, w.y, 8);
			w.text(String(it.value), M + 292, w.y, 8);
			notes.forEach((t, k) => w.text(t, M + 326, w.y - k * 9, 7.5, w.f, MUTED));
			w.y -= (notes.length - 1) * 9;
			w.page.drawLine({
				start: { x: M, y: w.y - 4 },
				end: { x: M + w.W, y: w.y - 4 },
				thickness: 0.3,
				color: RULE
			});
		}
	}
	if (bg?.equipment) {
		w.y -= 10;
		w.para(`Background starting equipment: ${bg.equipment}`, M, w.W, 7.5, w.i, MUTED);
	}

	// ---------------- Notes ----------------
	w.newPage();
	w.heading('Character & notes');
	const notes: [keyof Character['notes'], string, number][] = [
		['appearance', 'Appearance', 60],
		['personality', 'Personality traits', 50],
		['ideals', 'Ideals', 36],
		['bonds', 'Bonds', 36],
		['flaws', 'Flaws', 36],
		['allies', 'Allies & organizations', 50],
		['backstory', 'Backstory', 150],
		['other', 'Other notes', 110]
	];
	for (const [k, label, minH] of notes) {
		const lines = w.wrap(ch.notes[k], w.W - 8, 8.5).length;
		const h = Math.max(minH, lines * 11 + 8);
		w.ensure(h + 16);
		w.y -= 12;
		w.label(label, M, w.y);
		w.y -= h + 3;
		w.field(['notes', k], 'text', ch.notes[k], M, w.y, w.W, h, { multiline: true, size: 8.5 });
	}
	w.y -= 18;
	w.ensure(20);
	w.para(
		'Made with Hero Ledger. Load this PDF back into the app to keep editing; values typed into its fields are read back too. Rules summaries based on the System Reference Document 5.2 by Wizards of the Coast LLC, licensed under CC BY 4.0.',
		M,
		w.W,
		6.5,
		w.i,
		MUTED
	);

	w.form.updateFieldAppearances(w.f);

	const data: EmbeddedData = {
		app: APP_ID,
		version: 1,
		character: ch,
		packs: packsUsed,
		fieldMap: w.fieldMap
	};
	await doc.attach(new TextEncoder().encode(JSON.stringify(data)), PDF_DATA_NAME, {
		mimeType: 'application/json',
		description: 'Hero Ledger character data',
		creationDate: new Date(),
		modificationDate: new Date()
	});
	return doc.save();
}
