import type { CollectionEntry } from 'astro:content';

/** frontmatter の `public: false` 以外を公開とみなす（未指定は公開） */
export function isJournalPublic(entry: CollectionEntry<'journal'>): boolean {
	return entry.data.public !== false;
}
