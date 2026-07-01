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
  LogOut,
  ClipboardList,
  Inbox,
  Search,
  Clock,
  UserCog
} from 'lucide-react';
import { api } from '../services/api';

export default function AdminConsole() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('tree'); // 'tree' or 'list'
  const [activeTab, setActiveTab] = useState('credentials'); // credentials | requests | organization
  const [credentials, setCredentials] = useState([]);
  const [credentialRequests, setCredentialRequests] = useState([]);
  const [credentialSearch, setCredentialSearch] = useState('');
  const [expandedNodes, setExpandedNodes] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      const [usersData, projectsData, credentialsData, requestsData] = await Promise.all([
        api.getAdminUsers(),
        api.getProjects(),
        api.getCredentialsRegistry(),
        api.getCredentialRequests(),
      ]);
      setUsers(usersData);
      setProjects(projectsData);
      setCredentials(credentialsData);
      setCredentialRequests(requestsData);
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

    if (currentUser.role === 'Platform Owner' && newUser.role !== 'Super Admin' && !newUser.companyId) {
      setError("Please select a company organization for this user.");
      return;
    }

    try {
      const { fromRequestId, ...userPayload } = newUser;
      const created = await api.createAdminUser(userPayload);

      if (fromRequestId) {
        await api.updateCredentialRequest(fromRequestId, {
          status: 'approved',
          createdUserId: created.id,
          adminNotes: 'Account created from access request.',
        });
      }

      setShowAddModal(false);
      setNewUser({
        username: '',
        name: '',
        email: '',
        password: '',
        role: allowedRoles[0] || 'Employee',
        assignedProjects: [],
        companyId: '',
        fromRequestId: null,
      });
      fetchUsersAndProjects();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.updateAdminUser(editingUser.id, editingUser);
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsersAndProjects();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await api.updateAdminUser(user.id, { isActive: !user.isActive });
      fetchUsersAndProjects();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!confirm(`Are you sure you want to delete user ${user.name}?`)) return;
    try {
      await api.deleteAdminUser(user.id);
      fetchUsersAndProjects();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRejectRequest = async (request) => {
    try {
      await api.updateCredentialRequest(request.id, {
        status: 'rejected',
        adminNotes: 'Request declined by administrator.',
      });
      fetchUsersAndProjects();
    } catch (err) {
      setError(err.message);
    }
  };

  const openCreateFromRequest = (request) => {
    const username = request.email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase() || `user${Date.now()}`;
    setNewUser({
      username,
      name: request.name,
      email: request.email,
      password: '',
      role: currentUser.role === 'Platform Owner' ? 'Super Admin' : allowedRoles[0] || 'Employee',
      assignedProjects: [],
      companyId: '',
      fromRequestId: request.id,
    });
    setShowAddModal(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  };

  const pendingRequests = credentialRequests.filter((r) => r.status === 'pending');
  const filteredCredentials = credentials.filter((c) => {
    const q = credentialSearch.toLowerCase();
    return !q || [c.name, c.email, c.username, c.role, c.createdBy].some((v) => v?.toLowerCase().includes(q));
  });

  const credentialStats = {
    total: credentials.length,
    active: credentials.filter((c) => c.isActive).length,
    pending: pendingRequests.length,
    superAdmins: credentials.filter((c) => c.role === 'Super Admin').length,
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
      <aside className="hidden w-64 shrink-0 flex-col border-r border-hairline bg-surface-card lg:flex">
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
        <header className="flex shrink-0 flex-col gap-3 border-b border-hairline bg-surface-card px-4 py-4 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-hairline bg-surface-card p-2 text-muted hover:bg-canvas lg:hidden"
              aria-label="Open menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h2 className="text-base font-normal text-ink tracking-tight">Super Admin Panel</h2>
              <p className="text-[10px] text-muted-soft font-medium mt-0.5">
                Create credentials, track real estate users, and review access requests.
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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
                <span className="hidden sm:inline">Create Account</span>
                <span className="sm:hidden">Create</span>
              </button>
            </div>
            
            <div className="hidden h-8 w-px bg-hairline md:block"></div>
            <div className="hidden text-right md:block">
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

              {/* Stats */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="premium-card p-4">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-soft">Total Credentials</p>
                  <p className="mt-1 text-2xl font-semibold text-ink tabular-nums">{credentialStats.total}</p>
                </div>
                <div className="premium-card p-4">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-soft">Active Accounts</p>
                  <p className="mt-1 text-2xl font-semibold text-success tabular-nums">{credentialStats.active}</p>
                </div>
                <div className="premium-card p-4">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-soft">Pending Requests</p>
                  <p className="mt-1 text-2xl font-semibold text-primary tabular-nums">{credentialStats.pending}</p>
                </div>
                <div className="premium-card p-4">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-soft">Real Estate Tenants</p>
                  <p className="mt-1 text-2xl font-semibold text-ink tabular-nums">{credentialStats.superAdmins}</p>
                </div>
              </div>

              {/* Section tabs */}
              <div className="flex overflow-x-auto border-b border-hairline gap-4 sm:gap-6">
                {[
                  { id: 'credentials', label: 'Credential Registry', icon: ClipboardList },
                  { id: 'requests', label: `Access Requests${pendingRequests.length ? ` (${pendingRequests.length})` : ''}`, icon: Inbox },
                  { id: 'organization', label: 'Organization', icon: Users },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={`flex shrink-0 items-center gap-1.5 pb-3 border-b-2 text-xs font-semibold transition-colors ${
                      activeTab === id ? 'border-primary text-primary' : 'border-transparent text-muted-soft hover:text-body'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Credential Registry */}
              {activeTab === 'credentials' && (
                <div className="rounded-lg border border-hairline bg-surface-card p-5">
                  <div className="page-header mb-4">
                    <div>
                      <h4 className="text-xs font-semibold text-ink flex items-center gap-2">
                        <Key className="h-4 w-4 text-primary" />
                        All Created Credentials
                      </h4>
                      <p className="text-[9px] text-muted-soft font-medium mt-0.5">
                        Track every real estate user account created on BuildTrack
                      </p>
                    </div>
                    <div className="relative w-full sm:max-w-xs">
                      <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-soft" />
                      <input
                        type="text"
                        value={credentialSearch}
                        onChange={(e) => setCredentialSearch(e.target.value)}
                        placeholder="Search by name, email, role..."
                        className="w-full rounded-lg border border-hairline pl-9 pr-3 py-1.5 text-xs focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="table-scroll overflow-x-auto border border-hairline-soft rounded-lg">
                    <table className="w-full min-w-[720px] text-left text-xs">
                      <thead>
                        <tr className="border-b border-hairline bg-canvas-soft text-[10px] font-bold uppercase tracking-wider text-muted-soft">
                          <th className="px-4 py-2.5">User</th>
                          <th className="px-3 py-2.5">Role</th>
                          <th className="px-3 py-2.5">Created By</th>
                          <th className="px-3 py-2.5">Created On</th>
                          <th className="px-3 py-2.5 text-center">Status</th>
                          <th className="px-4 py-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hairline-soft">
                        {filteredCredentials.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-10 text-center text-muted-soft">
                              No credentials found.
                            </td>
                          </tr>
                        ) : (
                          filteredCredentials.map((cred) => (
                            <tr key={cred.id} className="hover:bg-canvas/50">
                              <td className="px-4 py-3">
                                <p className="font-semibold text-ink">{cred.name}</p>
                                <p className="text-[10px] text-muted-soft">@{cred.username} · {cred.email}</p>
                              </td>
                              <td className="px-3 py-3">
                                <span className="rounded bg-canvas-soft px-2 py-0.5 text-[10px] font-bold text-body">
                                  {cred.role}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-[10px] text-muted">
                                <p className="font-medium text-body">{cred.createdBy}</p>
                                {cred.createdByEmail && <p className="text-muted-soft">{cred.createdByEmail}</p>}
                              </td>
                              <td className="px-3 py-3 text-[10px] text-muted whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-muted-soft" />
                                  {formatDate(cred.createdAt)}
                                </div>
                              </td>
                              <td className="px-3 py-3 text-center">
                                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                                  cred.isActive ? 'bg-timeline-grep/20 text-success' : 'bg-canvas-soft text-muted'
                                }`}>
                                  {cred.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                {cred.id !== currentUser?.id && cred.role !== 'Platform Owner' && (
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingUser({ ...cred, assignedProjects: cred.assignedProjects || [] });
                                        setShowEditModal(true);
                                      }}
                                      className="rounded p-1 text-primary hover:bg-primary/5"
                                      title="Edit"
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleStatus(cred)}
                                      className="rounded p-1 text-muted hover:bg-canvas"
                                      title={cred.isActive ? 'Deactivate' : 'Activate'}
                                    >
                                      {cred.isActive ? <ToggleRight className="h-4 w-4 text-success" /> : <ToggleLeft className="h-4 w-4" />}
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Access Requests */}
              {activeTab === 'requests' && (
                <div className="rounded-lg border border-hairline bg-surface-card p-5">
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-ink flex items-center gap-2">
                      <Inbox className="h-4 w-4 text-primary" />
                      Credential Access Requests
                    </h4>
                    <p className="text-[9px] text-muted-soft font-medium mt-0.5">
                      Users who contacted admin from the login page to request BuildTrack access
                    </p>
                  </div>

                  {credentialRequests.length === 0 ? (
                    <div className="py-12 text-center text-xs text-muted-soft">
                      No access requests yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {credentialRequests.map((request) => (
                        <div
                          key={request.id}
                          className={`rounded-lg border p-4 ${
                            request.status === 'pending'
                              ? 'border-primary/30 bg-primary/5'
                              : request.status === 'approved'
                                ? 'border-hairline bg-timeline-grep/10'
                                : 'border-hairline bg-canvas-soft/50 opacity-80'
                          }`}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h5 className="text-sm font-semibold text-ink">{request.name}</h5>
                                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                                  request.status === 'pending' ? 'bg-primary/10 text-primary' :
                                  request.status === 'approved' ? 'bg-timeline-grep/20 text-success' :
                                  'bg-canvas-soft text-muted'
                                }`}>
                                  {request.status}
                                </span>
                              </div>
                              <div className="mt-2 space-y-1 text-[10px] text-muted">
                                <p className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {request.email}</p>
                                {request.company && <p className="flex items-center gap-1.5"><Building2 className="h-3 w-3" /> {request.company}</p>}
                                {request.phone && <p>{request.phone}</p>}
                                {request.message && <p className="mt-2 rounded bg-surface-card border border-hairline-soft p-2 text-body leading-relaxed">{request.message}</p>}
                              </div>
                              <p className="mt-2 text-[9px] text-muted-soft">Submitted {formatDate(request.createdAt)}</p>
                            </div>

                            {request.status === 'pending' && (
                              <div className="flex shrink-0 flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => openCreateFromRequest(request)}
                                  className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-[10px] font-bold text-white hover:bg-primary-active"
                                >
                                  <UserCog className="h-3.5 w-3.5" />
                                  Create Credentials
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectRequest(request)}
                                  className="flex items-center gap-1 rounded-lg border border-hairline bg-surface-card px-3 py-1.5 text-[10px] font-bold text-error hover:bg-canvas"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Organization (existing tree/list) */}
              {activeTab === 'organization' && (
              <>
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
              </>
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
              <h3 className="text-sm font-semibold text-ink">
                {newUser.fromRequestId ? 'Create Credentials from Request' : 'Create Team/Company Account'}
              </h3>
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

              <div className="form-grid-2">
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

              <div className="form-grid-2">
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

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-ink/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-hairline bg-surface-card transition-transform duration-300 lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-hairline-soft px-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { navigate('/'); setSidebarOpen(false); }}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-ink tracking-tight">BuildTrack</h1>
              <p className="text-[10px] text-muted-soft font-medium leading-none">Construction Management</p>
            </div>
          </div>
          <button type="button" onClick={() => setSidebarOpen(false)} className="text-muted-soft hover:text-body" aria-label="Close menu">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-[2px] overflow-y-auto px-3 py-4">
          <button
            type="button"
            onClick={() => { navigate('/'); setSidebarOpen(false); }}
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

        <div className="border-t border-hairline-soft p-4">
          <button
            type="button"
            onClick={() => { api.logout(); navigate('/login'); }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-error hover:bg-canvas-soft transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </div>
  );
}
