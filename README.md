# Hero Ledger

A character sheet for D&D 2024 (the "5.5" rules) that fills itself in, then prints as a sheet you can use at the table.

The web app does the bookkeeping; the printed PDF is what you play with.

## What it does

- **Build a character**: pick class, subclass, species and background. Features appear level by level, with their text, uses and recharge worked out from your level and ability scores.
- **Make your choices**: ability scores or a feat at each ASI level, fighting styles (or Blessed / Druidic Warrior and their cantrips), Weapon Mastery, Expertise, class options such as Divine Order or Circle of the Land, the spells and skills your feats and species let you pick, and the tools your class and background let you pick. Choices change the numbers: training, skills, cantrips, spells, extra damage.
- **Class & features tab**: the key numbers of your class (Rage, Sneak Attack, Focus Points, Sorcery Points, Pact slots…), a list of the choices you still have to make, your origin (species, lineage, background with its ability scores, skills, tool and feat), then everything your class gives you, level by level.
- **Attacks**: hit and damage for each equipped weapon and each spell attack, with the extra damage that applies only sometimes (Sneak Attack, Divine Smite, Rage, Hunter's Mark, a weapon's own extra dice) listed under it.
- **Situational effects** (Rage, Mage Armor, Hunter's Mark, Haste…) are listed with what they change, and the PDF prints the AC you get with each one.
- **Your turn**: what you can do as an Action, Bonus Action and Reaction, built from your attacks, spells, features and items.
- **Spells**: spell slots, DC and attack; spells your features give you are filled in and labelled (always prepared, free once per rest, at will, ritual only).
- **Inventory**: separate lists for armor and shields, weapons, money and other equipment. Armor and weapons can be taken from the rules or made from scratch (base AC, Dex limit, magic bonus; damage dice, magic bonus, extra damage dice such as a Flame Tongue's 2d6 Fire). Wearing armor sets your AC and equipped weapons become your attacks. Also an equipment catalog, containers, attunement and carrying capacity.
- **Everything can be customised**: every calculated number takes a bonus or a replacement value, every feature can be reworded, annotated or hidden, and you can add your own features, feats, weapons, armor, class, subclass, species or background. Custom text supports live formulas such as `{8 + wis + pb}`.
- **PDF export and re-import**: a fillable PDF (HP, uses, slots, coins…) that carries the whole character inside it. Load it back with **Open** and anything typed into its fields is picked up.

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
	"options": {},
	"texts": {}
}
```

Features:

- `l` level, `n` name, `d` description, `a` one of `action`, `bonus`, `reaction`, `special`, `passive`.
- `u` uses: a number or formula (`lvl`, `pb`, `str`…`cha` modifiers, `min`, `max`, `floor`, `ceil`, comparisons like `lvl >= 5`).
- `r` recharge: `short`, `short1` (one use per Short Rest, all per Long Rest) or `long`.
- `{formula}` inside `d` is replaced with the computed number.
- `spells`: spells the feature gives, e.g. `[{ "l": 3, "names": ["Shield"], "kind": "prepared" }]` (`kind`: `prepared`, `free`, `atwill`, `ritual`).
- `choose`: let the player pick from an option list, e.g. `{ "list": "maneuvers", "count": "3" }`, or a list of such choices. Built-in lists include `spells:<class>:<level>` (level 0 for cantrips), `school:<school>:<level>`, `rituals:<level>`, `skills`, `skills:<id>,<id>`, `skillup:<id>,<id>` (proficiency, or Expertise if already proficient), `expertise`, `tools:artisan`, `tools:instrument`, `tools:gaming`, `tools:any` and `weapon-mastery-any`; join keys with `|` to offer several lists together. An optional `label` names the choice and `grant` says how chosen spells are cast.

Subclasses that add spellcasting to a non-caster can set `caster` (`third`), `castAbil`, `spellList`, `cantrips` and `prepared` (20 numbers, one per class level).

Spells: `name`, `level` (0 for cantrips), `school`, `time`, `range`, `comp`, `duration`, `conc`, `ritual`, `classes`, `d`, and optionally `higher`, `material`, `cost` (GP) and `consumed`.

Feats: `name`, `cat` (`origin`, `general`, `style`, `epic`), `d`, and optionally `prereq`, `abilities` (which scores the +1 can raise), `u`/`r`/`a` for uses, `hp`, `hpFlat`, `speed`, `saveFromAsi`, `spells`, `choose` (as for features) and a damage `rider`.

Backgrounds: `name`, `abilities` (three scores), `feat` (a feat key, or empty to let the player pick an Origin feat), `skills`, `tool` and `equipment`, and optionally `feats` (feat keys to choose one from), `skillChoice` (`{ "count": 1, "from": ["insight", "history"] }`; without `from`, any skill) and `freeAsi` (at least +1 must go to one of `abilities`, the rest to any score). A `tool` like `"Disguise Kit or one kind of Gaming Set"` becomes a choice.

Texts (optional): the complete wording of rules, printed on the PDF next to the short `d` recap and shown under "Full rules text" in the app. Keys are a kind plus the names (not ids) in lowercase with dashes; `page` is optional:

```json
"texts": {
	"spell/fire-bolt": { "full": "You hurl a mote of fire…", "page": 12 },
	"class/fighter/second-wind": { "full": "…" },
	"sub/storm-warden-homebrew-example/thunder-strike": { "full": "…" },
	"species/dwarf/stonecunning": { "full": "…" },
	"feat/my-feat": { "full": "…" },
	"option/agonizing-blast": { "full": "…" }
}
```

Separate paragraphs with `\n`; start a line with `• ` for a bullet, and a paragraph opening with a short Title Case phrase and a period ("Spell Slots.") prints it in bold.

`scripts/build-pack.mjs` merges a folder of pieces (subclass files, `spells*.json`, `feats*.json`, `options*.json`, `texts*.json`…) into one pack file.

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
