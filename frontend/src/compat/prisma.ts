// Thin type shim so components referencing @prisma/client can compile in Vite.
// At runtime the frontend never calls Prisma — all data comes from the NestJS API.

export interface LembagaDocument {
  id: string;
  lembagaId: string;
  type: "AKTA_YAYASAN" | "SK_KEMENKUMHAM" | "NPWP" | "OTHER";
  fileUrl: string;
  filePublicId?: string | null;
  originalName?: string | null;
  createdAt: Date;
  [key: string]: unknown;
}

export interface Lembaga {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  logoPublicId?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
  approvedAt?: Date | string | null;
  picName: string;
  picPhone?: string | null;
  address: string;
  description?: string | null;
  officePhotoUrl?: string | null;
  officePhotoPublicId?: string | null;
  website?: string | null;
  izinYayasanNumber?: string | null;
  documents?: LembagaDocument[];
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}

export interface Volunteer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string | null;
  photoUrl?: string | null;
  ktpUrl?: string | null;
  cvUrl?: string | null;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: Date;
  [key: string]: unknown;
}

export interface VolunteerActivity {
  id: string;
  lembagaId: string;
  programId?: string | null;
  createdById: string;
  title: string;
  description: string;
  location?: string | null;
  activityDate?: Date | string | null;
  quota?: number | null;
  status: "OPEN" | "CLOSED" | "CANCELLED";
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}

export interface VolunteerApplication {
  id: string;
  volunteerId: string;
  activityId: string;
  lembagaId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "REPORT_SUBMITTED" | "COMPLETED";
  rejectionReason?: string | null;
  reportText?: string | null;
  reportFileUrl?: string | null;
  reportSubmittedAt?: Date | string | null;
  reportNote?: string | null;
  verifiedAt?: Date | string | null;
  createdAt: Date;
  [key: string]: unknown;
}

export interface Program {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  status: string;
  rejectionReason?: string | null;
  approvedAt?: Date | string | null;
  approvedById?: string | null;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  targetAmount: number;
  currentAmount: number;
  distributedAmount: number;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  amilPlatformPercentage: number;
  amilInstitutionPercentage: number;
  amilMaxTotalPercentage: number;
  amilLockedAt?: Date | string | null;
  lembagaId: string;
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
  lembagaId?: string | null;
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
