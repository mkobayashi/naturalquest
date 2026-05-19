/** @typedef {import('hast').Root} Root */
/** @typedef {import('hast').Element} Element */
/** @typedef {import('hast').Nodes} Nodes */

const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
const LEVEL_MARKERS = /^[①②③④⑤⑥⑦⑧⑨⑩]/;

/**
 * `.article-guide` 内の h3（①②③…）配下を `.level` カードに変換
 * @returns {(tree: Root) => void}
 */
export function rehypeGuideLevels() {
	return (tree) => {
		if (!tree || tree.type !== 'root') return;
		visit(tree, (node) => {
			if (node.type !== 'root' && node.type !== 'element') return;
			if (!Array.isArray(node.children)) return;
			const hasLevelH3 = node.children.some(
				(c) => c && isElement(c, 'h3') && headingHasLevelMarker(c)
			);
			if (hasLevelH3) transformLevelSections(node);
		});
	};
}

/** @param {Root | Element} container */
function transformLevelSections(container) {
	if (!Array.isArray(container.children)) return;

	const children = container.children.filter(Boolean);
	const next = [];

	for (let i = 0; i < children.length; i++) {
		const node = children[i];
		if (!isElement(node, 'h3') || !headingHasLevelMarker(node)) {
			next.push(node);
			continue;
		}

		const levelNum = levelFromHeading(node);
		const sectionNodes = [node];
		let j = i + 1;
		while (j < children.length) {
			const sibling = children[j];
			if (isElement(sibling, 'h2') || isElement(sibling, 'h3')) break;
			if (isElement(sibling, 'hr')) break;
			sectionNodes.push(sibling);
			j++;
		}

		next.push(buildLevelElement(sectionNodes, levelNum));
		i = j - 1;
	}

	container.children = next.filter(Boolean);
}

/** @param {Nodes[]} sectionNodes @param {number} levelNum */
function buildLevelElement(sectionNodes, levelNum) {
	const h3 = sectionNodes[0];
	const labelText = textContent(h3).replace(/^[①②③④⑤⑥⑦⑧⑨⑩]\s*/, '');

	/** @type {Element} */
	return {
		type: 'element',
		tagName: 'div',
		properties: {
			className: ['level'],
			dataLevel: String(levelNum),
		},
		children: [
			{
				type: 'element',
				tagName: 'div',
				properties: { className: ['level__head'] },
				children: [
					{
						type: 'element',
						tagName: 'span',
						properties: { className: ['level__num'] },
						children: [{ type: 'text', value: CIRCLED[levelNum - 1] ?? String(levelNum) }],
					},
					{
						type: 'element',
						tagName: 'div',
						properties: {},
						children: [
							{
								type: 'element',
								tagName: 'div',
								properties: { className: ['level__label'] },
								children: [{ type: 'text', value: labelText }],
							},
							buildMeter(levelNum),
						],
					},
				],
			},
			...groupProducts(sectionNodes.slice(1)).map(buildProductBlock),
		],
	};
}

/** @param {number} levelNum */
function buildMeter(levelNum) {
	/** @type {Element} */
	return {
		type: 'element',
		tagName: 'div',
		properties: { className: ['level__meter'] },
		children: Array.from({ length: 4 }, (_, i) => ({
			type: 'element',
			tagName: 'i',
			properties: i < levelNum ? { className: ['on'] } : {},
			children: [],
		})),
	};
}

/** @param {Nodes[]} nodes */
function groupProducts(nodes) {
	/** @type {Nodes[][]} */
	const groups = [];
	/** @type {Nodes[]} */
	let current = [];

	for (const node of nodes) {
		if (isProductNameParagraph(node)) {
			if (current.length) groups.push(current);
			current = [node];
		} else {
			current.push(node);
		}
	}
	if (current.length) groups.push(current);
	return groups;
}

