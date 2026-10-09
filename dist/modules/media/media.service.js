"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMedia = createMedia;
exports.listMedia = listMedia;
exports.getMedia = getMedia;
exports.getMediaContent = getMediaContent;
exports.replaceMedia = replaceMedia;
exports.deleteMedia = deleteMedia;
const mongoose_1 = require("mongoose");
const index_js_1 = require("../../storage/index.js");
const error_middleware_js_1 = require("../../middleware/error.middleware.js");
const media_model_js_1 = require("./media.model.js");
const media_validation_js_1 = require("./media.validation.js");
function toDto(doc) {
    const storage = (0, index_js_1.getStorageService)();
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
async function findInWorkspace(workspaceId, mediaId) {
    if (!mongoose_1.Types.ObjectId.isValid(mediaId)) {
        throw new error_middleware_js_1.AppError("Media not found", 404, "MEDIA_NOT_FOUND");
    }
    const doc = await media_model_js_1.MediaModel.findOne({
        _id: mediaId,
        workspaceId,
    });
    if (!doc) {
        throw new error_middleware_js_1.AppError("Media not found", 404, "MEDIA_NOT_FOUND");
    }
    return doc;
}
async function createMedia(workspaceId, file) {
    const detected = (0, media_validation_js_1.validateUploadBuffer)(file.buffer, file.mimetype);
    const storage = (0, index_js_1.getStorageService)();
    const mediaObjectId = new mongoose_1.Types.ObjectId();
    const mediaId = mediaObjectId.toString();
    const filename = `${mediaId}.${detected.extension}`;
    const originalFilename = (0, media_validation_js_1.sanitizeOriginalFilename)(file.originalname);
    const { storageKey } = await storage.upload({
        workspaceId,
        mediaId,
        buffer: file.buffer,
        mimeType: detected.mimeType,
        extension: detected.extension,
        filename,
    });
    const doc = await media_model_js_1.MediaModel.create({
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
async function listMedia(workspaceId, limit = 100) {
    const docs = await media_model_js_1.MediaModel.find({ workspaceId })
        .sort({ createdAt: -1 })
        .limit(limit);
    return { media: docs.map((d) => toDto(d)) };
}
async function getMedia(workspaceId, mediaId) {
    const doc = await findInWorkspace(workspaceId, mediaId);
    return toDto(doc);
}
async function getMediaContent(workspaceId, mediaId) {
    const doc = await findInWorkspace(workspaceId, mediaId);
    const storage = (0, index_js_1.getStorageService)();
    return {
        absolutePath: storage.getAbsolutePath(doc.storageKey),
        mimeType: doc.mimeType,
    };
}
async function replaceMedia(workspaceId, mediaId, file) {
    const doc = await findInWorkspace(workspaceId, mediaId);
    const detected = (0, media_validation_js_1.validateUploadBuffer)(file.buffer, file.mimetype);
    const storage = (0, index_js_1.getStorageService)();
    const oldKey = doc.storageKey;
    const filename = `${mediaId}.${detected.extension}`;
    const originalFilename = (0, media_validation_js_1.sanitizeOriginalFilename)(file.originalname);
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
async function deleteMedia(workspaceId, mediaId) {
    const doc = await findInWorkspace(workspaceId, mediaId);
    const storage = (0, index_js_1.getStorageService)();
    await storage.delete(doc.storageKey);
    await doc.deleteOne();
}
