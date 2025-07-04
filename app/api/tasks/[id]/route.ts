import { type NextRequest, NextResponse } from "next/server"
import { connectDB, Task, Activity, Organization } from "@/lib/db"
import { authenticateUser } from "@/lib/auth"
import { broadcastTaskUpdate } from "@/lib/socket"

export async function GET(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
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
    const task = await Task.findOne({ _id: id, organization: orgId })
    if (!task) {
      return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true, task })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
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

    const updates = await request.json()
    const taskId = id

    // Get current task for conflict detection
    const currentTask = await Task.findById(taskId)
    if (!currentTask) {
      return NextResponse.json(
        {
          success: false,
          message: "Task not found",
        },
        { status: 404 },
      )
    }

    // Check for conflicts if updatedAt is provided
    if (updates.lastKnownUpdate && new Date(updates.lastKnownUpdate) < currentTask.updatedAt) {
      return NextResponse.json(
        {
          success: false,
          conflict: {
            taskId,
            userVersion: updates,
            serverVersion: currentTask.toObject(),
          },
        },
        { status: 409 },
      )
    }

    // Validate title uniqueness if title is being updated
    if (updates.title && updates.title !== currentTask.title) {
      const existingTask = await Task.findOne({
        title: updates.title,
        _id: { $ne: taskId },
      })
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
      if (columnNames.includes(updates.title)) {
        return NextResponse.json(
          {
            success: false,
            message: "Task title cannot match column names",
          },
          { status: 400 },
        )
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { ...updates, updatedAt: new Date() },
      { new: true },
    ).populate("assignedUser", "username email")

    // Log activity
    let action = "update"
    const details: any = { title: updatedTask.title }

    if (updates.status && updates.status !== currentTask.status) {
      action = "move"
      details.newStatus = updates.status
    } else if (updates.assignedUser && updates.assignedUser !== currentTask.assignedUser?.toString()) {
      action = "assign"
      const assignedUser = await Task.findById(taskId).populate("assignedUser", "username")
      details.assignedTo = assignedUser?.assignedUser?.username || "Unassigned"
    }

    const activity = new Activity({
      action,
      user: user._id,
      task: updatedTask._id,
      organization: updatedTask.organization,
      details,
    })
    await activity.save()
    await activity.populate("user", "username")

    // Broadcast to all clients
    broadcastTaskUpdate("taskUpdated", updatedTask)
    broadcastTaskUpdate("activityAdded", activity)

    return NextResponse.json({
      success: true,
      task: updatedTask,
    })
  } catch (error) {
    console.error("Update task error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, context: any) {
  const { id } = await context.params;
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

    const taskId = id
    const task = await Task.findById(taskId)

    if (!task) {
      return NextResponse.json(
        {
          success: false,
          message: "Task not found",
        },
        { status: 404 },
      )
    }

    await Task.findByIdAndDelete(taskId)

    // Log activity
    const activity = new Activity({
      action: "delete",
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
    broadcastTaskUpdate("taskDeleted", taskId)
    broadcastTaskUpdate("activityAdded", activity)

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
