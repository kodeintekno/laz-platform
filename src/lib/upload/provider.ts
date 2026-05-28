export interface IUploadProvider {
  upload(file: File, options?: UploadOptions): Promise<UploadResult>;
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
