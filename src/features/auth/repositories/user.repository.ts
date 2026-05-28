import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * User Repository — Phase 2.
 *
 * Handles all database access for Users.
 * Always includes Role and Permissions where necessary.
 */
export const userRepository = {
  /**
   * Find a user by email, including their role and permissions.
   */
  async findByEmail(email: string) {
    return prisma.user.findUnique({
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
  },

  /**
   * Find a user by ID, including their role and permissions.
   */
  async findById(id: string) {
    return prisma.user.findUnique({
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
  },

  /**
   * Find a role by name.
   */
  async findRoleByName(name: string) {
    return prisma.role.findFirst({
      where: { name },
    });
  },

  /**
   * Create a new user.
   */
  async create(data: Prisma.UserUncheckedCreateInput) {
    return prisma.user.create({
      data,
    });
  },

  /**
   * Update the last login timestamp for a user.
   */
  async updateLastLogin(id: string) {
    return prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  },
};
