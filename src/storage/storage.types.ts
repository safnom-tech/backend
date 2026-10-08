export interface StorageUploadInput {
  workspaceId: string;
  mediaId: string;
  filename: string;
  buffer: Buffer;
  mimeType: string;
  extension: string;
}

export interface StorageUploadResult {
  storageKey: string;
  filename: string;
}

export interface StorageService {
  upload(input: StorageUploadInput): Promise<StorageUploadResult>;
  getAbsolutePath(storageKey: string): string;
  getContentUrl(workspaceId: string, mediaId: string): string;
  delete(storageKey: string): Promise<void>;
}
