"use client"

interface TaskCardProps {
  task: any;
  onEdit: (task: any) => void;
  onDelete: (task: any) => void;
  onDragStart: (e: React.DragEvent, task: any) => void;
  currentUser: any;
}

const PRIORITY_COLORS: { [key: string]: string } = {
  low: "#95a5a6",
  medium: "#f39c12",
  high: "#e74c3c",
}

const PRIORITY_LABELS: { [key: string]: string } = {
  low: "🟢 Low",
  medium: "🟡 Medium",
  high: "🔴 High",
}

export default function TaskCard({ task, onEdit, onDelete, onDragStart, currentUser }: TaskCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
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

        {/* Removed created/updated dates from the card footer */}
      </div>
    </div>
  )
}
