-- PostGIS geography column for indexed radius search on dispensaries.
-- latitude/longitude on the Dispensary model stay the Prisma-managed
-- source of truth; this trigger keeps `geog` in sync on write so
-- ST_DWithin queries (issued via $queryRaw from the geo service) can use
-- the GiST index instead of scanning + computing Haversine per row.
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE "dispensaries" ADD COLUMN IF NOT EXISTS "geog" geography(Point, 4326);

CREATE OR REPLACE FUNCTION dispensaries_sync_geog() RETURNS trigger AS $$
BEGIN
  NEW."geog" := ST_SetSRID(ST_MakePoint(NEW."longitude", NEW."latitude"), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS dispensaries_sync_geog_trigger ON "dispensaries";
CREATE TRIGGER dispensaries_sync_geog_trigger
  BEFORE INSERT OR UPDATE OF "latitude", "longitude" ON "dispensaries"
  FOR EACH ROW EXECUTE FUNCTION dispensaries_sync_geog();

UPDATE "dispensaries" SET "geog" = ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)::geography;

CREATE INDEX IF NOT EXISTS "dispensaries_geog_idx" ON "dispensaries" USING GIST ("geog");

-- Typo-tolerant search: trigram indexes back ILIKE '%term%' and
-- similarity() ranking for the Postgres search provider (see
-- src/server/search). Swappable for Typesense/Meilisearch later behind
-- the same SearchProvider interface without touching call sites.
CREATE INDEX IF NOT EXISTS "canonical_products_name_trgm_idx" ON "canonical_products" USING GIN ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "dispensaries_name_trgm_idx" ON "dispensaries" USING GIN ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "brands_name_trgm_idx" ON "brands" USING GIN ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "strains_name_trgm_idx" ON "strains" USING GIN ("name" gin_trgm_ops);
