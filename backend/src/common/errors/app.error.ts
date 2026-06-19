import { HttpException } from "@nestjs/common";

/**
 * AppError — HttpException dengan kode error mesin-terbaca.
 * Dipetakan ke envelope { success: false, error: { code, message } }
 * oleh AllExceptionsFilter.
 */
export class AppError extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    status: number,
  ) {
    super(message, status);
  }
}
