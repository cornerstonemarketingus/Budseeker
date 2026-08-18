type HighSocietyProduct = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  price: number;
  comparePrice: number | null;
  thcContent: number | null;
  cbdContent: number | null;
  strain: string | null;
  effects: string[];
  flavors: string[];
  inStock: boolean;
  published: boolean;
  category: { name: string; slug: string };
  variants: Array<{ id: string; label: string; price: number; inStock: boolean }>;
};

export type CatalogSearchResult = {
  productName: string;
  slug: string;
  brand: string | null;
  category: string;
  strain: string | null;
  thcContent: number | null;
  cbdContent: number | null;
  effects: string[];
  variantId: string;
  variantLabel: string;
  price: number;
  comparePrice: number | null;
  deal: null;
};

const catalogUrl = () => (process.env.HIGH_SOCIETY_CATALOG_URL || "https://highsocietymn.vercel.app/api/products").replace(/\/$/, "");

function matchesQuery(product: HighSocietyProduct, query: string) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const searchable = [product.name, product.brand, product.category.name, product.strain, ...product.effects, ...product.flavors]
    .filter(Boolean).join(" ").toLowerCase();
  return terms.every((term) => searchable.includes(term));
}

export async function searchHighSocietyCatalog(query: string, categorySlug?: string): Promise<CatalogSearchResult[]> {
  const response = await fetch(catalogUrl(), { next: { revalidate: 300 }, signal: AbortSignal.timeout(12_000) });
  if (!response.ok) throw new Error(`High Society catalog returned ${response.status}`);
  const data = await response.json() as { products?: HighSocietyProduct[] };
  if (!Array.isArray(data.products)) throw new Error("High Society catalog response was invalid");

  return data.products
    .filter((product) => product.published && product.inStock)
    .filter((product) => !categorySlug || product.category.slug === categorySlug)
    .filter((product) => matchesQuery(product, query))
    .flatMap((product) => product.variants.filter((variant) => variant.inStock).map((variant) => ({
      productName: product.name,
      slug: product.slug,
      brand: product.brand,
      category: product.category.name,
      strain: product.strain,
      thcContent: product.thcContent,
      cbdContent: product.cbdContent,
      effects: product.effects,
      variantId: `highsociety-${variant.id}`,
      variantLabel: variant.label,
      price: variant.price ?? product.price,
      comparePrice: product.comparePrice,
      deal: null,
    })))
    .slice(0, 40);
}

export function fallbackBudtenderReply(message: string, products: CatalogSearchResult[]) {
  const lower = message.toLowerCase();
  const format = /edible|gummy|drink/.test(lower) ? "edible" : /vape|cart|pen/.test(lower) ? "vape" : /flower|bud|joint|pre.?roll/.test(lower) ? "flower" : "";
  const matching = format ? products.filter((product) => product.category.toLowerCase().includes(format)) : products;
  const picks = matching.slice(0, 3);
  const productNote = picks.length
    ? `I found ${picks.map((product) => `${product.productName} (${product.variantLabel}, $${product.price})`).join(", ")}.`
    : "I do not have a current exact match in the live catalog, but the nearby finder can point you to local menus.";
  const guidance = /sleep|pain|anxiety|medical/.test(lower)
    ? "I cannot give medical advice, so check with a healthcare professional for health-related questions."
    : "For a first try, keep the dose low and give it time before taking more.";
  return `${productNote} ${guidance} Adults 21+ only.`;
}
