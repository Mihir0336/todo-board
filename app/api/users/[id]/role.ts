import { NextRequest, NextResponse } from "next/server"
import { connectDB, User, Organization } from "@/lib/db"
import { authenticateUser } from "@/lib/auth"

// PATCH /api/users/[id]/role
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }
    const { id } = params
    const { role, orgId } = await request.json()
    if (!role || !["employee", "hr"].includes(role)) {
      return NextResponse.json({ success: false, message: "Invalid role" }, { status: 400 })
    }
    await connectDB()
    // Find the org where the user is owner
    const org = await Organization.findOne({ owner: user._id, members: id })
    if (!org) {
      return NextResponse.json({ success: false, message: "Only the org owner can change roles" }, { status: 403 })
    }
    // Don't allow changing the owner's own role
    if (id === String(user._id)) {
      return NextResponse.json({ success: false, message: "Cannot change your own role" }, { status: 400 })
    }
    // Update the user's role
    await User.findByIdAndUpdate(id, { role })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
} 