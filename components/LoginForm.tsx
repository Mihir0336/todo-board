"use client"

import { useState } from "react"

export default function LoginForm({ onSuccess, onToggle }) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem("token", data.token)
        onSuccess(data.user)
      } else {
        setError(data.message || "Login failed")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Login</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="form-group">
        <label htmlFor="username">Username</label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          disabled={loading}
        />
      </div>

      <button type="submit" disabled={loading} className="auth-button">
        {loading ? "Logging in..." : "Login"}
      </button>

      <p className="auth-toggle">
        Don't have an account?{" "}
        <button type="button" onClick={onToggle} className="link-button">
          Register here
        </button>
      </p>
    </form>
  )
}
