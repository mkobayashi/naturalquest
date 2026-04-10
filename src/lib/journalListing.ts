import type { CollectionEntry } from 'astro:content';
import { getCollection } from 'astro:content';
import { isJournalPublic } from './journalPublic';

export const LIST_PAGE_SIZE = 12;

export async function getSortedPostsInCategory(category: string): Promise<CollectionEntry<'journal'>[]> {
	const allPosts = await getCollection('journal');
	return allPosts
		.filter(isJournalPublic)
		.filter((p) => (p.data.categories ?? []).includes(category))
		.sort((a, b) => {
			const dateA = a.data.pubDate ? new Date(a.data.pubDate).getTime() : 0;
			const dateB = b.data.pubDate ? new Date(b.data.pubDate).getTime() : 0;
			return dateB - dateA;
		});
}

export async function getSortedPostsWithTag(tag: string): Promise<CollectionEntry<'journal'>[]> {
	const allPosts = await getCollection('journal');
	return allPosts
		.filter(isJournalPublic)
		.filter((p) => (p.data.tags ?? []).includes(tag))
		.sort((a, b) => {
			const dateA = a.data.pubDate ? new Date(a.data.pubDate).getTime() : 0;
			const dateB = b.data.pubDate ? new Date(b.data.pubDate).getTime() : 0;
			return dateB - dateA;
		});
}

export function totalPagesFor(count: number, pageSize: number = LIST_PAGE_SIZE): number {
	return Math.max(1, Math.ceil(count / pageSize));
}
