import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { connectDB, User, Organization } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const { username, email, password, role, orgName, inviteCode } = await request.json()

    // Validate input
    if (!username || !email || !password || !role) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields are required",
        },
        { status: 400 },
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 6 characters",
        },
        { status: 400 },
      )
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    })

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User with this email or username already exists",
        },
        { status: 400 },
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    let user, org

    if (role === "org") {
      // Register as organization owner
      if (!orgName) {
        return NextResponse.json({ success: false, message: "Organization name is required" }, { status: 400 })
      }
      // Create user (but don't save yet)
      user = new User({
        username,
        email,
        password: hashedPassword,
        role: "org",
      })
      // Create org with user as owner
      org = await Organization.create({ name: orgName, owner: user._id, members: [] })
      // Add org to user's organizations
      user.organizations = [org._id]
      await user.save()
      // Add user to org members and save org
      org.members = [user._id]
      await org.save()
    } else if (role === "employee") {
      // Register as employee
      let orgId = undefined;
      if (inviteCode) {
      // Find org by invite code
      org = await Organization.findOne({ inviteCode })
      if (!org) {
        return NextResponse.json({ success: false, message: "Invalid organization invite code" }, { status: 400 })
        }
        orgId = org._id;
      }
      user = new User({
        username,
        email,
        password: hashedPassword,
        organizations: orgId ? [orgId] : [],
        role: "employee",
      })
      await user.save()
      // Add user to org members if org exists
      if (org) {
      org.members.push(user._id)
      await org.save()
      }
    } else {
      return NextResponse.json({ success: false, message: "Invalid role" }, { status: 400 })
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || "fallback-secret", { expiresIn: "7d" })

    return NextResponse.json({
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        organizations: user.organizations,
      },
      inviteCode: org ? org.inviteCode : undefined,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
