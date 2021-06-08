import { ErrorCorrectionLevel, encodeString } from './versions';

// console.log(getVersionCapacity(Mode.Numeric)(ErrorCorrectionLevel.L)(39));
// console.log(getVersionCapacity(Mode.Alphanumeric)(ErrorCorrectionLevel.L)(39));
// console.log(getVersionCapacity(Mode.Byte)(ErrorCorrectionLevel.L)(39));
// console.log(getVersionCapacity(Mode.Kanji)(ErrorCorrectionLevel.L)(39));

// console.log(encodeString(ErrorCorrectionLevel.L)('8675309')); // NUMERIC
// console.log(encodeString(ErrorCorrectionLevel.Q)('HELLO WORLD')); // ALPHANUMERIC
// const code = encodeString(ErrorCorrectionLevel.M)('HELLO WORLD'); // ALPHANUMERIC
const code = encodeString(ErrorCorrectionLevel.M)('HELLO WORLD'); // ALPHANUMERIC

console.log(
	code
		.map((row) =>
			row
				.map((cell) => {
					if (cell === 1) return '██';
					if (cell === -1) return '<>';
					return '  ';
				})
				.join('')
		)
		.join('\n')
);

// console.log(getGeneratorPolynomial(2)(2));

// console.log('sdasd');
