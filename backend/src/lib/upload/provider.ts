export interface UploadFile {
  buffer: Buffer;
  mimetype: string;
}

export interface IUploadProvider {
  upload(file: UploadFile, options?: UploadOptions): Promise<UploadResult>;
  delete(publicId: string, owner: UploadOwner): Promise<void>;
}

/** Trusted server principal or the tenant of an authorized attachment record. */
export type UploadOwner = { userId?: string; lembagaId?: string | null };

export type UploadOptions = {
  folder?: string;
  transformation?: any;
  owner?: UploadOwner;
};

export type UploadResult = {
  url: string;
  publicId: string;
  /** Cloudinary resource type: 'image', 'raw', 'video' */
  resourceType?: string;
};
