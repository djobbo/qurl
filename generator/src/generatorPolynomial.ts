const [EXP_TABLE, LOG_TABLE] = (() => {
	const expTable = Array.from({ length: 256 }, () => 0);
	const logTable = Array.from({ length: 256 }, () => 0);

	let x = 1;
	for (let i = 0; i < 255; i++) {
		expTable[i] = x;
		logTable[x] = i;

		x *= 2;

		if (x >= 256) x ^= 0x11d;
	}

	return [expTable, logTable];
})();

// Galois Exp
const gExp = (n: number) => EXP_TABLE[n];

// Galois Log
const gLog = (n: number) => {
	if (n <= 0) throw new Error(`log(${n})`);
	return LOG_TABLE[n];
};

// Galois Mult
const gMult = (x: number) => (y: number) => {
	if (x === 0 || y === 0) return 0;
	return gExp((gLog(x) + gLog(y)) % 255);
};

export const multPolynomials = (p1: number[], p2: number[]) => {
	const coeff = Array.from({ length: p1.length + p2.length - 1 }, () => 0);

	for (let i = 0; i < p1.length; i++) {
		for (let j = 0; j < p2.length; j++) {
			coeff[i + j] ^= gMult(p1[i])(p2[j]);
		}
	}

	return coeff;
};

export const divByGenerator = (generator: number[]) => (message: number[]) => {
	const normalizedGenerator = [
		...generator,
		...Array.from({ length: message.length - 1 }, () => 0),
	];
	const normalizedMessage = [
		...message,
		...Array.from({ length: generator.length }, () => 0),
	];

	let result = [...normalizedMessage];

	for (let i = 0; i < message.length; i++) {
		const coeff = result[0];
		const multipliedGen = normalizedGenerator.map(gMult(coeff));

		result = multipliedGen.map((byte, j) => byte ^ result[j]);
		result = result.slice(result.findIndex((byte) => byte !== 0));
	}

	// Remove zeros at the end.
	return result
		.slice(0, generator.length - 1)
		.map((byte) => byte.toString(2));
};

export const getGeneratorPolynomial = (ecCodewordsCount: number) => {
	let polynom = [1];

	for (let i = 0; i < ecCodewordsCount; i++)
		polynom = multPolynomials(polynom, [1, gExp(i)]);

	return polynom;
};
