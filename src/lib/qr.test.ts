import { describe, expect, it } from 'vitest';
import { drawnSize, QUIET_ZONE, qrFileName, qrModules, qrPath } from './qr';

const link = 'https://wa.me/6281234567890';

/** Whether a finder pattern (the three big squares) sits with its corner at row, column. */
function finderAt(modules: boolean[][], row: number, column: number): boolean {
	for (let y = 0; y < 7; y++) {
		for (let x = 0; x < 7; x++) {
			const ring = y === 0 || y === 6 || x === 0 || x === 6;
			const centre = y >= 2 && y <= 4 && x >= 2 && x <= 4;
			if (modules[row + y][column + x] !== (ring || centre)) return false;
		}
	}
	return true;
}

describe('qrModules', () => {
	it('makes a square code, the smallest that holds the link', () => {
		const modules = qrModules(link);
		// 27 bytes at error correction M: one more than version 2 holds, so version 3, 29 a side.
		expect(modules).toHaveLength(29);
		expect(modules.every((row) => row.length === 29)).toBe(true);
	});

	it('has the three finder squares a scanner looks for', () => {
		const modules = qrModules(link);
		const last = modules.length - 7;
		expect(finderAt(modules, 0, 0)).toBe(true);
		expect(finderAt(modules, 0, last)).toBe(true);
		expect(finderAt(modules, last, 0)).toBe(true);
	});

	it('grows for a link with a message in it', () => {
		const withMessage = `${link}?text=${encodeURIComponent("Hi! I'd like to ask about the blue shirt in size M.")}`;
		expect(qrModules(withMessage).length).toBeGreaterThan(29);
	});

	it('is the same code for the same link, so a printed one matches the screen', () => {
		expect(qrModules(link)).toEqual(qrModules(link));
	});
});

describe('qrPath', () => {
	it('draws every dark module once, inside the margin', () => {
		const modules = qrModules(link);
		const path = qrPath(modules);
		const covered = [...path.matchAll(/M(\d+) (\d+)h(\d+)/g)].reduce(
			(sum, [, , , width]) => sum + Number(width),
			0
		);
		const dark = modules.flat().filter(Boolean).length;
		expect(covered).toBe(dark);
		const starts = [...path.matchAll(/M(\d+) (\d+)/g)].map(([, x, y]) => [Number(x), Number(y)]);
		expect(Math.min(...starts.flat())).toBe(QUIET_ZONE);
		expect(drawnSize(modules)).toBe(29 + 2 * QUIET_ZONE);
	});

	it('joins a run of dark modules into one rectangle', () => {
		expect(
			qrPath([
				[true, true, false],
				[false, true, true]
			])
		).toBe('M4 4h2v1h-2zM5 5h2v1h-2z');
	});
});

describe('qrFileName', () => {
	it('names the file after the number', () => {
		expect(qrFileName('6281234567890')).toBe('whatsapp-6281234567890.png');
	});
});
