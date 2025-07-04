import { type NextRequest, NextResponse } from "next/server"
import { connectDB, User } from "@/lib/db"
import { authenticateUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      )
    }

    await connectDB()

    const orgId = request.nextUrl.searchParams.get("organization")
    let users
    if (orgId) {
      users = await User.find({ organizations: orgId }).select("_id username email")
    } else {
      users = await User.find().select("_id username email")
    }

    return NextResponse.json({
      success: true,
      users,
    })
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
