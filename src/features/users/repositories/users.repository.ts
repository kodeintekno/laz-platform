import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * Users Repository — Phase 3.
 *
 * Handles admin-facing database access for the User entity.
 */
export const usersRepository = {
  /**
   * Find paginated users with their assigned roles.
   */
  async findMany(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          role: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      items,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Find all active roles (for the role selector dropdown).
   */
  async findRoles() {
    return prisma.role.findMany({
      orderBy: { name: "asc" },
    });
  },

  /**
   * Update a user's role.
   */
  async updateRole(userId: string, roleId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { roleId },
      include: { role: true },
    });
  },

  /**
   * Count how many SUPER_ADMINs currently exist.
   * (Used to prevent removing the last super admin)
   */
  async countSuperAdmins() {
    return prisma.user.count({
      where: {
        role: {
          name: "SUPER_ADMIN",
        },
        status: "ACTIVE",
      },
    });
  },
};
