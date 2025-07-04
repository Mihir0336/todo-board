import { NextRequest, NextResponse } from "next/server"
import { connectDB, Organization } from "@/lib/db"
import { authenticateUser } from "@/lib/auth"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }
    const orgId = params.id
    const { name } = await request.json()
    if (!name) {
      return NextResponse.json({ success: false, message: "Organization name is required" }, { status: 400 })
    }
    await connectDB()
    const org = await Organization.findById(orgId)
    if (!org) {
      return NextResponse.json({ success: false, message: "Organization not found" }, { status: 404 })
    }
    if (String(org.owner) !== String(user._id)) {
      return NextResponse.json({ success: false, message: "Only the organization owner can update the name" }, { status: 403 })
    }
    org.name = name
    await org.save()
    return NextResponse.json({ success: true, organization: org })
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: "Organization name already exists" }, { status: 400 })
    }
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
} 