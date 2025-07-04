import jwt from "jsonwebtoken"
import type { NextRequest } from "next/server"
import { connectDB, User } from "./db"

export async function authenticateUser(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any

    await connectDB()
    const user = await User.findById(decoded.userId).select("-password")

    return user
  } catch (error) {
    return null
  }
}
