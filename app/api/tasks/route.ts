import { type NextRequest, NextResponse } from "next/server"
import { connectDB, Task, Activity } from "@/lib/db"
import { authenticateUser } from "@/lib/auth"
import { broadcastTaskUpdate } from "@/lib/socket"
import { Organization } from "@/lib/db"

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

    // Get organization from query
    const orgId = request.nextUrl.searchParams.get("organization")
    if (!orgId) {
      return NextResponse.json({ success: false, message: "Organization is required" }, { status: 400 })
    }

    // Check user is a member
    const org = await Organization.findById(orgId)
    if (!org || !org.members.includes(user._id)) {
      return NextResponse.json({ success: false, message: "Not a member of this organization" }, { status: 403 })
    }

    const tasks = await Task.find({ organization: orgId }).populate("assignedUser", "username email").sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      tasks,
    })
  } catch (error) {
    console.error("Get tasks error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
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

    const taskData = await request.json()

    // Accept organization from body or query string
    let organization = taskData.organization
    if (!organization) {
      organization = request.nextUrl.searchParams.get("organization")
      if (organization) {
        taskData.organization = organization
      }
    }
    if (!organization) {
      return NextResponse.json({ success: false, message: "Organization is required" }, { status: 400 })
    }

    // Validate title uniqueness and not matching column names
    const existingTask = await Task.findOne({ title: taskData.title })
    if (existingTask) {
      return NextResponse.json(
        {
          success: false,
          message: "Task title must be unique",
        },
        { status: 400 },
      )
    }

    const columnNames = ["todo", "inprogress", "done", "Todo", "In Progress", "Done"]
    if (columnNames.includes(taskData.title)) {
      return NextResponse.json(
        {
          success: false,
          message: "Task title cannot match column names",
        },
        { status: 400 },
      )
    }

    const task = new Task({
      ...taskData,
      createdBy: user._id,
    })

    await task.save()
    await task.populate("assignedUser", "username email")

    // Log activity
    const activity = new Activity({
      action: "create",
      user: user._id,
      task: task._id,
      organization: task.organization,
      details: {
        title: task.title,
      },
    })
    await activity.save()
    await activity.populate("user", "username")

    // Broadcast to all clients
    broadcastTaskUpdate("taskCreated", task)
    broadcastTaskUpdate("activityAdded", activity)

    return NextResponse.json({
      success: true,
      task,
    })
  } catch (error) {
    console.error("Create task error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
