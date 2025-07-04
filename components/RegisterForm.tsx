"use client"

import { useState } from "react"

const roleOptions = [
  {
    value: "org",
    label: "Organization",
    icon: "\ud83c\udfe2",
    description: "Create a new organization and manage your team."
  },
  {
    value: "employee",
    label: "Employee",
    icon: "\ud83d\udc64",
    description: "Join an existing organization as a team member."
  }
]

export default function RegisterForm({ onSuccess, onToggle }: { onSuccess: any, onToggle: any }) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "employee",
    orgName: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          orgName: formData.role === "org" ? formData.orgName : undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem("token", data.token)
        onSuccess(data.user)
      } else {
        setError(data.message || "Registration failed")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: any) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form" style={{ maxWidth: 700, margin: "0 auto", padding: 32, borderRadius: 18, background: "#18181b", boxShadow: "0 4px 24px #0008", minHeight: 0, maxHeight: 750, overflow: "hidden" }}>
      <h2 style={{ fontSize: 28, marginBottom: 22, textAlign: "center" }}>Register</h2>
      {error && <div className="error-message" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="form-group" style={{ marginBottom: 36 }}>
        <label style={{ marginBottom: 12, display: "block", fontWeight: 500, fontSize: 18 }}>Register as</label>
        <div style={{ display: "flex", gap: 32 }}>
          {roleOptions.map((opt) => (
            <button
              type="button"
              key={opt.value}
              className={
                "role-toggle-btn" +
                (formData.role === opt.value ? " selected" : "")
              }
              style={{
                flex: 1,
                padding: 24,
                borderRadius: 12,
                border: formData.role === opt.value ? "3px solid #6366f1" : "3px solid #23272f",
                background: formData.role === opt.value ? "#23272f" : "#18181b",
                color: formData.role === opt.value ? "#a5b4fc" : "#f3f3f3",
                fontWeight: 600,
                fontSize: 24,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                cursor: "pointer",
                boxShadow: formData.role === opt.value ? "0 0 0 3px #6366f1" : "none",
                transition: "all 0.2s"
              }}
              onClick={() => setFormData({ ...formData, role: opt.value })}
              disabled={loading}
            >
              <span style={{ fontSize: 44, marginBottom: 8 }}>{opt.icon}</span>
              {opt.label}
              <span style={{ fontSize: 18, fontWeight: 400, color: formData.role === opt.value ? "#a5b4fc" : "#aaa", marginTop: 8 }}>{opt.description}</span>
            </button>
          ))}
        </div>
      </div>
      {formData.role === "org" && (
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label htmlFor="orgName" style={{ fontSize: 17 }}>Organization Name</label>
          <input
            type="text"
            id="orgName"
            name="orgName"
            value={formData.orgName}
            onChange={handleChange}
            required
            disabled={loading}
            style={{ fontSize: 17, padding: "14px 18px", borderRadius: 10 }}
          />
        </div>
      )}
      <div style={{ display: "flex", gap: 28, marginBottom: 20 }}>
        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
          <label htmlFor="username" style={{ fontSize: 17 }}>Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            disabled={loading}
            style={{ fontSize: 17, padding: "14px 18px", borderRadius: 10 }}
          />
        </div>
        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
          <label htmlFor="email" style={{ fontSize: 17 }}>Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
            style={{ fontSize: 17, padding: "14px 18px", borderRadius: 10 }}
          />
        </div>
      </div>
      <div style={{ display: "flex", gap: 28, marginBottom: 20 }}>
        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
          <label htmlFor="password" style={{ fontSize: 17 }}>Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
            style={{ fontSize: 17, padding: "14px 18px", borderRadius: 10 }}
          />
        </div>
        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
          <label htmlFor="confirmPassword" style={{ fontSize: 17 }}>Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            disabled={loading}
            style={{ fontSize: 17, padding: "14px 18px", borderRadius: 10 }}
          />
        </div>
      </div>
      <button type="submit" className="primary-button" disabled={loading} style={{ width: "100%", fontSize: 19, padding: "14px 0", borderRadius: 10, marginTop: 10 }}>
        {loading ? "Registering..." : "Register"}
      </button>
      <div style={{ marginTop: 18, textAlign: "center" }}>
        Already have an account?{' '}
        <button type="button" className="link-button" onClick={onToggle} style={{ color: "#6366f1", fontWeight: 600, fontSize: 16 }}>
          Login
        </button>
      </div>
    </form>
  )
}
