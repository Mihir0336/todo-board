import { NextRequest, NextResponse } from "next/server"
import { connectDB, Organization, User } from "@/lib/db"
import { authenticateUser } from "@/lib/auth"

// Allow employees to join an org by invite code
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }
    const { inviteCode } = await request.json()
    if (!inviteCode) {
      return NextResponse.json({ success: false, message: "Invite code is required" }, { status: 400 })
    }
    await connectDB()
    const org = await Organization.findOne({ inviteCode })
    if (!org) {
      return NextResponse.json({ success: false, message: "Invalid invite code" }, { status: 404 })
    }
    // Add user to org if not already a member
    if (!org.members.includes(user._id)) {
      org.members.push(user._id)
      await org.save()
      // Add org to user's organizations
      await User.findByIdAndUpdate(user._id, { $addToSet: { organizations: org._id } })
    }
    return NextResponse.json({ success: true, message: "Joined organization" })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
} 