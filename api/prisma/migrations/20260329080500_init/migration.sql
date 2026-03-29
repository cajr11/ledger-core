-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "country" VARCHAR(2) NOT NULL,
    "kyc_status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tigerbeetle_account_id" BIGINT NOT NULL,
    "currency" VARCHAR(4) NOT NULL,
    "account_type" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "user_accounts" ADD CONSTRAINT "user_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
