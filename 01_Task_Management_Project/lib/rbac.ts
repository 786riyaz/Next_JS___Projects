export const Roles = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  USER: "USER",
} as const;

export const canAssignTask = (role: string) =>
  role === Roles.ADMIN || role === Roles.MANAGER;

export const canManageUsers = (role: string) =>
  role === Roles.ADMIN;