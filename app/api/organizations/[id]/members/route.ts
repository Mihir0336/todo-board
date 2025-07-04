import { NextRequest, NextResponse } from "next/server"
import { connectDB, Organization, User } from "@/lib/db"
import { authenticateUser } from "@/lib/auth"

// List members of an organization
export async function GET(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }
    await connectDB()
    const org = await Organization.findById(id).populate("members", "username email role")
    if (!org) {
      return NextResponse.json({ success: false, message: "Organization not found" }, { status: 404 })
    }
    if (!org.members.some((m: any) => m._id.equals(user._id))) {
      return NextResponse.json({ success: false, message: "Not a member of this organization" }, { status: 403 })
    }
    return NextResponse.json({ success: true, members: org.members })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
} 