export const closestDivisibleInt = (a: number, b: number) => a + b - (a % b);

export const logPolynomial = (polynom: number[]) =>
	polynom
		.map((coeff, i) => {
			const power = polynom.length - i - 1;

			if (power === 0) return coeff;
			if (power === 1) return `${coeff}X`;
			return `${coeff}X^${power}`;
		})
		.join(' + ');
