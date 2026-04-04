CREATE UNIQUE INDEX IF NOT EXISTS "Match_offerId_active_key"
ON "Match" ("offerId")
WHERE "status" IN ('proposed', 'confirmed');

CREATE UNIQUE INDEX IF NOT EXISTS "Match_requestId_active_key"
ON "Match" ("requestId")
WHERE "status" IN ('proposed', 'confirmed');
