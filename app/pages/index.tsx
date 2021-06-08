import Head from 'next/head';
import { useEffect, useState } from 'react';
import { Layer, Rect, Stage } from 'react-konva';
import styles from '../styles/Home.module.scss';

const STAGE_SIZE = 400;
const QR_SIZE = 20;
const CELL_SIZE = STAGE_SIZE / QR_SIZE;

const generateQRCode = (size: number, url: string): boolean[][] => {
	let qrCode = Array.from({ length: QR_SIZE }, (_, x) =>
		Array.from({ length: QR_SIZE }, (_, y) => false)
	);

	qrCode[0][1] = true;
	qrCode[2][10] = true;

	return qrCode;
};

export default function Home() {
	const [url, setUrl] = useState('');
	const [qrCode, setQRCode] = useState<boolean[][]>([]);

	useEffect(() => {
		setQRCode(generateQRCode(QR_SIZE, 'https://google.com'));
	}, [url]);

	return (
		<div className={styles.container}>
			<Head>
				<title>Qurl</title>
			</Head>

			<main className={styles.main}>
				<h1 className={styles.title}>Qurl</h1>

				<p className={styles.description}>Create a custom QR Code</p>

				<input
					type='text'
					name='url_input'
					value={url}
					onChange={({ target }) => setUrl(target.value)}
				/>
				{url}

				<Stage width={STAGE_SIZE} height={STAGE_SIZE}>
					<Layer>
						{qrCode.map((row, x) =>
							row.map((cell, y) => (
								<Rect
									x={x * CELL_SIZE}
									y={y * CELL_SIZE}
									width={CELL_SIZE}
									height={CELL_SIZE}
									fill={cell ? '#cc6666' : '#6666cc'}
								/>
							))
						)}
					</Layer>
				</Stage>
			</main>

			<footer className={styles.footer}>
				<a
					href='https://dvmm.dev'
					target='_blank'
					rel='noopener noreferrer'
				>
					dvmm.dev
				</a>
			</footer>
		</div>
	);
}
