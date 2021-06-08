import { errorCorrectionTable } from './errorCorrectionTable';
import {
	divByGenerator,
	getGeneratorPolynomial,
	multPolynomials,
} from './generatorPolynomial';
import { remainderBits } from './remainderBits';
import { render } from './render';
import { closestDivisibleInt, logPolynomial } from './util';
import { versionCapacities } from './versionCapacities';

export enum Mode {
	Numeric,
	Alphanumeric,
	Byte,
	Kanji,
}

export enum ErrorCorrectionLevel {
	L,
	M,
	Q,
	H,
}

// Smallest QR Code size
const BASE_SIZE = 21;
const VERSIONS_COUNT = 40;
const ALPHANUMERIC_CHARS = [
	'0',
	'1',
	'2',
	'3',
	'4',
	'5',
	'6',
	'7',
	'8',
	'9',
	'A',
	'B',
	'C',
	'D',
	'E',
	'F',
	'G',
	'H',
	'I',
	'J',
	'K',
	'L',
	'M',
	'N',
	'O',
	'P',
	'Q',
	'R',
	'S',
	'T',
	'U',
	'V',
	'W',
	'X',
	'Y',
	'Z',
	' ',
	'$',
	'%',
	'*',
	'+',
	'-',
	'.',
	'/',
	':',
];

export const getVersionCapacity =
	(mode: Mode) => (ecLevel: ErrorCorrectionLevel) => (version: number) =>
		versionCapacities[version][ecLevel][mode];

export const getVersionSize = (version: number) => BASE_SIZE + version * 4;

export const getModeIndicator = (mode: Mode) =>
	['0001', '0010', '0100', '1000'][mode];

const characterCountBits = [
	[10, 9, 8, 8],
	[12, 11, 16, 10],
	[14, 13, 16, 12],
];

export const getCharacterCountBits = (mode: Mode) => (version: number) => {
	if (version < 9) return characterCountBits[0][mode];
	if (version < 26) return characterCountBits[1][mode];
	return characterCountBits[3][mode];
};

export const getStringMode = (data: string): Mode => {
	if (data.match(/^[0-9]*$/)) return Mode.Numeric;
	if (data.match(/^[A-Z0-9 $%*+\-./:]*$/)) return Mode.Alphanumeric;

	return Mode.Byte;
};

const getDataCodewordsCount =
	(ecLevel: ErrorCorrectionLevel) => (version: number) =>
		errorCorrectionTable[version][ecLevel][0]; // 0 -> Data Codewords Count Index

const getECCodewordsCount =
	(ecLevel: ErrorCorrectionLevel) => (version: number) =>
		errorCorrectionTable[version][ecLevel][1];

const encodeNumericString = (data: string) => {
	const groups = data.match(/.{1,3}/g);
	if (!groups) return '';

	return groups
		.map((group) => {
			// .toString is ok cause no negative numbers.
			const bits = parseInt(group).toString(2);
			switch (group.length) {
				case 3:
					return bits.padStart(10, '0');
				case 2:
					return bits.padStart(7, '0');
				case 1:
					return bits.padStart(4, '0');
				default:
					throw new Error('Invalid group length.');
			}
		})
		.join('');
};

const encodeAlphanumericString = (data: string) => {
	const groups = data.match(/.{1,2}/g);
	if (!groups) return '';

	return groups
		.map((chars) => {
			const [first, second] = [...chars].map((char) =>
				ALPHANUMERIC_CHARS.findIndex((alphaChar) => alphaChar === char)
			);

			// .toString is ok cause no negative numbers.
			if (!second) return first.toString(2).padStart(6, '0');
			return (first * 45 + second).toString(2).padStart(11, '0');
		})
		.join('');
};

const encodeByteString = (data: string) => '';
const encodeKanjiString = (data: string) => '';

const encodeData = (mode: Mode) => (data: string) => {
	switch (mode) {
		case Mode.Numeric:
			return encodeNumericString(data);
		case Mode.Alphanumeric:
			return encodeAlphanumericString(data);
		case Mode.Byte:
			return encodeByteString(data);
		case Mode.Kanji:
			return encodeKanjiString(data);
	}
};

