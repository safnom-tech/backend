import type { AuthUserContext } from "../modules/users/users.types.js";
import type { PublicWorkspace } from "../modules/workspaces/workspaces.types.js";
import type { WorkspaceMemberRole } from "../modules/workspaces/workspace-member.model.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserContext;
      workspace?: PublicWorkspace;
      workspaceRole?: WorkspaceMemberRole;
    }
  }
}

export {};
