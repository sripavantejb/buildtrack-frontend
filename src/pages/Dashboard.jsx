import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Calendar,
  Plus,
  LogOut,
  Bell,
  Search,
  FolderKanban,
  LayoutDashboard,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  IndianRupee,
  X,
  Upload,
  ImageIcon,
} from 'lucide-react';
import { api } from '../services/api';

function CircularProgress({ percentage, colorClass = 'text-primary' }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex h-14 w-14 items-center justify-center">
      <svg className="h-full w-full -rotate-90 transform">
        <circle
          cx="28"
          cy="28"
          r={radius}
          className="text-hairline-soft"
          strokeWidth="3.5"
          stroke="currentColor"
          fill="transparent"
        />
        <circle
          cx="28"
          cy="28"
          r={radius}
          className={`${colorClass} transition-all duration-500`}
          strokeWidth="3.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
        />
      </svg>
      <span className="absolute text-[10px] font-semibold text-ink">{percentage}%</span>
    </div>
  );
}

export function formatRupees(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

const DEFAULT_COVER_IMAGE = 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600';
const MAX_COVER_IMAGE_SIZE = 2 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const emptyProjectForm = {
  name: '',
  location: '',
  budget: '',
  area: '',
  duration: '6 Months',
  startDate: '',
  endDate: '',
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatToday() {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());
}

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [coverImage, setCoverImage] = useState('');
  const [coverImageName, setCoverImageName] = useState('');
  const [imageError, setImageError] = useState('');
  const [newProject, setNewProject] = useState(emptyProjectForm);

  const navigate = useNavigate();
  const user = api.getCurrentUser() || { name: 'Arjun Reddy', role: 'Administrator', avatar: '' };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await api.getProjects();
        setProjects(data);
      } catch (err) {
        console.error('Error loading projects:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleImageFile = (file) => {
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setImageError('Please upload a JPG, PNG, or WebP image.');
      return;
    }

    if (file.size > MAX_COVER_IMAGE_SIZE) {
      setImageError('Image must be smaller than 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCoverImage(reader.result);
      setCoverImageName(file.name);
      setImageError('');
    };
    reader.onerror = () => setImageError('Could not read the image. Please try again.');
    reader.readAsDataURL(file);
  };

  const handleImageInputChange = (e) => {
    handleImageFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    handleImageFile(e.dataTransfer.files?.[0]);
  };

  const resetProjectForm = () => {
    setNewProject(emptyProjectForm);
    setCoverImage('');
    setCoverImageName('');
    setImageError('');
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    resetProjectForm();
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!newProject.name || !newProject.location || !newProject.budget) return;

    try {
      const budgetNum = parseFloat(newProject.budget.replace(/,/g, ''));
      const created = await api.createProject({
        ...newProject,
        budget: budgetNum,
        coverImage: coverImage || DEFAULT_COVER_IMAGE,
      });
      setProjects([...projects, created]);
      closeAddModal();
    } catch (err) {
      console.error('Error adding project:', err);
    }
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.location?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: projects.length,
    onTrack: projects.filter((p) => p.status === 'On Track').length,
    atRisk: projects.filter((p) => p.status === 'At Risk' || p.status === 'Delayed').length,
    totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
  };

  const canManageProjects = ['Platform Owner', 'Super Admin'].includes(user.role);

  const subtitle =
    user.role === 'Super Admin'
      ? "Monitor all projects across your organization from one command center."
      : user.role === 'Manager'
        ? 'Track progress, budgets, and site activity for your assigned projects.'
        : 'Manage construction portfolios, costs, and delivery timelines in one place.';

  const getStatusColor = (status) => {
    switch (status) {
      case 'On Track':
        return 'bg-timeline-grep/25 text-success';
      case 'At Risk':
        return 'bg-timeline-thinking/25 text-timeline-done';
      case 'Delayed':
        return 'bg-error/10 text-error';
      case 'Planning':
        return 'bg-timeline-read/25 text-body';
      default:
        return 'bg-surface-strong text-body';
    }
  };

  const getProgressColor = (status) => {
    switch (status) {
      case 'On Track':
        return 'text-success';
      case 'At Risk':
        return 'text-timeline-done';
      case 'Delayed':
        return 'text-error';
      case 'Planning':
        return 'text-timeline-read';
      default:
        return 'text-primary';
    }
  };

  const statCards = [
    { label: 'Total Projects', value: stats.total, icon: FolderKanban, tint: 'bg-timeline-read/20 text-body' },
    { label: 'On Track', value: stats.onTrack, icon: TrendingUp, tint: 'bg-timeline-grep/20 text-success' },
    { label: 'Needs Attention', value: stats.atRisk, icon: AlertTriangle, tint: 'bg-timeline-thinking/20 text-timeline-done' },
    { label: 'Portfolio Value', value: formatRupees(stats.totalBudget), icon: IndianRupee, tint: 'bg-primary/10 text-primary', isText: true },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      {/* Sidebar — desktop */}
      <aside className="hidden w-[260px] shrink-0 flex-col border-r border-hairline bg-surface-card lg:flex">
        <div
          className="flex h-[72px] cursor-pointer items-center gap-3 border-b border-hairline-soft px-6"
          onClick={() => navigate('/')}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold tracking-tight text-ink">BuildTrack</h1>
            <p className="text-[11px] font-medium text-muted-soft">Construction Management</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-soft">Main</p>
          <Link
            to="/"
            className="flex items-center gap-3 rounded-lg border border-hairline bg-canvas-soft px-3 py-2.5 text-sm font-medium text-primary"
          >
            <FolderKanban className="h-4 w-4" />
            Projects
          </Link>
          {['Platform Owner', 'Super Admin', 'Manager'].includes(user.role) && (
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted transition-colors hover:bg-canvas hover:text-ink"
            >
              <LayoutDashboard className="h-4 w-4 text-muted-soft" />
              Admin Console
            </button>
          )}
        </nav>

        <div className="border-t border-hairline-soft p-4">
          <div className="mb-3 flex items-center gap-3 rounded-lg border border-hairline-soft bg-canvas p-3">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="h-9 w-9 rounded-full border border-hairline object-cover" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {user.name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
              <p className="truncate text-xs text-muted-soft">{user.role}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              api.logout();
              navigate('/login');
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-canvas hover:text-error"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-[72px] shrink-0 items-center justify-between gap-3 border-b border-hairline bg-surface-card px-4 sm:px-6 lg:px-8">
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
          <div className="relative hidden max-w-md flex-1 sm:block">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-soft" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects by name or location..."
              className="text-input h-10 pl-10 text-sm"
            />
          </div>
          <div className="flex items-center gap-3 sm:ml-auto">
            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-hairline bg-canvas text-muted transition-colors hover:bg-canvas-soft"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border-2 border-surface-card bg-primary" />
            </button>
            <span className="badge-pill hidden sm:inline-flex">{user.role}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            {/* Mobile search */}
            <div className="relative mb-6 sm:hidden">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-soft" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects..."
                className="text-input h-10 pl-10 text-sm"
              />
            </div>
            {/* Hero */}
            <div className="mb-8 flex flex-col gap-4 border-b border-hairline-soft pb-8 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="section-label mb-2">{formatToday()}</p>
                <h2 className="text-xl font-normal tracking-tight text-ink sm:text-display-md">
                  {getGreeting()}, {user.name?.split(' ')[0]}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{subtitle}</p>
              </div>
              {canManageProjects && (
                <button type="button" onClick={() => setShowAddModal(true)} className="btn-primary shrink-0 gap-2">
                  <Plus className="h-4 w-4" />
                  Add Project
                </button>
              )}
            </div>

            {/* Stats */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {statCards.map(({ label, value, icon: Icon, tint, isText }) => (
                <div key={label} className="premium-card flex items-center gap-4 p-5">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${tint}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-soft">{label}</p>
                    <p className={`mt-0.5 font-semibold text-ink ${isText ? 'text-base' : 'text-2xl tabular-nums'}`}>
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Projects section */}
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="page-title">All Projects</h3>
                <p className="page-subtitle">
                  {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} in your portfolio
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex h-64 items-center justify-center rounded-lg border border-hairline bg-surface-card">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : filteredProjects.length === 0 && !search ? (
              <div className="rounded-xl border border-hairline bg-surface-card px-6 py-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <FolderKanban className="h-8 w-8 text-primary" />
                </div>
                <h4 className="mt-6 text-display-sm font-normal text-ink">No projects yet</h4>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
                  Create your first construction project to start tracking budgets, materials, site progress, and team
                  activity.
                </p>
                {canManageProjects && (
                  <button type="button" onClick={() => setShowAddModal(true)} className="btn-primary mt-8 gap-2">
                    <Plus className="h-4 w-4" />
                    Create First Project
                  </button>
                )}
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="rounded-xl border border-hairline bg-surface-card px-6 py-12 text-center">
                <p className="text-sm text-muted">No projects match &ldquo;{search}&rdquo;</p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProjects.map((proj) => (
                  <article
                    key={proj.id}
                    onClick={() => navigate(`/project/${proj.id}/overview`)}
                    className="group cursor-pointer overflow-hidden rounded-xl border border-hairline bg-surface-card transition-colors hover:border-hairline-strong"
                  >
                    <div className="relative h-44 overflow-hidden bg-canvas-soft">
                      <img
                        src={proj.coverImage || DEFAULT_COVER_IMAGE}
                        alt={proj.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
                      <div className="absolute left-4 top-4">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusColor(proj.status)}`}>
                          {proj.status}
                        </span>
                      </div>
                      <div className="absolute bottom-4 right-4 rounded-full bg-surface-card/95 p-1 backdrop-blur-sm">
                        <CircularProgress percentage={proj.progress} colorClass={getProgressColor(proj.status)} />
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-base font-semibold leading-snug text-ink transition-colors group-hover:text-primary">
                          {proj.name}
                        </h3>
                        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-soft transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      </div>

                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{proj.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">
                            {proj.startDate} – {proj.endDate}
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-hairline-soft pt-4">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-soft">Budget</p>
                          <p className="mt-1 text-sm font-semibold text-ink">{formatRupees(proj.budget)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-soft">Used</p>
                          <p className="mt-1 text-sm font-semibold text-primary">{formatRupees(proj.usedBudget)}</p>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}

                {canManageProjects && (
                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="flex min-h-[340px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-hairline bg-canvas-soft/50 p-6 text-center transition-colors hover:border-primary/40 hover:bg-surface-card"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Plus className="h-6 w-6" />
                    </div>
                    <h4 className="mt-4 text-sm font-semibold text-ink">Add New Project</h4>
                    <p className="mt-1 max-w-[200px] text-xs leading-relaxed text-muted">
                      Set up a new site and begin tracking costs and progress.
                    </p>
                  </button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px]">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-hairline bg-surface-card shadow-none">
            <div className="flex items-start justify-between border-b border-hairline-soft px-6 py-5">
              <div>
                <h3 className="text-base font-semibold text-ink">Add New Project</h3>
                <p className="mt-1 text-sm text-muted">Initialize a new construction project baseline.</p>
              </div>
              <button
                type="button"
                onClick={closeAddModal}
                className="rounded-lg p-1.5 text-muted-soft transition-colors hover:bg-canvas hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddProject} className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink">Cover Image</label>
                {coverImage ? (
                  <div className="relative overflow-hidden rounded-lg border border-hairline">
                    <img src={coverImage} alt="Project cover preview" className="h-40 w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-ink/60 px-3 py-2">
                      <span className="truncate text-xs text-canvas">{coverImageName}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCoverImage('');
                          setCoverImageName('');
                          setImageError('');
                        }}
                        className="text-xs font-medium text-canvas hover:text-primary"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleImageDrop}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-hairline bg-canvas-soft px-4 py-8 transition-colors hover:border-primary/40 hover:bg-canvas"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Upload className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-ink">Upload project cover</p>
                    <p className="mt-1 text-xs text-muted">Drag & drop or click to browse · JPG, PNG, WebP · Max 2 MB</p>
                    <input
                      type="file"
                      accept={ACCEPTED_IMAGE_TYPES.join(',')}
                      onChange={handleImageInputChange}
                      className="sr-only"
                    />
                  </label>
                )}
                {!coverImage && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-soft">
                    <ImageIcon className="h-3.5 w-3.5" />
                    A default image will be used if none is uploaded.
                  </p>
                )}
                {imageError && <p className="mt-2 text-xs text-error">{imageError}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink">Project Name</label>
                <input
                  type="text"
                  required
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="e.g. Green Valley Residency"
                  className="text-input text-sm"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink">Location</label>
                <input
                  type="text"
                  required
                  value={newProject.location}
                  onChange={(e) => setNewProject({ ...newProject, location: e.target.value })}
                  placeholder="e.g. Hyderabad, Telangana"
                  className="text-input text-sm"
                />
              </div>

              <div className="form-grid-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-ink">Total Budget (₹)</label>
                  <input
                    type="number"
                    required
                    value={newProject.budget}
                    onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
                    placeholder="50000000"
                    className="text-input text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-ink">Total Area (sq ft)</label>
                  <input
                    type="number"
                    value={newProject.area}
                    onChange={(e) => setNewProject({ ...newProject, area: e.target.value })}
                    placeholder="100000"
                    className="text-input text-sm"
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-ink">Start Date</label>
                  <input
                    type="date"
                    value={newProject.startDate}
                    onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                    className="text-input text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-ink">End Date</label>
                  <input
                    type="date"
                    value={newProject.endDate}
                    onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                    className="text-input text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-hairline-soft pt-5 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeAddModal} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-hairline bg-surface-card transition-transform duration-300 lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-[72px] items-center justify-between border-b border-hairline-soft px-6">
          <div className="flex items-center gap-3" onClick={() => { navigate('/'); setSidebarOpen(false); }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold tracking-tight text-ink">BuildTrack</h1>
              <p className="text-[11px] font-medium text-muted-soft">Construction Management</p>
            </div>
          </div>
          <button type="button" onClick={() => setSidebarOpen(false)} className="text-muted-soft hover:text-body" aria-label="Close menu">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-soft">Main</p>
          <Link
            to="/"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 rounded-lg border border-hairline bg-canvas-soft px-3 py-2.5 text-sm font-medium text-primary"
          >
            <FolderKanban className="h-4 w-4" />
            Projects
          </Link>
          {['Platform Owner', 'Super Admin', 'Manager'].includes(user.role) && (
            <button
              type="button"
              onClick={() => { navigate('/admin'); setSidebarOpen(false); }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted transition-colors hover:bg-canvas hover:text-ink"
            >
              <LayoutDashboard className="h-4 w-4 text-muted-soft" />
              Admin Console
            </button>
          )}
        </nav>

        <div className="border-t border-hairline-soft p-4">
          <div className="mb-3 flex items-center gap-3 rounded-lg border border-hairline-soft bg-canvas p-3">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="h-9 w-9 rounded-full border border-hairline object-cover" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {user.name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
              <p className="truncate text-xs text-muted-soft">{user.role}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              api.logout();
              navigate('/login');
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-canvas hover:text-error"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </div>
  );
}