const getEncodedDataGroups =
	(ecLevel: ErrorCorrectionLevel) =>
	(version: number) =>
	(encodedData: string[]): string[][] => {
		const [
			,
			,
			group1Blocks,
			dataCodewordsCountInGroup1Blocks,
			group2Blocks,
			dataCodewordsCountInGroup2Blocks,
		] = errorCorrectionTable[version][ecLevel];

		// Dear future me: fuck you :)
		const group1 = Array.from({ length: group1Blocks }, (_, blockId) =>
			encodedData.slice(
				blockId * dataCodewordsCountInGroup1Blocks,
				(blockId + 1) * dataCodewordsCountInGroup1Blocks
			)
		);
		const group2 =
			group2Blocks !== null && dataCodewordsCountInGroup2Blocks !== null
				? Array.from({ length: group2Blocks }, (_, blockId) =>
						encodedData.slice(
							blockId * dataCodewordsCountInGroup2Blocks,
							(blockId + 1) * dataCodewordsCountInGroup2Blocks
						)
				  )
				: [];

		const groups = [...group1, ...group2];
		return groups;
	};

const getECGroups =
	(ecLevel: ErrorCorrectionLevel) =>
	(version: number) =>
	(ecCodewords: string[]) => {
		const [, ecCodewordsPerBlock] = errorCorrectionTable[version][ecLevel];

		let groups = [];

		for (let i = 0; i < ecCodewords.length; i += ecCodewordsPerBlock) {
			groups.push(ecCodewords.slice(i, i + ecCodewordsPerBlock));
		}
		return groups;
	};

export const encodeString =
	(ecLevel: ErrorCorrectionLevel) => (data: string) => {
		const mode = getStringMode(data);
		const getCapacity = getVersionCapacity(mode)(ecLevel);

		let version = null;

		for (let i = 0; i < VERSIONS_COUNT; i++) {
			if (getCapacity(i) > data.length) {
				version = i;
				break;
			}
		}

		if (version === null) throw new Error('Data too powerful.');

		const modeIndicator = getModeIndicator(mode);
		const characterCountBits = getCharacterCountBits(mode)(version);
		const characterCountIndicator = data.length
			.toString(2)
			.padStart(characterCountBits, '0');

		const dataCodewordsCount = getDataCodewordsCount(ecLevel)(version);
		const dataCodewordsBits = dataCodewordsCount * 8;

		let encodedData =
			modeIndicator + characterCountIndicator + encodeData(mode)(data);

		encodedData += '0'.repeat(
			Math.min(4, dataCodewordsBits - encodedData.length)
		);

		encodedData = encodedData.padEnd(
			closestDivisibleInt(encodedData.length, 8),
			'0'
		);

		encodedData = encodedData.padEnd(dataCodewordsBits, '1110110000010001');

		const generateDataGroups = getEncodedDataGroups(ecLevel)(version);
		const encodedDataGroups = generateDataGroups(
			encodedData.match(/.{1,8}/g) ?? []
		);

		const messagePolynomial = (encodedData.match(/.{1,8}/g) ?? []).map(
			(byte) => parseInt(byte, 2)
		);

		const ecCodewordsCount = getECCodewordsCount(ecLevel)(version);

		const generatorPolynomial = getGeneratorPolynomial(ecCodewordsCount);

		const ecCodewords =
			divByGenerator(generatorPolynomial)(messagePolynomial);

		const generateECGroups = getECGroups(ecLevel)(version);
		const ecGroups = generateECGroups(ecCodewords);

		const interleavedData = Array.from(
			{
				length: dataCodewordsCount + ecCodewordsCount,
			},
			(_, i) => {
				if (i < dataCodewordsCount)
					return encodedDataGroups[i % encodedDataGroups.length][
						Math.floor(i / encodedDataGroups.length)
					];

				const ecIndex = i - dataCodewordsCount;
				return ecGroups[ecIndex % ecGroups.length][
					Math.floor(ecIndex / ecGroups.length)
				];
			}
		);
		const dataWithRemainderBits =
			interleavedData.join('') + '0'.repeat(remainderBits[version]);

		return render(version)(dataWithRemainderBits);
	};
