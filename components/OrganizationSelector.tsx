"use client"

import { useEffect, useState } from "react"
import { Dispatch, SetStateAction } from "react"

interface Organization {
  _id: string
  name: string
  inviteCode?: string
  owner: string
}

interface User {
  _id: string
  username: string
  role: string
  organizations?: string[]
}

interface OrganizationSelectorProps {
  onSelect: (orgId: string) => void
  selectedOrg: string | null
  user: User
  organizations: Organization[]
  setOrganizations: React.Dispatch<React.SetStateAction<Organization[]>>
}

export default function OrganizationSelector({ onSelect, selectedOrg, user, organizations, setOrganizations }: OrganizationSelectorProps) {
  const [loading, setLoading] = useState<boolean>(true)
  const [showCreate, setShowCreate] = useState<boolean>(false)
  const [newOrgName, setNewOrgName] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [inviteCode, setInviteCode] = useState<string>("")
  const [joining, setJoining] = useState<boolean>(false)

  useEffect(() => {
    fetchOrgs()
  }, [])

  async function fetchOrgs() {
    setLoading(true)
    setError("")
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/organizations", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setOrganizations(data.organizations)
        if (!selectedOrg && data.organizations.length > 0) {
          onSelect(data.organizations[0]._id)
        }
      } else {
        setError(data.message || "Failed to load organizations")
      }
    } catch (e) {
      setError("Failed to load organizations")
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateOrg(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newOrgName }),
      })
      const data = await res.json()
      if (data.success) {
        setOrganizations((prev) => [...prev, data.organization])
        onSelect(data.organization._id)
        setShowCreate(false)
        setNewOrgName("")
      } else {
        setError(data.message || "Failed to create organization")
      }
    } catch (e) {
      setError("Failed to create organization")
    }
  }

  async function handleJoinOrg(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setJoining(true)
    setError("")
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/organizations/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inviteCode }),
      })
      const data = await res.json()
      if (data.success) {
        setInviteCode("")
        fetchOrgs()
      } else {
        setError(data.message || "Failed to join organization")
      }
    } catch (e) {
      setError("Failed to join organization")
    } finally {
      setJoining(false)
    }
  }

  // Only show join org form for employees who are not in any orgs
  if (!loading && user && user.role === "employee" && organizations.length === 0) {
    return (
      <div>
        <div className="join-org-form" style={{ margin: "32px auto", maxWidth: 400, padding: 24, background: "#23272f", borderRadius: 12 }}>
          <h3 style={{ marginBottom: 16 }}>Join an Organization</h3>
          <form onSubmit={handleJoinOrg}>
            <input
              type="text"
              placeholder="Enter Invite Code"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              required
              style={{ fontSize: 17, padding: "12px 16px", borderRadius: 8, width: "100%", marginBottom: 12 }}
            />
            <button type="submit" className="primary-button" disabled={joining} style={{ width: "100%", fontSize: 17, padding: "10px 0", borderRadius: 8 }}>
              {joining ? "Joining..." : "Join Organization"}
            </button>
          </form>
          {error && <div className="error-message" style={{ marginTop: 10 }}>{error}</div>}
        </div>
      </div>
    )
  }
  // If employee and in org(s), do not show any org selector or join form
  if (!loading && user && user.role === "employee" && organizations.length > 0) {
    return null
  }

  if (loading) {
    return (
      <div className="org-selector">
        <label htmlFor="org-select">Organization:</label>
        <span>Loading...</span>
      </div>
    )
  }

  return null
} 