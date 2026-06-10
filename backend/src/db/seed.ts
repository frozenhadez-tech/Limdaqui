import { db, pool } from "./index.js";
import { categories, products } from "./schema.js";

const CATEGORIES = [
  { name: "Electronics", slug: "electronics" },
  { name: "Apparel", slug: "apparel" },
  { name: "Home & Kitchen", slug: "home-kitchen" },
];

type SeedProduct = {
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  stock: number;
  imageUrl: string;
  categorySlug: string;
};

const PRODUCTS: SeedProduct[] = [
  {
    name: "Wireless Headphones",
    slug: "wireless-headphones",
    description: "Over-ear Bluetooth headphones with active noise cancellation.",
    priceCents: 12999,
    stock: 40,
    imageUrl: "https://picsum.photos/seed/headphones/600/600",
    categorySlug: "electronics",
  },
  {
    name: "Mechanical Keyboard",
    slug: "mechanical-keyboard",
    description: "Hot-swappable 75% mechanical keyboard with RGB backlight.",
    priceCents: 8999,
    stock: 25,
    imageUrl: "https://picsum.photos/seed/keyboard/600/600",
    categorySlug: "electronics",
  },
  {
    name: "Classic Cotton Tee",
    slug: "classic-cotton-tee",
    description: "Soft 100% organic cotton t-shirt. Unisex fit.",
    priceCents: 2499,
    stock: 120,
    imageUrl: "https://picsum.photos/seed/tee/600/600",
    categorySlug: "apparel",
  },
  {
    name: "Stainless Water Bottle",
    slug: "stainless-water-bottle",
    description: "Insulated 750ml bottle that keeps drinks cold for 24h.",
    priceCents: 1999,
    stock: 80,
    imageUrl: "https://picsum.photos/seed/bottle/600/600",
    categorySlug: "home-kitchen",
  },
  {
    name: "Ceramic Pour-Over Set",
    slug: "ceramic-pour-over-set",
    description: "Hand-glazed ceramic dripper with matching carafe.",
    priceCents: 3499,
    stock: 30,
    imageUrl: "https://picsum.photos/seed/pourover/600/600",
    categorySlug: "home-kitchen",
  },
];

async function main() {
  console.log("Seeding categories...");
  await db.insert(categories).values(CATEGORIES).onConflictDoNothing();

  const allCategories = await db.select().from(categories);
  const categoryIdBySlug = new Map(allCategories.map((c) => [c.slug, c.id]));

  console.log("Seeding products...");
  for (const p of PRODUCTS) {
    const categoryId = categoryIdBySlug.get(p.categorySlug) ?? null;
    await db
      .insert(products)
      .values({
        name: p.name,
        slug: p.slug,
        description: p.description,
        priceCents: p.priceCents,
        stock: p.stock,
        imageUrl: p.imageUrl,
        categoryId,
      })
      .onConflictDoNothing({ target: products.slug });
  }

  console.log(
    `Done. ${CATEGORIES.length} categories, ${PRODUCTS.length} products ensured.`,
  );
  await pool.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
