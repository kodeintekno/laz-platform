import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AppError } from "../../common/errors/app.error";

@Injectable()
export class AutoJournalService {
  private readonly logger = new Logger(AutoJournalService.name);

  // Generate journal number using existing transaction client
  async generateJournalNo(tx: Prisma.TransactionClient, lembagaId: string, date: Date): Promise<string> {
    const yearMonth = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const prefix = `JU-${yearMonth}-`;

    const lastJournal = await tx.journal.findFirst({
      where: { 
        lembagaId, 
        journalNo: { startsWith: prefix } 
      },
      orderBy: { journalNo: "desc" },
      select: { journalNo: true }
    });

    let nextSequence = 1;
    if (lastJournal) {
      const lastSeq = parseInt(lastJournal.journalNo.replace(prefix, ""), 10);
      if (!isNaN(lastSeq)) {
        nextSequence = lastSeq + 1;
      }
    }

    return `${prefix}${nextSequence.toString().padStart(6, '0')}`;
  }

  private async getCoaId(tx: Prisma.TransactionClient, lembagaId: string, code: string): Promise<string> {
    const coa = await tx.chartOfAccount.findUnique({
      where: { lembagaId_code: { lembagaId, code } },
      select: { id: true },
    });
    if (!coa) {
      throw new AppError("COA_NOT_FOUND", `Chart of Account code ${code} is missing for this tenant`, 500);
    }
    return coa.id;
  }

  private getDonationCreditCode(category: string): string {
    switch(category) {
      case "ZAKAT": return "4101";
      case "INFAK": return "4102";
      case "SEDEKAH": return "4103";
      case "WAKAF": return "4104";
      case "CSR": return "4108";
      case "DSKL": return "4109";
      default: return "4102";
    }
  }

  private getDistributionDebitCode(category: string): string {
    switch(category) {
      case "ZAKAT": return "5101";
      case "INFAK": return "5102";
      case "SEDEKAH": return "5103";
      case "WAKAF": return "5104";
      case "CSR": return "5105";
      case "DSKL": return "5106";
      default: return "5102";
    }
  }

  async createDonationJournal(
    tx: Prisma.TransactionClient,
    donationId: string,
    amount: number,
    platformFee: number,
    institutionAmount: number,
    programId: string,
    lembagaId: string,
    programCategory: string
  ) {
    const existing = await tx.journal.findUnique({
      where: { sourceType_sourceId: { sourceType: "DONATION", sourceId: donationId } }
    });
    
    if (existing) {
      this.logger.warn(`Auto-journal for DONATION ${donationId} already exists, skipping.`);
      return;
    }

    const journalNo = await this.generateJournalNo(tx, lembagaId, new Date());
    const debitCoaId = await this.getCoaId(tx, lembagaId, "1101");
    const platformFeeCoaId = await this.getCoaId(tx, lembagaId, "6114");
    const creditCoaId = await this.getCoaId(tx, lembagaId, this.getDonationCreditCode(programCategory));

    await tx.journal.create({
      data: {
        lembagaId,
        journalNo,
        journalDate: new Date(),
        description: `Penerimaan Donasi #${donationId.slice(-6).toUpperCase()}`,
        sourceType: "DONATION",
        sourceId: donationId,
        programId,
        status: "POSTED",
        postedAt: new Date(),
        details: {
          create: [
            { accountId: debitCoaId, debit: institutionAmount, credit: 0, description: "Penerimaan Kas Bersih" },
            { accountId: platformFeeCoaId, debit: platformFee, credit: 0, description: "Biaya Platform (12.5%)" },
            { accountId: creditCoaId, debit: 0, credit: amount, description: "Penerimaan Donasi" },
          ]
        }
      }
    });
    this.logger.log(`Created donation auto-journal ${journalNo}`);
  }

  async createDistributionJournal(
    tx: Prisma.TransactionClient,
    distributionId: string,
    amount: number,
    programId: string,
    lembagaId: string,
    programCategory: string,
    userId: string
  ) {
    const existing = await tx.journal.findUnique({
      where: { sourceType_sourceId: { sourceType: "DISTRIBUTION", sourceId: distributionId } }
    });
    
    if (existing) {
      this.logger.warn(`Auto-journal for DISTRIBUTION ${distributionId} already exists, skipping.`);
      return;
    }

    const journalNo = await this.generateJournalNo(tx, lembagaId, new Date());
    const debitCoaId = await this.getCoaId(tx, lembagaId, this.getDistributionDebitCode(programCategory));
    const creditCoaId = await this.getCoaId(tx, lembagaId, "1101");

    await tx.journal.create({
      data: {
        lembagaId,
        journalNo,
        journalDate: new Date(),
        description: `Penyaluran #${distributionId.slice(-6).toUpperCase()}`,
        sourceType: "DISTRIBUTION",
        sourceId: distributionId,
        programId,
        status: "POSTED",
        createdById: userId,
        postedById: userId,
        postedAt: new Date(),
        details: {
          create: [
            { accountId: debitCoaId, debit: amount, credit: 0, description: "Penyaluran Dana Program" },
            { accountId: creditCoaId, debit: 0, credit: amount, description: "Penyaluran Dana Program" },
          ]
        }
      }
    });
    this.logger.log(`Created distribution auto-journal ${journalNo}`);
  }

