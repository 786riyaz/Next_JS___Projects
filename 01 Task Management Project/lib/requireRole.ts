import { NextRequest } from "next/server";
import { verifyToken } from "./auth";

export const requireRole = (
  req: NextRequest,
  allowedRoles: string[]
) => {
  const token = req.cookies.get("token")?.value;

  if (!token) {
    throw new Error("Unauthorized");
  }

  const decoded: any = verifyToken(token);

  if (!allowedRoles.includes(decoded.role)) {
    throw new Error("Forbidden");
  }

  return decoded;
};