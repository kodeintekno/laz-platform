-- CreateTable
CREATE TABLE "institution_balances" (
    "id" TEXT NOT NULL,
    "lembagaId" TEXT NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "institution_balances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "institution_balances_lembagaId_key" ON "institution_balances"("lembagaId");

-- AddForeignKey
ALTER TABLE "institution_balances" ADD CONSTRAINT "institution_balances_lembagaId_fkey" FOREIGN KEY ("lembagaId") REFERENCES "lembagas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

