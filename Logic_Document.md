# 🧠 CollabBoard Logic Documentation

This document explains the core logic and algorithms used in the CollabBoard application.

## 🎯 Smart Assignment Logic

### Overview
The Smart Assignment feature automatically assigns unassigned tasks to the user with the fewest active (non-completed) tasks, ensuring balanced workload distribution.

### Algorithm

\`\`\`javascript
async function smartAssign() {
  // 1. Find all unassigned tasks
  const unassignedTasks = await Task.find({ assignedUser: null })
  
  if (unassignedTasks.length === 0) {
    return { success: false, message: 'No unassigned tasks available' }
  }

  // 2. Get all users in the system
  const users = await User.find().select('_id username')
  
  // 3. Count active tasks for each user
  const userTaskCounts = await Promise.all(
    users.map(async (user) => {
      const activeTaskCount = await Task.countDocuments({
        assignedUser: user._id,
        status: { $ne: 'done' } // Exclude completed tasks
      })
      return {
        user: user,
        activeTaskCount: activeTaskCount
      }
    })
  )

  // 4. Find user with minimum active tasks
  const userWithFewestTasks = userTaskCounts.reduce((min, current) => 
    current.activeTaskCount < min.activeTaskCount ? current : min
  )

  // 5. Assign the first unassigned task to this user
  const taskToAssign = unassignedTasks[0]
  await Task.findByIdAndUpdate(taskToAssign._id, {
    assignedUser: userWithFewestTasks.user._id,
    updatedAt: new Date()
  })

  return {
    success: true,
    task: taskToAssign,
    assignedUser: userWithFewestTasks.user
  }
}
\`\`\`

### Key Features
- **Load Balancing**: Distributes tasks evenly across team members
- **Active Task Focus**: Only counts non-completed tasks for fair distribution
- **Automatic Selection**: Picks the first available unassigned task
- **Real-Time Updates**: Broadcasts assignment to all connected clients

### Example Scenario
\`\`\`
Users and their active task counts:
- Alice: 2 active tasks
- Bob: 5 active tasks  
- Charlie: 1 active task

Smart Assign will choose Charlie (fewest active tasks)
\`\`\`

## ⚔️ Conflict Handling System

### Overview
The conflict handling system detects when multiple users attempt to edit the same task simultaneously and provides resolution options.

### Conflict Detection Algorithm

\`\`\`javascript
async function updateTask(taskId, updates, userVersion) {
  // 1. Get current task from database
  const currentTask = await Task.findById(taskId)
  
  // 2. Check if task was modified since user started editing
  if (userVersion.lastKnownUpdate && 
      new Date(userVersion.lastKnownUpdate) < currentTask.updatedAt) {
    
    // 3. Conflict detected - return both versions
    return {
      success: false,
      conflict: {
        taskId: taskId,
        userVersion: userVersion,
        serverVersion: currentTask.toObject(),
        conflictTime: new Date()
      }
    }
  }

  // 4. No conflict - proceed with update
  const updatedTask = await Task.findByIdAndUpdate(
    taskId,
    { ...updates, updatedAt: new Date() },
    { new: true }
  )

  return { success: true, task: updatedTask }
}
\`\`\`

### Conflict Resolution Strategies

#### 1. Overwrite Strategy
\`\`\`javascript
function resolveOverwrite(conflict) {
  // User's version completely replaces server version
  return updateTask(conflict.taskId, conflict.userVersion)
}
\`\`\`

#### 2. Merge Strategy
\`\`\`javascript
function resolveMerge(conflict) {
  // Intelligent merging of both versions
  const merged = {
    // Keep server's metadata
    _id: conflict.serverVersion._id,
    createdAt: conflict.serverVersion.createdAt,
    createdBy: conflict.serverVersion.createdBy,
    
    // Merge content fields
    title: conflict.userVersion.title || conflict.serverVersion.title,
    description: conflict.userVersion.description || conflict.serverVersion.description,
    status: conflict.userVersion.status || conflict.serverVersion.status,
    priority: conflict.userVersion.priority || conflict.serverVersion.priority,
    assignedUser: conflict.userVersion.assignedUser || conflict.serverVersion.assignedUser,
    
    // Update timestamp
    updatedAt: new Date()
  }
  
  return updateTask(conflict.taskId, merged)
}
\`\`\`

#### 3. Keep Server Strategy
\`\`\`javascript
function resolveKeepServer(conflict) {
  // Discard user changes, keep server version
  return { success: true, task: conflict.serverVersion }
}
\`\`\`

### Conflict Detection Example

\`\`\`
Timeline:
10:00 AM - User A opens task for editing (lastKnownUpdate: 10:00 AM)
10:01 AM - User B opens same task for editing (lastKnownUpdate: 10:00 AM)
10:02 AM - User B saves changes (task.updatedAt becomes 10:02 AM)
10:03 AM - User A tries to save changes

Conflict Detection:
- User A's lastKnownUpdate: 10:00 AM
- Current task.updatedAt: 10:02 AM
- 10:00 AM < 10:02 AM = CONFLICT DETECTED

Resolution Dialog Shows:
- User A's Version: Their unsaved changes
- Server Version: User B's saved changes
- Options: Merge, Overwrite, Keep Server, Cancel
\`\`\`

## 🔄 Real-Time Synchronization Logic

### Socket.IO Event System

\`\`\`javascript
// Server-side event broadcasting
function broadcastTaskUpdate(event, data) {
  io.emit(event, data) // Broadcast to all connected clients
}

// Client-side event handling
socket.on('taskUpdated', (updatedTask) => {
  setTasks(prevTasks => 
    prevTasks.map(task => 
      task._id === updatedTask._id ? updatedTask : task
    )
  )
})

socket.on('taskCreated', (newTask) => {
  setTasks(prevTasks => [...prevTasks, newTask])
})

socket.on('taskDeleted', (taskId) => {
  setTasks(prevTasks => 
    prevTasks.filter(task => task._id !== taskId)
  )
})
\`\`\`

### Event Types and Data Flow

1. **Task Creation**
   - User creates task → API saves to DB → Broadcast 'taskCreated' → All clients add task

2. **Task Update**
   - User updates task → Check conflicts → Save to DB → Broadcast 'taskUpdated' → All clients update task

3. **Task Deletion**
   - User deletes task → API removes from DB → Broadcast 'taskDeleted' → All clients remove task

4. **Activity Logging**
   - Any action → Create activity record → Broadcast 'activityAdded' → All clients update activity feed

## 📊 Activity Logging System

### Activity Data Structure
\`\`\`javascript
const activitySchema = {
  action: String,      // 'create', 'update', 'delete', 'assign', 'move'
  user: ObjectId,      // Reference to user who performed action
  task: ObjectId,      // Reference to affected task
  details: Mixed,      // Action-specific details
  createdAt: Date      // Timestamp
}
\`\`\`

### Activity Generation Logic
\`\`\`javascript
async function logActivity(action, user, task, details) {
  const activity = new Activity({
    action: action,
    user: user._id,
    task: task._id,
    details: details,
    createdAt: new Date()
  })
  
  await activity.save()
  await activity.populate('user', 'username')
  
  // Broadcast to all clients
  broadcastTaskUpdate('activityAdded', activity)
  
  return activity
}

// Usage examples:
logActivity('create', user, task, { title: task.title })
logActivity('move', user, task, { title: task.title, newStatus: 'done' })
logActivity('assign', user, task, { title: task.title, assignedTo: assignee.username })
\`\`\`

## 🔐 Authentication Flow

### JWT Token Lifecycle
\`\`\`javascript
// 1. User Registration/Login
const token = jwt.sign(
  { userId: user._id },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
)

// 2. Token Storage (Client)
localStorage.setItem('token', token)

// 3. Request Authentication (Client)
fetch('/api/tasks', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})

// 4. Token Verification (Server)
const decoded = jwt.verify(token, process.env.JWT_SECRET)
const user = await User.findById(decoded.userId)
\`\`\`

### Route Protection Logic
\`\`\`javascript
async function authenticateUser(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) return null
    
    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    const user = await User.findById(decoded.userId).select('-password')
    return user
  } catch (error) {
    return null
  }
}
\`\`\`

## 🎨 Drag & Drop Implementation

### Drag Event Handling
\`\`\`javascript
// 1. Drag Start
const handleDragStart = (e, task) => {
  setDraggedTask(task)
  e.dataTransfer.effectAllowed = 'move'
}

// 2. Drag Over (Allow Drop)
const handleDragOver = (e) => {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
}

// 3. Drop Handler
const handleDrop = (e, newStatus) => {
  e.preventDefault()
  if (draggedTask && draggedTask.status !== newStatus) {
    // Update task status
    updateTask(draggedTask._id, { status: newStatus })
  }
  setDraggedTask(null)
}
\`\`\`

### Visual Feedback System
\`\`\`css
/* Dragging state */
.task-card.dragging {
  opacity: 0.5;
  transform: rotate(5deg);
}

/* Drop zone highlighting */
.kanban-column.drag-over {
  background: #f8f9ff;
  border: 2px dashed #667eea;
}
\`\`\`

## 🔍 Data Validation Logic

### Task Validation Rules
\`\`\`javascript
async function validateTask(taskData, existingTaskId = null) {
  const errors = []
  
  // 1. Title uniqueness check
  const existingTask = await Task.findOne({
    title: taskData.title,
    _id: { $ne: existingTaskId } // Exclude current task if updating
  })
  
  if (existingTask) {
    errors.push('Task title must be unique')
  }
  
  // 2. Column name conflict check
  const columnNames = ['todo', 'inprogress', 'done', 'Todo', 'In Progress', 'Done']
  if (columnNames.includes(taskData.title)) {
    errors.push('Task title cannot match column names')
  }
  
  // 3. Required field validation
  if (!taskData.title?.trim()) {
    errors.push('Title is required')
  }
  
  // 4. Status validation
  const validStatuses = ['todo', 'inprogress', 'done']
  if (!validStatuses.includes(taskData.status)) {
    errors.push('Invalid status')
  }
  
  return errors
}
\`\`\`

This logic documentation provides a comprehensive understanding of how CollabBoard handles complex scenarios like conflict resolution, real-time synchronization, and intelligent task assignment.
