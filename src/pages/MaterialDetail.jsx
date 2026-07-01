import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  TrendingUp, 
  Calendar, 
  Warehouse, 
  BellRing,
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import { api } from '../services/api';
import { formatRupees } from './Dashboard';

export default function MaterialDetail({ project }) {
  const { materialId } = useParams();
  const navigate = useNavigate();
  const [material, setMaterial] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMaterialDetails = async () => {
      try {
        setLoading(true);
        const [mList, inventoryLogs] = await Promise.all([
          api.getMaterials(project.id),
          api.getInventory(project.id)
        ]);
        
        const mat = mList.find(m => m.id === materialId);
        setMaterial(mat);
        
        const filteredLogs = inventoryLogs.filter(log => 
          log.material.toLowerCase().includes(mat?.name.split(' ')[0].toLowerCase() || '')
        );
        setLogs(filteredLogs);
      } catch (err) {
        console.error("Error loading material detail:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterialDetails();
  }, [project.id, materialId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-muted">Material details could not be found.</p>
        <button 
          onClick={() => navigate(`/project/${project.id}/materials`)}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs text-white"
        >
          Back to Materials
        </button>
      </div>
    );
  }

  // Dynamic depletion calculations
  const stockOutLogs = logs.filter(l => l.type === 'Stock Out');
  const totalOut = stockOutLogs.reduce((sum, l) => sum + Number(l.quantity), 0);
  const uniqueDates = [...new Set(stockOutLogs.map(l => l.date))];
  const avgDailyUsage = uniqueDates.length > 0 ? (totalOut / uniqueDates.length) : (material.planned / 120 || 10);
  
  const daysRemaining = material.remaining > 0 
    ? Math.max(0, Math.round(material.remaining / avgDailyUsage)) 
    : 0;

  const recommendedReorderVal = Math.round(Math.max(avgDailyUsage * 15, material.planned * 0.2));

  // Supply Flow mock metrics
  const flowSteps = [
    { label: "Purchased", val: material.purchased, color: "bg-timeline-read" },
    { label: "Received", val: material.purchased, color: "bg-teal-500" },
    { label: "Issued", val: material.used, color: "bg-canvas-soft" },
    { label: "Used", val: Math.round(material.used * 0.97), color: "bg-success" },
    { label: "Wastage", val: Math.round(material.used * 0.03), color: "bg-error" },
    { label: "Balance", val: material.remaining, color: "bg-timeline-done" }
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-2">
        <button 
          onClick={() => navigate(`/project/${project.id}/materials`)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline bg-surface-card text-muted hover:bg-canvas transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-base font-normal text-ink">{material.name}</h2>
          <p className="text-[10px] text-muted-soft font-medium">Inventory metrics, timelines, and reorder projections.</p>
        </div>
      </div>

      {/* Main KPI Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
        <div className="rounded-lg border border-hairline bg-surface-card p-4">
          <p className="text-[9px] font-bold text-muted-soft uppercase tracking-wider">Planned Qty</p>
          <h3 className="mt-1 text-base font-black text-ink">{Number(material.planned).toLocaleString()}</h3>
          <p className="mt-1 text-[9px] text-muted-soft font-semibold">{material.unit}</p>
        </div>
        <div className="rounded-lg border border-hairline bg-surface-card p-4">
          <p className="text-[9px] font-bold text-muted-soft uppercase tracking-wider">Purchased Qty</p>
          <h3 className="mt-1 text-base font-black text-ink">{Number(material.purchased).toLocaleString()}</h3>
          <p className="mt-1 text-[9px] text-muted-soft font-semibold">{material.unit}</p>
        </div>
        <div className="rounded-lg border border-hairline bg-surface-card p-4">
          <p className="text-[9px] font-bold text-muted-soft uppercase tracking-wider">Used Qty</p>
          <h3 className="mt-1 text-base font-black text-ink">{Number(material.used).toLocaleString()}</h3>
          <p className="mt-1 text-[9px] text-muted-soft font-semibold">{material.unit}</p>
        </div>
        <div className="rounded-lg border border-hairline bg-surface-card p-4">
          <p className="text-[9px] font-bold text-muted-soft uppercase tracking-wider">Remaining Qty</p>
          <h3 className={`mt-1 text-base font-black ${material.remaining < 200 ? 'text-error' : 'text-ink'}`}>
            {Number(material.remaining).toLocaleString()}
          </h3>
          <p className="mt-1 text-[9px] text-muted-soft font-semibold">{material.unit}</p>
        </div>
        <div className="rounded-lg border border-hairline bg-surface-card p-4">
          <p className="text-[9px] font-bold text-muted-soft uppercase tracking-wider">Unit Rate</p>
          <h3 className="mt-1 text-base font-black text-ink">{formatRupees(material.unitRate)}</h3>
          <p className="mt-1 text-[9px] text-muted-soft font-semibold">Per {material.unit.slice(0, -1) || 'Unit'}</p>
        </div>
        <div className="rounded-lg border border-hairline bg-surface-card p-4">
          <p className="text-[9px] font-bold text-muted-soft uppercase tracking-wider">Planned Cost</p>
          <h3 className="mt-1 text-base font-black text-ink">{formatRupees(material.plannedCost)}</h3>
          <p className="mt-1 text-[9px] text-muted-soft font-semibold">Baseline Budget</p>
        </div>
        <div className="rounded-lg border border-hairline bg-surface-card p-4">
          <p className="text-[9px] font-bold text-muted-soft uppercase tracking-wider">Actual Cost</p>
          <h3 className="mt-1 text-base font-black text-primary">{formatRupees(material.actualCost)}</h3>
          <p className="mt-1 text-[9px] text-muted-soft font-semibold">Spent to Date</p>
        </div>
      </div>

      {/* Visual Flow Representation Purchased -> Received -> Issued -> Used -> Wastage -> Balance */}
      <div className="rounded-lg border border-hairline bg-surface-card p-5">
        <h4 className="text-xs font-semibold text-ink mb-6">Supply Chain Pipeline Flow</h4>
        
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 px-4">
          {flowSteps.map((step, idx) => (
            <React.Fragment key={step.label}>
              {/* Step circle */}
              <div className="flex flex-col items-center flex-1 text-center relative z-10">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full text-white font-bold ${step.color}`}>
                  {idx + 1}
                </div>
                <h5 className="mt-2 text-xs font-semibold text-ink">{step.label}</h5>
                <p className="text-[10px] text-muted-soft font-bold mt-0.5">
                  {step.val.toLocaleString()} <span className="font-medium text-[9px]">{material.unit}</span>
                </p>
              </div>

              {/* Connecting arrow line */}
              {idx < flowSteps.length - 1 && (
                <div className="hidden md:block flex-1 h-0.5 bg-canvas-soft relative top-[-16px]">
                  <div className="absolute right-0 top-[-3px] border-solid border-l-muted border-l-4 border-y-transparent border-y-4 border-r-0"></div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Forecast & Logistics Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Forecast & Ordering Alerts */}
        <div className="rounded-lg border border-hairline bg-surface-card p-5 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-semibold text-ink mb-1">Forecasting & Reordering</h4>
            <p className="text-[9px] text-muted-soft font-semibold mb-4">Stock depletion and order intelligence</p>
          </div>

          <div className="space-y-4">
            <div className={`flex items-center justify-between rounded-lg border p-3 text-xs ${
              daysRemaining < 5 ? 'bg-canvas-soft/50 border-red-150' : daysRemaining < 10 ? 'bg-timeline-thinking/20/50 border-orange-150' : 'bg-timeline-grep/20/50 border-green-150'
            }`}>
              <div className="flex items-center gap-2">
                <BellRing className={`h-4.5 w-4.5 ${
                  daysRemaining < 5 ? 'text-error' : daysRemaining < 10 ? 'text-timeline-done' : 'text-success'
                }`} />
                <div>
                  <h6 className="font-semibold text-ink">Days of Stock Remaining</h6>
                  <p className="text-[9px] text-muted-soft mt-0.5">Estimated depletion based on usage rate</p>
                </div>
              </div>
              <span className={`text-sm font-black ${
                daysRemaining < 5 ? 'text-error' : daysRemaining < 10 ? 'text-timeline-done' : 'text-success'
              }`}>{daysRemaining} {daysRemaining === 1 ? 'Day' : 'Days'}</span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-timeline-read/20/50 border border-hairline p-3 text-xs">
              <div className="flex items-center gap-2">
                <Warehouse className="h-4.5 w-4.5 text-timeline-read" />
                <div>
                  <h6 className="font-semibold text-ink">Recommended Reorder</h6>
                  <p className="text-[9px] text-muted-soft mt-0.5">Suggested restock volume to mitigate delay</p>
                </div>
              </div>
              <span className="text-sm font-black text-timeline-read">{recommendedReorderVal.toLocaleString()} {material.unit}</span>
            </div>
          </div>

          {/* Planned vs Actual indicator bar */}
          <div className="mt-6 border-t border-hairline-soft pt-4">
            <div className="flex items-center justify-between text-[10px] font-semibold text-ink mb-1.5">
              <span>Baseline Plan Consumption</span>
              <span>{((material.used / material.planned) * 100).toFixed(0)}% used</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-canvas-soft overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full" 
                style={{ width: `${Math.min(100, (material.used / material.planned) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Inventory Stock Movement Log */}
        <div className="md:col-span-2 rounded-lg border border-hairline bg-surface-card p-5 flex flex-col justify-between">
          <h4 className="text-xs font-semibold text-ink mb-4">Stock Movement Timeline</h4>
          
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-hairline-soft text-muted-soft font-bold">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2 text-right">Quantity</th>
                  <th className="pb-2 pl-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft font-medium text-ink">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-canvas/50">
                      <td className="py-2.5 text-muted-soft font-semibold">{log.date}</td>
                      <td className="py-2.5">
                        <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold ${
                          log.type === 'Stock In' ? 'bg-timeline-grep/20 text-success' : 'bg-timeline-thinking/20 text-timeline-done'
                        }`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-semibold text-ink">
                        {log.quantity.toLocaleString()} {log.unit}
                      </td>
                      <td className="py-2.5 pl-4 text-muted">{log.remarks}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-muted-soft">No stock movements logged for this material.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
