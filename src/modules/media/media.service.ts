import { Types } from "mongoose";
import { getStorageService } from "../../storage/index.js";
import { AppError } from "../../middleware/error.middleware.js";
import { MediaModel } from "./media.model.js";
import type { MediaDto, UploadedFileInput } from "./media.types.js";
import {
  sanitizeOriginalFilename,
  validateUploadBuffer,
} from "./media.validation.js";

function toDto(doc: {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  storageKey: string;
  createdAt: Date;
  updatedAt: Date;
}): MediaDto {
  const storage = getStorageService();
  const id = doc._id.toString();
  const workspaceId = doc.workspaceId.toString();
  return {
    id,
    workspaceId,
    filename: doc.filename,
    originalFilename: doc.originalFilename,
    mimeType: doc.mimeType,
    size: doc.size,
    url: storage.getContentUrl(workspaceId, id),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

async function findInWorkspace(workspaceId: string, mediaId: string) {
  if (!Types.ObjectId.isValid(mediaId)) {
    throw new AppError("Media not found", 404, "MEDIA_NOT_FOUND");
  }
  const doc = await MediaModel.findOne({
    _id: mediaId,
    workspaceId,
  });
  if (!doc) {
    throw new AppError("Media not found", 404, "MEDIA_NOT_FOUND");
  }
  return doc;
}

export async function createMedia(
  workspaceId: string,
  file: UploadedFileInput
): Promise<MediaDto> {
  const detected = validateUploadBuffer(file.buffer, file.mimetype);
  const storage = getStorageService();
  const mediaObjectId = new Types.ObjectId();
  const mediaId = mediaObjectId.toString();
  const filename = `${mediaId}.${detected.extension}`;
  const originalFilename = sanitizeOriginalFilename(file.originalname);

  const { storageKey } = await storage.upload({
    workspaceId,
    mediaId,
    buffer: file.buffer,
    mimeType: detected.mimeType,
    extension: detected.extension,
    filename,
  });

  const doc = await MediaModel.create({
    _id: mediaObjectId,
    workspaceId,
    filename,
    originalFilename,
    mimeType: detected.mimeType,
    size: file.buffer.length,
    storageKey,
  });

  return toDto(doc);
}

export async function listMedia(
  workspaceId: string,
  limit = 100
): Promise<{ media: MediaDto[] }> {
  const docs = await MediaModel.find({ workspaceId })
    .sort({ createdAt: -1 })
    .limit(limit);
  return { media: docs.map((d) => toDto(d)) };
}

export async function getMedia(
  workspaceId: string,
  mediaId: string
): Promise<MediaDto> {
  const doc = await findInWorkspace(workspaceId, mediaId);
  return toDto(doc);
}

export async function getMediaContent(
  workspaceId: string,
  mediaId: string
): Promise<{ absolutePath: string; mimeType: string }> {
  const doc = await findInWorkspace(workspaceId, mediaId);
  const storage = getStorageService();
  return {
    absolutePath: storage.getAbsolutePath(doc.storageKey),
    mimeType: doc.mimeType,
  };
}

export async function replaceMedia(
  workspaceId: string,
  mediaId: string,
  file: UploadedFileInput
): Promise<MediaDto> {
  const doc = await findInWorkspace(workspaceId, mediaId);
  const detected = validateUploadBuffer(file.buffer, file.mimetype);
  const storage = getStorageService();
  const oldKey = doc.storageKey;

  const filename = `${mediaId}.${detected.extension}`;
  const originalFilename = sanitizeOriginalFilename(file.originalname);

  const { storageKey } = await storage.upload({
    workspaceId,
    mediaId,
    buffer: file.buffer,
    mimeType: detected.mimeType,
    extension: detected.extension,
    filename,
  });

  doc.filename = filename;
  doc.originalFilename = originalFilename;
  doc.mimeType = detected.mimeType;
  doc.size = file.buffer.length;
  doc.storageKey = storageKey;
  await doc.save();

  if (oldKey !== storageKey) {
    await storage.delete(oldKey);
  }

  return toDto(doc);
}

export async function deleteMedia(
  workspaceId: string,
  mediaId: string
): Promise<void> {
  const doc = await findInWorkspace(workspaceId, mediaId);
  const storage = getStorageService();
  await storage.delete(doc.storageKey);
  await doc.deleteOne();
}
