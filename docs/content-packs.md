# Content packs

A content pack is a JSON file that adds material to Hero Ledger: subclasses, spells, feats, species, backgrounds and option lists (invocations, metamagic, maneuvers…). Use packs for homebrew, house rules, or any material you have the right to use.

The built-in rules are the free D&D 2024 rules (System Reference Document 5.2). Everything else comes from packs.

## Using a pack

- Open the app, then **Packs → Load pack file** (or paste the JSON into the box in that dialog).
- Packs are saved in your browser and travel inside the PDFs and character files you export, so a character opens correctly on another device.
- When you run the app locally (`yarn dev`), any pack in `content-packs/local/` is installed automatically. That folder is git-ignored, so private material never ends up in the repository.
- **Packs → Install example** adds a small homebrew pack you can copy from.

## Format

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

### Features

- `l` level, `n` name, `d` description, `a` one of `action`, `bonus`, `reaction`, `special`, `passive`.
- `u` uses: a number or formula (`lvl`, `pb`, `str`…`cha` modifiers, `min`, `max`, `floor`, `ceil`, comparisons like `lvl >= 5`).
- `r` recharge: `short`, `short1` (one use per Short Rest, all per Long Rest) or `long`.
- `{formula}` inside `d` is replaced with the computed number.
- `spells`: spells the feature gives, e.g. `[{ "l": 3, "names": ["Shield"], "kind": "prepared" }]` (`kind`: `prepared`, `free`, `atwill`, `ritual`).
- `choose`: let the player pick from an option list, e.g. `{ "list": "maneuvers", "count": "3" }`, or a list of such choices. Built-in lists include `spells:<class>:<level>` (level 0 for cantrips), `school:<school>:<level>`, `rituals:<level>`, `skills`, `skills:<id>,<id>`, `skillup:<id>,<id>` (proficiency, or Expertise if already proficient), `expertise`, `tools:artisan`, `tools:instrument`, `tools:gaming`, `tools:any` and `weapon-mastery-any`; join keys with `|` to offer several lists together. An optional `label` names the choice and `grant` says how chosen spells are cast.

### Subclasses

Subclasses that add spellcasting to a non-caster can set `caster` (`third`), `castAbil`, `spellList`, `cantrips` and `prepared` (20 numbers, one per class level).

### Spells

`name`, `level` (0 for cantrips), `school`, `time`, `range`, `comp`, `duration`, `conc`, `ritual`, `classes`, `d`, and optionally `higher`, `material`, `cost` (GP) and `consumed`.

### Feats

`name`, `cat` (`origin`, `general`, `style`, `epic`), `d`, and optionally `prereq`, `abilities` (which scores the +1 can raise), `u`/`r`/`a` for uses, `hp`, `hpFlat`, `speed`, `saveFromAsi`, `spells`, `choose` (as for features) and a damage `rider`.

### Backgrounds

`name`, `abilities` (three scores), `feat` (a feat key, or empty to let the player pick an Origin feat), `skills`, `tool` and `equipment`, and optionally `feats` (feat keys to choose one from), `skillChoice` (`{ "count": 1, "from": ["insight", "history"] }`; without `from`, any skill) and `freeAsi` (at least +1 must go to one of `abilities`, the rest to any score). A `tool` like `"Disguise Kit or one kind of Gaming Set"` becomes a choice.

### Texts (optional)

The complete wording of rules, printed on the PDF next to the short `d` recap and shown under "Full rules text" in the app. Keys are a kind plus the names (not ids) in lowercase with dashes; `page` is optional:

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

## Building a pack from pieces

`scripts/build-pack.mjs` merges a folder of pieces into one pack file:

```bash
node scripts/build-pack.mjs <folder> <out.json> --id my-pack --name "My pack"
```

In the folder: `spells*.json` (arrays of spells), `feats*.json`, `species*.json`, `backgrounds*.json`, `options*.json`, `texts*.json`, and any other `*.json` as arrays of subclasses.
