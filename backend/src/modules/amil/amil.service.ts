import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ProgramCategory } from "@prisma/client";

export interface AmilSplitResult {
  platformPercentage: number;
  institutionPercentage: number;
  amilPlatformAmount: number;
  amilInstitutionAmount: number;
  netAmount: number;
}

@Injectable()
export class AmilService {
  constructor(private readonly prisma: PrismaService) {}

  async getGlobalSettings() {
    return this.prisma.amilGlobalSetting.findMany({
      orderBy: { category: "asc" },
    });
  }

  async updateGlobalSetting(category: ProgramCategory, maxTotalPercentage: number, defaultPlatformPercentage: number) {
    if (maxTotalPercentage < 0 || maxTotalPercentage > 100) {
      throw new BadRequestException("maxTotalPercentage must be between 0 and 100");
    }
    if (defaultPlatformPercentage < 0 || defaultPlatformPercentage > maxTotalPercentage) {
      throw new BadRequestException("defaultPlatformPercentage must be between 0 and maxTotalPercentage");
    }

    return this.prisma.amilGlobalSetting.upsert({
      where: { category },
      update: { maxTotalPercentage, defaultPlatformPercentage },
      create: { category, maxTotalPercentage, defaultPlatformPercentage },
    });
  }

  async getInstitutionSettings(lembagaId: string) {
    // We want to return settings for all categories.
    // If an institution setting doesn't exist, we fall back to global defaults.
    const globalSettings = await this.getGlobalSettings();
    const institutionSettings = await this.prisma.amilInstitutionSetting.findMany({
      where: { lembagaId },
    });

    return globalSettings.map((global: any) => {
      const instSetting = institutionSettings.find((s: any) => s.category === global.category);
      return {
        category: global.category,
        maxTotalPercentage: Number(global.maxTotalPercentage),
        platformPercentage: instSetting ? Number(instSetting.platformPercentage) : Number(global.defaultPlatformPercentage),
        institutionPercentage: instSetting ? Number(instSetting.institutionPercentage) : Number(global.maxTotalPercentage) - Number(global.defaultPlatformPercentage),
      };
    });
  }

  async updateInstitutionSetting(lembagaId: string, category: ProgramCategory, institutionPercentage: number, platformPercentageOverride?: number) {
    const globalSetting = await this.prisma.amilGlobalSetting.findUnique({
      where: { category },
    });

    if (!globalSetting) {
      throw new NotFoundException(`Global setting for category ${category} not found`);
    }

    // Determine platform percentage
    // Admin Lembaga cannot provide platformPercentageOverride (it will be undefined).
    // Super Admin can provide it.
    let platformPercentage = Number(globalSetting.defaultPlatformPercentage);
    
    // Check if there is an existing setting to preserve existing platformPercentage if not overridden
    const existingSetting = await this.prisma.amilInstitutionSetting.findUnique({
      where: { lembagaId_category: { lembagaId, category } },
    });

    if (platformPercentageOverride !== undefined) {
      platformPercentage = platformPercentageOverride;
    } else if (existingSetting) {
      platformPercentage = Number(existingSetting.platformPercentage);
    }

    const totalPercentage = platformPercentage + institutionPercentage;

    if (institutionPercentage < 0 || platformPercentage < 0) {
      throw new BadRequestException("Percentage cannot be negative");
    }

    if (totalPercentage > Number(globalSetting.maxTotalPercentage)) {
      throw new BadRequestException(
        `Total percentage (${totalPercentage}%) exceeds the maximum allowed (${globalSetting.maxTotalPercentage}%) for ${category}`
      );
    }

    return this.prisma.amilInstitutionSetting.upsert({
      where: { lembagaId_category: { lembagaId, category } },
      update: { institutionPercentage, platformPercentage },
      create: { lembagaId, category, institutionPercentage, platformPercentage },
    });
  }

  async calculateSplit(amount: number, category: ProgramCategory, lembagaId: string, tx: any = this.prisma): Promise<AmilSplitResult> {
    let platformPercentage = 5; // Fallback
    let institutionPercentage = 7.5; // Fallback

    const globalSetting = await tx.amilGlobalSetting.findUnique({
      where: { category },
    });

    const instSetting = await tx.amilInstitutionSetting.findUnique({
      where: { lembagaId_category: { lembagaId, category } },
    });

    if (instSetting) {
      platformPercentage = Number(instSetting.platformPercentage);
      institutionPercentage = Number(instSetting.institutionPercentage);
    } else if (globalSetting) {
      platformPercentage = Number(globalSetting.defaultPlatformPercentage);
      institutionPercentage = Number(globalSetting.maxTotalPercentage) - platformPercentage;
    }

    const amilPlatformAmount = Math.floor(amount * (platformPercentage / 100));
    const amilInstitutionAmount = Math.floor(amount * (institutionPercentage / 100));
    const netAmount = amount - amilPlatformAmount - amilInstitutionAmount;

    return {
      platformPercentage,
      institutionPercentage,
      amilPlatformAmount,
      amilInstitutionAmount,
      netAmount,
    };
  }
}
