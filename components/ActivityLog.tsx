"use client"

export default function ActivityLog({ activities, onClose }) {
  const formatActivity = (activity) => {
    const time = new Date(activity.createdAt).toLocaleString()
    const user = activity.user?.username || "Unknown"

    switch (activity.action) {
      case "create":
        return `${user} created task "${activity.details.title}"`
      case "update":
        return `${user} updated task "${activity.details.title}"`
      case "delete":
        return `${user} deleted task "${activity.details.title}"`
      case "assign":
        return `${user} assigned task "${activity.details.title}" to ${activity.details.assignedTo}`
      case "move":
        return `${user} moved task "${activity.details.title}" to ${activity.details.newStatus}`
      default:
        return `${user} performed ${activity.action} on "${activity.details.title}"`
    }
  }

  const getActivityIcon = (action) => {
    switch (action) {
      case "create":
        return "➕"
      case "update":
        return "✏️"
      case "delete":
        return "🗑️"
      case "assign":
        return "👤"
      case "move":
        return "🔄"
      default:
        return "📝"
    }
  }

  return (
    <div className="activity-log">
      <div className="activity-header">
        <h3>📜 Recent Activity</h3>
        <button onClick={onClose} className="close-btn">
          ✕
        </button>
      </div>

      <div className="activity-list">
        {activities.length === 0 ? (
          <p className="no-activities">No recent activities</p>
        ) : (
          activities.map((activity, index) => (
            <div key={activity._id || index} className="activity-item">
              <div className="activity-icon">{getActivityIcon(activity.action)}</div>
              <div className="activity-content">
                <p className="activity-description">{formatActivity(activity)}</p>
                <small className="activity-time">{new Date(activity.createdAt).toLocaleString()}</small>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
