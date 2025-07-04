import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { connectDB, User } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          message: "No token provided",
        },
        { status: 401 },
      )
    }

    const token = authHeader.substring(7)

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any

      await connectDB()
      const user = await User.findById(decoded.userId).select("-password")

      if (!user) {
        return NextResponse.json(
          {
            success: false,
            message: "User not found",
          },
          { status: 401 },
        )
      }

      return NextResponse.json({
        success: true,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role, // Include role
        },
      })
    } catch (jwtError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid token",
        },
        { status: 401 },
      )
    }
  } catch (error) {
    console.error("Token verification error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
