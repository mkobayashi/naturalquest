export type SidebarAmazonProduct = {
	label: string;
	title: string;
	brand?: string;
	volume?: string;
	priceNote?: string;
	description: string;
	amazonUrl: string;
	imageUrl: string;
	imageAlt: string;
};

export type SidebarAmazonConfig = {
	slugPrefixes?: string[];
	slugs?: string[];
	products: SidebarAmazonProduct[];
};

export function sidebarAmazonMatches(slug: string, config: SidebarAmazonConfig): boolean {
	if (config.slugs?.includes(slug)) return true;
	return config.slugPrefixes?.some((prefix) => slug.startsWith(prefix)) ?? false;
}

export function getSidebarAmazonProducts(
	slug: string,
	configs: SidebarAmazonConfig[],
): SidebarAmazonProduct[] {
	return configs.filter((config) => sidebarAmazonMatches(slug, config)).flatMap((config) => config.products);
}
