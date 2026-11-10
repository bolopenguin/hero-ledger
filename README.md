# Hero Ledger

A character sheet for D&D 2024 (the "5.5" / One D&D rules) that fills itself in.

- **Pick class, subclass, species and background**: features appear grouped by level, with their text, uses and recharge, all computed from your level and ability scores.
- **Feats at the right levels**: Ability Score Improvement, Fighting Style, Origin and Epic Boon slots get a feat picker; ASIs feed back into your scores.
- **Attacks with situational damage**: each attack shows its base hit and damage, plus _riders_ (Rage, Sneak Attack, Divine Smite, Hunter's Mark, your own…) you tick on or off to see the total, the average and the crit for that situation. Versatile weapons get a two-hands toggle; Champion crit ranges are applied.
- **Everything can be customised**: every calculated number takes a misc bonus or a replacement value; every built-in feature can be renamed, rewritten, annotated or hidden; you can add custom features, feats, riders, a custom class, subclass, species or background. Custom text supports live formulas such as `{8 + wis + pb}`.
- **Inventory** grouped by container, with weight, value, attunement, charges, coins and carrying capacity. Weapons become attacks in one click.
- **PDF export and re-import**: the exported PDF is fillable (HP, uses, slots, coins, notes…) and carries the full character inside it. Load it back with **Open** and anything typed into the PDF fields is picked up.
- **Content packs**: JSON files that add subclasses, feats, species or backgrounds (see below).

Characters are stored in the browser (localStorage) and in the files you save. There is no server.

## Develop

```bash
yarn install
yarn dev
```

```bash
yarn check   # svelte-check / TypeScript
yarn test    # rules math + PDF round trip
yarn build   # static site in build/
```

## Deploy

It is a static SvelteKit site (`@sveltejs/adapter-static`), so any static host works.

**Netlify**: connect the repository; `netlify.toml` already sets `yarn build` and the `build` folder. Or drag the `build/` folder into Netlify Drop.

GitHub Pages, Cloudflare Pages and Vercel work the same way: build command `yarn build`, output `build`.

## Content packs

A pack is a JSON file loaded from **Packs → Load pack file**:

```json
{
	"id": "my-pack",
	"name": "My pack",
	"subclasses": [
		{
			"id": "storm-warden",
			"class": "fighter",
			"name": "Storm Warden",
			"features": [
				{
					"l": 3,
					"n": "Thunder Strike",
					"a": "special",
					"u": "max(1, con)",
					"r": "short",
					"d": "+1d8 Thunder once per turn."
				}
			]
		}
	],
	"feats": { "my-feat": { "name": "My Feat", "cat": "general", "d": "…" } },
	"species": {},
	"backgrounds": {}
}
```

- `l` level, `n` name, `d` description, `a` one of `action`, `bonus`, `reaction`, `special`, `passive`.
- `u` uses: a number or formula (`lvl`, `pb`, `str`…`cha` modifiers, `min`, `max`, `floor`, `ceil`).
- `r` recharge: `short`, `short1` (one use per Short Rest, all per Long Rest) or `long`.
- `{formula}` inside `d` is replaced with the computed number.

Packs travel inside exported PDFs and character files, so a character opens correctly on another device.


## Legal

This work includes material from the System Reference Document 5.2 by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd, licensed under the Creative Commons Attribution 4.0 International License (https://creativecommons.org/licenses/by/4.0/legalcode). Hero Ledger is unofficial and not affiliated with Wizards of the Coast.
