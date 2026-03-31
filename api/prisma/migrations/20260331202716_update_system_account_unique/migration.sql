/*
  Warnings:

  - A unique constraint covering the columns `[currency,account_type]` on the table `system_accounts` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "system_accounts_currency_key";

-- CreateIndex
CREATE UNIQUE INDEX "system_accounts_currency_account_type_key" ON "system_accounts"("currency", "account_type");
