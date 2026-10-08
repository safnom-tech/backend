import type { Types } from "mongoose";

export interface AuthUserContext {
  id: string;
  email: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDocumentFields {
  _id: Types.ObjectId;
  email: string;
  passwordHash?: string | null;
  firebaseUid?: string | null;
  name?: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function toPublicUser(doc: {
  _id: Types.ObjectId;
  email: string;
  name?: string | null;
  emailVerified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}): PublicUser {
  return {
    id: doc._id.toString(),
    email: doc.email,
    name: doc.name ?? null,
    emailVerified: doc.emailVerified,
    createdAt: doc.createdAt ?? new Date(),
    updatedAt: doc.updatedAt ?? new Date(),
  };
}
