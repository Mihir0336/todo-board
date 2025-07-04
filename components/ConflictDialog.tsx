"use client"

export default function ConflictDialog({ conflict, onResolve, onCancel }) {
  const { userVersion, serverVersion } = conflict

  return (
    <div className="modal-overlay">
      <div className="modal-content conflict-dialog">
        <div className="modal-header">
          <h3>⚠️ Conflict Detected</h3>
        </div>

        <p className="conflict-message">
          This task was modified by another user while you were editing it. Please choose how to resolve the conflict:
        </p>

        <div className="conflict-versions">
          <div className="version-card">
            <h4>Your Version</h4>
            <div className="version-details">
              <p>
                <strong>Title:</strong> {userVersion.title}
              </p>
              <p>
                <strong>Description:</strong> {userVersion.description || "None"}
              </p>
              <p>
                <strong>Status:</strong> {userVersion.status}
              </p>
              <p>
                <strong>Priority:</strong> {userVersion.priority}
              </p>
            </div>
          </div>

          <div className="version-card">
            <h4>Server Version (Other User's Changes)</h4>
            <div className="version-details">
              <p>
                <strong>Title:</strong> {serverVersion.title}
              </p>
              <p>
                <strong>Description:</strong> {serverVersion.description || "None"}
              </p>
              <p>
                <strong>Status:</strong> {serverVersion.status}
              </p>
              <p>
                <strong>Priority:</strong> {serverVersion.priority}
              </p>
            </div>
          </div>
        </div>

        <div className="conflict-actions">
          <button onClick={() => onResolve("overwrite")} className="danger-button">
            Use My Version (Overwrite)
          </button>
          <button onClick={() => onResolve("merge")} className="primary-button">
            Merge Changes
          </button>
          <button onClick={() => onResolve("keep-server")} className="secondary-button">
            Keep Server Version
          </button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
