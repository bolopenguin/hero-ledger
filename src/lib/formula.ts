import type { Ab, Ctx } from './types';

/**
 * Tiny safe formula evaluator for custom values.
 * Supports numbers, + - * / ( ), identifiers lvl/level, pb, str..cha (modifiers)
 * and functions min, max, floor, ceil, round. Division rounds down when used via floor().
 */
const ABS: Ab[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const FNS: Record<string, (...a: number[]) => number> = {
	min: Math.min,
	max: Math.max,
	floor: Math.floor,
	ceil: Math.ceil,
	round: Math.round
};

export function evalFormula(src: string, c: Ctx): number | null {
	const s = src.trim().toLowerCase();
	if (!s) return null;
	let i = 0;
	const peek = () => s[i];
	const ws = () => {
		while (s[i] === ' ') i++;
	};
	const expr = (): number => {
		let v = term();
		ws();
		while (peek() === '+' || peek() === '-') {
			const op = s[i++];
			const r = term();
			v = op === '+' ? v + r : v - r;
			ws();
		}
		return v;
	};
	const term = (): number => {
		let v = factor();
		ws();
		while (peek() === '*' || peek() === '/') {
			const op = s[i++];
			const r = factor();
			v = op === '*' ? v * r : v / r;
			ws();
		}
		return v;
	};
	const factor = (): number => {
		ws();
		const ch = peek();
		if (ch === '-') {
			i++;
			return -factor();
		}
		if (ch === '(') {
			i++;
			const v = expr();
			ws();
			if (s[i++] !== ')') throw new Error('missing )');
			return v;
		}
		const num = /^\d+(\.\d+)?/.exec(s.slice(i));
		if (num) {
			i += num[0].length;
			return parseFloat(num[0]);
		}
		const id = /^[a-z_]+/.exec(s.slice(i));
		if (id) {
			i += id[0].length;
			const name = id[0];
			ws();
			if (peek() === '(') {
				i++;
				const args: number[] = [];
				ws();
				if (peek() !== ')') {
					args.push(expr());
					ws();
					while (peek() === ',') {
						i++;
						args.push(expr());
						ws();
					}
				}
				if (s[i++] !== ')') throw new Error('missing )');
				const fn = FNS[name];
				if (!fn) throw new Error('unknown function ' + name);
				return fn(...args);
			}
			if (name === 'lvl' || name === 'level') return c.l;
			if (name === 'pb') return c.pb;
			if ((ABS as string[]).includes(name)) return c.m(name as Ab);
			throw new Error('unknown name ' + name);
		}
		throw new Error('unexpected ' + (ch ?? 'end'));
	};
	try {
		const v = expr();
		ws();
		if (i < s.length) return null;
		return Number.isFinite(v) ? v : null;
	} catch {
		return null;
	}
}

/** Replace {formula} placeholders in a text, e.g. "Heal 1d8 + {wis}". */
export function fillTemplate(text: string, c: Ctx): string {
	return text.replace(/\{([^{}]+)\}/g, (m, f) => {
		const v = evalFormula(f, c);
		return v === null ? m : String(Math.floor(v));
	});
}

// ---------- Dice ----------

export interface DiceTerm {
	n: number;
	d: number; // 0 = flat number
}

export function parseDice(expr: string): DiceTerm[] | null {
	const s = expr.replace(/\s+/g, '');
	if (!s) return [];
	const re = /([+-]?)(\d*)(?:d(\d+))?/gy;
	const out: DiceTerm[] = [];
	let pos = 0;
	while (pos < s.length) {
		re.lastIndex = pos;
		const m = re.exec(s);
		if (!m || m[0] === '' || (m[2] === '' && m[3] === undefined)) return null;
		const sign = m[1] === '-' ? -1 : 1;
		if (m[3] !== undefined)
			out.push({ n: sign * (m[2] === '' ? 1 : parseInt(m[2])), d: parseInt(m[3]) });
		else out.push({ n: sign * parseInt(m[2]), d: 0 });
		pos = re.lastIndex;
	}
	return out;
}

export function avgDice(terms: DiceTerm[]): number {
	return terms.reduce((a, t) => a + (t.d ? (t.n * (t.d + 1)) / 2 : t.n), 0);
}

/** Merge terms (same die size summed, flats summed) and format as "2d6 + 1d8 + 4". */
export function formatDice(terms: DiceTerm[]): string {
	const dice = new Map<number, number>();
	let flat = 0;
	for (const t of terms) {
		if (t.d) dice.set(t.d, (dice.get(t.d) ?? 0) + t.n);
		else flat += t.n;
	}
	const parts = [...dice.entries()]
		.filter(([, n]) => n !== 0)
		.sort((a, b) => b[0] - a[0])
		.map(([d, n]) => `${n}d${d}`);
	let out = parts.join(' + ');
	if (flat || !out) out += out ? (flat >= 0 ? ` + ${flat}` : ` − ${-flat}`) : String(flat);
	return out;
}

export function critTerms(terms: DiceTerm[]): DiceTerm[] {
	return terms.map((t) => (t.d ? { ...t, n: t.n * 2 } : t));
}
