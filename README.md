# Hero Ledger

A character sheet for D&D 2024 (the "5.5" rules) that fills itself in, then prints as a sheet you can use at the table.

The web app does the bookkeeping; the printed PDF is what you play with.

## What it does

- **Build a character**: pick class, subclass, species and background. Features appear level by level, with their text, uses and recharge worked out from your level and ability scores.
- **Make your choices**: ability scores or a feat at each ASI level, fighting styles, Weapon Mastery, Expertise, and class options such as Divine Order or Circle of the Land. Choices change the numbers: training, skills, cantrips, damage riders.
- **Class tab**: the key numbers of your class (Rage, Sneak Attack, Focus Points, Sorcery Points, Pact slots…), every limited-use feature, and what you still have to choose.
- **Attacks**: hit and damage for each weapon or spell attack, plus extra damage that applies only sometimes (Sneak Attack, Divine Smite, your own) with averages and crits.
- **"Right now" switches** for situational effects (Rage, Unarmored, Mage Armor, Hunter's Mark, Haste…): flip one and AC, damage, speed or spell DC follow.
- **Your turn**: what you can do as an Action, Bonus Action and Reaction, built from your attacks, spells, features and items.
- **Spells**: spell slots, DC and attack; spells your features give you are filled in and labelled (always prepared, free once per rest, at will, ritual only).
- **Inventory**: an equipment catalog with cost, weight and what each item does, one-click starting equipment, containers, attunement, coins and carrying capacity.
- **Everything can be customised**: every calculated number takes a bonus or a replacement value, every feature can be reworded, annotated or hidden, and you can add your own features, feats, riders, class, subclass, species or background. Custom text supports live formulas such as `{8 + wis + pb}`.
- **PDF export and re-import**: a fillable PDF (HP, uses, slots, coins, notes…) that carries the whole character inside it. Load it back with **Open** and anything typed into its fields is picked up.

Characters are stored in your browser and in the files you save. There is no server.

## Add your own content

The built-in rules are the free D&D 2024 rules (System Reference Document 5.2). You can add more with **content packs**: JSON files with subclasses, spells, feats, species, backgrounds and option lists (invocations, metamagic, maneuvers…). Use them for homebrew, house rules, or any material you have the right to use.

Load a pack from **Packs → Load pack file**. Packs are saved in your browser and travel inside the PDFs and character files you export, so a character opens correctly on another device. When you run the app locally, any pack in `content-packs/local/` is installed automatically.

```json
{
	"id": "my-pack",
	"name": "My homebrew",
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
					"d": "Once per turn on a weapon hit, deal +1d8 Thunder damage."
				}
			]
		}
	],
	"feats": {
		"my-feat": { "name": "My Feat", "cat": "general", "abilities": ["str", "dex"], "d": "…" }
	},
	"spells": [],
	"species": {},
	"backgrounds": {},
	"options": {}
}
```

Features:

- `l` level, `n` name, `d` description, `a` one of `action`, `bonus`, `reaction`, `special`, `passive`.
- `u` uses: a number or formula (`lvl`, `pb`, `str`…`cha` modifiers, `min`, `max`, `floor`, `ceil`, comparisons like `lvl >= 5`).
- `r` recharge: `short`, `short1` (one use per Short Rest, all per Long Rest) or `long`.
- `{formula}` inside `d` is replaced with the computed number.
- `spells`: spells the feature gives, e.g. `[{ "l": 3, "names": ["Shield"], "kind": "prepared" }]` (`kind`: `prepared`, `free`, `atwill`, `ritual`).
- `choose`: let the player pick from an option list, e.g. `{ "list": "maneuvers", "count": "3" }`.

Subclasses that add spellcasting to a non-caster can set `caster` (`third`), `castAbil`, `spellList`, `cantrips` and `prepared` (20 numbers, one per class level).

Spells: `name`, `level` (0 for cantrips), `school`, `time`, `range`, `comp`, `duration`, `conc`, `ritual`, `classes`, `d`, and optionally `higher`, `material`, `cost` (GP) and `consumed`.

Feats: `name`, `cat` (`origin`, `general`, `style`, `epic`), `d`, and optionally `prereq`, `abilities` (which scores the +1 can raise), `u`/`r`/`a` for uses, `hp`, `hpFlat`, `speed`, `saveFromAsi` and a damage `rider`.

`scripts/build-pack.mjs` merges a folder of pieces (subclass files, `spells*.json`, `feats*.json`, `options*.json`…) into one pack file.

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

## Legal

This work includes material from the System Reference Document 5.2 by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd, licensed under the Creative Commons Attribution 4.0 International License (https://creativecommons.org/licenses/by/4.0/legalcode). Hero Ledger is unofficial and not affiliated with Wizards of the Coast.
