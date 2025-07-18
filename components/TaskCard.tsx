"use client"

const PRIORITY_COLORS = {
  low: "#95a5a6",
  medium: "#f39c12",
  high: "#e74c3c",
}

const PRIORITY_LABELS = {
  low: "🟢 Low",
  medium: "🟡 Medium",
  high: "🔴 High",
}

export default function TaskCard({ task, onEdit, onDelete, onDragStart, currentUser }) {
  const handleDragStart = (e) => {
    onDragStart(e, task)
  }

  const isAssignedToCurrentUser = task.assignedUser?._id === currentUser._id

  return (
    <div
      className={`task-card ${isAssignedToCurrentUser ? "assigned-to-me" : ""}`}
      draggable
      onDragStart={handleDragStart}
      style={{ display: 'flex', alignItems: 'stretch' }}
    >
      <div style={{ width: 6, borderRadius: 6, background: PRIORITY_COLORS[task.priority], marginRight: 16 }} />
      <div style={{ flex: 1 }}>
        <div className="task-header">
          <h4 className="task-title">{task.title}</h4>
          <div className="task-actions">
            <button onClick={onEdit} className="edit-btn" title="Edit">
              ✏️
            </button>
            <button onClick={onDelete} className="delete-btn" title="Delete">
              🗑️
            </button>
          </div>
        </div>

        {task.description && <p className="task-description">{task.description}</p>}

        <div className="task-meta">
          <div className="task-priority" style={{ color: PRIORITY_COLORS[task.priority] }}>
            {PRIORITY_LABELS[task.priority]}
          </div>

          {task.assignedUser && <div className="task-assignee">👤 {task.assignedUser.username}</div>}
        </div>

        <div className="task-footer">
          <small className="task-date">Created: {new Date(task.createdAt).toLocaleDateString()}</small>
          {task.updatedAt !== task.createdAt && (
            <small className="task-date">Updated: {new Date(task.updatedAt).toLocaleDateString()}</small>
          )}
        </div>
      </div>
    </div>
  )
}
