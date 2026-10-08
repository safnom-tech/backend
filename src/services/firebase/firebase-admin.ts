import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { env } from "../../config/env.js";
import { AppError } from "../../middleware/error.middleware.js";

let app: App | undefined;
let auth: Auth | undefined;

export function isFirebaseAdminConfigured(): boolean {
  return Boolean(
    env.firebaseProjectId &&
      env.firebaseClientEmail &&
      env.firebasePrivateKey
  );
}

function getFirebaseApp(): App {
  if (!isFirebaseAdminConfigured()) {
    throw new AppError(
      "Google sign-in is not configured on the server",
      503,
      "FIREBASE_NOT_CONFIGURED"
    );
  }

  if (app) {
    return app;
  }

  const existing = getApps()[0];
  if (existing) {
    app = existing;
    return app;
  }

  app = initializeApp({
    credential: cert({
      projectId: env.firebaseProjectId,
      clientEmail: env.firebaseClientEmail,
      privateKey: env.firebasePrivateKey,
    }),
  });
  return app;
}

function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

export interface VerifiedFirebaseUser {
  uid: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
}

export async function verifyFirebaseIdToken(
  idToken: string
): Promise<VerifiedFirebaseUser> {
  let decoded;
  try {
    decoded = await getFirebaseAuth().verifyIdToken(idToken);
  } catch {
    throw new AppError("Invalid or expired Google sign-in", 401, "INVALID_FIREBASE_TOKEN");
  }
  const email = decoded.email?.trim().toLowerCase();
  if (!email) {
    throw new AppError(
      "This sign-in method must provide an email address",
      400,
      "FIREBASE_EMAIL_REQUIRED"
    );
  }

  const name =
    typeof decoded.name === "string" && decoded.name.trim()
      ? decoded.name.trim()
      : null;

  return {
    uid: decoded.uid,
    email,
    name,
    emailVerified: decoded.email_verified === true,
  };
}
