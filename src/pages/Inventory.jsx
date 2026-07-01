import React, { useState, useEffect } from 'react';
import { 
  Archive, 
  Plus, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Search, 
  Filter, 
  AlertTriangle,
  History,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { formatRupees } from './Dashboard';

export default function Inventory({ project }) {
  const [materials, setMaterials] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddLog, setShowAddLog] = useState(false);
  const [search, setSearch] = useState('');
  const [logTypeFilter, setLogTypeFilter] = useState('All');
  
  const [newLog, setNewLog] = useState({
    materialName: '',
    type: 'Stock In',
    quantity: '',
    remarks: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mList, inventoryLogs] = await Promise.all([
        api.getMaterials(project.id),
        api.getInventory(project.id)
      ]);
      setMaterials(mList);
      setLogs(inventoryLogs);
    } catch (err) {
      console.error("Error loading inventory data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [project.id]);

  const handleRecordLog = async (e) => {
    e.preventDefault();
    if (!newLog.materialName || !newLog.quantity) return;

    try {
      const mat = materials.find(m => m.name === newLog.materialName);
      await api.addInventoryLog(project.id, {
        material: newLog.materialName,
        type: newLog.type,
        quantity: Number(newLog.quantity),
        unit: mat ? mat.unit : 'Bags',
        remarks: newLog.remarks
      });
      setShowAddLog(false);
      setNewLog({ materialName: '', type: 'Stock In', quantity: '', remarks: '' });
      fetchData();
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

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.material.toLowerCase().includes(search.toLowerCase());
    const matchesType = logTypeFilter === 'All' || log.type === logTypeFilter;
    return matchesSearch && matchesType;
  });

  // Calculate quick metrics
  const lowStockCount = materials.filter(m => m.status === 'Low Stock').length;
  const inStockVal = materials.reduce((sum, m) => sum + (m.remaining * m.unitRate), 0);

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-normal text-ink">Inventory Management</h2>
          <p className="text-[10px] text-muted-soft font-medium">Monitor active warehouse balances and material issue history logs.</p>
        </div>
        <button 
          onClick={() => setShowAddLog(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-white hover:bg-primary-active transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Record Stock Entry</span>
        </button>
      </div>

      {/* Warning alert banner for low stock */}
      {lowStockCount > 0 && (
        <div className="rounded-lg border border-hairline bg-timeline-thinking/20/50 p-4 text-xs font-medium text-orange-700 flex items-center gap-2">
          <AlertTriangle className="h-4.5 w-4.5 text-timeline-done flex-shrink-0" />
          <div>
            <h5 className="font-bold text-orange-800">Low Stock Alert</h5>
            <p className="text-[10px] text-timeline-done mt-0.5">There are {lowStockCount} material categories with balances below safety levels. Restock soon to prevent site delays.</p>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-hairline bg-surface-card p-4">
          <p className="text-[9px] font-bold text-muted-soft uppercase tracking-wider">Total Warehouse Value</p>
          <h3 className="mt-1 text-base font-black text-ink">{formatRupees(inStockVal)}</h3>
          <p className="mt-1.5 text-[9px] font-semibold text-muted-soft">Total remaining inventory value</p>
        </div>

        <div className="rounded-lg border border-hairline bg-surface-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold text-muted-soft uppercase tracking-wider">Low Stock Classes</p>
            <h3 className={`mt-1 text-base font-black ${lowStockCount > 0 ? 'text-timeline-done' : 'text-ink'}`}>
              {lowStockCount} Items
            </h3>
            <p className="mt-1.5 text-[9px] font-semibold text-muted-soft">Below minimum safety levels</p>
          </div>
          <AlertTriangle className={`h-8 w-8 ${lowStockCount > 0 ? 'text-timeline-thinking' : 'text-hairline'}`} />
        </div>

        <div className="rounded-lg border border-hairline bg-surface-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold text-muted-soft uppercase tracking-wider">Total Log Entries</p>
            <h3 className="mt-1 text-base font-black text-ink">{logs.length} Operations</h3>
            <p className="mt-1.5 text-[9px] font-semibold text-muted-soft">Recorded issues & arrivals</p>
          </div>
          <History className="h-8 w-8 text-hairline" />
        </div>
      </div>

      {/* Main Grid: Warehouse balances + Stock Logs */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Warehouse Balances */}
        <div className="rounded-lg border border-hairline bg-surface-card p-5 flex flex-col justify-between">
          <h4 className="text-xs font-semibold text-ink mb-4">Warehouse Status</h4>
          
          <div className="flex-1 space-y-4">
            {materials.map((mat) => {
              const capUsed = mat.purchased > 0 ? (mat.remaining / mat.purchased) * 100 : 0;
              return (
                <div key={mat.id} className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-ink">{mat.name}</span>
                    <span className={`font-black ${mat.remaining < 200 && mat.remaining > 0 ? 'text-timeline-done' : 'text-muted'}`}>
                      {mat.remaining.toLocaleString()} {mat.unit}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-canvas-soft overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${mat.remaining < 200 && mat.remaining > 0 ? 'bg-timeline-done' : 'bg-primary'}`} 
                      style={{ width: `${Math.min(100, capUsed)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* History Stock Logs */}
        <div className="lg:col-span-2 rounded-lg border border-hairline bg-surface-card p-5 flex flex-col justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <h4 className="text-xs font-semibold text-ink">Inventory Logs</h4>
            <div className="flex items-center gap-3">
              <div className="relative max-w-xs">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-soft" />
                <input 
                  type="text" 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Filter by material..."
                  className="rounded-lg border border-hairline pl-8 pr-3 py-1 text-xs text-ink placeholder:text-muted-soft focus:outline-none"
                />
              </div>
              <select
                value={logTypeFilter}
                onChange={e => setLogTypeFilter(e.target.value)}
                className="rounded-lg border border-hairline bg-surface-card px-2 py-1 text-xs font-semibold text-muted focus:outline-none cursor-pointer"
              >
                <option value="All">All Logs</option>
                <option value="Stock In">Stock In Only</option>
                <option value="Stock Out">Stock Out Only</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-hairline text-muted-soft font-bold">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Material</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2 text-right">Quantity</th>
                  <th className="pb-2 pl-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft font-medium text-ink">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-canvas/50">
                      <td className="py-2.5 text-muted-soft font-semibold">{log.date}</td>
                      <td className="py-2.5 font-semibold text-ink">{log.material}</td>
                      <td className="py-2.5">
                        <span className={`flex items-center gap-1 w-fit rounded px-1.5 py-0.5 text-[8px] font-bold ${
                          log.type === 'Stock In' ? 'bg-timeline-grep/20 text-success' : 'bg-timeline-thinking/20 text-timeline-done'
                        }`}>
                          {log.type === 'Stock In' ? <ArrowDownCircle className="h-3 w-3" /> : <ArrowUpCircle className="h-3 w-3" />}
                          <span>{log.type}</span>
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-black text-ink">
                        {log.quantity.toLocaleString()} {log.unit}
                      </td>
                      <td className="py-2.5 pl-4 text-muted">{log.remarks}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-muted-soft">No matching log records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Record Stock Entry Modal */}
      {showAddLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-sm rounded-lg border border-hairline-soft bg-surface-card p-6">
            <h3 className="text-sm font-semibold text-ink">Record Inventory Transaction</h3>
            
            <form onSubmit={handleRecordLog} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[10px] font-semibold text-ink mb-1">Select Material</label>
                <select
                  required
                  value={newLog.materialName}
                  onChange={e => setNewLog({...newLog, materialName: e.target.value})}
                  className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
                >
                  <option value="">-- Choose Material --</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.name}>{m.name} ({m.unit})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-semibold text-ink mb-1">Transaction Type</label>
                  <select
                    value={newLog.type}
                    onChange={e => setNewLog({...newLog, type: e.target.value})}
                    className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
                  >
                    <option value="Stock In">Stock In (Delivered)</option>
                    <option value="Stock Out">Stock Out (Issued)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-ink mb-1">Quantity</label>
                  <input 
                    type="number" 
                    required
                    value={newLog.quantity}
                    onChange={e => setNewLog({...newLog, quantity: e.target.value})}
                    placeholder="e.g. 100"
                    className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-ink mb-1">Remarks / Details</label>
                <input 
                  type="text" 
                  value={newLog.remarks}
                  onChange={e => setNewLog({...newLog, remarks: e.target.value})}
                  placeholder="e.g. Supplier load / Issued to Block A Columns"
                  className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink placeholder:text-muted-soft focus:border-primary focus:outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowAddLog(false)}
                  className="rounded-lg border border-hairline bg-surface-card px-4 py-1.5 text-xs font-bold text-body hover:bg-canvas transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-active transition-colors"
                >
                  Post Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
