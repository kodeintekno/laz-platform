export interface UploadFile {
  buffer: Buffer;
  mimetype: string;
}

export interface IUploadProvider {
  upload(file: UploadFile, options?: UploadOptions): Promise<UploadResult>;
  delete(publicId: string): Promise<void>;
}

export type UploadOptions = {
  folder?: string;
  transformation?: any;
};

export type UploadResult = {
  url: string;
  publicId: string;
};
