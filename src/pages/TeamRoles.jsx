import React, { useState, useEffect } from 'react';
import { Users, Plus, ShieldCheck, Mail, ShieldAlert, Check, X, Trash2, UserPlus, Link2 } from 'lucide-react';
import { api, BASE_URL } from '../services/api';

export default function TeamRoles({ project }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState('assign'); // 'assign' | 'create'
  
  const currentUser = api.getCurrentUser();
  const allowedRoles = currentUser?.role === 'Super Admin' 
    ? ['Manager', 'Site Manager', 'Employee'] 
    : ['Site Manager', 'Employee'];

  const [newMember, setNewMember] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    role: allowedRoles[0] || 'Site Manager',
    projectId: project.id
  });

  const [allProjects, setAllProjects] = useState([]);

  const [selectedExistingUserId, setSelectedExistingUserId] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('buildtrack_token');
      const res = await fetch(`${BASE_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();

    const fetchAllProjects = async () => {
      try {
        const data = await api.getProjects();
        setAllProjects(data);
      } catch (err) {
        console.error("Error loading projects in TeamRoles:", err);
      }
    };
    fetchAllProjects();
  }, [project.id]);

  const handleCreateMember = async (e) => {
    e.preventDefault();
    setError('');
    const token = sessionStorage.getItem('buildtrack_token');

    try {
      const payload = {
        ...newMember,
        assignedProjects: [newMember.projectId || project.id]
      };
      
      const res = await fetch(`${BASE_URL}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to create user");
      }
      
      setShowAddModal(false);
      setNewMember({
        username: '',
        name: '',
        email: '',
        password: '',
        role: allowedRoles[0] || 'Site Manager',
        projectId: project.id
      });
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAssignMember = async (e) => {
    e.preventDefault();
    if (!selectedExistingUserId) return;
    setError('');
    const token = sessionStorage.getItem('buildtrack_token');

    try {
      const userToAssign = users.find(u => u.id === selectedExistingUserId);
      if (!userToAssign) return;

      const currentProjects = userToAssign.assignedProjects || [];
      if (currentProjects.includes(project.id)) {
        setShowAddModal(false);
        return;
      }

      const res = await fetch(`${BASE_URL}/admin/users/${selectedExistingUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          assignedProjects: [...currentProjects, project.id]
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to assign project");
      }

      setShowAddModal(false);
      setSelectedExistingUserId('');
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveMember = async (memberUser) => {
    if (!confirm(`Are you sure you want to remove ${memberUser.name} from this project?`)) return;
    setError('');
    const token = sessionStorage.getItem('buildtrack_token');

    try {
      const updatedProjects = (memberUser.assignedProjects || []).filter(id => id !== project.id);
      
      const res = await fetch(`${BASE_URL}/admin/users/${memberUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          assignedProjects: updatedProjects
        })
      });

      if (!res.ok) throw new Error("Failed to remove user from project");
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  // Filter members of this project
  const activeMembers = users.filter(u => 
    u.id === project.ownerId || 
    u.id === project.managerId || 
    (u.assignedProjects && u.assignedProjects.includes(project.id))
  );

  // Filter users that are in the company but not yet assigned to this project
  const unassignedCompanyUsers = users.filter(u => 
    u.role !== 'Platform Owner' &&
    u.id !== project.ownerId &&
    u.id !== project.managerId &&
    (!u.assignedProjects || !u.assignedProjects.includes(project.id))
  );

  const canManage = ['Platform Owner', 'Super Admin', 'Manager'].includes(currentUser?.role);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-normal text-ink">Team & Roles</h2>
          <p className="text-[10px] text-muted-soft font-medium">Manage project members, access levels, and invite collaborators.</p>
        </div>
        
        {canManage && (
          <button 
            onClick={() => {
              setNewMember({
                username: '',
                name: '',
                email: '',
                password: '',
                role: allowedRoles[0] || 'Site Manager',
                projectId: project.id
              });
              setAddMode(unassignedCompanyUsers.length > 0 ? 'assign' : 'create');
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-white hover:bg-primary-active transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Manage Team</span>
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-canvas-soft border border-hairline p-3.5 text-xs font-semibold text-error">
          {error}
        </div>
      )}

      {/* Members Listing grid */}
      <div className="rounded-lg border border-hairline bg-surface-card p-5">
        <h4 className="text-xs font-semibold text-ink mb-4 font-sans">Active Collaborators</h4>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {activeMembers.map((member) => (
            <div 
              key={member.id} 
              className={`rounded-lg border p-4 flex flex-col justify-between transition-opacity ${
                !member.isActive ? 'opacity-65 border-hairline bg-canvas/50' : 'border-hairline bg-surface-card'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src={member.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
                    alt={member.name} 
                    className="h-10 w-10 rounded-full object-cover border border-hairline-soft"
                  />
                  <div>
                    <h5 className="text-xs font-semibold text-ink leading-snug">{member.name}</h5>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`rounded px-1.5 py-0.2 text-[8px] font-normal uppercase tracking-wide ${
                        member.role === 'Platform Owner' ? 'bg-purple-50 text-purple-650' :
                        member.role === 'Super Admin' ? 'bg-canvas-soft text-primary' :
                        member.role === 'Manager' ? 'bg-timeline-read/20 text-blue-650' :
                        member.role === 'Site Manager' ? 'bg-timeline-thinking/20 text-timeline-done' : 'bg-canvas-soft text-body'
                      }`}>
                        {member.role === 'Super Admin' ? 'Company Admin' : member.role}
                      </span>
                    </div>
                  </div>
                </div>
                <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold ${
                  member.isActive ? 'bg-timeline-grep/20 text-success border border-hairline' : 'bg-canvas-soft text-muted-soft'
                }`}>
                  {member.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mt-5 border-t border-hairline-soft pt-3.5 flex items-center justify-between text-[10px] font-semibold text-muted">
                <div className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-muted-soft" />
                  <span className="truncate max-w-[120px]">{member.email}</span>
                </div>
                
                {/* Remove button (Cannot remove project owner or manager directly from here) */}
                {canManage && member.id !== project.ownerId && member.id !== project.managerId && member.id !== currentUser.id && (
                  <button 
                    onClick={() => handleRemoveMember(member)}
                    className="text-error hover:text-red-655 font-bold text-[9px] flex items-center gap-0.5 p-1 rounded hover:bg-canvas-soft"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite/Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-sm rounded-lg border border-hairline bg-surface-card p-6 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-hairline-soft">
              <h3 className="text-sm font-semibold text-ink">Manage Project Team</h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted-soft hover:text-body font-bold text-sm">✕</button>
            </div>

            {/* Mode selection tabs if there are unassigned company users */}
            {unassignedCompanyUsers.length > 0 && (
              <div className="flex rounded-lg border border-hairline p-0.5 bg-surface-strong my-4 text-xs font-bold text-muted">
                <button 
                  onClick={() => setAddMode('assign')}
                  className={`flex-1 py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5 ${addMode === 'assign' ? 'bg-surface-card text-ink shadow-sm' : 'hover:text-ink'}`}
                >
                  <Link2 className="h-3.5 w-3.5" />
                  <span>Assign Existing User</span>
                </button>
                <button 
                  onClick={() => setAddMode('create')}
                  className={`flex-1 py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5 ${addMode === 'create' ? 'bg-surface-card text-ink shadow-sm' : 'hover:text-ink'}`}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Create & Assign</span>
                </button>
              </div>
            )}

            {addMode === 'assign' && unassignedCompanyUsers.length > 0 ? (
              /* Assign Existing */
              <form onSubmit={handleAssignMember} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-ink mb-1">Select Company Member</label>
                  <select
                    value={selectedExistingUserId}
                    onChange={e => setSelectedExistingUserId(e.target.value)}
                    className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none cursor-pointer"
                    required
                  >
                    <option value="">-- Choose Member --</option>
                    {unassignedCompanyUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>

                <div className="mt-6 flex justify-end gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="rounded-lg border border-hairline bg-surface-card px-4 py-1.5 text-xs font-bold text-body hover:bg-canvas"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-active"
                  >
                    Assign to Project
                  </button>
                </div>
              </form>
            ) : (
              /* Create New */
              <form onSubmit={handleCreateMember} className="space-y-3.5 overflow-y-auto pr-1">
                <div>
                  <label className="block text-[10px] font-semibold text-ink mb-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={newMember.name}
                    onChange={e => setNewMember({...newMember, name: e.target.value})}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-ink mb-1">Username</label>
                    <input 
                      type="text" 
                      required
                      value={newMember.username}
                      onChange={e => setNewMember({...newMember, username: e.target.value})}
                      placeholder="e.g. rajesh"
                      className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-ink mb-1">Role Type</label>
                    <select
                      value={newMember.role}
                      onChange={e => setNewMember({...newMember, role: e.target.value})}
                      className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none cursor-pointer"
                    >
                      {allowedRoles.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-ink mb-1">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={newMember.email}
                    onChange={e => setNewMember({...newMember, email: e.target.value})}
                    placeholder="e.g. rajesh@company.com"
                    className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-ink mb-1">Account Password</label>
                  <input 
                    type="password" 
                    required
                    autoComplete="new-password"
                    value={newMember.password}
                    onChange={e => setNewMember({...newMember, password: e.target.value})}
                    placeholder="Enter password"
                    className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-ink mb-1">Assign to Project</label>
                  <select
                    value={newMember.projectId}
                    onChange={e => setNewMember({...newMember, projectId: e.target.value})}
                    className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none cursor-pointer"
                    required
                  >
                    <option value="">-- Choose Project --</option>
                    {allProjects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-hairline-soft">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="rounded-lg border border-hairline bg-surface-card px-4 py-1.5 text-xs font-bold text-body hover:bg-canvas"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-active"
                  >
                    Create & Assign
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
