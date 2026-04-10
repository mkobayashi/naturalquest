/**
 * ジャーナル記事の本文から先頭の画像 URL を拾い、空の heroImage を補完する。
 *
 *   npm run journal:hero-fill -- --dry-run   # 変更せず集計・一覧のみ
 *   npm run journal:hero-fill                 # 書き込み
 *
 * 既に heroImage が非空のファイルは上書きしない。
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JOURNAL_DIR = path.join(__dirname, '..', 'src', 'content', 'journal');

const MD_IMG = /!\[[^\]]*\]\(([^)\s]+)\)/g;
const HTML_IMG = /<img[^>]+src=["']([^"']+)["']/gi;

function extractFirstImageUrl(body) {
	if (!body) return null;
	let m;
	MD_IMG.lastIndex = 0;
	while ((m = MD_IMG.exec(body)) !== null) {
		const url = m[1].trim().replace(/^<|>$/g, '');
		if (/^https?:\/\//i.test(url) || url.startsWith('/')) return url;
	}
	HTML_IMG.lastIndex = 0;
	while ((m = HTML_IMG.exec(body)) !== null) {
		const url = m[1].trim();
		if (/^https?:\/\//i.test(url) || url.startsWith('/')) return url;
	}
	return null;
}

function isHeroEmpty(data) {
	const h = data?.heroImage;
	if (h == null) return true;
	if (typeof h !== 'string') return true;
	return h.trim() === '';
}

async function main() {
	const dryRun = process.argv.includes('--dry-run') || process.argv.includes('-n');

	const entries = await fs.readdir(JOURNAL_DIR, { withFileTypes: true });
	const mdFiles = entries
		.filter((e) => e.isFile() && e.name.endsWith('.md'))
		.map((e) => e.name)
		.sort();

	let skippedHasHero = 0;
	let updated = 0;
	let unchangedNoImage = 0;
	const wouldSet = [];
	const stillMissing = [];

	for (const name of mdFiles) {
		const filePath = path.join(JOURNAL_DIR, name);
		const raw = await fs.readFile(filePath, 'utf8');
		const { data, content } = matter(raw);

		if (!isHeroEmpty(data)) {
			skippedHasHero++;
			continue;
		}

		const url = extractFirstImageUrl(content);
		if (!url) {
			unchangedNoImage++;
			stillMissing.push(name);
			continue;
		}

		if (dryRun) {
			wouldSet.push({ name, url });
		} else {
			data.heroImage = url;
			const out = matter.stringify(content, data);
			await fs.writeFile(filePath, out, 'utf8');
			updated++;
		}
	}

	console.log(
		dryRun
			? '[dry-run] heroImage を追加する候補（本文に画像あり・frontmatter 空）'
			: 'heroImage を追加したファイル',
	);
	if (dryRun) {
		for (const { name, url } of wouldSet) {
			console.log(`  ${name}`);
			console.log(`    → ${url}`);
		}
	} else {
		console.log(`  件数: ${updated}`);
	}

	console.log('');
	console.log('サマリ:');
	console.log(`  既に heroImage あり（スキップ）: ${skippedHasHero}`);
	if (dryRun) {
		console.log(`  追加候補: ${wouldSet.length}`);
	} else {
		console.log(`  追加済み: ${updated}`);
	}
	console.log(`  本文に画像なし（手作業用リスト）: ${unchangedNoImage}`);

	if (stillMissing.length) {
		console.log('');
		console.log('--- 本文に画像が見つからない .md（heroImage 手入力） ---');
		for (const name of stillMissing) console.log(name);
	}

	if (dryRun && wouldSet.length === 0 && stillMissing.length === 0) {
		console.log('（対象なし）');
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
