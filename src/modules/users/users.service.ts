import { AppError } from "../../middleware/error.middleware.js";
import { UserModel } from "./users.model.js";
import { toPublicUser, type PublicUser } from "./users.types.js";
import type { UpdateProfileInput } from "./users.validators.js";

export async function getUserById(userId: string): Promise<PublicUser> {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }
  return toPublicUser(user);
}

export async function updateUserProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<PublicUser> {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  if (input.name !== undefined) {
    user.name = input.name;
  }

  await user.save();
  return toPublicUser(user);
}
