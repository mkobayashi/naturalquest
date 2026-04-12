/**
 * 開発サーバー（既定 http://127.0.0.1:4321）の URL を既定ブラウザで開く。
 *
 *   node scripts/open-journal-in-browser.mjs <ファイルパス>   → /journal/<スラッグ>
 *   node scripts/open-journal-in-browser.mjs --top          → /
 *
 * ポートが違うとき: PORT=3000 node scripts/open-journal-in-browser.mjs ...
 */

import { spawnSync } from 'node:child_process';
import { basename, extname } from 'node:path';

const port = process.env.PORT || '4321';
const origin = `http://127.0.0.1:${port}`;

const arg = process.argv[2];
if (!arg) {
	console.error('Usage: node scripts/open-journal-in-browser.mjs <file> | --top');
	process.exit(1);
}

if (arg !== '--top' && arg.trim() === '') {
	console.error('ジャーナルの .md / .mdx をエディタで開いた状態でタスクを実行してください。');
	process.exit(1);
}

let url;
if (arg === '--top') {
	url = `${origin}/`;
} else {
	const slug = basename(arg, extname(arg));
	url = `${origin}/journal/${encodeURIComponent(slug)}`;
}

function openUrl(href) {
	const platform = process.platform;
	if (platform === 'darwin') {
		return spawnSync('open', [href], { stdio: 'inherit' });
	}
	if (platform === 'win32') {
		return spawnSync('cmd', ['/c', 'start', '', href], { stdio: 'inherit' });
	}
	return spawnSync('xdg-open', [href], { stdio: 'inherit' });
}

const r = openUrl(url);
process.exit(r.status === null ? 1 : r.status);
