// lib/serverAuth.ts
import { NextRequest } from "next/server"
import jwt from "jsonwebtoken"

export function verifyToken(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization")
    if (!auth) return null

    const token = auth.split(" ")[1]
    if (!token) return null

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as any

    if (!decoded.id) return null

    return { id: decoded.id }

  } catch (err) {
    console.error("JWT verification failed:", err)
    return null
  }
}