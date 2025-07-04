import mongoose from "mongoose"
import crypto from "crypto"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/todo_db"

let cached = (global as any).mongoose

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null }
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}

// Organization Schema
const OrganizationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
  inviteCode: { type: String, unique: true, default: () => crypto.randomBytes(6).toString("hex") },
})

export const Organization = mongoose.models.Organization || mongoose.model("Organization", OrganizationSchema)

// Update User Schema to reference organizations
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  organizations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Organization" }],
  role: { type: String, enum: ["org", "employee", "hr"], required: true },
  pendingOrg: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null },
  // ... other fields ...
})

export const User = mongoose.models.User || mongoose.model("User", UserSchema)

// Update Task Schema to reference organization
const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  status: String,
  priority: String,
  assignedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
})

export const Task = mongoose.models.Task || mongoose.model("Task", TaskSchema)

// Update Activity Schema to reference organization
const ActivitySchema = new mongoose.Schema({
  action: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
  details: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
})

export const Activity = mongoose.models.Activity || mongoose.model("Activity", ActivitySchema)
