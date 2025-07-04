"use client"

import { useState, useEffect } from "react"

export default function TaskForm({ task, onSubmit, onCancel, organization }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
  })
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        status: task.status || "todo",
        priority: task.priority || "medium",
        assignedUser: task.assignedUser?._id || "",
      })
    }
    loadUsers()
  }, [task])

  const loadUsers = async () => {
    try {
      const response = await fetch(`/api/users?organization=${organization}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error("Error loading users:", error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const submitData = { ...formData }
    if (submitData.assignedUser === "") {
      delete submitData.assignedUser
    }

    await onSubmit(submitData)
    setLoading(false)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{task ? "Edit Task" : "Create New Task"}</h3>
          <button onClick={onCancel} className="close-btn">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select id="status" name="status" value={formData.status} onChange={handleChange} disabled={loading}>
                <option value="todo">Todo</option>
                <option value="inprogress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="assignedUser">Assign to</label>
            <select
              id="assignedUser"
              name="assignedUser"
              value={formData.assignedUser || ""}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.username}
                </option>
              ))}
            </select>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="primary-button">
              {loading ? "Saving..." : task ? "Update Task" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