/** @param {Nodes[]} nodes */
function buildProductBlock(nodes) {
	const nameNode = nodes.find((n) => isProductNameParagraph(n));
	const { name, maker } = parseProductName(nameNode);
	const bodyParas = nodes.filter((n) => n !== nameNode && isElement(n, 'p') && !isSpecList(n));
	const specList = nodes.find((n) => isSpecList(n));

	/** @type {Element} */
	const product = {
		type: 'element',
		tagName: 'div',
		properties: { className: ['product'] },
		children: [
			{
				type: 'element',
				tagName: 'div',
				properties: { className: ['product__main'] },
				children: [
					{
						type: 'element',
						tagName: 'h3',
						properties: { className: ['product__name'] },
						children: [
							{ type: 'text', value: name },
							...(maker
								? [
										{
											type: 'element',
											tagName: 'span',
											properties: { className: ['product__maker'] },
											children: [{ type: 'text', value: maker }],
										},
									]
								: []),
						],
					},
					...bodyParas,
				],
			},
		],
	};

	if (specList) {
		product.children.push({
			type: 'element',
			tagName: 'dl',
			properties: { className: ['product__specs'] },
			children: listItemsToSpecs(specList),
		});
	}

	return product;
}

/** @param {Nodes} list */
function listItemsToSpecs(list) {
	if (!isElement(list, 'ul')) return [];
	return list.children
		.filter((li) => isElement(li, 'li'))
		.map((li) => {
			const raw = textContent(li);
			const sep = raw.indexOf('：');
			const key = sep >= 0 ? raw.slice(0, sep) : raw;
			const value = sep >= 0 ? raw.slice(sep + 1).trim() : '';
			return {
				type: 'element',
				tagName: 'div',
				properties: {},
				children: [
					{ type: 'element', tagName: 'dt', properties: {}, children: [{ type: 'text', value: key }] },
					{
						type: 'element',
						tagName: 'dd',
						properties: {},
						children: value ? [{ type: 'text', value }] : [],
					},
				],
			};
		});
}

/** @param {Nodes | undefined} node */
function parseProductName(node) {
	const raw = node ? textContent(node).replace(/\*\*/g, '') : '';
	const m = raw.match(/^[「"]?(.+?)[」"]?\s*[（(](.+?)[）)]\s*$/);
	if (m) return { name: m[1], maker: m[2] };
	return { name: raw, maker: '' };
}

/** @param {Nodes} node */
function isProductNameParagraph(node) {
	if (!isElement(node, 'p')) return false;
	const t = textContent(node);
	return /^[「"]/.test(t) || /^\*\*[「"]/.test(t) || /^\*\*/.test(t);
}

/** @param {Nodes} node */
function isSpecList(node) {
	if (!isElement(node, 'ul')) return false;
	const first = node.children.find((c) => isElement(c, 'li'));
	if (!first) return false;
	const t = textContent(first);
	return (
		t.includes('入手先') || t.includes('価格') || t.includes('参考価格') || t.includes('税込')
	);
}

/** @param {Nodes} node */
function headingHasLevelMarker(node) {
	return LEVEL_MARKERS.test(textContent(node));
}

/** @param {Nodes} node */
function levelFromHeading(node) {
	const t = textContent(node);
	const idx = CIRCLED.findIndex((c) => t.startsWith(c));
	return idx >= 0 ? idx + 1 : 1;
}

/** @param {Nodes} node @param {string} tag */
function isElement(node, tag) {
	return node?.type === 'element' && node.tagName === tag;
}

/** @param {Element} node @param {string} cls */
function hasClass(node, cls) {
	const c = node.properties?.className;
	if (Array.isArray(c)) return c.includes(cls);
	return c === cls;
}

/** @param {Nodes} node */
function textContent(node) {
	if (node.type === 'text') return node.value;
	if (node.type === 'element') return node.children.map(textContent).join('');
	return '';
}

/** @param {Nodes | undefined | null} node @param {(n: Nodes) => void} fn */
function visit(node, fn) {
	if (!node || typeof node !== 'object' || !('type' in node)) return;
	fn(node);
	if (node.type === 'element' && Array.isArray(node.children)) {
		for (const child of node.children) {
			if (child) visit(child, fn);
		}
	}
}
