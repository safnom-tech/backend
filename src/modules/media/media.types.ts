export interface MediaDto {
  id: string;
  workspaceId: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadedFileInput {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}
