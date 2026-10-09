"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
exports.reconcileFirebaseUidIndex = reconcileFirebaseUidIndex;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    passwordHash: { type: String, default: null, select: false },
    // Omit when unset — do not default to null (breaks unique sparse index).
    firebaseUid: { type: String },
    name: { type: String, trim: true, default: null },
    emailVerified: { type: Boolean, default: false },
    currentWorkspaceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Workspace",
        default: null,
    },
}, { timestamps: true });
userSchema.index({ firebaseUid: 1 }, {
    unique: true,
    partialFilterExpression: {
        firebaseUid: { $exists: true, $type: "string" },
    },
    name: "firebaseUid_unique_nonempty",
});
exports.UserModel = (0, mongoose_1.model)("User", userSchema);
/** Fix legacy null firebaseUid values and index from early OAuth rollout. */
async function reconcileFirebaseUidIndex() {
    await exports.UserModel.updateMany({ $or: [{ firebaseUid: null }, { firebaseUid: "" }] }, { $unset: { firebaseUid: "" } });
    try {
        await exports.UserModel.collection.dropIndex("firebaseUid_1");
    }
    catch {
        /* index may not exist */
    }
    await exports.UserModel.syncIndexes();
}
