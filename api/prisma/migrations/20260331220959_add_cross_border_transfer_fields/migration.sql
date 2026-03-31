/*
  Warnings:

  - You are about to drop the column `currency` on the `transfers` table. All the data in the column will be lost.
  - Added the required column `recipient_currency` to the `transfers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sender_currency` to the `transfers` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "transfers" DROP CONSTRAINT "transfers_recipient_id_fkey";

-- AlterTable
ALTER TABLE "transfers" DROP COLUMN "currency",
ADD COLUMN     "converted_amount" DECIMAL(20,8),
ADD COLUMN     "exchange_rate" DECIMAL(20,8),
ADD COLUMN     "provider_ref" VARCHAR(255),
ADD COLUMN     "recipient_currency" VARCHAR(4) NOT NULL,
ADD COLUMN     "recipient_details" JSONB,
ADD COLUMN     "sender_currency" VARCHAR(4) NOT NULL,
ADD COLUMN     "type" VARCHAR(20) NOT NULL DEFAULT 'SAME_CURRENCY',
ALTER COLUMN "recipient_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
