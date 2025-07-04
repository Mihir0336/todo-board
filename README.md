# 📋 CollabBoard - Collaborative Real-Time To-Do Board

A full-stack collaborative task management application similar to Trello, built with modern web technologies and real-time synchronization.

## 🚀 Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **Next.js 14** - Full-stack React framework with App Router
- **Custom CSS** - No UI libraries, fully custom responsive design
- **Socket.IO Client** - Real-time communication

### Backend
- **Node.js** - JavaScript runtime
- **Next.js API Routes** - RESTful API endpoints
- **MongoDB** - NoSQL database with Mongoose ODM
- **Socket.IO** - Real-time bidirectional communication
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing

## ✨ Features

### 🔐 Authentication System
- User registration and login
- Password hashing with bcrypt (12 rounds)
- JWT-based authentication tokens
- Protected routes on both frontend and backend
- Automatic token verification and refresh

### 🗃️ Task Management
- **CRUD Operations**: Create, read, update, delete tasks
- **Task Fields**: Title, description, status, priority, assigned user
- **Validation**: Unique titles per board, no column name conflicts
- **Status Tracking**: Todo, In Progress, Done
- **Priority Levels**: Low, Medium, High with color coding

### 🔄 Real-Time Synchronization
- **Socket.IO Integration**: Instant updates across all connected clients
- **Live Updates**: Task creation, editing, deletion, and status changes
- **Drag & Drop**: Real-time column changes with smooth animations
- **Multi-User Support**: See changes from other users immediately

### 📜 Activity Logging
- **Comprehensive Logging**: Every action is recorded in MongoDB
- **Activity Types**: Create, update, delete, assign, move operations
- **User Attribution**: Track who performed each action
- **Timestamp Tracking**: When each action occurred
- **Live Activity Feed**: Last 20 actions displayed in real-time

### ⚔️ Conflict Resolution
- **Conflict Detection**: Uses updatedAt timestamps to detect simultaneous edits
- **Smart Resolution**: Presents both user and server versions
- **Resolution Options**:
  - **Merge**: Combine changes intelligently
  - **Overwrite**: Use your version
  - **Keep Server**: Accept other user's changes
  - **Cancel**: Abort the operation

### 🧠 Smart Assignment
- **Intelligent Distribution**: Assigns tasks to users with fewest active tasks
- **Load Balancing**: Automatically distributes workload evenly
- **One-Click Assignment**: Simple button to assign unassigned tasks
- **Activity Logging**: Smart assignments are logged and broadcast

### 🎨 User Interface
- **Kanban Board**: Three-column layout (Todo, In Progress, Done)
- **Drag & Drop**: Smooth task movement between columns
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Custom Animations**: Card flips, smooth transitions, loading states
- **Activity Panel**: Collapsible real-time activity log
- **Modal Forms**: Clean task creation and editing interfaces

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ installed
- MongoDB database (local or cloud)
- Git for version control

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/mihir0336/todo-board.git
   cd todo-board
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Environment Setup**
   Create a \`.env.local\` file in the root directory:
   \`\`\`env
   MONGODB_URI=mongodb://localhost:27017/collaborative-todo
   JWT_SECRET=your-super-secret-jwt-key-here
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
   \`\`\`

4. **Database Setup**
   - Start your MongoDB server
   - The application will automatically create the necessary collections

5. **Run the application**
   \`\`\`bash
   npm run dev
   \`\`\`

6. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser

### Production Deployment

1. **Build the application**
   \`\`\`bash
   npm run build
   \`\`\`

2. **Start production server**
   \`\`\`bash
   npm start
   \`\`\`

## 🎯 Usage Guide

### Getting Started
1. **Register**: Create a new account with username, email, and password
2. **Login**: Sign in with your credentials
3. **Create Tasks**: Click "Add Task" to create your first task
4. **Organize**: Drag tasks between Todo, In Progress, and Done columns
5. **Collaborate**: Invite team members and see real-time updates

### Task Management
- **Create**: Fill out title, description, priority, and assignee
- **Edit**: Click the edit icon on any task card
- **Delete**: Click the trash icon (with confirmation)
- **Move**: Drag tasks between columns or use the status dropdown
- **Assign**: Use the assignee dropdown or Smart Assign feature

### Real-Time Features
- **Live Updates**: See changes from other users instantly
- **Activity Feed**: Monitor all team activities in real-time
- **Conflict Resolution**: Handle simultaneous edits gracefully
- **Smart Assignment**: Automatically balance workload

## 🔧 API Endpoints

### Authentication
- \`POST /api/auth/register\` - User registration
- \`POST /api/auth/login\` - User login
- \`GET /api/auth/verify\` - Token verification

### Tasks
- \`GET /api/tasks\` - Get all tasks
- \`POST /api/tasks\` - Create new task
- \`PUT /api/tasks/[id]\` - Update task
- \`DELETE /api/tasks/[id]\` - Delete task
- \`POST /api/tasks/smart-assign\` - Smart assign task

### Users & Activities
- \`GET /api/users\` - Get all users
- \`GET /api/activities\` - Get recent activities

## 🏗️ Architecture

### Frontend Architecture
- **Component-Based**: Modular React components
- **State Management**: React hooks (useState, useEffect)
- **Real-Time**: Socket.IO client integration
- **Responsive**: Mobile-first CSS design

### Backend Architecture
- **API Routes**: Next.js API routes for RESTful endpoints
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT middleware for protected routes
- **Real-Time**: Socket.IO server integration

### Database Schema
- **Users**: Authentication and profile data
- **Tasks**: Task information with references to users
- **Activities**: Action logging with user and task references

## 🚀 Live Demo

**Live Application**: [https://your-app.vercel.app](https://your-app.vercel.app)

**Demo Video**: [https://youtu.be/your-demo-video](https://youtu.be/your-demo-video)

### Demo Accounts
- **Username**: demo1, **Password**: demo123
- **Username**: demo2, **Password**: demo123

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Socket.IO for real-time communication
- MongoDB for flexible data storage
- Next.js for full-stack capabilities
- React for the component architecture

## 📞 Support

For support, email mihirpatel0336@gmail.com or create an issue in the GitHub repository.

---

**Built with ❤️ by Mihir Patel**
