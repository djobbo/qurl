import {
	alignmentPatternsPositions,
	getFinderPatternsPositions,
} from './patternsPositions';
import { getVersionSize } from './versions';

type QRCanvas = number[][];

const addFinderPatterns = (size: number) => (canvas: QRCanvas) => {
	const positions = getFinderPatternsPositions(size);

	let result = [...canvas];

	positions.forEach(([xPos, yPos]) => {
		for (let x = 0; x < 7; x++) {
			for (let y = 0; y < 7; y++) {
				const fill =
					x === 0 ||
					y === 0 ||
					x === 6 ||
					y === 6 ||
					(x > 1 && x < 5 && y > 1 && y < 5);

				result[xPos + x][yPos + y] = fill ? 1 : 0;
			}
		}
	});
	return result;
};

const addAlignmentPatterns = (version: number) => (canvas: QRCanvas) => {
	let result = [...canvas];
	const size = getVersionSize(version);
	const positions = alignmentPatternsPositions[version];

	positions.forEach((xPos) => {
		positions.forEach((yPos) => {
			// Overlaps Top-Left Finder Pattern
			if (xPos < 11 && yPos < 11) return;

			// Overlaps Top-Right Finder Pattern
			if (xPos > size - 11 && yPos < 11) return;

			// Overlaps Bottom-Left Finder Pattern
			if (xPos < 11 && yPos > size - 11) return;

			for (let x = -2; x < 3; x++) {
				for (let y = -2; y < 3; y++) {
					const fill = x === -2 || y === -2 || x === 2 || y === 2;
					result[xPos + x][yPos + y] = fill ? 1 : 0;
				}
			}
			result[xPos][yPos] = 1;
		});
	});
	return result;
};

const addDarkModule = (size: number) => (canvas: QRCanvas) => {
	let result = [...canvas];
	result[size - 8][8] = 1;
	return result;
};

const withTimingPatterns = (canvas: QRCanvas) => {
	let result = [...canvas];
	for (let i = 0; i < result.length; i++) {
		const fill = 1 - (i % 2);
		result[6][i] = fill;
		result[i][6] = fill;
	}
	return result;
};

const addData = (data: string) => (canvas: QRCanvas) => {
	let result = [...canvas];
	const size = canvas.length;
	let i = size ** 2;
	let dataIndex = 0;

	console.log(result.length, size);

	while (dataIndex < data.length - 1) {
		if (i < 0) throw new Error('Data overflow');

		const xPos = Math.floor(i / size);
		const yPos = i % size;
		console.log({ xPos, yPos });

		const bit = data[dataIndex];

		console.log(result[xPos]);

		if (result[yPos][xPos] !== -1) {
			if (result[yPos][xPos - 1] !== -1) {
				i--;
				continue;
			}
			result[yPos][xPos - 1] = bit === '0' ? 0 : 1;
			dataIndex++;
			continue;
		}
		result[yPos][xPos] = bit === '0' ? 0 : 1;
		dataIndex++;

		if (result[yPos][xPos - 1] !== -1) {
			continue;
		}

		const bit2 = data[dataIndex];
		result[yPos][xPos - 1] = bit2 === '0' ? 0 : 1;

		dataIndex++;

		i--;
	}

	return result;
};

export const render = (version: number) => (data: string) => {
	const size = getVersionSize(version);
	const canvas: QRCanvas = Array.from({ length: size }, () =>
		Array.from({ length: size }, () => -1)
	);

	const withFinderPatterns = addFinderPatterns(size);
	const withAlignmentPatterns = addAlignmentPatterns(version);
	const withDarkModule = addDarkModule(size);
	const withData = addData(data);

	return withData(
		withAlignmentPatterns(
			withFinderPatterns(withDarkModule(withTimingPatterns(canvas)))
		)
	);

	// Add Finder Patterns
};
