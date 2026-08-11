import "server-only";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export type NearbyDispensaryRow = {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  distanceMiles: number;
};

const METERS_PER_MILE = 1609.344;

/**
 * Radius search backed by the PostGIS `geog` column + GiST index (see the
 * geo_search_and_trgm migration) — ST_DWithin does the filtering in the
 * database instead of computing Haversine distance per row in application
 * code, so this stays index-backed as the dispensary table grows.
 */
export async function findNearbyDispensaries(
  latitude: number,
  longitude: number,
  radiusMiles: number,
  limit = 25,
): Promise<NearbyDispensaryRow[]> {
  const radiusMeters = radiusMiles * METERS_PER_MILE;
  return db.$queryRaw<NearbyDispensaryRow[]>(Prisma.sql`
    SELECT
      id,
      name,
      slug,
      city,
      state,
      ST_Distance(geog, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography) / ${METERS_PER_MILE} AS "distanceMiles"
    FROM dispensaries
    WHERE status = 'ACTIVE'
      AND ST_DWithin(geog, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography, ${radiusMeters})
    ORDER BY "distanceMiles" ASC
    LIMIT ${limit};
  `);
}
