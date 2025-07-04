import { type NextRequest, NextResponse } from "next/server"
import { connectDB, Task, User, Activity, Organization } from "@/lib/db"
import { authenticateUser } from "@/lib/auth"
import { broadcastTaskUpdate } from "@/lib/socket"

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

    const orgId = request.nextUrl.searchParams.get("organization")
    if (!orgId) {
      return NextResponse.json(
        {
          success: false,
          message: "Organization is required",
        },
        { status: 400 },
      )
    }
    const org = await Organization.findById(orgId)
    if (!org || !org.members.includes(user._id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Not a member of this organization",
        },
        { status: 403 },
      )
    }

    // Find unassigned tasks in org
    const unassignedTasks = await Task.find({ assignedUser: null, organization: orgId })

    if (unassignedTasks.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No unassigned tasks available",
        },
        { status: 400 },
      )
    }

    // Get all users in org and count their active tasks
    const users = await User.find({ _id: { $in: org.members } }).select("_id username")
    const userTaskCounts = await Promise.all(
      users.map(async (u) => {
        const activeTaskCount = await Task.countDocuments({
          assignedUser: u._id,
          status: { $ne: "done" },
          organization: orgId,
        })
        return {
          user: u,
          activeTaskCount,
        }
      }),
    )

    // Find user with fewest active tasks
    const userWithFewestTasks = userTaskCounts.reduce((min, current) =>
      current.activeTaskCount < min.activeTaskCount ? current : min,
    )

    // Assign the first unassigned task to this user
    const taskToAssign = unassignedTasks[0]
    const updatedTask = await Task.findByIdAndUpdate(
      taskToAssign._id,
      {
        assignedUser: userWithFewestTasks.user._id,
        updatedAt: new Date(),
      },
      { new: true },
    ).populate("assignedUser", "username email")

    // Log activity
    const activity = new Activity({
      action: "assign",
      user: user._id,
      task: updatedTask._id,
      organization: orgId,
      details: {
        title: updatedTask.title,
        assignedTo: userWithFewestTasks.user.username,
      },
    })
    await activity.save()
    await activity.populate("user", "username")

    // Broadcast to all clients
    broadcastTaskUpdate("taskUpdated", updatedTask)
    broadcastTaskUpdate("activityAdded", activity)

    return NextResponse.json({
      success: true,
      task: updatedTask,
      assignedUser: userWithFewestTasks.user,
    })
  } catch (error) {
    console.error("Smart assign error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
