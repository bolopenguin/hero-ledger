import { features, hpMax } from './calc';
import type { Character } from './types';

export function shortRest(ch: Character) {
	for (const f of features(ch)) {
		if (f.r === 'short') ch.used[f.key] = 0;
		else if (f.r === 'short1') ch.used[f.key] = Math.max(0, (ch.used[f.key] ?? 0) - 1);
	}
	ch.spells.pactUsed = 0;
}

export function longRest(ch: Character) {
	ch.used = {};
	ch.spells.slotsUsed = [0, 0, 0, 0, 0, 0, 0, 0, 0];
	ch.spells.pactUsed = 0;
	ch.hp.current = hpMax(ch);
	ch.hp.temp = 0;
	ch.hitDiceUsed = 0;
	ch.death = { s: 0, f: 0 };
	ch.exhaustion = Math.max(0, ch.exhaustion - 1);
	if (ch.speciesId === 'human') ch.inspiration = true;
}
