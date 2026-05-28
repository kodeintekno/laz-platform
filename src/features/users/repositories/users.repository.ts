import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * Users Repository — Phase 3.
 *
 * Handles admin-facing database access for the User entity.
 */
export const usersRepository = {
  /**
   * Find paginated users with their assigned roles and LAZs.
   */
  async findMany(page = 1, limit = 10, search?: string, lazId?: string) {
    const skip = (page - 1) * limit;

    // Build the query filter conditions
    const filterConditions: Prisma.UserWhereInput[] = [];

    if (search) {
      filterConditions.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    if (lazId) {
      filterConditions.push({ lazId });
    }

    const where: Prisma.UserWhereInput =
      filterConditions.length > 0 ? { AND: filterConditions } : {};

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
          laz: {
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
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  /**
   * Find all active roles (optionally scoped to a specific LAZ tenant).
   */
  async findRoles(lazId?: string) {
    const where = lazId ? { lazId } : {};
    return prisma.role.findMany({
      where,
      orderBy: { name: "asc" },
    });
  },

  /**
   * Find a user by their unique ID, including role and LAZ details.
   */
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        laz: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  /**
   * Find a user by their unique email.
   */
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  /**
   * Create a new user.
   */
  async create(data: Prisma.UserUncheckedCreateInput) {
    return prisma.user.create({
      data,
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        laz: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  /**
   * Update an existing user.
   */
  async update(id: string, data: Prisma.UserUncheckedUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        laz: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  /**
   * Delete a user by ID.
   */
  async delete(id: string) {
    return prisma.user.delete({
      where: { id },
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        laz: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  /**
   * Find all LAZ tenants (for Super Admin dropdown).
   */
  async findAllLazs() {
    return prisma.laz.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
    });
  },

  /**
   * Update a user's role (legacy compatibility).
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
