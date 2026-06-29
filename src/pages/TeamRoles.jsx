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
          <h2 className="text-base font-extrabold text-slate-800">Team & Roles</h2>
          <p className="text-[10px] text-slate-400 font-medium">Manage project members, access levels, and invite collaborators.</p>
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
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-white hover:bg-primary-hover shadow-premium transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Manage Team</span>
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 p-3.5 text-xs font-semibold text-red-600">
          {error}
        </div>
      )}

      {/* Members Listing grid */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-premium">
        <h4 className="text-xs font-bold text-slate-800 mb-4 font-sans">Active Collaborators</h4>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {activeMembers.map((member) => (
            <div 
              key={member.id} 
              className={`rounded-xl border p-4 shadow-premium flex flex-col justify-between transition-opacity ${
                !member.isActive ? 'opacity-65 border-slate-200 bg-slate-50/50' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src={member.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
                    alt={member.name} 
                    className="h-10 w-10 rounded-full object-cover border border-slate-100"
                  />
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 leading-snug">{member.name}</h5>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`rounded px-1.5 py-0.2 text-[8px] font-extrabold uppercase tracking-wide ${
                        member.role === 'Platform Owner' ? 'bg-purple-50 text-purple-650' :
                        member.role === 'Super Admin' ? 'bg-indigo-50 text-indigo-650' :
                        member.role === 'Manager' ? 'bg-blue-50 text-blue-650' :
                        member.role === 'Site Manager' ? 'bg-amber-50 text-amber-650' : 'bg-slate-100 text-slate-655'
                      }`}>
                        {member.role === 'Super Admin' ? 'Company Admin' : member.role}
                      </span>
                    </div>
                  </div>
                </div>
                <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold ${
                  member.isActive ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-slate-100 text-slate-400'
                }`}>
                  {member.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-3.5 flex items-center justify-between text-[10px] font-semibold text-slate-500">
                <div className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span className="truncate max-w-[120px]">{member.email}</span>
                </div>
                
                {/* Remove button (Cannot remove project owner or manager directly from here) */}
                {canManage && member.id !== project.ownerId && member.id !== project.managerId && member.id !== currentUser.id && (
                  <button 
                    onClick={() => handleRemoveMember(member)}
                    className="text-red-500 hover:text-red-655 font-bold text-[9px] flex items-center gap-0.5 p-1 rounded hover:bg-red-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-150 bg-white p-6 shadow-dropdown flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Manage Project Team</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-655 font-bold text-sm">✕</button>
            </div>

            {/* Mode selection tabs if there are unassigned company users */}
            {unassignedCompanyUsers.length > 0 && (
              <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-150 my-4 text-xs font-bold text-slate-500">
                <button 
                  onClick={() => setAddMode('assign')}
                  className={`flex-1 py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5 ${addMode === 'assign' ? 'bg-white text-slate-800 shadow-sm' : 'hover:text-slate-800'}`}
                >
                  <Link2 className="h-3.5 w-3.5" />
                  <span>Assign Existing User</span>
                </button>
                <button 
                  onClick={() => setAddMode('create')}
                  className={`flex-1 py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5 ${addMode === 'create' ? 'bg-white text-slate-800 shadow-sm' : 'hover:text-slate-800'}`}
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
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Select Company Member</label>
                  <select
                    value={selectedExistingUserId}
                    onChange={e => setSelectedExistingUserId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-primary focus:outline-none cursor-pointer"
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
                    className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-hover shadow-premium"
                  >
                    Assign to Project
                  </button>
                </div>
              </form>
            ) : (
              /* Create New */
              <form onSubmit={handleCreateMember} className="space-y-3.5 overflow-y-auto pr-1">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={newMember.name}
                    onChange={e => setNewMember({...newMember, name: e.target.value})}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Username</label>
                    <input 
                      type="text" 
                      required
                      value={newMember.username}
                      onChange={e => setNewMember({...newMember, username: e.target.value})}
                      placeholder="e.g. rajesh"
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Role Type</label>
                    <select
                      value={newMember.role}
                      onChange={e => setNewMember({...newMember, role: e.target.value})}
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-primary focus:outline-none cursor-pointer"
                    >
                      {allowedRoles.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={newMember.email}
                    onChange={e => setNewMember({...newMember, email: e.target.value})}
                    placeholder="e.g. rajesh@company.com"
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Account Password</label>
                  <input 
                    type="password" 
                    required
                    autoComplete="new-password"
                    value={newMember.password}
                    onChange={e => setNewMember({...newMember, password: e.target.value})}
                    placeholder="Enter password"
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Assign to Project</label>
                  <select
                    value={newMember.projectId}
                    onChange={e => setNewMember({...newMember, projectId: e.target.value})}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-primary focus:outline-none cursor-pointer"
                    required
                  >
                    <option value="">-- Choose Project --</option>
                    {allProjects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-hover shadow-premium"
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
