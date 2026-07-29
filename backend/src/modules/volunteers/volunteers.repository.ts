import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { Prisma } from "@prisma/client";

@Injectable()
export class VolunteersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.volunteer.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.volunteer.findUnique({ where: { id } });
  }

  async create(data: Prisma.VolunteerCreateInput) {
    return this.prisma.volunteer.create({ data });
  }

  async update(id: string, data: Prisma.VolunteerUpdateInput) {
    return this.prisma.volunteer.update({ where: { id }, data });
  }
}
