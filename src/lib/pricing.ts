import { db } from "@/lib/db";

const DEAL_SCORE_WINDOW_DAYS = 90;
const MIN_OBSERVATIONS_FOR_SCORE = 3;

export type DealAssessment = {
  dealScore: number;
  label: "Excellent deal" | "Good deal" | "Fair price" | "Above typical";
  typicalPrice: number;
  lowestPrice: number;
  savingsVsTypical: number;
  suspiciousSale: boolean;
};

type PriceSnapshot = { price: number; comparePrice: number | null };
type ListingPrice = { listingId: string; price: number; comparePrice: number | null };

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Records one price snapshot per listing per calendar day, in two queries total regardless of
 * how many listings — a per-listing round trip here is what made product search slow.
 */
export async function recordPriceObservationsBatch(entries: ListingPrice[]) {
  if (entries.length === 0) return;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const alreadyRecordedToday = await db.priceObservation.findMany({
    where: { listingId: { in: entries.map((entry) => entry.listingId) }, observedAt: { gte: startOfDay } },
    select: { listingId: true },
  });
  const covered = new Set(alreadyRecordedToday.map((row) => row.listingId));
  const toCreate = entries.filter((entry) => !covered.has(entry.listingId));
  if (toCreate.length === 0) return;

  await db.priceObservation.createMany({
    data: toCreate.map((entry) => ({
      listingId: entry.listingId,
      price: entry.price,
      comparePrice: entry.comparePrice ?? undefined,
    })),
  });
}

/** Fetches trailing price history for a batch of listings in one query, keyed by listingId. */
export async function getPriceHistoryMap(listingIds: string[]): Promise<Map<string, PriceSnapshot[]>> {
  const map = new Map<string, PriceSnapshot[]>();
  if (listingIds.length === 0) return map;

  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - DEAL_SCORE_WINDOW_DAYS);
  const rows = await db.priceObservation.findMany({
    where: { listingId: { in: listingIds }, observedAt: { gte: windowStart } },
    orderBy: { observedAt: "asc" },
    select: { listingId: true, price: true, comparePrice: true },
  });

  for (const row of rows) {
    const existing = map.get(row.listingId);
    const snapshot = { price: row.price, comparePrice: row.comparePrice };
    if (existing) existing.push(snapshot);
    else map.set(row.listingId, [snapshot]);
  }
  return map;
}

/**
 * Scores a listing's current price against its own trailing history (already fetched via
 * getPriceHistoryMap). Pure and synchronous, so it's cheap to call per listing. Returns null
 * until there's enough history to say anything meaningful, rather than guessing from one price.
 */
export function computeDealAssessment(
  history: PriceSnapshot[],
  currentPrice: number,
  currentComparePrice: number | null,
): DealAssessment | null {
  if (history.length < MIN_OBSERVATIONS_FOR_SCORE) return null;

  const historicalPrices = history.map((observation) => observation.price);
  const typicalPrice = average(historicalPrices);
  const lowestPrice = Math.min(...historicalPrices);
  const highestPrice = Math.max(...historicalPrices);

  // Fake-sale detection: a "compare at" price that just spiked right before this sale started
  // isn't a real discount, so it shouldn't earn a high score.
  const priorComparePrices = history.map((o) => o.comparePrice).filter((value): value is number => value != null);
  const priorCompareAverage = priorComparePrices.length > 0 ? average(priorComparePrices) : null;
  const onSale = currentComparePrice != null && currentComparePrice > currentPrice;
  const suspiciousSale = onSale && priorCompareAverage != null && currentComparePrice! > priorCompareAverage * 1.1;

  const savingsVsTypical = typicalPrice - currentPrice;
  const spread = Math.max(highestPrice - lowestPrice, 1);
  let dealScore = Math.round(50 + (savingsVsTypical / spread) * 50);
  dealScore = Math.min(99, Math.max(1, dealScore));
  if (suspiciousSale) dealScore = Math.min(dealScore, 40);

  const label: DealAssessment["label"] =
    dealScore >= 85 ? "Excellent deal" : dealScore >= 65 ? "Good deal" : dealScore >= 40 ? "Fair price" : "Above typical";

  return {
    dealScore,
    label,
    typicalPrice: Number(typicalPrice.toFixed(2)),
    lowestPrice: Number(lowestPrice.toFixed(2)),
    savingsVsTypical: Number(savingsVsTypical.toFixed(2)),
    suspiciousSale,
  };
}

/** Single-listing convenience wrapper for routes that only ever handle one listing at a time. */
export async function assessDeal(
  listingId: string,
  currentPrice: number,
  currentComparePrice: number | null,
): Promise<DealAssessment | null> {
  const historyMap = await getPriceHistoryMap([listingId]);
  return computeDealAssessment(historyMap.get(listingId) ?? [], currentPrice, currentComparePrice);
}
