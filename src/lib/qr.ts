// A QR code for a chat link, drawn in the browser: nothing is sent anywhere to make it, and no
// image is loaded. The encoding (error correction, masking, version) is qrcode-generator's; what
// this file decides is how the code is drawn and saved.

import qrcode from 'qrcode-generator';

/**
 * The white margin a scanner needs around a code, in modules: the standard asks for four. It's
 * part of the drawing, so a code printed on anything keeps it.
 */
export const QUIET_ZONE = 4;

/**
 * The code's modules, row by row: true for dark. Error correction is M (about 15% of it can be
 * lost), enough for a printed card that gets scuffed, and still a small code for a short link.
 */
export function qrModules(text: string): boolean[][] {
	const code = qrcode(0, 'M');
	code.addData(text, 'Byte');
	code.make();
	const size = code.getModuleCount();
	return Array.from({ length: size }, (_, row) =>
		Array.from({ length: size }, (_, column) => code.isDark(row, column))
	);
}

/** How wide the drawing is, in modules, margin included: the SVG's viewBox and the PNG's grid. */
export const drawnSize = (modules: boolean[][]) => modules.length + QUIET_ZONE * 2;

/**
 * The dark modules as one SVG path, a run of dark modules in a row drawn as one rectangle: a far
 * shorter path than a square for each, and no gaps between them when it's scaled.
 */
export function qrPath(modules: boolean[][]): string {
	let path = '';
	modules.forEach((row, y) => {
		let x = 0;
		while (x < row.length) {
			if (!row[x]) {
				x++;
				continue;
			}
			const start = x;
			while (x < row.length && row[x]) x++;
			path += `M${start + QUIET_ZONE} ${y + QUIET_ZONE}h${x - start}v1h-${x - start}z`;
		}
	});
	return path;
}

/** The file a saved code goes in: the number it opens a chat with, so a folder of them sorts. */
export const qrFileName = (number: string) => `whatsapp-${number}.png`;
