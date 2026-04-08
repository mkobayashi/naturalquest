import { defineCollection, z } from 'astro:content';

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
			heroImage: z.string().optional(),
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
