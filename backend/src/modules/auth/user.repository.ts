import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { Prisma } from "@prisma/client";

/**
 * User Repository (auth) — pindahan verbatim dari src/features/auth.
 * Always includes Role and Permissions where necessary.
 */
@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find a user by email, including their role and permissions.
   */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Find a user by ID, including their role and permissions.
   */
  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Find a role by name.
   */
  async findRoleByName(name: string) {
    return this.prisma.role.findFirst({
      where: { name },
    });
  }

  /**
   * Create a new user.
   */
  async create(data: Prisma.UserUncheckedCreateInput) {
    return this.prisma.user.create({
      data,
    });
  }

  /**
   * Update the last login timestamp for a user.
   */
  async updateLastLogin(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }
}