  async createWithdrawalReservationJournal(
    tx: Prisma.TransactionClient,
    withdrawalId: string,
    amount: number,
    lembagaId: string,
    userId: string
  ) {
    const journalNo = await this.generateJournalNo(tx, lembagaId, new Date());
    const debitCoaId = await this.getCoaId(tx, lembagaId, "1104"); // Kas Dalam Perjalanan
    const creditCoaId = await this.getCoaId(tx, lembagaId, "1101"); // Kas

    await tx.journal.create({
      data: {
        lembagaId,
        journalNo,
        journalDate: new Date(),
        description: `Pencairan Dana (Withdrawal) #${withdrawalId.slice(-6).toUpperCase()}`,
        sourceType: "WITHDRAWAL",
        sourceId: withdrawalId,
        status: "POSTED",
        createdById: userId,
        postedById: userId,
        postedAt: new Date(),
        details: {
          create: [
            { accountId: debitCoaId, debit: amount, credit: 0, description: "Kas Dalam Perjalanan (Pencairan)" },
            { accountId: creditCoaId, debit: 0, credit: amount, description: "Pengeluaran Kas untuk Pencairan" },
          ]
        }
      }
    });
    this.logger.log(`Created withdrawal reservation auto-journal ${journalNo}`);
  }

  async createWithdrawalRejectionJournal(
    tx: Prisma.TransactionClient,
    withdrawalId: string,
    amount: number,
    lembagaId: string,
    userId: string | null,
    reason: string
  ) {
    const journalNo = await this.generateJournalNo(tx, lembagaId, new Date());
    const debitCoaId = await this.getCoaId(tx, lembagaId, "1101"); // Kas
    const creditCoaId = await this.getCoaId(tx, lembagaId, "1104"); // Kas Dalam Perjalanan

    await tx.journal.create({
      data: {
        lembagaId,
        journalNo,
        journalDate: new Date(),
        description: `Pembatalan Pencairan Dana #${withdrawalId.slice(-6).toUpperCase()} - ${reason}`,
        sourceType: "WITHDRAWAL",
        sourceId: `${withdrawalId}-REJECT`,
        status: "POSTED",
        createdById: userId,
        postedById: userId,
        postedAt: new Date(),
        details: {
          create: [
            { accountId: debitCoaId, debit: amount, credit: 0, description: "Pengembalian Dana Kas (Pencairan Ditolak)" },
            { accountId: creditCoaId, debit: 0, credit: amount, description: "Pembatalan Kas Dalam Perjalanan" },
          ]
        }
      }
    });
    this.logger.log(`Created withdrawal rejection auto-journal ${journalNo}`);
  }

  async createWithdrawalCompletionJournal(
    tx: Prisma.TransactionClient,
    withdrawalId: string,
    amount: number,
    lembagaId: string,
    userId: string | null
  ) {
    const journalNo = await this.generateJournalNo(tx, lembagaId, new Date());
    const debitCoaId = await this.getCoaId(tx, lembagaId, "1103"); // Bank (Lembaga)
    const creditCoaId = await this.getCoaId(tx, lembagaId, "1104"); // Kas Dalam Perjalanan

    await tx.journal.create({
      data: {
        lembagaId,
        journalNo,
        journalDate: new Date(),
        description: `Pencairan Dana Selesai #${withdrawalId.slice(-6).toUpperCase()}`,
        sourceType: "WITHDRAWAL",
        sourceId: `${withdrawalId}-SUCCESS`,
        status: "POSTED",
        createdById: userId, // Can be null if system
        postedById: userId, // Can be null if system
        postedAt: new Date(),
        details: {
          create: [
            { accountId: debitCoaId, debit: amount, credit: 0, description: "Penerimaan Kas di Bank Lembaga" },
            { accountId: creditCoaId, debit: 0, credit: amount, description: "Penyelesaian Kas Dalam Perjalanan" },
          ]
        }
      }
    });
    this.logger.log(`Created withdrawal completion auto-journal ${journalNo}`);
  }
}
