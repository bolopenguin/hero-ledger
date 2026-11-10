// Writes a sample PDF for visual checks: OUT=/path/file.pdf yarn vitest run scripts/sample-pdf.test.ts
import { it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { buildPdf } from '../src/lib/pdf/export';
import { sampleCharacter } from '../src/lib/store.svelte';

it.skipIf(!process.env.OUT)('writes sample pdf', async () => {
	const ch = sampleCharacter();
	ch.spells.list = [];
	writeFileSync(process.env.OUT ?? 'sample.pdf', await buildPdf(ch, []));
});
