import { Schema, model, type Document, Types } from "mongoose";

export interface UserDocument extends Document {
  email: string;
  passwordHash?: string | null;
  firebaseUid?: string | null;
  name?: string | null;
  emailVerified: boolean;
  currentWorkspaceId?: Types.ObjectId | null;
}

const userSchema = new Schema<UserDocument>(
  {
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
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.index(
  { firebaseUid: 1 },
  {
    unique: true,
    partialFilterExpression: {
      firebaseUid: { $exists: true, $type: "string" },
    },
    name: "firebaseUid_unique_nonempty",
  }
);

export const UserModel = model<UserDocument>("User", userSchema);

/** Fix legacy null firebaseUid values and index from early OAuth rollout. */
export async function reconcileFirebaseUidIndex(): Promise<void> {
  await UserModel.updateMany(
    { $or: [{ firebaseUid: null }, { firebaseUid: "" }] },
    { $unset: { firebaseUid: "" } }
  );

  try {
    await UserModel.collection.dropIndex("firebaseUid_1");
  } catch {
    /* index may not exist */
  }

  await UserModel.syncIndexes();
}
