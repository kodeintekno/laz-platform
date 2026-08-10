import { Injectable, Logger } from "@nestjs/common";
import { CoaRepository } from "./coa.repository";
import { AppError } from "../../common/errors/app.error";

@Injectable()
export class CoaService {
  private readonly logger = new Logger(CoaService.name);

  constructor(private readonly coaRepository: CoaRepository) {}

  /**
   * Ambil seluruh COA untuk satu lembaga, sudah terurut by code.
   * Gunakan di controller setelah resolveLembagaScope().
   */
  async getCoaByLembaga(lembagaId: string) {
    return this.coaRepository.findByLembaga(lembagaId);
  }

  /**
   * Provision / seed seluruh akun COA template untuk lembaga.
   * Akan melempar AppError jika lembaga sudah memiliki COA (idempotent).
   */
  async seedCoaForLembaga(lembagaId: string): Promise<void> {
    const existingCount = await this.coaRepository.countByLembaga(lembagaId);
    if (existingCount > 0) {
      this.logger.warn(`Lembaga ${lembagaId} already has COA (${existingCount} accounts). Skipping provision.`);
      throw new AppError("COA_ALREADY_EXISTS", "Lembaga sudah memiliki Chart of Accounts.", 400);
    }

    this.logger.log(`Seeding COA for lembaga ${lembagaId}`);
    await this.coaRepository.seedCoaForLembaga(lembagaId);
    const count = await this.coaRepository.countByLembaga(lembagaId);
    this.logger.log(`COA seeded: ${count} accounts for lembaga ${lembagaId}`);
  }
}
