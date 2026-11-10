import {
	PDFArray,
	PDFCheckBox,
	PDFDict,
	PDFDocument,
	PDFName,
	PDFRawStream,
	PDFString,
	PDFHexString,
	PDFTextField,
	decodePDFRawStream
} from 'pdf-lib';
import { normalize } from '../store.svelte';
import type { ContentPack } from '../packs.svelte';
import type { Character } from '../types';
import { APP_ID, PDF_DATA_NAME, type EmbeddedData } from './export';

function attachments(doc: PDFDocument): { name: string; bytes: Uint8Array }[] {
	const out: { name: string; bytes: Uint8Array }[] = [];
	const names = doc.catalog.lookupMaybe(PDFName.of('Names'), PDFDict);
	const ef = names?.lookupMaybe(PDFName.of('EmbeddedFiles'), PDFDict);
	if (!ef) return out;
	const walk = (node: PDFDict) => {
		const arr = node.lookupMaybe(PDFName.of('Names'), PDFArray);
		if (arr) {
			for (let i = 0; i + 1 < arr.size(); i += 2) {
				const nm = arr.lookup(i);
				const name = nm instanceof PDFString || nm instanceof PDFHexString ? nm.decodeText() : '';
				const spec = arr.lookup(i + 1, PDFDict);
				const efd = spec.lookupMaybe(PDFName.of('EF'), PDFDict);
				const stream = efd?.lookup(PDFName.of('F'));
				if (stream instanceof PDFRawStream)
					out.push({ name, bytes: decodePDFRawStream(stream).decode() });
			}
		}
		const kids = node.lookupMaybe(PDFName.of('Kids'), PDFArray);
		if (kids) for (let i = 0; i < kids.size(); i++) walk(kids.lookup(i, PDFDict));
	};
	walk(ef);
	return out;
}

type Container = Record<string | number, unknown>;

function setPath(root: Character, path: (string | number)[], value: unknown) {
	let node = root as unknown as Container;
	for (let i = 0; i < path.length - 1; i++) {
		const seg = path[i];
		let next: unknown;
		if (typeof seg === 'string' && seg.startsWith('#') && Array.isArray(node)) {
			next = (node as { id: string }[]).find((x) => x.id === seg.slice(1));
		} else next = node[seg];
		if (next === undefined || next === null) {
			if (typeof seg === 'string' && seg.startsWith('#')) return; // item deleted since export
			next = {};
			node[seg] = next;
		}
		node = next as Container;
	}
	node[path[path.length - 1]] = value;
}

export interface PdfImport {
	character: Character;
	packs: ContentPack[];
	changedFields: number;
}

export async function readPdf(bytes: ArrayBuffer): Promise<PdfImport> {
	let doc: PDFDocument;
	try {
		doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
	} catch {
		throw new Error('This file could not be opened as a PDF.');
	}
	const file = attachments(doc).find((a) => a.name === PDF_DATA_NAME);
	if (!file)
		throw new Error(
			'This PDF has no character data inside. Only PDFs exported from this app can be loaded back; for other sheets, create the character here and copy the values over.'
		);
	let data: EmbeddedData;
	try {
		data = JSON.parse(new TextDecoder().decode(file.bytes));
	} catch {
		throw new Error('The character data inside this PDF is damaged.');
	}
	if (data.app !== APP_ID || !data.character)
		throw new Error('The data inside this PDF is not a Hero Ledger character.');

	const ch = normalize(data.character);
	let changed = 0;
	const form = doc.getForm();
	for (const [, entry] of Object.entries(data.fieldMap ?? {})) {
		try {
			if (entry.kind === 'count') {
				const n = entry.fields.filter((f) => (form.getField(f) as PDFCheckBox).isChecked()).length;
				setPath(ch, entry.path, n);
				changed++;
			} else if (entry.kind === 'bool') {
				setPath(ch, entry.path, (form.getField(entry.fields[0]) as PDFCheckBox).isChecked());
				changed++;
			} else {
				const v = (form.getField(entry.fields[0]) as PDFTextField).getText() ?? '';
				if (entry.kind === 'number') {
					const n = parseFloat(v.replace(',', '.'));
					setPath(ch, entry.path, Number.isFinite(n) ? n : 0);
				} else setPath(ch, entry.path, v);
				changed++;
			}
		} catch {
			/* field removed by the PDF reader: keep the stored value */
		}
	}
	ch.updated = Date.now();
	return { character: ch, packs: data.packs ?? [], changedFields: changed };
}
