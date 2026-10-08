import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface JwtPayload {
  sub: string;
  email: string;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.jwtSecret);
  if (typeof decoded !== "object" || decoded === null) {
    throw new Error("Invalid token payload");
  }
  const sub = "sub" in decoded ? String(decoded.sub) : "";
  const email = "email" in decoded ? String(decoded.email) : "";
  if (!sub || !email) {
    throw new Error("Invalid token payload");
  }
  return { sub, email };
}
