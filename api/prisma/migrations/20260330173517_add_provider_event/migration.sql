-- CreateTable
CREATE TABLE "provider_events" (
    "id" UUID NOT NULL,
    "transfer_id" UUID NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "event_type" VARCHAR(50) NOT NULL,
    "raw_status" VARCHAR(100) NOT NULL,
    "mapped_status" VARCHAR(30) NOT NULL,
    "raw_payload" JSONB NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_events_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "provider_events" ADD CONSTRAINT "provider_events_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "transfers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
