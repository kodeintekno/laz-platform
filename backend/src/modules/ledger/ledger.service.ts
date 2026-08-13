import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { NormalBalance, Prisma } from "@prisma/client";
import * as fs from "fs";

export interface GetLedgerParams {
  lembagaId: string;
  accountId: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  async getLedger(params: GetLedgerParams) {
    try {
      const { lembagaId, accountId, startDate, endDate, page = 1, limit = 50 } = params;
    
    const accountById = await this.prisma.chartOfAccount.findFirst({
      where: { id: accountId, lembagaId },
    });
    
    if (!accountById) {
      throw new NotFoundException("Account not found");
    }
    
    if (accountById.isHeader) {
      throw new BadRequestException("Cannot generate ledger for a header account");
    }

    // Parse dates
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999);
    
    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException("Invalid date format");
    }

    // Calculate opening balance before start date
    const beforeRecords = await this.prisma.journalDetail.findMany({
      where: {
        accountId: accountById.id,
        journal: {
          lembagaId,
          status: 'POSTED',
          journalDate: {
            lt: start,
          },
        },
      },
      select: {
        debit: true,
        credit: true,
      }
    });

    const sumDebitBefore = beforeRecords.reduce((acc, curr) => acc + Number(curr.debit), 0);
    const sumCreditBefore = beforeRecords.reduce((acc, curr) => acc + Number(curr.credit), 0);

    let openingBalance = 0;
    if (accountById.normalBalance === NormalBalance.DEBIT) {
      openingBalance = sumDebitBefore - sumCreditBefore;
    } else {
      openingBalance = sumCreditBefore - sumDebitBefore;
    }

    const skip = (page - 1) * limit;
    
    const wherePeriod: Prisma.JournalDetailWhereInput = {
      accountId: accountById.id,
      journal: {
        lembagaId,
        status: 'POSTED',
        journalDate: {
          gte: start,
          lte: end,
        },
      },
    };

    const totalCount = await this.prisma.journalDetail.count({
      where: wherePeriod,
    });

    const transactions = await this.prisma.journalDetail.findMany({
      where: wherePeriod,
      include: {
        journal: {
          include: {
            program: true,
          }
        },
      },
      orderBy: [
        { journal: { journalDate: 'asc' } },
        { journal: { journalNo: 'asc' } },
        { id: 'asc' }, 
      ],
      skip,
      take: limit,
    });
    
    const periodRecords = await this.prisma.journalDetail.findMany({
      where: wherePeriod,
      select: { debit: true, credit: true }
    });
    
    const periodTotalDebit = periodRecords.reduce((acc, curr) => acc + Number(curr.debit), 0);
    const periodTotalCredit = periodRecords.reduce((acc, curr) => acc + Number(curr.credit), 0);
    
    let periodNet = 0;
    if (accountById.normalBalance === NormalBalance.DEBIT) {
      periodNet = periodTotalDebit - periodTotalCredit;
    } else {
      periodNet = periodTotalCredit - periodTotalDebit;
    }
    const closingBalance = openingBalance + periodNet;
    
    let pageOpeningBalance = openingBalance;
    if (skip > 0) {
      const precedingTransactions = await this.prisma.journalDetail.findMany({
        where: wherePeriod,
        select: { debit: true, credit: true },
        orderBy: [
          { journal: { journalDate: 'asc' } },
          { journal: { journalNo: 'asc' } },
          { id: 'asc' },
        ],
        take: skip,
      });
      
      const precedingDebit = precedingTransactions.reduce((acc, val) => acc + Number(val.debit), 0);
      const precedingCredit = precedingTransactions.reduce((acc, val) => acc + Number(val.credit), 0);
      
      if (accountById.normalBalance === NormalBalance.DEBIT) {
        pageOpeningBalance += (precedingDebit - precedingCredit);
      } else {
        pageOpeningBalance += (precedingCredit - precedingDebit);
      }
    }
    
    let currentBalance = pageOpeningBalance;
    const items = transactions.map((t) => {
      const debit = Number(t.debit);
      const credit = Number(t.credit);
      
      if (accountById.normalBalance === NormalBalance.DEBIT) {
        currentBalance = currentBalance + debit - credit;
      } else {
        currentBalance = currentBalance + credit - debit;
      }
      
      return {
        ...t,
        debit,
        credit,
        runningBalance: currentBalance,
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    return {
      account: accountById,
      openingBalance,
      transactions: items,
      totalDebit: periodTotalDebit,
      totalCredit: periodTotalCredit,
      closingBalance,
      meta: {
        page,
        totalPages,
        total: totalCount,
        limit,
      }
    };
    } catch (err) {
      fs.writeFileSync("ledger-error.log", err instanceof Error ? err.stack || err.message : String(err));
      throw err;
    }
  }
}
