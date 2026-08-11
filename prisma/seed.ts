// Realistic but entirely fictional demo data. None of the dispensaries,
// brands, or license numbers below reference real licensed businesses —
// see the disclaimer that ships in the app footer.
import "dotenv/config";
import { PrismaClient, type StrainType, type DealType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

const DAY = 24 * 60 * 60 * 1000;
const now = new Date();

async function main() {
  console.log("Seeding Budseeker demo data…");

  // ── Compliance ────────────────────────────────────────────────────────
  await db.jurisdictionPolicy.upsert({
    where: { country_region: { country: "US", region: "MN" } },
    update: {},
    create: { country: "US", region: "MN", minAge: 21, deliveryAllowed: true, notes: "Adult-use, licensed retail only." },
  });
  await db.jurisdictionPolicy.upsert({
    where: { country_region: { country: "US", region: "CA" } },
    update: {},
    create: { country: "US", region: "CA", minAge: 21, deliveryAllowed: true },
  });

  // ── Categories ────────────────────────────────────────────────────────
  const categoryDefs = [
    { name: "Flower", slug: "flower" },
    { name: "Pre-Rolls", slug: "pre-rolls" },
    { name: "Vapes", slug: "vapes" },
    { name: "Edibles", slug: "edibles" },
    { name: "Concentrates", slug: "concentrates" },
    { name: "Tinctures", slug: "tinctures" },
    { name: "Topicals", slug: "topicals" },
  ];
  const categories = new Map<string, string>();
  for (const [i, c] of categoryDefs.entries()) {
    const row = await db.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: { ...c, sortOrder: i },
    });
    categories.set(c.slug, row.id);
  }

  // ── Strains ───────────────────────────────────────────────────────────
  const strainDefs: { name: string; slug: string; type: StrainType; description: string }[] = [
    { name: "Blue Dream", slug: "blue-dream", type: "HYBRID", description: "A widely-known sativa-leaning hybrid with a sweet berry aroma." },
    { name: "OG Kush", slug: "og-kush", type: "INDICA", description: "A classic indica-leaning strain with earthy, pine notes." },
    { name: "Sour Diesel", slug: "sour-diesel", type: "SATIVA", description: "A pungent, diesel-scented sativa popular for daytime use." },
    { name: "Girl Scout Cookies", slug: "girl-scout-cookies", type: "HYBRID", description: "A dense-budded hybrid with a sweet, earthy profile." },
    { name: "Granddaddy Purple", slug: "granddaddy-purple", type: "INDICA", description: "A grape-and-berry-scented indica with deep purple hues." },
    { name: "Green Crack", slug: "green-crack", type: "SATIVA", description: "An energetic, citrus-forward sativa." },
    { name: "Harlequin CBD", slug: "harlequin-cbd", type: "CBD", description: "A high-CBD, low-THC strain with a woody, earthy scent." },
  ];
  const strains = new Map<string, string>();
  for (const s of strainDefs) {
    const row = await db.strain.upsert({ where: { slug: s.slug }, update: {}, create: s });
    strains.set(s.slug, row.id);
  }

  // ── Brands ────────────────────────────────────────────────────────────
  const brandDefs = [
    { name: "North Loop Cannabis Co.", slug: "north-loop-cannabis-co", description: "Small-batch flower grown in Minneapolis.", verified: true },
    { name: "Prairie Sun Extracts", slug: "prairie-sun-extracts", description: "Solventless concentrates and live rosin.", verified: true },
    { name: "Lakeside Edibles", slug: "lakeside-edibles", description: "Precisely-dosed gummies and chocolates.", verified: true },
    { name: "Timberline Vapor", slug: "timberline-vapor", description: "Full-spectrum vape cartridges.", verified: false },
    { name: "Hearth & Leaf", slug: "hearth-and-leaf", description: "Craft pre-rolls and infused joints.", verified: true },
  ];
  const brands = new Map<string, string>();
  for (const b of brandDefs) {
    const row = await db.brand.upsert({ where: { slug: b.slug }, update: {}, create: b });
    brands.set(b.slug, row.id);
  }

  // ── Merchants & dispensaries (fictional, Eagan/Minneapolis MN area) ────
  const dispensaryDefs = [
    {
      merchantName: "Twin Cities Wellness Group",
      merchantSlug: "twin-cities-wellness-group",
      name: "Eagan Provisions",
      slug: "eagan-provisions",
      address1: "1450 Yankee Doodle Rd",
      city: "Eagan",
      state: "MN",
      postalCode: "55121",
      latitude: 44.8041,
      longitude: -93.1668,
      licenseVerified: true,
    },
    {
      merchantName: "Twin Cities Wellness Group",
      merchantSlug: "twin-cities-wellness-group",
      name: "Northfield Cannabis Market",
      slug: "northfield-cannabis-market",
      address1: "780 Cedar Ave",
      city: "Minneapolis",
      state: "MN",
      postalCode: "55407",
      latitude: 44.9375,
      longitude: -93.2367,
      licenseVerified: true,
    },
    {
      merchantName: "River Valley Retail LLC",
      merchantSlug: "river-valley-retail-llc",
      name: "Mendota Heights Dispensary",
      slug: "mendota-heights-dispensary",
      address1: "2200 Dodd Rd",
      city: "Mendota Heights",
      state: "MN",
      postalCode: "55120",
      latitude: 44.8831,
      longitude: -93.1401,
      licenseVerified: true,
    },
    {
      merchantName: "River Valley Retail LLC",
      merchantSlug: "river-valley-retail-llc",
      name: "Burnsville Green Room",
      slug: "burnsville-green-room",
      address1: "301 County Rd 42 W",
      city: "Burnsville",
      state: "MN",
      postalCode: "55337",
      latitude: 44.7677,
      longitude: -93.2777,
      licenseVerified: false,
    },
  ];

  const merchants = new Map<string, string>();
  const dispensaries = new Map<string, string>();
  for (const d of dispensaryDefs) {
    let merchantId = merchants.get(d.merchantSlug);
    if (!merchantId) {
      const merchant = await db.merchant.upsert({
        where: { slug: d.merchantSlug },
        update: {},
        create: { name: d.merchantName, slug: d.merchantSlug, planTier: "PRO" },
      });
      merchantId = merchant.id;
      merchants.set(d.merchantSlug, merchantId);
    }

    const dispensary = await db.dispensary.upsert({
      where: { slug: d.slug },
      update: {},
      create: {
        merchantId,
        name: d.name,
        slug: d.slug,
        description: `A licensed adult-use cannabis retailer in ${d.city}, MN.`,
        address1: d.address1,
        city: d.city,
        state: d.state,
        postalCode: d.postalCode,
        country: "US",
        latitude: d.latitude,
        longitude: d.longitude,
        phone: "(651) 555-0100",
        website: `https://${d.slug}.example.com`,
        status: "ACTIVE",
        lastMenuSyncAt: now,
        ratingAverage: 4.2,
        ratingCount: 0,
      },
    });
    dispensaries.set(d.slug, dispensary.id);

    await db.merchantLicense.upsert({
      where: { dispensaryId: dispensary.id },
      update: {},
      create: {
        dispensaryId: dispensary.id,
        licenseNumber: `MN-CRB-${Math.floor(10000 + Math.random() * 89999)}`,
        licenseType: "Adult-Use Retail",
        issuingAuthority: "Minnesota Office of Cannabis Management",
        status: d.licenseVerified ? "VERIFIED" : "PENDING",
        issuedAt: new Date(now.getTime() - 200 * DAY),
        expiresAt: new Date(now.getTime() + 165 * DAY),
        verifiedAt: d.licenseVerified ? new Date(now.getTime() - 190 * DAY) : null,
      },
    });

    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      await db.dispensaryHours.upsert({
        where: { dispensaryId_dayOfWeek: { dispensaryId: dispensary.id, dayOfWeek } },
        update: {},
        create: { dispensaryId: dispensary.id, dayOfWeek, opensAt: "09:00", closesAt: dayOfWeek === 5 || dayOfWeek === 6 ? "22:00" : "20:00" },
      });
    }
  }

  // ── Canonical products + variants ──────────────────────────────────────
  type VariantSeed = { packageSize: number; unit: string; thcPercent?: number; cbdPercent?: number; thcMgPerServing?: number; servingsPerPackage?: number };
  type ProductSeed = {
    brandSlug: string;
    categorySlug: string;
    strainSlug?: string;
    name: string;
    slug: string;
    description: string;
    variants: VariantSeed[];
  };

  const productDefs: ProductSeed[] = [
    {
      brandSlug: "north-loop-cannabis-co",
      categorySlug: "flower",
      strainSlug: "blue-dream",
      name: "Blue Dream",
      slug: "blue-dream-flower",
      description: "Hand-trimmed, small-batch Blue Dream flower.",
      variants: [
        { packageSize: 3.5, unit: "g", thcPercent: 19.4, cbdPercent: 0.3 },
        { packageSize: 7, unit: "g", thcPercent: 19.4, cbdPercent: 0.3 },
      ],
    },
    {
      brandSlug: "north-loop-cannabis-co",
      categorySlug: "flower",
      strainSlug: "og-kush",
      name: "OG Kush",
      slug: "og-kush-flower",
      description: "Dense, resinous OG Kush colas.",
      variants: [{ packageSize: 3.5, unit: "g", thcPercent: 22.1, cbdPercent: 0.2 }],
    },
    {
      brandSlug: "hearth-and-leaf",
      categorySlug: "pre-rolls",
      strainSlug: "sour-diesel",
      name: "Sour Diesel Pre-Roll Pack",
      slug: "sour-diesel-pre-roll-pack",
      description: "5-pack of 0.5g Sour Diesel pre-rolls.",
      variants: [{ packageSize: 2.5, unit: "g", thcPercent: 20.8 }],
    },
    {
      brandSlug: "timberline-vapor",
      categorySlug: "vapes",
      strainSlug: "green-crack",
      name: "Green Crack Live Resin Cart",
      slug: "green-crack-live-resin-cart",
      description: "Full-spectrum live resin vape cartridge.",
      variants: [{ packageSize: 1, unit: "g", thcPercent: 84.2 }],
    },
    {
      brandSlug: "lakeside-edibles",
      categorySlug: "edibles",
      name: "Mixed Berry Gummies 10-Pack",
      slug: "mixed-berry-gummies-10-pack",
      description: "10mg-per-piece mixed berry gummies.",
      variants: [{ packageSize: 100, unit: "mg", thcMgPerServing: 10, servingsPerPackage: 10 }],
    },
    {
      brandSlug: "lakeside-edibles",
      categorySlug: "edibles",
      name: "Dark Chocolate Squares 20-Pack",
      slug: "dark-chocolate-squares-20-pack",
      description: "5mg-per-square dark chocolate, low-dose format.",
      variants: [{ packageSize: 100, unit: "mg", thcMgPerServing: 5, servingsPerPackage: 20 }],
    },
    {
      brandSlug: "prairie-sun-extracts",
      categorySlug: "concentrates",
      strainSlug: "girl-scout-cookies",
      name: "Girl Scout Cookies Live Rosin",
      slug: "girl-scout-cookies-live-rosin",
      description: "Solventless live rosin, cold-cured.",
      variants: [{ packageSize: 1, unit: "g", thcPercent: 71.5 }],
    },
    {
      brandSlug: "prairie-sun-extracts",
      categorySlug: "tinctures",
      strainSlug: "harlequin-cbd",
      name: "Harlequin CBD:THC 1:1 Tincture",
      slug: "harlequin-cbd-thc-tincture",
      description: "Balanced 1:1 CBD:THC tincture, 30ml.",
      variants: [{ packageSize: 30, unit: "ml", thcMgPerServing: 5, cbdPercent: 5, servingsPerPackage: 30 }],
    },
    {
      brandSlug: "north-loop-cannabis-co",
      categorySlug: "flower",
      strainSlug: "granddaddy-purple",
      name: "Granddaddy Purple",
      slug: "granddaddy-purple-flower",
      description: "Deep-purple, dense Granddaddy Purple buds.",
      variants: [{ packageSize: 3.5, unit: "g", thcPercent: 18.7, cbdPercent: 0.4 }],
    },
  ];

  const dispensarySlugs = [...dispensaries.keys()];

  for (const p of productDefs) {
    const brandId = brands.get(p.brandSlug)!;
    const categoryId = categories.get(p.categorySlug)!;
    const strainId = p.strainSlug ? strains.get(p.strainSlug) : undefined;

    const product = await db.canonicalProduct.upsert({
      where: { brandId_slug: { brandId, slug: p.slug } },
      update: {},
      create: {
        brandId,
        categoryId,
        strainId,
        name: p.name,
        slug: p.slug,
        description: p.description,
        images: [],
        status: "PUBLISHED",
      },
    });

    for (const v of p.variants) {
      const existing = await db.productVariant.findFirst({
        where: { canonicalProductId: product.id, packageSize: v.packageSize, unit: v.unit },
      });
      const variant =
        existing ??
        (await db.productVariant.create({
          data: {
            canonicalProductId: product.id,
            packageSize: v.packageSize,
            unit: v.unit,
            thcPercent: v.thcPercent,
            cbdPercent: v.cbdPercent,
            thcMgPerServing: v.thcMgPerServing,
            servingsPerPackage: v.servingsPerPackage,
          },
        }));

      // List this variant at 2-3 nearby dispensaries with independently
      // varied pricing/stock, so price comparison has something real to show.
      const storeCount = 2 + Math.floor(Math.random() * 2);
      const chosenStores = [...dispensarySlugs].sort(() => Math.random() - 0.5).slice(0, storeCount);
      const basePrice = estimateBasePrice(v);

      for (const storeSlug of chosenStores) {
        const dispensaryId = dispensaries.get(storeSlug)!;
        const priceJitter = 1 + (Math.random() * 0.3 - 0.15);
        const price = round2(basePrice * priceJitter);
        const onSale = Math.random() < 0.35;
        const salePrice = onSale ? round2(price * (0.75 + Math.random() * 0.15)) : null;
        const inStock = Math.random() > 0.12;

        const listing = await db.dispensaryListing.upsert({
          where: { dispensaryId_productVariantId: { dispensaryId, productVariantId: variant.id } },
          update: { price, salePrice, inStock, lastSyncedAt: now },
          create: {
            dispensaryId,
            productVariantId: variant.id,
            price,
            salePrice,
            inStock,
            stockQty: inStock ? 10 + Math.floor(Math.random() * 40) : 0,
            lastSyncedAt: now,
          },
        });

        // 30 days of price history so "lowest observed" / price-drop badges
        // have real data to compute from.
        for (let daysAgo = 30; daysAgo >= 0; daysAgo -= 3) {
          const historicalPrice = round2(price * (1 + (Math.random() * 0.1 - 0.05)));
          await db.priceSnapshot.create({
            data: {
              listingId: listing.id,
              price: historicalPrice,
              salePrice: daysAgo === 0 ? salePrice : null,
              capturedAt: new Date(now.getTime() - daysAgo * DAY),
            },
          });
        }
      }
    }
  }

  // ── Deals ─────────────────────────────────────────────────────────────
  const someProducts = await db.canonicalProduct.findMany({ take: 3 });
  const merchantIds = [...merchants.values()];

  const dealDefs: { title: string; dealType: DealType; percentOff?: number; startsAgoDays: number; endsInDays: number }[] = [
    { title: "20% off all flower this weekend", dealType: "CATEGORY_DISCOUNT", percentOff: 20, startsAgoDays: 1, endsInDays: 3 },
    { title: "Buy one Lakeside Edibles pack, get one 50% off", dealType: "BOGO", startsAgoDays: 0, endsInDays: 6 },
    { title: "15% off Prairie Sun Extracts concentrates", dealType: "BRAND_DISCOUNT", percentOff: 15, startsAgoDays: 2, endsInDays: 5 },
  ];

  for (const [i, d] of dealDefs.entries()) {
    const deal = await db.deal.create({
      data: {
        merchantId: merchantIds[i % merchantIds.length],
        title: d.title,
        description: `${d.title}. Valid at participating Budseeker locations while supplies last.`,
        dealType: d.dealType,
        percentOff: d.percentOff,
        startsAt: new Date(now.getTime() - d.startsAgoDays * DAY),
        endsAt: new Date(now.getTime() + d.endsInDays * DAY),
        status: "ACTIVE",
        terms: "Cannot be combined with other offers. Adults 21+ only. While supplies last.",
      },
    });
    for (const dispensarySlug of dispensarySlugs.slice(0, 2)) {
      await db.dealLocation.create({ data: { dealId: deal.id, dispensaryId: dispensaries.get(dispensarySlug)! } }).catch(() => {});
    }
    for (const product of someProducts.slice(0, 1)) {
      await db.dealProduct.create({ data: { dealId: deal.id, canonicalProductId: product.id } }).catch(() => {});
    }
  }

  // ── Demo users (password: "budseeker-demo-2026" for all) ─────────────
  const demoPasswordHash = await bcrypt.hash("budseeker-demo-2026", 10);
  const consumer = await db.user.upsert({
    where: { email: "demo.consumer@example.com" },
    update: {},
    create: {
      email: "demo.consumer@example.com",
      name: "Jordan Rivera",
      passwordHash: demoPasswordHash,
      dateOfBirth: new Date("1994-05-12"),
      ageVerifiedAt: now,
    },
  });
  const consumerRole = await db.userRole.findFirst({ where: { userId: consumer.id, role: "CONSUMER" } });
  if (!consumerRole) {
    await db.userRole.create({ data: { userId: consumer.id, role: "CONSUMER", scopeType: "PLATFORM" } });
  }
  await db.notificationPreference.upsert({
    where: { userId: consumer.id },
    update: {},
    create: { userId: consumer.id },
  });

  const firstMerchantId = merchantIds[0];
  const merchantOwner = await db.user.upsert({
    where: { email: "demo.merchant@example.com" },
    update: {},
    create: { email: "demo.merchant@example.com", name: "Priya Shah", passwordHash: demoPasswordHash },
  });
  const merchantOwnerRole = await db.userRole.findFirst({ where: { userId: merchantOwner.id, role: "MERCHANT_OWNER", scopeId: firstMerchantId } });
  if (!merchantOwnerRole) {
    await db.userRole.create({ data: { userId: merchantOwner.id, role: "MERCHANT_OWNER", scopeType: "MERCHANT", scopeId: firstMerchantId } });
  }

  const firstBrandId = brands.get("north-loop-cannabis-co")!;
  const brandOwner = await db.user.upsert({
    where: { email: "demo.brand@example.com" },
    update: {},
    create: { email: "demo.brand@example.com", name: "Marcus Webb", passwordHash: demoPasswordHash },
  });
  const brandOwnerRole = await db.userRole.findFirst({ where: { userId: brandOwner.id, role: "BRAND_OWNER", scopeId: firstBrandId } });
  if (!brandOwnerRole) {
    await db.userRole.create({ data: { userId: brandOwner.id, role: "BRAND_OWNER", scopeType: "BRAND", scopeId: firstBrandId } });
  }

  const admin = await db.user.upsert({
    where: { email: "demo.admin@example.com" },
    update: {},
    create: { email: "demo.admin@example.com", name: "Sam Okafor", passwordHash: demoPasswordHash },
  });
  const adminRole = await db.userRole.findFirst({ where: { userId: admin.id, role: "SUPER_ADMIN" } });
  if (!adminRole) {
    await db.userRole.create({ data: { userId: admin.id, role: "SUPER_ADMIN", scopeType: "PLATFORM" } });
  }

  // ── Favorites & a review ────────────────────────────────────────────
  const blueDream = await db.canonicalProduct.findUnique({ where: { brandId_slug: { brandId: brands.get("north-loop-cannabis-co")!, slug: "blue-dream-flower" } } });
  if (blueDream) {
    await db.savedProduct.upsert({
      where: { userId_canonicalProductId: { userId: consumer.id, canonicalProductId: blueDream.id } },
      update: {},
      create: { userId: consumer.id, canonicalProductId: blueDream.id },
    });
    await db.review.create({
      data: {
        userId: consumer.id,
        targetType: "PRODUCT",
        targetId: blueDream.id,
        rating: 5,
        title: "Consistent, smells great",
        body: "Picked this up at Eagan Provisions — smooth and matched the listed potency.",
        status: "PUBLISHED",
        verified: true,
      },
    });
  }
  const eaganProvisions = dispensaries.get("eagan-provisions");
  if (eaganProvisions) {
    await db.savedStore.upsert({
      where: { userId_dispensaryId: { userId: consumer.id, dispensaryId: eaganProvisions } },
      update: {},
      create: { userId: consumer.id, dispensaryId: eaganProvisions },
    });
    await db.review.create({
      data: {
        userId: consumer.id,
        targetType: "DISPENSARY",
        targetId: eaganProvisions,
        rating: 4,
        title: "Fast pickup, friendly staff",
        body: "In and out in five minutes with an online order.",
        status: "PUBLISHED",
        verified: true,
      },
    });
    await db.dispensary.update({ where: { id: eaganProvisions }, data: { ratingAverage: 4.5, ratingCount: 1 } });
  }

  // ── Feature flags (section 40) ─────────────────────────────────────
  const flags = [
    { key: "ai_assistant", enabled: true, description: "Budseeker AI budtender chat" },
    { key: "price_history", enabled: true, description: "30-day price history on product pages" },
    { key: "recommendations", enabled: false, description: "Personalized recommendation rails" },
    { key: "merchant_analytics", enabled: false, description: "Merchant dashboard analytics" },
    { key: "brand_dashboard", enabled: false, description: "Brand portal" },
    { key: "sponsored_placements", enabled: false, description: "Labeled sponsored search placements" },
  ];
  for (const f of flags) {
    await db.featureFlag.upsert({ where: { key: f.key }, update: {}, create: f });
  }

  console.log("Seed complete.");
}

function estimateBasePrice(v: { packageSize: number; unit: string }) {
  if (v.unit === "g" && v.packageSize <= 4) return 32;
  if (v.unit === "g" && v.packageSize > 4) return 55;
  if (v.unit === "mg") return 22;
  if (v.unit === "ml") return 45;
  return 30;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
