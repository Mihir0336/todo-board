import { NextRequest, NextResponse } from "next/server"
import { connectDB, Organization, User } from "@/lib/db"
import { authenticateUser } from "@/lib/auth"

// POST /api/organizations/[id]/fire
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }
    const { id } = params
    const { userId } = await request.json()
    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 })
    }
    await connectDB()
    const org = await Organization.findById(id)
    if (!org) {
      return NextResponse.json({ success: false, message: "Organization not found" }, { status: 404 })
    }
    if (String(org.owner) !== String(user._id)) {
      return NextResponse.json({ success: false, message: "Only the org owner can fire members" }, { status: 403 })
    }
    if (String(org.owner) === String(userId)) {
      return NextResponse.json({ success: false, message: "Cannot fire the owner" }, { status: 400 })
    }
    // Remove user from org members
    org.members = org.members.filter((m: any) => String(m) !== String(userId))
    await org.save()
    // Remove org from user's organizations
    await User.findByIdAndUpdate(userId, { $pull: { organizations: org._id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
} 