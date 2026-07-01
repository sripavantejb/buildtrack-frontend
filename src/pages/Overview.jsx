import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { api } from '../services/api';
import { formatRupees } from './Dashboard';

export default function Overview({ project }) {
  const navigate = useNavigate();
  const [budgetData, setBudgetData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [bData, aData] = await Promise.all([
          api.getBudget(project.id),
          api.getAlerts(project.id)
        ]);
        setBudgetData(bData);
        setAlerts(aData);
      } catch (err) {
        console.error("Error loading overview data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [project.id]);

  if (loading || !budgetData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Formatting large numbers to simple Crores (e.g. ₹3.42 Cr)
  const formatCrores = (value) => {
    const cr = value / 10000000;
    return `₹${cr.toFixed(2)} Cr`;
  };

  // Pie chart variables
  const pieColors = ['#f54e00', '#1f8a65', '#c08532', '#807d72'];
  
  // Format categories list for donut chart
  const donutData = budgetData.categories
    .filter(cat => cat.spent > 0)
    .slice(0, 4)
    .map(cat => ({
      name: cat.category,
      value: cat.spent
    }));

  const totalSpent = donutData.reduce((sum, d) => sum + d.value, 0);

  // Custom tooltips for graphs
  const CustomAreaTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-hairline-soft bg-surface-card p-3 text-xs">
          <p className="font-semibold text-ink mb-1">{payload[0].payload.date}</p>
          <p className="text-muted">Planned: <span className="font-semibold text-ink">{formatRupees(payload[0].value)}</span></p>
          <p className="text-primary">Actual: <span className="font-bold">{formatRupees(payload[1].value)}</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* Top Title Section */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="page-title">{project.name} Workspace</h2>
          <p className="page-subtitle">Executive overview and cost tracking analytics.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-hairline bg-timeline-grep/20 px-2.5 py-0.5 text-[10px] font-bold text-success">
            {project.status}
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-hairline bg-surface-card p-4">
          <p className="text-[9px] font-bold text-muted-soft uppercase tracking-wider">Total Budget</p>
          <h3 className="mt-1 text-base font-black text-ink">{formatRupees(project.budget)}</h3>
          <p className="mt-1.5 text-[9px] font-semibold text-muted-soft">All Phases Baseline</p>
        </div>

        <div className="rounded-lg border border-hairline bg-surface-card p-4">
          <p className="text-[9px] font-bold text-muted-soft uppercase tracking-wider">Budget Used</p>
          <h3 className="mt-1 text-base font-black text-ink">{formatRupees(project.usedBudget)}</h3>
          <p className="mt-1.5 text-[9px] font-bold text-success">
            {((project.usedBudget / project.budget) * 100).toFixed(1)}% of total budget
          </p>
        </div>

        <div className="rounded-lg border border-hairline bg-surface-card p-4">
          <p className="text-[9px] font-bold text-muted-soft uppercase tracking-wider">Budget Remaining</p>
          <h3 className="mt-1 text-base font-black text-ink">{formatRupees(project.budget - project.usedBudget)}</h3>
          <p className="mt-1.5 text-[9px] font-bold text-timeline-done">
            {(100 - (project.usedBudget / project.budget) * 100).toFixed(1)}% remaining
          </p>
        </div>

        <div className="rounded-lg border border-hairline bg-surface-card p-4">
          <p className="text-[9px] font-bold text-muted-soft uppercase tracking-wider">Project Progress</p>
          <div className="mt-1 flex items-center justify-between">
            <h3 className="text-base font-black text-ink">{project.progress}%</h3>
            <span className="text-[9px] font-bold text-primary">On Schedule</span>
          </div>
          <div className="mt-2.5 h-1.5 w-full rounded-full bg-canvas-soft overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full" 
              style={{ width: `${project.progress}%` }}
            ></div>
          </div>
        </div>

        <div className="rounded-lg border border-hairline bg-surface-card p-4">
          <p className="text-[9px] font-bold text-muted-soft uppercase tracking-wider">Days Remaining</p>
          <h3 className="mt-1 text-base font-black text-ink">49 Days</h3>
          <p className="mt-1.5 text-[9px] font-semibold text-muted-soft">To Project End (31 Oct)</p>
        </div>
      </div>

      {/* Main Graph Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Budget Progress Area Chart */}
        <div className="lg:col-span-2 rounded-lg border border-hairline bg-surface-card p-5 flex flex-col justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h4 className="text-xs font-semibold text-ink">Budget Progress</h4>
              <p className="text-[9px] text-muted-soft font-semibold mt-0.5">Cumulative Planned vs Actual expenses over time</p>
            </div>
            <div className="flex items-center gap-3 text-[9px] font-bold">
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-3 rounded-full bg-hairline-strong"></span>
                <span className="text-muted">Planned</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-3 rounded-full bg-primary"></span>
                <span className="text-primary">Actual</span>
              </div>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={budgetData.progressHistory} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f54e00" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#f54e00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} tickFormatter={(val) => `${(val / 10000000).toFixed(1)} Cr`} />
                <Tooltip content={<CustomAreaTooltip />} />
                <Area type="monotone" dataKey="planned" stroke="#CBD5E1" strokeWidth={1.5} fill="none" />
                <Area type="monotone" dataKey="actual" stroke="#f54e00" strokeWidth={2} fillOpacity={1} fill="url(#colorActual)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget Distribution Donut Chart */}
        <div className="rounded-lg border border-hairline bg-surface-card p-5 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-semibold text-ink">Budget by Category</h4>
            <p className="text-[9px] text-muted-soft font-semibold mt-0.5">Top spent breakdown categories</p>
          </div>
          <div className="relative flex h-44 items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Text label */}
            <div className="absolute flex flex-col items-center">
              <span className="text-[9px] font-bold text-muted-soft uppercase tracking-wider">Spent</span>
              <span className="text-sm font-normal text-ink mt-0.5">{formatCrores(totalSpent)}</span>
            </div>
          </div>

          {/* Donut Legend */}
          <div className="space-y-1.5 border-t border-hairline-soft pt-3">
            {donutData.map((d, index) => (
              <div key={d.name} className="flex items-center justify-between text-[10px] font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: pieColors[index % pieColors.length] }}></span>
                  <span className="text-muted truncate max-w-[100px]">{d.name}</span>
                </div>
                <div className="text-ink font-bold">
                  {formatRupees(d.value)} <span className="text-[9px] font-normal text-muted-soft">({((d.value / totalSpent) * 100).toFixed(0)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts and Warnings Panel */}
      <div className="rounded-lg border border-hairline bg-surface-card p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h4 className="text-xs font-semibold text-ink">Alerts & Notifications</h4>
            <p className="text-[9px] text-muted-soft font-semibold mt-0.5">Critical anomalies and milestones detected automatically</p>
          </div>
          <button 
            onClick={() => navigate(`/project/${project.id}/forecast`)}
            className="text-[10px] font-bold text-primary hover:text-primary-hover flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {alerts.map((alert) => {
            let iconColor, bgColor, borderColor, icon;
            switch (alert.type) {
              case 'Critical':
                iconColor = 'text-error';
                bgColor = 'bg-canvas-soft/50';
                borderColor = 'border-hairline';
                icon = <AlertTriangle className="h-4 w-4" />;
                break;
              case 'Warning':
                iconColor = 'text-timeline-done';
                bgColor = 'bg-timeline-thinking/20/50';
                borderColor = 'border-hairline';
                icon = <AlertTriangle className="h-4 w-4" />;
                break;
              case 'Success':
                iconColor = 'text-success';
                bgColor = 'bg-timeline-grep/20/50';
                borderColor = 'border-hairline';
                icon = <CheckCircle2 className="h-4 w-4" />;
                break;
              case 'Info':
              default:
                iconColor = 'text-timeline-read';
                bgColor = 'bg-timeline-read/20/50';
                borderColor = 'border-hairline';
                icon = <Info className="h-4 w-4" />;
                break;
            }

            return (
              <div 
                key={alert.id} 
                className={`flex flex-col justify-between rounded-lg border ${borderColor} ${bgColor} p-4 text-xs`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={iconColor}>{icon}</span>
                    <h5 className="font-semibold text-ink truncate">{alert.title}</h5>
                  </div>
                  <p className="mt-1.5 text-[10px] text-muted font-medium leading-relaxed">{alert.desc}</p>
                </div>
                <button 
                  onClick={() => {
                    let path = `/project/${project.id}/forecast`;
                    if (alert.id === 'a-1') path = `/project/${project.id}/materials/m-1`;
                    else if (alert.id === 'a-2') path = `/project/${project.id}/planned-vs-actual`;
                    else if (alert.id === 'a-3') path = `/project/${project.id}/daily-tracking`;
                    else if (alert.id === 'a-4') path = `/project/${project.id}/budget`;
                    navigate(path);
                  }}
                  className="mt-3.5 text-[9px] font-bold text-primary hover:text-primary-hover text-left w-fit"
                >
                  View Details
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
