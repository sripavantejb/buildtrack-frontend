import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  Plus, 
  LogOut, 
  Bell, 
  Search, 
  Filter,
  SlidersHorizontal
} from 'lucide-react';
import { api } from '../services/api';

// Circular Progress Component
function CircularProgress({ percentage, colorClass = "text-primary" }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center h-14 w-14">
      <svg className="h-full w-full transform -rotate-90">
        <circle
          cx="28"
          cy="28"
          r={radius}
          className="text-slate-100"
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
      <span className="absolute text-[10px] font-bold text-slate-700">{percentage}%</span>
    </div>
  );
}

// Format Currency to Rupees (e.g. ₹5,00,00,000)
export function formatRupees(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    location: '',
    budget: '',
    area: '',
    duration: '6 Months',
    startDate: '',
    endDate: ''
  });
  
  const navigate = useNavigate();
  const user = api.getCurrentUser() || { name: 'Arjun Reddy', role: 'Administrator' };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await api.getProjects();
        setProjects(data);
      } catch (err) {
        console.error("Error loading projects:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!newProject.name || !newProject.location || !newProject.budget) return;

    try {
      const budgetNum = parseFloat(newProject.budget.replace(/,/g, ''));
      const created = await api.createProject({
        ...newProject,
        budget: budgetNum,
        coverImage: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600"
      });
      setProjects([...projects, created]);
      setShowAddModal(false);
      setNewProject({
        name: '',
        location: '',
        budget: '',
        area: '',
        duration: '6 Months',
        startDate: '',
        endDate: ''
      });
    } catch (err) {
      console.error("Error adding project:", err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'On Track': return 'bg-green-50 text-green-600 border-green-100';
      case 'At Risk': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'Delayed': return 'bg-red-50 text-red-600 border-red-100';
      case 'Planning': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getProgressColor = (status) => {
    switch (status) {
      case 'On Track': return 'text-green-500';
      case 'At Risk': return 'text-orange-500';
      case 'Delayed': return 'text-red-500';
      case 'Planning': return 'text-blue-500';
      default: return 'text-primary';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      
      {/* Dashboard Left Navigation Shell */}
      <aside className="flex w-64 flex-col border-r border-slate-200/80 bg-white">
        <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shadow-premium">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 tracking-tight">BuildTrack</h1>
            <p className="text-[10px] text-slate-400 font-medium leading-none">Construction Management</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          <a href="#" className="flex items-center gap-3 rounded-lg bg-primary-light px-3 py-2 text-xs font-semibold text-primary transition-colors">
            <Building2 className="h-4.5 w-4.5" />
            Projects
          </a>
          {['Platform Owner', 'Super Admin', 'Manager'].includes(user.role) && (
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left"
            >
              <Building2 className="h-4.5 w-4.5 text-slate-400" />
              Admin Console
            </button>
          )}
        </nav>

        {/* Footer info logout */}
        <div className="border-t border-slate-100 p-4">
          <button 
            onClick={() => { api.logout(); navigate('/login'); }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200/80 bg-white px-8">
          <div>
            <h2 className="text-base font-extrabold text-slate-800 tracking-tight">Good Morning, {user.name}! 👋</h2>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              {user.role === 'Super Admin' ? "Here's an overview of all system-wide projects." :
               user.role === 'Manager' ? "Here's an overview of your assigned construction projects." :
               "Here's an overview of all your construction projects."}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors shadow-premium">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-red-500"></span>
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">
                {user.role === 'User' ? 'Client Admin' : user.role}
              </span>
            </div>
          </div>
        </header>

        {/* Dashboard workspace grid */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-extrabold text-slate-800">All Projects</h2>
              <p className="text-[10px] text-slate-400 font-medium">Manage and monitor all your construction projects in one place.</p>
            </div>
            {['Platform Owner', 'Super Admin'].includes(user.role) && (
              <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-white hover:bg-primary-hover shadow-premium transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Project
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Project Cards */}
              {projects.map((proj) => (
                <div 
                  key={proj.id}
                  onClick={() => navigate(`/project/${proj.id}/overview`)}
                  className="group relative flex flex-col overflow-hidden bg-white border border-slate-200/80 rounded-xl shadow-premium hover:shadow-card cursor-pointer transition-all duration-300 hover:-translate-y-0.5"
                >
                  {/* Cover image & status badge */}
                  <div className="relative h-44 overflow-hidden bg-slate-100">
                    <img 
                      src={proj.coverImage} 
                      alt={proj.name} 
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute left-3 top-3">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${getStatusColor(proj.status)}`}>
                        {proj.status}
                      </span>
                    </div>

                    {/* Circular Progress Ring Overlay */}
                    <div className="absolute right-3 bottom-3 rounded-full bg-white/95 p-1 shadow-premium backdrop-blur-sm">
                      <CircularProgress 
                        percentage={proj.progress} 
                        colorClass={getProgressColor(proj.status)}
                      />
                    </div>
                  </div>

                  {/* Core details */}
                  <div className="flex flex-col flex-1 p-5">
                    <h3 className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors leading-snug">{proj.name}</h3>
                    
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{proj.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{proj.startDate} - {proj.endDate}</span>
                      </div>
                    </div>

                    {/* Financial summary */}
                    <div className="mt-5 border-t border-slate-100 pt-4 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Budget</p>
                        <p className="text-xs font-bold text-slate-700 mt-0.5">{formatRupees(proj.budget)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Used</p>
                        <p className="text-xs font-bold text-primary mt-0.5">{formatRupees(proj.usedBudget)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add New Project Card Placeholder */}
              {['Platform Owner', 'Super Admin'].includes(user.role) && (
                <div 
                  onClick={() => setShowAddModal(true)}
                  className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white/50 hover:bg-white hover:border-primary/50 cursor-pointer transition-all duration-300 group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 group-hover:bg-primary-light group-hover:text-primary transition-colors">
                    <Plus className="h-5 w-5" />
                  </div>
                  <h4 className="mt-3 text-xs font-bold text-slate-700 group-hover:text-primary transition-colors">Add New Project</h4>
                  <p className="mt-1 text-[10px] text-slate-400 font-semibold max-w-[160px] text-center">Create a new project and start managing it efficiently.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-100 bg-white p-6 shadow-dropdown">
            <h3 className="text-sm font-bold text-slate-800">Add New Project</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Initialize a new baseline for tracking costs.</p>
            
            <form onSubmit={handleAddProject} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Project Name</label>
                <input 
                  type="text" 
                  required
                  value={newProject.name}
                  onChange={e => setNewProject({...newProject, name: e.target.value})}
                  placeholder="e.g. Green Valley Residency"
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Location</label>
                <input 
                  type="text" 
                  required
                  value={newProject.location}
                  onChange={e => setNewProject({...newProject, location: e.target.value})}
                  placeholder="e.g. Hyderabad, Telangana"
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Total Budget (₹)</label>
                  <input 
                    type="number" 
                    required
                    value={newProject.budget}
                    onChange={e => setNewProject({...newProject, budget: e.target.value})}
                    placeholder="e.g. 50000000"
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Total Area (SFT)</label>
                  <input 
                    type="number" 
                    value={newProject.area}
                    onChange={e => setNewProject({...newProject, area: e.target.value})}
                    placeholder="e.g. 100000"
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Start Date</label>
                  <input 
                    type="date" 
                    value={newProject.startDate}
                    onChange={e => setNewProject({...newProject, startDate: e.target.value})}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">End Date</label>
                  <input 
                    type="date" 
                    value={newProject.endDate}
                    onChange={e => setNewProject({...newProject, endDate: e.target.value})}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-hover shadow-premium transition-colors"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
