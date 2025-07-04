"use client"

import { useState, useEffect, useRef } from "react"
import TaskCard from "./TaskCard"
import TaskForm from "./TaskForm"
import ActivityLog from "./ActivityLog"
import ConflictDialog from "./ConflictDialog"
import { io } from "socket.io-client"

const COLUMNS = [
  { id: "todo", title: "Todo", color: "#ff6b6b" },
  { id: "inprogress", title: "In Progress", color: "#4ecdc4" },
  { id: "done", title: "Done", color: "#45b7d1" },
]

interface KanbanBoardProps {
  user: any
  organization: string
}

export default function KanbanBoard({ user, organization }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<any[]>([])
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [showActivityLog, setShowActivityLog] = useState(false)
  const [conflict, setConflict] = useState<any>(null)
  const [draggedTask, setDraggedTask] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const socketRef = useRef<any>(null)

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io("/", {
      auth: {
        token: localStorage.getItem("token"),
        organization,
      },
    })

    // Socket event listeners
    socketRef.current.on("taskUpdated", (updatedTask: any) => {
      setTasks((prev) => prev.map((task) => (task._id === updatedTask._id ? updatedTask : task)))
    })

    socketRef.current.on("taskCreated", (newTask: any) => {
      setTasks((prev) => [...prev, newTask])
    })

    socketRef.current.on("taskDeleted", (taskId: any) => {
      setTasks((prev) => prev.filter((task) => task._id !== taskId))
    })

    socketRef.current.on("activityAdded", (activity: any) => {
      setActivities((prev) => [activity, ...prev.slice(0, 19)])
    })

    socketRef.current.on("conflict", (conflictData: any) => {
      setConflict(conflictData)
    })

    // Load initial data
    loadTasks()
    loadActivities()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [organization])

  const loadTasks = async () => {
    try {
      const response = await fetch(`/api/tasks?organization=${organization}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setTasks(data.tasks)
      }
    } catch (error) {
      console.error("Error loading tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadActivities = async () => {
    try {
      const response = await fetch(`/api/activities?organization=${organization}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setActivities(data.activities)
      }
    } catch (error) {
      console.error("Error loading activities:", error)
    }
  }

  const handleCreateTask = async (taskData: any) => {
    try {
      const response = await fetch(`/api/tasks?organization=${organization}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(taskData),
      })
      const data = await response.json()
      if (data.success) {
        setShowTaskForm(false)
        // Task will be added via socket event
      } else {
        alert(data.message || "Failed to create task")
      }
    } catch (error) {
      console.error("Error creating task:", error)
      alert("Failed to create task")
    }
  }

  const handleUpdateTask = async (taskId: any, updates: any) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}?organization=${organization}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(updates),
      })
      const data = await response.json()
      if (data.success) {
        setEditingTask(null)
        // Task will be updated via socket event
      } else if (data.conflict) {
        setConflict(data.conflict)
      } else {
        alert(data.message || "Failed to update task")
      }
    } catch (error) {
      console.error("Error updating task:", error)
      alert("Failed to update task")
    }
  }

  const handleDeleteTask = async (taskId: any) => {
    if (!confirm("Are you sure you want to delete this task?")) return

    try {
      const response = await fetch(`/api/tasks/${taskId}?organization=${organization}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      const data = await response.json()
      if (!data.success) {
        alert(data.message || "Failed to delete task")
      }
      // Task will be removed via socket event
    } catch (error) {
      console.error("Error deleting task:", error)
      alert("Failed to delete task")
    }
  }

  const handleSmartAssign = async () => {
    try {
      const response = await fetch(`/api/tasks/smart-assign?organization=${organization}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        alert(`Task "${data.task.title}" assigned to ${data.assignedUser.username}`)
      } else {
        alert(data.message || "No unassigned tasks available")
      }
    } catch (error) {
      console.error("Error with smart assign:", error)
      alert("Failed to smart assign task")
    }
  }

  const handleDragStart = (e: any, task: any) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: any) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: any, newStatus: any) => {
    e.preventDefault()
    if (draggedTask && draggedTask.status !== newStatus) {
      handleUpdateTask(draggedTask._id, { status: newStatus })
    }
    setDraggedTask(null)
  }

  const getTasksByStatus = (status: any) => {
    return tasks.filter((task) => task.status === status)
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading board...</p>
      </div>
    )
  }

  return (
    <div className="kanban-container">
      <div className="kanban-header">
        <div className="header-actions">
          <button onClick={() => setShowTaskForm(true)} className="secondary-button">
            ➕ Add Task
          </button>
          <button onClick={handleSmartAssign} className="secondary-button">
            🧠 Smart Assign
          </button>
          <button onClick={() => setShowActivityLog(!showActivityLog)} className="secondary-button">
            📜 Activity Log
          </button>
        </div>
      </div>

      <div className="kanban-board">
        <div className="board-columns">
          {COLUMNS.map((column) => (
            <div
              key={column.id}
              className="kanban-column"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="column-header" style={{ borderTopColor: column.color }}>
                <h3>{column.title}</h3>
                <span className="task-count">{getTasksByStatus(column.id).length}</span>
              </div>
              <div className="column-content" style={{ maxHeight: 670, overflowY: 'auto' }}>
                {getTasksByStatus(column.id).map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onEdit={() => setEditingTask(task)}
                    onDelete={() => handleDeleteTask(task._id)}
                    onDragStart={handleDragStart}
                    currentUser={user}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {showActivityLog && <ActivityLog activities={activities} onClose={() => setShowActivityLog(false)} />}
      </div>

      {showTaskForm && (
        <TaskForm task={null} onSubmit={handleCreateTask} onCancel={() => setShowTaskForm(false)} organization={organization} />
      )}

      {editingTask && (
        <TaskForm
          task={editingTask}
          onSubmit={(data: any) => handleUpdateTask(editingTask._id, data)}
          onCancel={() => setEditingTask(null)}
          organization={organization}
        />
      )}

      {conflict && (
        <ConflictDialog
          conflict={conflict}
          onResolve={(resolution: any) => {
            if (resolution === "overwrite") {
              handleUpdateTask(conflict.taskId, conflict.userVersion)
            } else if (resolution === "merge") {
              // Simple merge strategy - could be more sophisticated
              const merged = {
                ...conflict.serverVersion,
                ...conflict.userVersion,
                updatedAt: new Date(),
              }
              handleUpdateTask(conflict.taskId, merged)
            }
            setConflict(null)
          }}
          onCancel={() => setConflict(null)}
        />
      )}
    </div>
  )
}
