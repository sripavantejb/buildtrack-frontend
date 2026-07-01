import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  ShieldCheck, 
  Mail, 
  ShieldAlert, 
  Check, 
  X, 
  Edit2, 
  UserPlus, 
  ToggleLeft, 
  ToggleRight, 
  Trash2, 
  Key, 
  ChevronDown, 
  ChevronRight, 
  Building2, 
  Briefcase, 
  UserCheck,
  LogOut
} from 'lucide-react';
import { api, BASE_URL } from '../services/api';

export default function AdminConsole() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('tree'); // 'tree' or 'list'
  const [expandedNodes, setExpandedNodes] = useState({});

  const currentUser = api.getCurrentUser();

  const getAllowedRoles = () => {
    if (!currentUser) return [];
    if (currentUser.role === 'Platform Owner') return ['Super Admin', 'Manager', 'Site Manager', 'Employee'];
    if (currentUser.role === 'Super Admin') return ['Manager', 'Site Manager', 'Employee'];
    if (currentUser.role === 'Manager') return ['Site Manager', 'Employee'];
    return [];
  };

  const allowedRoles = getAllowedRoles();

  const [newUser, setNewUser] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    role: allowedRoles[0] || 'Employee',
    assignedProjects: [],
    companyId: ''
  });

  const [editingUser, setEditingUser] = useState(null);

  const fetchUsersAndProjects = async () => {
    try {
      setLoading(true);
      
      // Fetch users
      const token = sessionStorage.getItem('buildtrack_token');
      const usersRes = await fetch(`${BASE_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!usersRes.ok) throw new Error("Failed to load users");
      const usersData = await usersRes.json();
      setUsers(usersData);

      // Fetch projects
      const projectsRes = await fetch(`${BASE_URL}/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!projectsRes.ok) throw new Error("Failed to load projects");
      const projectsData = await projectsRes.json();
      setProjects(projectsData);
      
      setError('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error loading Admin settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndProjects();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    const token = sessionStorage.getItem('buildtrack_token');

    // If Platform Owner is creating a non-Super Admin, companyId is required
    if (currentUser.role === 'Platform Owner' && newUser.role !== 'Super Admin' && !newUser.companyId) {
      setError("Please select a company organization for this user.");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to create user");
      }
      
      setShowAddModal(false);
      setNewUser({
        username: '',
        name: '',
        email: '',
        password: '',
        role: allowedRoles[0] || 'Employee',
        assignedProjects: [],
        companyId: ''
      });
      fetchUsersAndProjects();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setError('');
    const token = sessionStorage.getItem('buildtrack_token');

    try {
      const res = await fetch(`${BASE_URL}/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingUser)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to update user");
      }

      setShowEditModal(false);
      setEditingUser(null);
      fetchUsersAndProjects();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleStatus = async (user) => {
    const token = sessionStorage.getItem('buildtrack_token');
    try {
      const res = await fetch(`${BASE_URL}/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !user.isActive })
      });
      if (!res.ok) throw new Error("Failed to toggle status");
      fetchUsersAndProjects();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!confirm(`Are you sure you want to delete user ${user.name}?`)) return;
    const token = sessionStorage.getItem('buildtrack_token');
    try {
      const res = await fetch(`${BASE_URL}/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to delete user");
      fetchUsersAndProjects();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleProjectCheckboxChange = (projectId, isChecked, isEdit = false) => {
    if (isEdit) {
      const current = editingUser.assignedProjects || [];
      const updated = isChecked 
        ? [...current, projectId]
        : current.filter(id => id !== projectId);
      setEditingUser({ ...editingUser, assignedProjects: updated });
    } else {
      const current = newUser.assignedProjects || [];
      const updated = isChecked
        ? [...current, projectId]
        : current.filter(id => id !== projectId);
      setNewUser({ ...newUser, assignedProjects: updated });
    }
  };

  const toggleExpand = (id) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Helper to build hierarchy structure
  const buildHierarchy = () => {
    if (!currentUser || users.length === 0) return [];

    let roots = [];

    if (currentUser.role === 'Platform Owner') {
      roots = users.filter(u => u.role === 'Platform Owner');
      if (roots.length === 0) {
        roots = [users.find(u => u.id === currentUser.id) || currentUser];
      }
    } else if (currentUser.role === 'Super Admin') {
      const myCompanyId = currentUser.companyId || currentUser.id;
      roots = users.filter(u => u.id === currentUser.id || (u.role === 'Super Admin' && u.companyId === myCompanyId));
      if (roots.length === 0) {
        roots = [users.find(u => u.id === currentUser.id) || currentUser];
      }
    } else if (currentUser.role === 'Manager') {
      roots = users.filter(u => u.id === currentUser.id);
      if (roots.length === 0) {
        roots = [currentUser];
      }
    }

    const getChildren = (parentNode) => {
      if (parentNode.role === 'Platform Owner') {
        // Platform Owner's children are Super Admins
        return users.filter(u => u.role === 'Super Admin');
      }
      if (parentNode.role === 'Super Admin') {
        // Super Admin's children are Managers, or Site Managers/Employees with parentId === Super Admin or no parent
        const companyId = parentNode.companyId || parentNode.id;
        return users.filter(u => 
          u.companyId === companyId && 
          u.id !== parentNode.id && 
          (u.parentId === parentNode.id || !u.parentId || (u.parentId !== parentNode.id && !users.some(p => p.id === u.parentId)))
        );
      }
      if (parentNode.role === 'Manager') {
        // Manager's children are Site Managers & Employees who report to them
        return users.filter(u => u.parentId === parentNode.id);
      }
      return [];
    };

    const mapTree = (node) => {
      // Find actual user object in users state if it exists
      const fullNode = users.find(u => u.id === node.id) || node;
      const children = getChildren(fullNode);
      return {
        ...fullNode,
        children: children.map(mapTree)
      };
    };

    return roots.map(mapTree);
  };

  const hierarchyTree = buildHierarchy();

  const renderTreeNodes = (nodes, level = 0) => {
    return (
      <div className={`space-y-4 ${level > 0 ? 'pl-6 border-l border-dashed border-hairline mt-2 ml-4' : ''}`}>
        {nodes.map(node => {
          const hasChildren = node.children && node.children.length > 0;
          const isExpanded = expandedNodes[node.id] !== false; // default expanded

          return (
            <div key={node.id} className="relative">
              {/* Connector horizontal line */}
              {level > 0 && (
                <div className="absolute -left-6 top-5 w-6 border-t border-dashed border-hairline"></div>
              )}
              
              <div 
                className={`flex items-start gap-3.5 bg-surface-card p-4 rounded-lg border max-w-2xl transition-all duration-200 ${
                  !node.isActive 
                    ? 'border-hairline opacity-65 bg-canvas/50' 
                    : node.id === currentUser.id 
                      ? 'border-hairline ring-2 ring-primary/10 bg-canvas-soft/10' 
                      : 'border-hairline/90 hover:border-hairline-strong hover:shadow-dropdown'
                }`}
              >
                {/* Avatar */}
                <div className="relative">
                  <img 
                    src={node.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
                    alt={node.name} 
                    className="h-10 w-10 rounded-full object-cover border border-hairline-soft flex-shrink-0"
                  />
                  <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${
                    node.isActive ? 'bg-success' : 'bg-muted-soft'
                  }`} />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h5 className="text-xs font-semibold text-ink truncate leading-snug">{node.name}</h5>
                      {node.id === currentUser.id && (
                        <span className="rounded bg-canvas-soft text-primary px-1 py-0.2 text-[8px] font-normal tracking-wide uppercase">You</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                      <span className={`rounded px-1.5 py-0.5 text-[8px] font-normal uppercase tracking-wide ${
                        node.role === 'Platform Owner' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                        node.role === 'Super Admin' ? 'bg-canvas-soft text-primary border border-hairline' :
                        node.role === 'Manager' ? 'bg-timeline-read/20 text-timeline-read border border-hairline' :
                        node.role === 'Site Manager' ? 'bg-timeline-thinking/20 text-amber-600 border border-amber-100' : 'bg-canvas-soft text-body'
                      }`}>
                        {node.role}
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-muted-soft font-semibold mt-0.5">@{node.username} • {node.email}</p>
                  
                  {node.assignedProjects && node.assignedProjects.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {node.assignedProjects.map(projId => {
                        const matchedProj = projects.find(p => p.id === projId);
                        return (
                          <span key={projId} className="rounded bg-canvas border border-hairline px-1.5 py-0.5 text-[8px] font-bold text-muted">
                            {matchedProj ? matchedProj.name : projId}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Node Actions */}
                  {node.id !== currentUser.id && node.role !== 'Platform Owner' && (
                    <div className="mt-3 pt-2.5 border-t border-hairline-soft flex items-center justify-end gap-3.5">
                      <button 
                        onClick={() => handleToggleStatus(node)}
                        className={`text-[9px] font-normal transition-colors ${
                          node.isActive ? 'text-muted hover:text-ink' : 'text-emerald-500 hover:text-emerald-650'
                        }`}
                      >
                        {node.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button 
                        onClick={() => {
                          setEditingUser({
                            ...node,
                            assignedProjects: node.assignedProjects || []
                          });
                          setShowEditModal(true);
                        }}
                        className="text-[9px] font-normal text-primary hover:text-primary-hover"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(node)}
                        className="text-[9px] font-normal text-error hover:text-red-655"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {hasChildren && (
                  <button 
                    onClick={() => toggleExpand(node.id)}
                    className="p-1 rounded-lg hover:bg-canvas-soft text-muted self-start transition-colors"
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                )}
              </div>
              
              {hasChildren && isExpanded && renderTreeNodes(node.children, level + 1)}
            </div>
          );
        })}
      </div>
    );
  };  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      {/* Left Sidebar (Desktop) */}
      <aside className="flex w-64 flex-col border-r border-hairline bg-surface-card flex-shrink-0">
        {/* Logo Branding */}
        <div className="flex h-16 items-center gap-2 border-b border-hairline-soft px-6 cursor-pointer" onClick={() => navigate('/')}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-ink tracking-tight">BuildTrack</h1>
            <p className="text-[10px] text-muted-soft font-medium leading-none">Construction Management</p>
          </div>
        </div>

        {/* Main Navigation Links */}
        <nav className="flex-1 space-y-[2px] overflow-y-auto px-3 py-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-muted hover:bg-canvas hover:text-ink transition-colors text-left"
          >
            <Building2 className="h-4.5 w-4.5 text-muted-soft" />
            Projects
          </button>
          {['Platform Owner', 'Super Admin', 'Manager'].includes(currentUser?.role) && (
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg bg-primary-light px-3 py-2 text-xs font-semibold text-primary transition-colors text-left"
            >
              <Users className="h-4.5 w-4.5 text-primary" />
              Admin Console
            </button>
          )}
        </nav>

        {/* User profile footer widget */}
        <div className="relative border-t border-hairline-soft p-4">
          <button 
            onClick={() => { api.logout(); navigate('/login'); }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-error hover:bg-canvas-soft transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b border-hairline bg-surface-card px-8 flex-shrink-0">
          <div>
            <h2 className="text-base font-normal text-ink tracking-tight">Admin Console</h2>
            <p className="text-[10px] text-muted-soft font-medium mt-0.5">
              Manage credentials, team roles, and project mapping in a hierarchical view.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {/* Toggle view mode */}
              <div className="flex rounded-lg border border-hairline p-0.5 bg-canvas-soft">
                <button 
                  type="button"
                  onClick={() => setViewMode('tree')}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-colors ${
                    viewMode === 'tree' 
                      ? 'bg-surface-card text-ink shadow-sm' 
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  Tree Hierarchy
                </button>
                <button 
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-surface-card text-ink shadow-sm' 
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  Grid List
                </button>
              </div>

              <button 
                onClick={() => {
                  setNewUser({
                    username: '',
                    name: '',
                    email: '',
                    password: '',
                    role: allowedRoles[0] || 'Employee',
                    assignedProjects: [],
                    companyId: ''
                  });
                  setShowAddModal(true);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-white hover:bg-primary-active transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                <span>Create Account</span>
              </button>
            </div>
            
            <div className="h-8 w-px bg-hairline"></div>
            <div className="text-right">
              <p className="text-xs font-semibold text-ink">{currentUser?.name}</p>
              <p className="text-[10px] text-muted-soft font-medium">{currentUser?.role}</p>
            </div>
          </div>
        </header>

        {/* View Content Port */}
        <main className="flex-1 overflow-y-auto bg-canvas p-4 sm:p-6 lg:p-8">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {error && (
                <div className="rounded-lg bg-canvas-soft border border-hairline p-3.5 text-xs font-semibold text-error">
                  {error}
                </div>
              )}

              {/* Main Hierarchy UI */}
              {viewMode === 'tree' ? (
                <div className="rounded-lg border border-hairline bg-surface-card p-6">
                  <h4 className="text-xs font-semibold text-ink mb-6 flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span>Organization Visual Tree</span>
                  </h4>
                  
                  {hierarchyTree.length > 0 ? (
                    <div className="overflow-x-auto py-2">
                      {renderTreeNodes(hierarchyTree)}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-muted-soft">
                      No organization members loaded.
                    </div>
                  )}
                </div>
              ) : (
                /* Grid List View */
                <div className="rounded-lg border border-hairline bg-surface-card p-5">
                  <h4 className="text-xs font-semibold text-ink mb-4">Manage System Accounts</h4>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {users.map((u) => (
                      <div 
                        key={u.id} 
                        className={`rounded-lg border bg-surface-card p-4 flex flex-col justify-between transition-all duration-200 ${
                          !u.isActive 
                            ? 'opacity-65 border-hairline bg-canvas/50' 
                            : u.id === currentUser.id 
                              ? 'border-hairline ring-2 ring-primary/10' 
                              : 'border-hairline/90'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <img 
                                src={u.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
                                alt={u.name} 
                                className="h-10 w-10 rounded-full object-cover border border-hairline-soft"
                              />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <h5 className="text-xs font-semibold text-ink leading-snug">{u.name}</h5>
                                  {u.id === currentUser.id && (
                                    <span className="rounded bg-canvas-soft text-primary px-1 py-0.2 text-[8px] font-normal uppercase">You</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className={`rounded-sm px-1.5 py-0.2 text-[8px] font-normal uppercase tracking-wide ${
                                    u.role === 'Platform Owner' ? 'bg-purple-50 text-purple-650' :
                                    u.role === 'Super Admin' ? 'bg-canvas-soft text-primary' :
                                    u.role === 'Manager' ? 'bg-timeline-read/20 text-blue-650' :
                                    u.role === 'Site Manager' ? 'bg-timeline-thinking/20 text-timeline-done' : 'bg-canvas-soft text-body'
                                  }`}>
                                    {u.role}
                                  </span>
                                  <span className="text-[9px] font-bold text-muted-soft">@{u.username}</span>
                                </div>
                              </div>
                            </div>
                            
                            {u.id !== currentUser.id && u.role !== 'Platform Owner' && (
                              <button 
                                onClick={() => handleToggleStatus(u)}
                                title={u.isActive ? "Deactivate Account" : "Activate Account"}
                                className="text-muted-soft hover:text-body transition-colors"
                              >
                                {u.isActive ? (
                                  <ToggleRight className="h-6 w-6 text-emerald-500" />
                                ) : (
                                  <ToggleLeft className="h-6 w-6 text-muted-soft" />
                                )}
                              </button>
                            )}
                          </div>

                          <div className="mt-4 space-y-1.5 border-t border-hairline-soft pt-3 text-[10px] font-semibold text-muted">
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-muted-soft" />
                              <span className="truncate">{u.email}</span>
                            </div>
                            {u.role !== 'Super Admin' && u.role !== 'Platform Owner' && (
                              <div className="pt-1.5">
                                <p className="text-[9px] text-muted-soft uppercase font-normal tracking-wider mb-1">
                                  Assigned Projects ({u.assignedProjects?.length || 0})
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {u.assignedProjects && u.assignedProjects.length > 0 ? (
                                    u.assignedProjects.map(projId => {
                                      const matchedProj = projects.find(p => p.id === projId);
                                      return (
                                        <span key={projId} className="rounded bg-canvas-soft px-1.5 py-0.5 text-[8px] font-bold text-body">
                                          {matchedProj ? matchedProj.name : projId}
                                        </span>
                                      );
                                    })
                                  ) : (
                                    <span className="text-muted-soft font-medium text-[9px] italic">No projects assigned</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {u.id !== currentUser.id && u.role !== 'Platform Owner' && (
                          <div className="mt-5 flex items-center justify-between border-t border-hairline-soft pt-3">
                            <button 
                              onClick={() => {
                                setEditingUser({
                                  ...u,
                                  assignedProjects: u.assignedProjects || []
                                });
                                setShowEditModal(true);
                              }}
                              className="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary-hover transition-colors"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              <span>Edit details</span>
                            </button>

                            <button 
                              onClick={() => handleDeleteUser(u)}
                              className="text-error hover:text-error font-bold p-1 rounded-lg hover:bg-canvas-soft transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-hairline bg-surface-card p-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-hairline-soft">
              <h3 className="text-sm font-semibold text-ink">Create Team/Company Account</h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted-soft hover:text-body font-bold text-sm">✕</button>
            </div>
            
            <form onSubmit={handleCreateUser} className="mt-4 space-y-3.5 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="block text-[10px] font-semibold text-ink mb-1">Company / User Full Name</label>
                <input 
                  type="text" 
                  required
                  value={newUser.name}
                  onChange={e => setNewUser({...newUser, name: e.target.value})}
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
                    value={newUser.username}
                    onChange={e => setNewUser({...newUser, username: e.target.value})}
                    placeholder="e.g. rajesh"
                    className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-ink mb-1">Role Type</label>
                  <select
                    value={newUser.role}
                    onChange={e => setNewUser({...newUser, role: e.target.value, assignedProjects: []})}
                    className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none cursor-pointer"
                  >
                    {allowedRoles.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Platform Owner Tenant Assigning Dropdown */}
              {newUser.role !== 'Super Admin' && currentUser.role === 'Platform Owner' && (
                <div>
                  <label className="block text-[10px] font-semibold text-ink mb-1">Company Organization</label>
                  <select
                    value={newUser.companyId}
                    onChange={e => setNewUser({...newUser, companyId: e.target.value})}
                    className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none cursor-pointer"
                    required
                  >
                    <option value="">-- Choose Company --</option>
                    {users.filter(u => u.role === 'Super Admin').map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-semibold text-ink mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                  placeholder="e.g. rajesh@prestige.com"
                  className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-ink mb-1">Account Password</label>
                <input 
                  type="password" 
                  required
                  autoComplete="new-password"
                  value={newUser.password}
                  onChange={e => setNewUser({...newUser, password: e.target.value})}
                  placeholder="Set password"
                  className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
                />
              </div>

              {newUser.role !== 'Super Admin' && (
                <div className="border-t border-hairline-soft pt-3">
                  <label className="block text-[10px] font-semibold text-ink mb-1">
                    Assign Project Access
                  </label>
                  <select
                    value={newUser.assignedProjects[0] || ''}
                    onChange={e => setNewUser({ ...newUser, assignedProjects: e.target.value ? [e.target.value] : [] })}
                    className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none cursor-pointer"
                    required
                  >
                    <option value="">-- Choose Project --</option>
                    {projects.map(proj => (
                      <option key={proj.id} value={proj.id}>{proj.name}</option>
                    ))}
                  </select>
                </div>
              )}

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
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-hairline bg-surface-card p-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-hairline-soft">
              <h3 className="text-sm font-semibold text-ink">Edit Account Details</h3>
              <button onClick={() => setShowEditModal(false)} className="text-muted-soft hover:text-body font-bold text-sm">✕</button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="mt-4 space-y-3.5 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="block text-[10px] font-semibold text-ink mb-1">Company / User Full Name</label>
                <input 
                  type="text" 
                  required
                  value={editingUser.name}
                  onChange={e => setEditingUser({...editingUser, name: e.target.value})}
                  className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-ink mb-1">Username (Read Only)</label>
                  <input 
                    type="text" 
                    disabled
                    value={editingUser.username}
                    className="w-full rounded-lg border border-hairline bg-canvas px-3 py-1.5 text-xs text-muted-soft focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-ink mb-1">Role Type</label>
                  <select
                    value={editingUser.role}
                    onChange={e => setEditingUser({...editingUser, role: e.target.value})}
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
                  value={editingUser.email}
                  onChange={e => setEditingUser({...editingUser, email: e.target.value})}
                  className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-ink mb-1">Change Password (Leave blank to keep current)</label>
                <input 
                  type="password" 
                  autoComplete="new-password"
                  value={editingUser.password || ''}
                  onChange={e => setEditingUser({...editingUser, password: e.target.value})}
                  placeholder="Enter new password"
                  className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
                />
              </div>

              {editingUser.role !== 'Super Admin' && (
                <div className="border-t border-hairline-soft pt-3">
                  <label className="block text-[10px] font-semibold text-ink mb-1">
                    Assign Project Access
                  </label>
                  <select
                    value={editingUser.assignedProjects[0] || ''}
                    onChange={e => setEditingUser({ ...editingUser, assignedProjects: e.target.value ? [e.target.value] : [] })}
                    className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none cursor-pointer"
                    required
                  >
                    <option value="">-- Choose Project --</option>
                    {projects.map(proj => (
                      <option key={proj.id} value={proj.id}>{proj.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-hairline-soft">
                <button 
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-lg border border-hairline bg-surface-card px-4 py-1.5 text-xs font-bold text-body hover:bg-canvas"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-active"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
