import { type NextRequest, NextResponse } from "next/server"
import { connectDB, Activity, Organization } from "@/lib/db"
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
    if (!orgId) {
      return NextResponse.json({ success: false, message: "Organization is required" }, { status: 400 })
    }
    const org = await Organization.findById(orgId)
    if (!org || !org.members.includes(user._id)) {
      return NextResponse.json({ success: false, message: "Not a member of this organization" }, { status: 403 })
    }

    const activities = await Activity.find({ organization: orgId }).populate("user", "username").sort({ createdAt: -1 }).limit(20)

    return NextResponse.json({
      success: true,
      activities,
    })
  } catch (error) {
    console.error("Get activities error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
