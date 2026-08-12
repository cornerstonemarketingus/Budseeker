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

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** Records one price snapshot per product per calendar day so DealScore has a real trend to compare against. */
export async function recordPriceObservation(productId: string, price: number, comparePrice: number | null) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const alreadyRecordedToday = await db.priceObservation.findFirst({
    where: { productId, observedAt: { gte: startOfDay } },
    select: { id: true },
  });
  if (alreadyRecordedToday) return;
  await db.priceObservation.create({ data: { productId, price, comparePrice: comparePrice ?? undefined } });
}

/**
 * Scores the current price against this product's own trailing history. Returns null until
 * there's enough history to say anything meaningful, rather than guessing from a single price.
 */
export async function assessDeal(
  productId: string,
  currentPrice: number,
  currentComparePrice: number | null,
): Promise<DealAssessment | null> {
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - DEAL_SCORE_WINDOW_DAYS);

  const history = await db.priceObservation.findMany({
    where: { productId, observedAt: { gte: windowStart } },
    orderBy: { observedAt: "asc" },
    select: { price: true, comparePrice: true },
  });
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
