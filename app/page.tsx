"use client"

import { useState, useEffect } from "react"
import LoginForm from "@/components/LoginForm"
import RegisterForm from "@/components/RegisterForm"
import KanbanBoard from "@/components/KanbanBoard"
import OrganizationSelector from "@/components/OrganizationSelector"
import "./globals.css"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { useRef } from "react"
import * as RadixDialog from '@radix-ui/react-dialog';

interface Organization {
  _id: string
  name: string
  inviteCode?: string
  owner: string
}

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [showRegister, setShowRegister] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [orgModalOpen, setOrgModalOpen] = useState(false)
  const [orgNameEdit, setOrgNameEdit] = useState("")
  const [orgNameSaving, setOrgNameSaving] = useState(false)
  const [orgMembers, setOrgMembers] = useState<any[]>([])
  const [orgMembersLoading, setOrgMembersLoading] = useState(false)
  const [orgError, setOrgError] = useState("")
  const orgNameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token")
    if (token) {
      // Verify token with backend
      fetch("/api/auth/verify", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setUser(data.user)
            // Fetch orgs after login
            fetchOrgs()
          } else {
            localStorage.removeItem("token")
            setLoading(false)
          }
        })
        .catch(() => {
          localStorage.removeItem("token")
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line
  }, [])

  const fetchOrgs = async () => {
    const token = localStorage.getItem("token")
    if (!token) return
    const res = await fetch("/api/organizations", {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (data.success) {
      setOrganizations(data.organizations)
      if (!selectedOrg && data.organizations.length > 0) {
        setSelectedOrg(data.organizations[0]._id)
      }
    }
    setLoading(false) // <-- ensure loading is set to false after orgs are fetched
  }

  const handleLogin = (userData: any) => {
    setUser(userData)
    fetchOrgs()
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    setUser(null)
    setOrganizations([])
    setSelectedOrg(null)
  }

  const selectedOrgObj = organizations.find((org) => org._id === selectedOrg)

  // Fetch members when modal opens
  useEffect(() => {
    if (orgModalOpen && selectedOrgObj) {
      setOrgMembersLoading(true)
      fetch(`/api/organizations/${selectedOrgObj._id}/members`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setOrgMembers(data.members)
          else setOrgError(data.message || "Failed to load members")
        })
        .catch(() => setOrgError("Failed to load members"))
        .finally(() => setOrgMembersLoading(false))
    }
    if (orgModalOpen && selectedOrgObj) {
      setOrgNameEdit(selectedOrgObj.name)
      setOrgError("")
    }
  }, [orgModalOpen, selectedOrgObj])

  // Save org name
  const handleOrgNameSave = async () => {
    if (!selectedOrgObj) return
    setOrgNameSaving(true)
    setOrgError("")
    try {
      const res = await fetch(`/api/organizations/${selectedOrgObj._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ name: orgNameEdit }),
      })
      const data = await res.json()
      if (data.success) {
        // Update org name in state
        setOrganizations((prev) => prev.map((o) => o._id === selectedOrgObj._id ? { ...o, name: orgNameEdit } : o))
        setOrgModalOpen(false)
      } else {
        setOrgError(data.message || "Failed to update name")
      }
    } catch {
      setOrgError("Failed to update name")
    } finally {
      setOrgNameSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="app-title">📋 CollabBoard</h1>
          <p className="app-subtitle">Collaborative Task Management</p>

          {showRegister ? (
            <RegisterForm onSuccess={handleLogin} onToggle={() => setShowRegister(false)} />
          ) : (
            <LoginForm onSuccess={handleLogin} onToggle={() => setShowRegister(true)} />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ marginLeft: 32 }}>📋 CollabBoard</h1>
        {selectedOrgObj && (
          <div
            className="org-header"
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              color: '#6366f1',
              background: '#18181b',
              borderRadius: 8,
              padding: '8px 18px',
              fontSize: 20,
              fontWeight: 700,
              boxShadow: '0 1px 4px #0001',
              cursor: 'pointer',
            }}
            onClick={() => setOrgModalOpen(true)}
            title="Click to view or edit organization details"
          >
            <span style={{ fontSize: 26, marginRight: 8 }}>🏢</span>
            Organization: <span style={{ color: '#fff', marginLeft: 6 }}>{selectedOrgObj.name}</span>
          </div>
        )}
        <div className="user-info" style={{ marginRight: 32 }}>
          <span>Welcome, {user.username}!</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>
      {/* Remove divider and org header */}
      <div className="org-bar">
        <OrganizationSelector
          onSelect={setSelectedOrg}
          selectedOrg={selectedOrg}
          user={user}
          organizations={organizations}
          setOrganizations={setOrganizations}
        />
      </div>
      {selectedOrg ? (
        <KanbanBoard user={user} organization={selectedOrg} />
      ) : (
        <div style={{ padding: 32, textAlign: "center" }}>No organization selected.</div>
      )}
      <RadixDialog.Root open={orgModalOpen} onOpenChange={setOrgModalOpen}>
        <RadixDialog.Overlay style={{ background: 'rgba(0,0,0,0.7)', position: 'fixed', inset: 0, zIndex: 10000 }} />
        <RadixDialog.Content style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#18181b', color: '#f3f3f3', zIndex: 10001, padding: 0, borderRadius: 16, boxShadow: '0 8px 48px #000a', minWidth: 420, maxWidth: 560, width: '100%' }}>
          <RadixDialog.Title style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
            Organization Details
          </RadixDialog.Title>

          {selectedOrgObj && (
            <>
              {/* Header with icon and close */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 32px 12px 32px', borderTopLeftRadius: 16, borderTopRightRadius: 16, background: '#23272f', borderBottom: '1px solid #333' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 32 }}>🏢</span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                    <span style={{ fontSize: 22, fontWeight: 700 }}>Organization Details</span>
                    <span style={{ fontSize: 15, color: '#a5b4fc' }}>Manage your organization info, invite code, and members.</span>
                  </div>
                </div>
                <button onClick={() => setOrgModalOpen(false)} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 26, cursor: 'pointer', padding: 0, marginLeft: 12 }} title="Close">×</button>
              </div>
              <div style={{ padding: '24px 32px 18px 32px' }}>
                {/* Editable org name if owner */}
                {user && selectedOrgObj && user._id === selectedOrgObj.owner ? (
                  <div style={{ margin: '18px 0 28px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <label style={{ fontWeight: 600, fontSize: 16, minWidth: 140 }}>Organization Name:</label>
                    <input
                      ref={orgNameInputRef}
                      type="text"
                      value={orgNameEdit}
                      onChange={e => setOrgNameEdit(e.target.value)}
                      style={{ fontSize: 18, padding: '8px 14px', borderRadius: 8, width: 200, background: '#23272f', color: '#fff', border: '1.5px solid #6366f1', outline: 'none' }}
                    />
                    <button
                      className="primary-button"
                      style={{ fontSize: 16, padding: '7px 18px', borderRadius: 8, background: '#6366f1', color: '#fff', border: 'none', fontWeight: 600 }}
                      onClick={handleOrgNameSave}
                      disabled={orgNameSaving || !orgNameEdit.trim()}
                    >
                      {orgNameSaving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                ) : (
                  <div style={{ margin: '18px 0 28px 0', fontWeight: 600, fontSize: 18 }}>
                    Organization Name: <span style={{ color: '#6366f1' }}>{selectedOrgObj.name}</span>
                  </div>
                )}
                <div style={{ borderTop: '1px solid #333', margin: '0 -32px 0 -32px' }} />
                {/* Invite code */}
                <div style={{ margin: '24px 0 18px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <label style={{ fontWeight: 600, fontSize: 16, minWidth: 140 }}>Invite Code:</label>
                  <span style={{ fontFamily: 'monospace', background: '#23272f', padding: '4px 14px', borderRadius: 6, color: '#a5b4fc', fontSize: 17 }}>{selectedOrgObj.inviteCode || 'N/A'}</span>
                  <button
                    className="primary-button"
                    style={{ fontSize: 15, padding: '6px 14px', borderRadius: 8, background: '#6366f1', color: '#fff', border: 'none', fontWeight: 600 }}
                    onClick={() => {
                      if (selectedOrgObj.inviteCode) navigator.clipboard.writeText(selectedOrgObj.inviteCode)
                    }}
                    disabled={!selectedOrgObj.inviteCode}
                  >
                    Copy
                  </button>
                </div>
                <div style={{ borderTop: '1px solid #333', margin: '0 -32px 0 -32px' }} />
                {/* Members */}
                <div style={{ margin: '24px 0 0 0' }}>
                  <label style={{ fontWeight: 600, fontSize: 16, marginBottom: 8, display: 'block' }}>Current Employees:</label>
                  <div style={{ background: '#23232b', borderRadius: 18, padding: '24px 18px 18px 18px', boxShadow: '0 4px 32px #0004', marginTop: 10, minHeight: 120, minWidth: 420, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
                    {orgMembersLoading ? (
                      <div style={{ marginTop: 8 }}>Loading...</div>
                    ) : orgMembers.length > 0 ? (
                      <ul style={{ marginTop: 8, paddingLeft: 0, listStyle: 'none' }}>
                        {orgMembers.map((m) => (
                          <li
                            key={m._id}
                            style={{
                              fontSize: 16,
                              marginBottom: 12,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              background: '#23232b',
                              borderRadius: 8,
                              padding: '10px 16px',
                              boxShadow: '0 1px 4px #0002',
                            }}
                          >
                            <span style={{ fontWeight: 700, color: '#fff' }}>{m.username}</span>
                            <span style={{ color: '#aaa', fontSize: 14 }}>({m.email})</span>
                            <span
                              style={{
                                marginLeft: 8,
                                fontWeight: 600,
                                fontSize: 13,
                                borderRadius: 12,
                                padding: '2px 10px',
                                background:
                                  selectedOrgObj.owner === m._id
                                    ? '#6366f1'
                                    : m.role === 'hr'
                                    ? '#facc15'
                                    : '#18181b',
                                color:
                                  selectedOrgObj.owner === m._id
                                    ? '#fff'
                                    : m.role === 'hr'
                                    ? '#23272f'
                                    : '#a5b4fc',
                              }}
                            >
                              {selectedOrgObj.owner === m._id
                                ? 'Owner'
                                : m.role === 'hr'
                                ? 'HR'
                                : 'Employee'}
                            </span>
                            {user && user._id === selectedOrgObj.owner && m._id !== selectedOrgObj.owner && (
                              <div style={{ marginLeft: 'auto', position: 'relative' }}>
                                <details style={{ position: 'relative', display: 'inline-block' }}>
                                  <summary
                                    style={{
                                      background: '#6366f1',
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: 8,
                                      padding: '6px 20px 6px 14px',
                                      fontWeight: 600,
                                      fontSize: 15,
                                      cursor: 'pointer',
                                      outline: 'none',
                                      minWidth: 90,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 8,
                                      boxShadow: '0 1px 4px #0002',
                                      transition: 'background 0.2s',
                                    }}
                                  >
                                    Action
                                    <span style={{ fontSize: 13, marginLeft: 2 }}>▼</span>
                                  </summary>
                                  <div
                                    style={{
                                      position: 'absolute',
                                      right: 0,
                                      top: 38,
                                      zIndex: 10,
                                      background: '#23232b',
                                      border: '1.5px solid #6366f1',
                                      borderRadius: 12,
                                      boxShadow: '0 8px 32px #0008',
                                      minWidth: 170,
                                      padding: '8px 0',
                                      marginTop: 4,
                                    }}
                                  >
                                    <button
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        width: '100%',
                                        textAlign: 'left',
                                        background: 'none',
                                        border: 'none',
                                        color: m.role === 'hr' ? '#facc15' : '#6366f1',
                                        fontWeight: 600,
                                        fontSize: 15,
                                        padding: '10px 22px',
                                        cursor: 'pointer',
                                        borderRadius: 0,
                                        transition: 'background 0.15s',
                                        gap: 8,
                                      }}
                                      onMouseOver={e => (e.currentTarget.style.background = '#18181b')}
                                      onMouseOut={e => (e.currentTarget.style.background = 'none')}
                                      onFocus={e => (e.currentTarget.style.background = '#18181b')}
                                      onBlur={e => (e.currentTarget.style.background = 'none')}
                                      onClick={async () => {
                                        const token = localStorage.getItem('token');
                                        await fetch(`/api/users/${m._id}/role`, {
                                          method: 'PATCH',
                                          headers: {
                                            'Content-Type': 'application/json',
                                            Authorization: `Bearer ${token}`,
                                          },
                                          body: JSON.stringify({ role: m.role === 'hr' ? 'employee' : 'hr' }),
                                        });
                                        // Refresh members
                                        fetch(`/api/organizations/${selectedOrgObj._id}/members`, {
                                          headers: { Authorization: `Bearer ${token}` },
                                        })
                                          .then(res => res.json())
                                          .then(data => {
                                            if (data.success) setOrgMembers(data.members);
                                          });
                                      }}
                                    >
                                      <span style={{ fontSize: 17 }}>{m.role === 'hr' ? '👤' : '⭐'}</span>
                                      {m.role === 'hr' ? 'Remove HR' : 'Make HR'}
                                    </button>
                                    <div style={{ height: 1, background: '#333', margin: '6px 0' }} />
                                    <button
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        width: '100%',
                                        textAlign: 'left',
                                        background: 'none',
                                        border: 'none',
                                        color: '#b91c1c',
                                        fontWeight: 600,
                                        fontSize: 15,
                                        padding: '10px 22px',
                                        cursor: 'pointer',
                                        borderRadius: 0,
                                        transition: 'background 0.15s',
                                        gap: 8,
                                      }}
                                      onMouseOver={e => (e.currentTarget.style.background = '#18181b')}
                                      onMouseOut={e => (e.currentTarget.style.background = 'none')}
                                      onFocus={e => (e.currentTarget.style.background = '#18181b')}
                                      onBlur={e => (e.currentTarget.style.background = 'none')}
                                      onClick={async () => {
                                        if (!window.confirm(`Are you sure you want to fire ${m.username}?`)) return;
                                        const token = localStorage.getItem('token');
                                        await fetch(`/api/organizations/${selectedOrgObj._id}/fire`, {
                                          method: 'POST',
                                          headers: {
                                            'Content-Type': 'application/json',
                                            Authorization: `Bearer ${token}`,
                                          },
                                          body: JSON.stringify({ userId: m._id }),
                                        });
                                        // Refresh members
                                        fetch(`/api/organizations/${selectedOrgObj._id}/members`, {
                                          headers: { Authorization: `Bearer ${token}` },
                                        })
                                          .then(res => res.json())
                                          .then(data => {
                                            if (data.success) setOrgMembers(data.members);
                                          });
                                      }}
                                    >
                                      <span style={{ fontSize: 17 }}>🔥</span>
                                      Fire
                                    </button>
                                  </div>
                                </details>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ marginTop: 8, color: '#aaa' }}>No employees found.</div>
                    )}
                  </div>
                </div>
                {orgError && <div style={{ color: 'red', marginTop: 10 }}>{orgError}</div>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
                  <button className="primary-button" style={{ fontSize: 16, padding: '8px 22px', borderRadius: 8, background: '#6366f1', color: '#fff', border: 'none', fontWeight: 600 }} onClick={() => setOrgModalOpen(false)}>Close</button>
                </div>
              </div>
            </>
          )}
        </RadixDialog.Content>
      </RadixDialog.Root>
    </div>
  )
}
