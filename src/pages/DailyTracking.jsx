import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Coins, 
  Hammer, 
  Clock, 
  Truck, 
  AlertOctagon,
  TrendingDown,
  TrendingUp,
  Package,
  Layers,
  Sparkles,
  Check
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { api } from '../services/api';
import { formatRupees } from './Dashboard';

export default function DailyTracking({ project }) {
  const [logs, setLogs] = useState([]);
  const user = api.getCurrentUser();
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [newEntry, setNewEntry] = useState({
    todayCost: '',
    materialsUsed: '',
    workProgress: '',
    labourPresent: '',
    workingHours: '8.5',
    cementBlockA: '',
    cementBlockB: '',
    cementBlockC: '',
    cementSiteOffice: '',
    steelUsed: '',
    sandUsed: '',
    bricksUsed: '',
    issueText: ''
  });

  const fetchLogsAndAlerts = async () => {
    try {
      setLoading(true);
      const [logsData, alertsData] = await Promise.all([
        api.getDailyTracking(project.id),
        api.getAlerts(project.id)
      ]);
      setLogs(logsData);
      setAlerts(alertsData);
      if (alertsData && alertsData.length > 0) {
        setShowAlertsModal(true);
      }
    } catch (err) {
      console.error("Error loading daily tracking logs or alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismissAlert = (alertId) => {
    const remainingAlerts = alerts.filter(a => a.id !== alertId);
    setAlerts(remainingAlerts);
    if (remainingAlerts.length === 0) {
      setShowAlertsModal(false);
    }
  };

  useEffect(() => {
    fetchLogsAndAlerts();
  }, [project.id]);

  const handleCreateEntry = async (e) => {
    e.preventDefault();
    try {
      const entryCost = Number(newEntry.todayCost);
      const cementBags = Number(newEntry.cementBlockA || 0) + Number(newEntry.cementBlockB || 0) + Number(newEntry.cementBlockC || 0) + Number(newEntry.cementSiteOffice || 0);
      const materialsQty = cementBags + Number(newEntry.steelUsed || 0) + Number(newEntry.sandUsed || 0) + Number(newEntry.bricksUsed || 0);

      const usageToday = [];
      if (cementBags > 0) usageToday.push({ material: "Cement", used: cementBags, unit: "Bags", cost: cementBags * 450 });
      if (newEntry.steelUsed) usageToday.push({ material: "Steel", used: Number(newEntry.steelUsed), unit: "Tons", cost: Number(newEntry.steelUsed) * 65000 });
      if (newEntry.sandUsed) usageToday.push({ material: "Sand", used: Number(newEntry.sandUsed), unit: "Loads", cost: Number(newEntry.sandUsed) * 8000 });
      if (newEntry.bricksUsed) usageToday.push({ material: "Bricks", used: Number(newEntry.bricksUsed), unit: "Nos", cost: Number(newEntry.bricksUsed) * 15 });

      await api.createDailyEntry(project.id, {
        todayCost: entryCost,
        materialsUsed: materialsQty,
        workProgress: Number(newEntry.workProgress),
        labourPresent: Number(newEntry.labourPresent),
        workingHours: Number(newEntry.workingHours),
        materialUsageToday: usageToday,
        areaWiseUsage: [
          { area: "Block A", quantity: Number(newEntry.cementBlockA || 0), material: "Cement Used" },
          { area: "Block B", quantity: Number(newEntry.cementBlockB || 0), material: "Cement Used" },
          { area: "Block C (Roof)", quantity: Number(newEntry.cementBlockC || 0), material: "Cement Used" },
          { area: "Site Office", quantity: Number(newEntry.cementSiteOffice || 0), material: "Cement Used" }
        ],
        expensesBreakdown: [
          { name: "Materials", value: Math.round(entryCost * 0.5), percentage: 50 },
          { name: "Labour", value: Math.round(entryCost * 0.3), percentage: 30 },
          { name: "Equipment", value: Math.round(entryCost * 0.15), percentage: 15 },
          { name: "Other Expenses", value: Math.round(entryCost * 0.05), percentage: 5 }
        ],
        attendance: { present: Number(newEntry.labourPresent), absent: 2 },
        equipment: { active: 5, idle: 2 },
        issues: newEntry.issueText ? [{
          id: `i-${Date.now()}`,
          title: newEntry.issueText,
          severity: "Medium",
          status: "Open"
        }] : []
      });

      setShowAddModal(false);
      setNewEntry({
        todayCost: '',
        materialsUsed: '',
        workProgress: '',
        labourPresent: '',
        workingHours: '8.5',
        cementBlockA: '',
        cementBlockB: '',
        cementBlockC: '',
        cementSiteOffice: '',
        steelUsed: '',
        sandUsed: '',
        bricksUsed: '',
        issueText: ''
      });
      fetchLogsAndAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Active or latest daily entry
  const latestLog = logs[0] || {
    todayCost: 78000,
    materialsUsed: 156,
    workProgress: 2.3,
    labourPresent: 42,
    workingHours: 8.5,
    materialUsageToday: [
      { material: "Cement", used: 120, unit: "Bags", cost: 48000 },
      { material: "Steel", used: 4.2, unit: "Tons", cost: 22000 },
      { material: "Sand", used: 12, unit: "Loads", cost: 6000 },
      { material: "Bricks", used: 2500, unit: "Nos", cost: 2000 }
    ],
    areaWiseUsage: [
      { area: "Block A", quantity: 50, material: "Cement Used" },
      { area: "Block B", quantity: 40, material: "Cement Used" },
      { area: "Block C (Roof)", quantity: 30, material: "Cement Used" },
      { area: "Site Office", quantity: 10, material: "Cement Used" }
    ],
    expensesBreakdown: [
      { name: "Materials", value: 35000, percentage: 44.9 },
      { name: "Labour", value: 20000, percentage: 25.6 },
      { name: "Equipment", value: 15000, percentage: 19.2 },
      { name: "Other Expenses", value: 8000, percentage: 10.3 }
    ],
    attendance: { present: 42, absent: 2 },
    equipment: { active: 5, idle: 2 },
    issues: [
      { id: "i-1", title: "Concrete mixer breakdown", severity: "Medium", status: "Resolved" },
      { id: "i-2", title: "Late delivery of sand load", severity: "Low", status: "Open" }
    ]
  };

  const donutColors = ['#4F6BFF', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-800">Daily Tracking</h2>
          <p className="text-[10px] text-slate-400 font-medium">Record site operations and daily material consumption logs.</p>
        </div>
        {user?.role !== 'Employee' && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-white hover:bg-primary-hover shadow-premium transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Daily Entry</span>
          </button>
        )}
      </div>

      {/* Top operational metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-premium">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Today's Cost</p>
          <h3 className="mt-1 text-base font-black text-slate-800">{formatRupees(latestLog.todayCost)}</h3>
          <p className="mt-1 flex items-center gap-1 text-[9px] font-bold text-green-600">
            <TrendingDown className="h-3.5 w-3.5" />
            <span>-12% vs yesterday</span>
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-premium">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Materials Used</p>
          <h3 className="mt-1 text-base font-black text-slate-800">{latestLog.materialsUsed} Units</h3>
          <p className="mt-1 flex items-center gap-1 text-[9px] font-bold text-green-600">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>+8% vs yesterday</span>
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-premium">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Work Progress</p>
          <h3 className="mt-1 text-base font-black text-slate-800">{latestLog.workProgress}%</h3>
          <p className="mt-1 flex items-center gap-1 text-[9px] font-bold text-green-600">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>+0.6% vs yesterday</span>
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-premium">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Labour Present</p>
          <h3 className="mt-1 text-base font-black text-slate-800">{latestLog.labourPresent} Workers</h3>
          <p className="mt-1 text-[9px] font-bold text-orange-500">
            {latestLog.attendance?.absent || 0} absent today
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-premium">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Working Hours</p>
          <h3 className="mt-1 text-base font-black text-slate-800">{latestLog.workingHours} hrs</h3>
          <p className="mt-1 text-[9px] font-semibold text-slate-400">Goal: 9.0 hrs</p>
        </div>
      </div>

      {/* Middle Operations Matrix Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Material Usage Today */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-premium flex flex-col justify-between">
          <h4 className="text-xs font-bold text-slate-800 mb-4">Material Usage Today</h4>
          
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11px] font-medium text-slate-600">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold">
                  <th className="pb-2">Material</th>
                  <th className="pb-2 text-right">Used</th>
                  <th className="pb-2 text-center">Unit</th>
                  <th className="pb-2 text-right">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {latestLog.materialUsageToday?.map((usage) => (
                  <tr key={usage.material} className="hover:bg-slate-50/50">
                    <td className="py-2.5 font-bold text-slate-800">{usage.material}</td>
                    <td className="py-2.5 text-right font-semibold">{usage.used}</td>
                    <td className="py-2.5 text-center text-slate-400 font-semibold">{usage.unit}</td>
                    <td className="py-2.5 text-right font-bold text-slate-800">{formatRupees(usage.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Area-Wise Usage */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-premium flex flex-col justify-between">
          <h4 className="text-xs font-bold text-slate-800 mb-4">Area-Wise Usage</h4>
          
          <div className="flex-1 space-y-4">
            {latestLog.areaWiseUsage?.map((area) => (
              <div key={area.area} className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-slate-700">{area.area}</span>
                  <span className="text-slate-500">{area.quantity} Bags <span className="font-semibold text-slate-400">Cement</span></span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${Math.min(100, (area.quantity / 60) * 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Expense Breakdown (Donut) */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-premium flex flex-col justify-between">
          <h4 className="text-xs font-bold text-slate-800">Daily Expenses Breakdown</h4>
          
          <div className="relative flex h-36 items-center justify-center my-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={latestLog.expensesBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={60}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {latestLog.expensesBreakdown?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={donutColors[index % donutColors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute flex flex-col items-center">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
              <span className="text-xs font-black text-slate-800 mt-0.5">{formatRupees(latestLog.todayCost)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 border-t border-slate-100 pt-3 text-[10px] font-semibold">
            {latestLog.expensesBreakdown?.map((d, index) => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: donutColors[index % donutColors.length] }}></span>
                  <span className="text-slate-400 text-[9px] truncate max-w-[60px]">{d.name}</span>
                </div>
                <span className="text-slate-700 font-bold">{d.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Compact Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Today's Expenses */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-premium flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
              <Coins className="h-4.5 w-4.5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-slate-700">Today's Expenses</h5>
              <p className="text-[9px] text-slate-400 mt-0.5">Total spend generated today</p>
            </div>
          </div>
          <span className="text-xs font-black text-slate-800">{formatRupees(latestLog.todayCost)}</span>
        </div>

        {/* Labour Present */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-premium flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-500">
              <Hammer className="h-4.5 w-4.5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-slate-700">Labour & Attendance</h5>
              <p className="text-[9px] text-slate-400 mt-0.5">Workers checking in today</p>
            </div>
          </div>
          <span className="text-xs font-black text-slate-800">{latestLog.labourPresent} Present</span>
        </div>

        {/* Equipment Usage */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-premium flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500">
              <Truck className="h-4.5 w-4.5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-slate-700">Equipment Usage</h5>
              <p className="text-[9px] text-slate-400 mt-0.5">Machinery active onsite</p>
            </div>
          </div>
          <span className="text-xs font-black text-slate-800">{latestLog.equipment?.active || 5} Active</span>
        </div>

        {/* Issues & Delays */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-premium flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-500">
              <AlertOctagon className="h-4.5 w-4.5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-slate-700">Issues & Delays</h5>
              <p className="text-[9px] text-slate-400 mt-0.5">Unresolved alerts on site</p>
            </div>
          </div>
          <span className={`text-xs font-black ${latestLog.issues?.length > 0 ? 'text-red-500' : 'text-slate-850'}`}>
            {latestLog.issues?.length || 0} Issues
          </span>
        </div>
      </div>

      {/* Add Daily Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-100 bg-white p-6 shadow-dropdown">
            <h3 className="text-sm font-bold text-slate-800">Add Daily Site Entry</h3>
            
            <form onSubmit={handleCreateEntry} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Today's Cost (₹)</label>
                  <input 
                    type="number" 
                    required
                    value={newEntry.todayCost}
                    onChange={e => setNewEntry({...newEntry, todayCost: e.target.value})}
                    placeholder="e.g. 78000"
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Labour Count</label>
                  <input 
                    type="number" 
                    required
                    value={newEntry.labourPresent}
                    onChange={e => setNewEntry({...newEntry, labourPresent: e.target.value})}
                    placeholder="e.g. 42"
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Work progress (%)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    required
                    value={newEntry.workProgress}
                    onChange={e => setNewEntry({...newEntry, workProgress: e.target.value})}
                    placeholder="e.g. 2.3"
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Hours Worked</label>
                  <input 
                    type="number" 
                    step="0.5"
                    required
                    value={newEntry.workingHours}
                    onChange={e => setNewEntry({...newEntry, workingHours: e.target.value})}
                    placeholder="e.g. 8.5"
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <h4 className="text-[10px] font-bold text-slate-450 uppercase mb-2">Material Usage Quantity</h4>
                
                {/* Area-Wise Cement Inputs Grid */}
                <div className="mb-4 bg-slate-50/50 rounded-lg p-3 border border-slate-200">
                  <h5 className="text-[9px] font-bold text-slate-500 uppercase mb-2">Cement Distribution (Bags)</h5>
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[8px] font-semibold text-slate-650 mb-1">Block A</label>
                      <input 
                        type="number" 
                        value={newEntry.cementBlockA}
                        onChange={e => setNewEntry({...newEntry, cementBlockA: e.target.value})}
                        placeholder="e.g. 50"
                        className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-semibold text-slate-650 mb-1">Block B</label>
                      <input 
                        type="number" 
                        value={newEntry.cementBlockB}
                        onChange={e => setNewEntry({...newEntry, cementBlockB: e.target.value})}
                        placeholder="e.g. 40"
                        className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-semibold text-slate-650 mb-1">Block C (Roof)</label>
                      <input 
                        type="number" 
                        value={newEntry.cementBlockC}
                        onChange={e => setNewEntry({...newEntry, cementBlockC: e.target.value})}
                        placeholder="e.g. 30"
                        className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-semibold text-slate-650 mb-1">Site Office</label>
                      <input 
                        type="number" 
                        value={newEntry.cementSiteOffice}
                        onChange={e => setNewEntry({...newEntry, cementSiteOffice: e.target.value})}
                        placeholder="e.g. 10"
                        className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-semibold text-slate-600 mb-1">Steel (Tons)</label>
                    <input 
                      type="number" 
                      value={newEntry.steelUsed}
                      onChange={e => setNewEntry({...newEntry, steelUsed: e.target.value})}
                      placeholder="e.g. 4.2"
                      className="w-full rounded border border-slate-200 px-2 py-1 text-xs text-slate-800 focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-semibold text-slate-600 mb-1">Sand (Loads)</label>
                    <input 
                      type="number" 
                      value={newEntry.sandUsed}
                      onChange={e => setNewEntry({...newEntry, sandUsed: e.target.value})}
                      placeholder="e.g. 12"
                      className="w-full rounded border border-slate-200 px-2 py-1 text-xs text-slate-800 focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-semibold text-slate-600 mb-1">Bricks (Nos)</label>
                    <input 
                      type="number" 
                      value={newEntry.bricksUsed}
                      onChange={e => setNewEntry({...newEntry, bricksUsed: e.target.value})}
                      placeholder="e.g. 2500"
                      className="w-full rounded border border-slate-200 px-2 py-1 text-xs text-slate-800 focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Site Issues / Delays</label>
                <input 
                  type="text" 
                  value={newEntry.issueText}
                  onChange={e => setNewEntry({...newEntry, issueText: e.target.value})}
                  placeholder="e.g. Concrete mixer breakdown causing 2h delay"
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-primary focus:outline-none"
                />
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
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pop-up Alerts Modal */}
      {showAlertsModal && alerts.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-100 bg-white p-6 shadow-dropdown flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-150">
              <div className="flex items-center gap-2">
                <AlertOctagon className="h-5 w-5 text-red-500 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Critical Project Alerts</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Please review and acknowledge these alerts to proceed</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAlertsModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 rounded-full hover:bg-slate-50 transition-colors"
                title="Dismiss all and close"
              >
                ✕
              </button>
            </div>

            {/* List of active alerts */}
            <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1 py-1">
              {alerts.map((alert) => {
                let colorClass = "bg-blue-50/70 border-blue-100 text-blue-800";
                let typeLabel = "Info";
                if (alert.type === "Critical" || alert.type === "Danger") {
                  colorClass = "bg-red-50/70 border-red-100 text-red-800";
                  typeLabel = "Critical";
                } else if (alert.type === "Warning") {
                  colorClass = "bg-amber-50/70 border-amber-100 text-amber-800";
                  typeLabel = "Warning";
                } else if (alert.type === "Success") {
                  colorClass = "bg-green-50/70 border-green-100 text-green-800";
                  typeLabel = "Success";
                }

                return (
                  <div 
                    key={alert.id} 
                    className={`flex items-start justify-between gap-3 p-4 rounded-xl border ${colorClass} transition-all duration-200 hover:scale-[1.01]`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {alert.type === "Success" ? (
                          <Sparkles className="h-4 w-4" />
                        ) : (
                          <AlertOctagon className="h-4 w-4" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-white/60">
                            {typeLabel}
                          </span>
                          <span className="text-xs font-bold leading-tight">
                            {alert.title}
                          </span>
                        </div>
                        <p className="text-[10px] opacity-90 font-medium">
                          {alert.desc}
                        </p>
                        <p className="text-[8px] opacity-75 font-semibold">
                          Date: {alert.date}
                        </p>
                      </div>
                    </div>
                    
                    {/* Wrong / Dismiss close button */}
                    <button
                      onClick={() => handleDismissAlert(alert.id)}
                      className="shrink-0 rounded-full p-1 hover:bg-black/5 transition-colors text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold"
                      title="Dismiss alert"
                    >
                      <span className="text-sm leading-none px-1">✕</span>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex justify-between items-center">
              <span className="text-[9px] font-bold text-slate-400">
                {alerts.length} alert{alerts.length > 1 ? 's' : ''} remaining
              </span>
              <button
                type="button"
                onClick={() => setShowAlertsModal(false)}
                className="rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-700 shadow-premium transition-colors"
              >
                Close Popup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
