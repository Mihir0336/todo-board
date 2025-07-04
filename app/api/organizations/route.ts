import { NextRequest, NextResponse } from "next/server"
import { connectDB, Organization, User } from "@/lib/db"
import { authenticateUser } from "@/lib/auth"

// Create a new organization
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }
    const { name } = await request.json()
    if (!name) {
      return NextResponse.json({ success: false, message: "Organization name is required" }, { status: 400 })
    }
    await connectDB()
    // Create organization
    const org = await Organization.create({ name, owner: user._id, members: [user._id] })
    // Add org to user's organizations
    await User.findByIdAndUpdate(user._id, { $push: { organizations: org._id } })
    return NextResponse.json({ success: true, organization: org })
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: "Organization name already exists" }, { status: 400 })
    }
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

// List organizations for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }
    await connectDB()
    const orgs = await Organization.find({ members: user._id })
    return NextResponse.json({ success: true, organizations: orgs })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
} 