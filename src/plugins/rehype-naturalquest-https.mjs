import { visit } from 'unist-util-visit';

/** http://naturalquest.org（および www）を https に統一（混合コンテンツ回避） */
const HTTP_NQ = /^http:\/\/(www\.)?naturalquest\.org/i;

function upgradeUrl(url) {
	if (typeof url !== 'string') return url;
	return HTTP_NQ.test(url) ? url.replace(/^http:\/\//i, 'https://') : url;
}

export function rehypeNaturalquestHttps() {
	return (tree) => {
		visit(tree, 'element', (node) => {
			if (node.tagName === 'img' && node.properties?.src) {
				node.properties.src = upgradeUrl(String(node.properties.src));
			}
		});
	};
}
