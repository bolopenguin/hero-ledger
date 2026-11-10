// Merge a folder of pack pieces into one content pack JSON.
//
//   node scripts/build-pack.mjs <folder> <out.json> --id my-pack --name "My pack"
//
// In <folder>:
//   spells*.json        -> arrays of spells
//   feats.json          -> object of feats
//   species.json        -> object of species
//   backgrounds.json    -> object of backgrounds
//   any other *.json    -> arrays of subclasses
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';

const [dir, out, ...rest] = process.argv.slice(2);
if (!dir || !out) {
	console.error('usage: node scripts/build-pack.mjs <folder> <out.json> --id ID --name NAME');
	process.exit(1);
}
const opt = (k, d) => {
	const i = rest.indexOf(`--${k}`);
	return i >= 0 ? rest[i + 1] : d;
};

const pack = {
	id: opt('id', basename(dir)),
	name: opt('name', basename(dir)),
	description: opt('description', ''),
	subclasses: [],
	spells: [],
	feats: {},
	species: {},
	backgrounds: {}
};
const problems = [];

for (const f of readdirSync(dir)
	.filter((f) => f.endsWith('.json'))
	.sort()) {
	let data;
	try {
		data = JSON.parse(readFileSync(join(dir, f), 'utf8'));
	} catch (e) {
		problems.push(`${f}: ${e.message}`);
		continue;
	}
	if (f.startsWith('spells')) pack.spells.push(...data);
	else if (f === 'feats.json') Object.assign(pack.feats, data);
	else if (f === 'species.json') Object.assign(pack.species, data);
	else if (f === 'backgrounds.json') Object.assign(pack.backgrounds, data);
	else pack.subclasses.push(...data);
}

const seen = new Set();
for (const s of pack.subclasses) {
	if (!s.id || !s.class || !s.name || !Array.isArray(s.features))
		problems.push(`subclass ${s.name ?? s.id}: missing fields`);
	if (seen.has(s.class + s.id)) problems.push(`duplicate subclass ${s.class}/${s.id}`);
	seen.add(s.class + s.id);
	for (const ft of s.features ?? [])
		if (typeof ft.l !== 'number' || !ft.n)
			problems.push(`${s.name}: bad feature ${JSON.stringify(ft).slice(0, 60)}`);
}
const names = new Set();
for (const sp of pack.spells) {
	const k = sp.name?.toLowerCase();
	if (!k || typeof sp.level !== 'number')
		problems.push(`bad spell ${JSON.stringify(sp).slice(0, 60)}`);
	if (names.has(k)) problems.push(`duplicate spell ${sp.name}`);
	names.add(k);
}
pack.spells.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));

writeFileSync(out, JSON.stringify(pack));
console.log(
	`${out}: ${pack.subclasses.length} subclasses, ${pack.spells.length} spells, ${Object.keys(pack.feats).length} feats`
);
if (problems.length) {
	console.log('Problems:\n- ' + problems.join('\n- '));
	process.exitCode = 1;
}
