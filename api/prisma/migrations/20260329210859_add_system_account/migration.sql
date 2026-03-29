-- CreateTable
CREATE TABLE "system_accounts" (
    "id" UUID NOT NULL,
    "tigerbeetle_account_id" DECIMAL(39,0) NOT NULL,
    "currency" VARCHAR(4) NOT NULL,
    "account_type" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_accounts_currency_key" ON "system_accounts"("currency");
