export interface UploadImageParams {
  /** Raw binary data for the image. */
  stream: NodeJS.ReadableStream | undefined;
  /** Optional Cloudinary folder to organize assets. */
  folder?: string;
}

export interface UploadImageResult {
  url: string;
  publicId: string;
}

export interface DeleteImageResult {
  publicId: string;
  result: string;
}
