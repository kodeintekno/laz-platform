import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { Prisma } from "@prisma/client";

/**
 * Users Repository — admin-facing database access for the User entity.
 */
@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find paginated users with their assigned roles and LAZs.
   */
  async findMany(page = 1, limit = 10, search?: string, lembagaId?: string) {
    const skip = (page - 1) * limit;

    const filterConditions: Prisma.UserWhereInput[] = [];

    if (search) {
      filterConditions.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    if (lembagaId) {
      filterConditions.push({ lembagaId });
    }

    const where: Prisma.UserWhereInput =
      filterConditions.length > 0 ? { AND: filterConditions } : {};

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          role: { select: { id: true, name: true } },
          lembaga: { select: { id: true, name: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Find all active roles.
   */
  async findRoles() {
    return this.prisma.role.findMany({
      orderBy: { name: "asc" },
    });
  }

  /**
   * Find a user by their unique ID, including role and LAZ details.
   */
  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        role: { select: { id: true, name: true } },
        lembaga: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Find a user by their unique email.
   */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        role: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Create a new user.
   */
  async create(data: Prisma.UserUncheckedCreateInput) {
    return this.prisma.user.create({
      data,
      include: {
        role: { select: { id: true, name: true } },
        lembaga: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Update an existing user.
   */
  async update(id: string, data: Prisma.UserUncheckedUpdateInput) {
    return this.prisma.user.update({
      where: { id },
      data,
      include: {
        role: { select: { id: true, name: true } },
        lembaga: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Delete a user by ID.
   */
  async delete(id: string) {
    return this.prisma.user.delete({
      where: { id },
      include: {
        role: { select: { id: true, name: true } },
        lembaga: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Find all APPROVED Lembaga tenants (for Super Admin dropdown).
   */
  async findAllLembagas() {
    return this.prisma.lembaga.findMany({
      where: { status: "APPROVED" },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Update a user's role (legacy compatibility).
   */
  async updateRole(userId: string, roleId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { roleId },
      include: { role: true },
    });
  }

  /**
   * Count how many SUPER_ADMINs currently exist.
   */
  async countSuperAdmins() {
    return this.prisma.user.count({
      where: {
        role: { name: "SUPER_ADMIN" },
        status: "ACTIVE",
      },
    });
  }
}
