import { json, error } from '@sveltejs/kit';
import { ASSEMBLYAI_API_KEY } from '$env/static/private';
import type { RequestHandler } from './$types';

const BASE = 'https://api.assemblyai.com/v2';
const HEADERS = () => ({
	Authorization: ASSEMBLYAI_API_KEY,
	'Content-Type': 'application/json'
});

export const POST: RequestHandler = async ({ request }) => {
	if (!ASSEMBLYAI_API_KEY) {
		throw error(500, 'ASSEMBLYAI_API_KEY non configurée dans .env');
	}

	const { audioUrl } = await request.json();
	if (!audioUrl) throw error(400, 'audioUrl manquant');

	// 1. Soumettre la transcription (AssemblyAI télécharge le fichier lui-même)
	const submitRes = await fetch(`${BASE}/transcript`, {
		method: 'POST',
		headers: HEADERS(),
		body: JSON.stringify({
			audio_url: audioUrl,
			language_code: 'fr'
		})
	});

	if (!submitRes.ok) {
		const err = await submitRes.text();
		throw error(502, `AssemblyAI soumission échouée : ${err}`);
	}

	const { id } = await submitRes.json();

	// 2. Polling jusqu'à completion (max 10 min)
	const deadline = Date.now() + 10 * 60 * 1000;
	while (Date.now() < deadline) {
		await sleep(3000);

		const pollRes = await fetch(`${BASE}/transcript/${id}`, {
			headers: HEADERS()
		});

		if (!pollRes.ok) continue;

		const result = await pollRes.json();

		if (result.status === 'completed') {
			return json({ transcript: result.text?.trim() ?? '' });
		}

		if (result.status === 'error') {
			throw error(502, `AssemblyAI erreur : ${result.error}`);
		}
		// statuts 'queued' ou 'processing' → on continue à attendre
	}

	throw error(504, 'Timeout : la transcription a pris trop longtemps');
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
