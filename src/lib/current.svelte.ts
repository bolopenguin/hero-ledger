import { app } from './store.svelte';
import type { Character } from './types';

/** The character being edited. Components read it through this getter. */
export function currentChar(): Character {
	return app.chars.find((c) => c.id === app.currentId) ?? app.chars[0];
}
