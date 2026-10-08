import { env } from "../../config/env.js";
import { sendEmail } from "../../services/email/email.service.js";
import { AppError } from "../../middleware/error.middleware.js";
import { signAccessToken } from "../../utils/jwt.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import {
  generateResetToken,
  hashResetToken,
} from "../../utils/reset-token.js";
import { UserModel } from "../users/users.model.js";
import { toPublicUser, type PublicUser } from "../users/users.types.js";
import { createWorkspace } from "../workspaces/workspaces.service.js";
import {
  isFirebaseAdminConfigured,
  verifyFirebaseIdToken,
} from "../../services/firebase/firebase-admin.js";
import { PasswordResetTokenModel } from "./auth.password-reset.model.js";
import type {
  FirebaseLoginInput,
  ForgotPasswordInput,
  LoginInput,
  ResetPasswordInput,
  SignupInput,
} from "./auth.validators.js";

const RESET_EXPIRY_MS = 60 * 60 * 1000;

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
}

export async function signup(input: SignupInput): Promise<AuthResult> {
  const existing = await UserModel.findOne({ email: input.email });
  if (existing) {
    throw new AppError("Email already registered", 409, "EMAIL_EXISTS");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await UserModel.create({
    email: input.email,
    passwordHash,
    name: input.name ?? null,
  });

  const workspaceName =
    input.name?.trim() ||
    input.email.split("@")[0]?.trim() ||
    "My workspace";
  await createWorkspace(user._id.toString(), { name: workspaceName });

  const accessToken = signAccessToken({
    sub: user._id.toString(),
    email: user.email,
  });

  const refreshed = await UserModel.findById(user._id);
  return {
    user: toPublicUser(refreshed ?? user),
    accessToken,
  };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await UserModel.findOne({ email: input.email }).select(
    "+passwordHash"
  );
  if (!user) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  if (!user.passwordHash) {
    throw new AppError(
      "This account uses Google sign-in. Continue with Google or reset your password to add one.",
      401,
      "PASSWORD_LOGIN_UNAVAILABLE"
    );
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  const accessToken = signAccessToken({
    sub: user._id.toString(),
    email: user.email,
  });

  return { user: toPublicUser(user), accessToken };
}

function workspaceNameFromUser(email: string, name?: string | null): string {
  return (
    name?.trim() ||
    email.split("@")[0]?.trim() ||
    "My workspace"
  );
}

async function issueAuthResult(userId: string): Promise<AuthResult> {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  const accessToken = signAccessToken({
    sub: user._id.toString(),
    email: user.email,
  });

  return { user: toPublicUser(user), accessToken };
}

export async function loginWithFirebase(
  input: FirebaseLoginInput
): Promise<AuthResult> {
  if (!isFirebaseAdminConfigured()) {
    throw new AppError(
      "Google sign-in is not configured on the server",
      503,
      "FIREBASE_NOT_CONFIGURED"
    );
  }

  const profile = await verifyFirebaseIdToken(input.idToken);

  let user = await UserModel.findOne({ firebaseUid: profile.uid });
  let isNewUser = false;

  if (!user) {
    user = await UserModel.findOne({ email: profile.email });
    if (user) {
      if (user.firebaseUid && user.firebaseUid !== profile.uid) {
        throw new AppError(
          "Email already linked to another Google account",
          409,
          "ACCOUNT_CONFLICT"
        );
      }
      user.firebaseUid = profile.uid;
      if (profile.emailVerified) {
        user.emailVerified = true;
      }
      if (!user.name && profile.name) {
        user.name = profile.name;
      }
      await user.save();
    } else {
      user = await UserModel.create({
        email: profile.email,
        firebaseUid: profile.uid,
        name: profile.name,
        emailVerified: profile.emailVerified,
      });
      isNewUser = true;
    }
  } else {
    if (profile.emailVerified) {
      user.emailVerified = true;
    }
    if (!user.name && profile.name) {
      user.name = profile.name;
    }
    if (user.isModified()) {
      await user.save();
    }
  }

  if (isNewUser) {
    await createWorkspace(user._id.toString(), {
      name: workspaceNameFromUser(profile.email, profile.name),
    });
  }

  return issueAuthResult(user._id.toString());
}

export async function forgotPassword(
  input: ForgotPasswordInput
): Promise<void> {
  const user = await UserModel.findOne({ email: input.email });
  if (!user) {
    return;
  }

  const rawToken = generateResetToken();
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_EXPIRY_MS);

  await PasswordResetTokenModel.deleteMany({ userId: user._id, usedAt: null });
  await PasswordResetTokenModel.create({
    userId: user._id,
    tokenHash,
    expiresAt,
  });

  const resetUrl = `${env.frontendUrl.replace(/\/$/, "")}/reset-password?token=${rawToken}`;

  await sendEmail({
    to: user.email,
    subject: "Reset your Safnom password",
    text: `Reset your password using this link (expires in 1 hour): ${resetUrl}`,
    html: `<p>Reset your password using this link (expires in 1 hour):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });
}

export async function resetPassword(
  input: ResetPasswordInput
): Promise<void> {
  const tokenHash = hashResetToken(input.token);
  const record = await PasswordResetTokenModel.findOne({
    tokenHash,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!record) {
    throw new AppError(
      "Invalid or expired reset token",
      400,
      "INVALID_RESET_TOKEN"
    );
  }

  const user = await UserModel.findById(record.userId).select("+passwordHash");
  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  user.passwordHash = await hashPassword(input.newPassword);
  await user.save();

  record.usedAt = new Date();
  await record.save();
}
