import { defineCollection, z } from 'astro:content';

const catalogGridItemSchema = z.object({
	name: z.string(),
	maker: z.string().optional(),
	tag: z.string().optional(),
	tags: z
		.array(
			z.object({
				label: z.string(),
				color: z.enum(['green', 'accent', 'muted']).optional(),
			})
		)
		.optional(),
	price: z.string().optional(),
	image: z.string().optional(),
	specs: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
	body: z.string().optional(),
});

const catalogSectionSchema = z.object({
	label: z.string(),
	/** セクション見出しの見た目：Aテキスト+下線 / B左ボーダー / C番号主体 / D背景帯（既定 B） */
	labelStyle: z.enum(['a', 'b', 'c', 'd']).default('b'),
	items: z.array(catalogGridItemSchema),
});

const journal = defineCollection({
	type: 'content',
	schema: z
		.object({
			title: z.string(),
			pubDate: z.coerce.date().optional(),
			categories: z.array(z.string()).optional(),
			/** 移行元の一部記事で使用 */
			category: z.array(z.string()).optional(),
			tags: z.array(z.string()).optional(),
			description: z.string().optional(),
			/** `false` のとき一覧に出さず、個別URLは「非公開」表示のみ（本文は出さない） */
			public: z.boolean().optional().default(true),
			heroImage: z.string().optional(),
			articleType: z.enum(['default', 'catalog', 'list', 'immersive']).optional().default('default'),
			/** カタログ記事：`alternate`＝写真交互（既定）、`grid`＝セクション付きカードグリッド */
			layout: z.enum(['alternate', 'grid']).optional().default('alternate'),
			sections: z.array(catalogSectionSchema).optional(),
			items: z
				.array(
					z.object({
						name: z.string(),
						tag: z.string().optional(),
						image: z.string().optional(),
						specs: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
						body: z.string().optional(),
						// 既存データ互換（必要なら後で削除可）
						badge: z.string().optional(),
					})
				)
				.optional(),
		})
		.transform(({ category, categories, heroImage, ...rest }) => ({
			...rest,
			categories: categories?.length ? categories : (category ?? []),
			heroImage:
				heroImage && /^http:\/\/(www\.)?naturalquest\.org/i.test(heroImage)
					? heroImage.replace(/^http:\/\//i, 'https://')
					: heroImage,
		})),
});

const features = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(),
		description: z.string(),
		tags: z.array(z.string()),
		pubDate: z.coerce.date().optional(),
	}),
});

export const collections = { journal, features };
