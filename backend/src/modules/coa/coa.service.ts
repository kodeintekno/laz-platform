import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { CoaRepository } from "./coa.repository";
import { AppError } from "../../common/errors/app.error";
import { randomUUID } from "crypto";

@Injectable()
export class CoaService implements OnModuleInit {
  private readonly logger = new Logger(CoaService.name);

  constructor(private readonly coaRepository: CoaRepository) {}

  async onModuleInit() {
    await this.coaRepository.syncPlatformCoa();
    await this.coaRepository.syncAllApprovedLembagaCoas();
  }

  async getCoaByLembaga(lembagaId: string) {
    return this.coaRepository.findByLembaga(lembagaId);
  }

  async getPlatformCoa() {
    return this.coaRepository.findPlatform();
  }

  /** Sinkronisasi aman: akun historis dipertahankan tetapi dinonaktifkan. */
  async seedCoaForLembaga(lembagaId: string): Promise<void> {
    await this.coaRepository.syncPlatformCoa();
    await this.coaRepository.syncCoaForLembaga(lembagaId);
    const count = await this.coaRepository.countByLembaga(lembagaId);
    this.logger.log(`COA synchronized: ${count} active accounts for lembaga ${lembagaId}`);
  }

  async createCustomAccount(lembagaId: string, input: { parentId: string; code: string; name: string }) {
    const code = input.code?.trim();
    const name = input.name?.trim();
    if (!/^\d{5,12}$/.test(code ?? "") || !name) {
      throw new AppError("INVALID_COA", "Kode harus 5-12 digit dan nama akun wajib diisi", 400);
    }
    const parent = await this.coaRepository.findAccountForLembaga(lembagaId, input.parentId);
    if (!parent || !parent.isActive || !parent.isHeader) {
      throw new AppError("INVALID_PARENT_COA", "Akun induk harus berupa header aktif milik Lembaga", 400);
    }
    if (parent.level >= 4) throw new AppError("MAX_COA_DEPTH", "Maksimal kedalaman COA adalah 4 level", 400);
    if (await this.coaRepository.findAccountByCode(lembagaId, code!)) {
      throw new AppError("COA_CODE_EXISTS", "Kode akun sudah digunakan", 409);
    }
    return this.coaRepository.createCustomAccount({
      lembagaId,
      accountingBookId: parent.accountingBookId,
      key: `CUSTOM_${randomUUID().replace(/-/g, "").toUpperCase()}`,
      code: code!,
      name: name!,
      accountType: parent.accountType,
      normalBalance: parent.normalBalance,
      parentCode: parent.code,
      level: parent.level + 1,
    });
  }

  async updateCustomAccount(lembagaId: string, id: string, nameInput: string) {
    const account = await this.coaRepository.findAccountForLembaga(lembagaId, id);
    if (!account || account.isSystem || !account.isEditable) {
      throw new AppError("COA_NOT_EDITABLE", "Akun tidak ditemukan atau tidak dapat diubah", 404);
    }
    const name = nameInput?.trim();
    if (!name) throw new AppError("INVALID_COA", "Nama akun wajib diisi", 400);
    return this.coaRepository.updateCustomAccount(id, name);
  }

  async deleteCustomAccount(lembagaId: string, id: string) {
    const account = await this.coaRepository.findAccountForLembaga(lembagaId, id);
    if (!account || account.isSystem || !account.isDeletable) {
      throw new AppError("COA_NOT_DELETABLE", "Akun tidak ditemukan atau tidak dapat dihapus", 404);
    }
    if (await this.coaRepository.countAccountUsage(id)) {
      throw new AppError("COA_IN_USE", "Akun sudah digunakan dan tidak dapat dihapus", 409);
    }
    return this.coaRepository.deactivateCustomAccount(id);
  }
}
