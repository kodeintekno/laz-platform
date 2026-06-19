// Thin type shim so components referencing @prisma/client can compile in Vite.
// At runtime the frontend never calls Prisma — all data comes from the NestJS API.

export interface Laz {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  logoPublicId?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}

export interface Program {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  status: string;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  targetAmount: number;
  currentAmount: number;
  distributedAmount: number;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  lazId: string;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}

export interface Role {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface Permission {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  module: string;
  [key: string]: unknown;
}

export interface User {
  id: string;
  name: string;
  email: string;
  roleId?: string | null;
  lazId?: string | null;
  avatarUrl?: string | null;
  avatarPublicId?: string | null;
  phoneNumber?: string | null;
  emailNotifications?: boolean;
  waNotifications?: boolean;
  isActive?: boolean;
  [key: string]: unknown;
}

// Prisma namespace — only used for complex payload types (we widen to any).
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Prisma {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type ProgramGetPayload<_T> = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type UserGetPayload<_T> = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type DistributionGetPayload<_T> = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type DonationGetPayload<_T> = any;
}
