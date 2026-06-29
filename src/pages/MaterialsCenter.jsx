import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, ArrowRight, ArrowDownToLine, ShoppingBag } from 'lucide-react';
import { api } from '../services/api';
import { formatRupees } from './Dashboard';

export default function MaterialsCenter({ project }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setLoading(true);
        const data = await api.getMaterials(project.id);
        setMaterials(data);
      } catch (err) {
        console.error("Error loading materials:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, [project.id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Calculate totals
  const totalBudget = materials.reduce((sum, m) => sum + m.plannedCost, 0);
  const purchasedValue = materials.reduce((sum, m) => sum + m.actualCost, 0);
  const usedValue = materials.reduce((sum, m) => sum + (m.used * m.unitRate), 0);
  const remainingValue = purchasedValue - usedValue;

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'All' || m.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Optimal': return 'bg-green-50 text-green-600 border border-green-150';
      case 'Low Stock': return 'bg-orange-50 text-orange-600 border border-orange-150 animate-pulse';
      case 'To Order': return 'bg-red-50 text-red-600 border border-red-150';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-base font-extrabold text-slate-800">Materials Center</h2>
        <p className="text-[10px] text-slate-400 font-medium">Core tracking and allocation statistics for physical building resources.</p>
      </div>

      {/* Summary value cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-premium">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Materials Budget</p>
          <h3 className="mt-1 text-base font-black text-slate-800">{formatRupees(totalBudget)}</h3>
          <p className="mt-1.5 text-[9px] font-semibold text-slate-400">Baseline material allocation</p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-premium">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Purchased Value</p>
          <h3 className="mt-1 text-base font-black text-slate-800">{formatRupees(purchasedValue)}</h3>
          <p className="mt-1.5 text-[9px] font-bold text-primary">
            {((purchasedValue / totalBudget) * 100).toFixed(1)}% of total budget
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-premium">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Used Value</p>
          <h3 className="mt-1 text-base font-black text-slate-800">{formatRupees(usedValue)}</h3>
          <p className="mt-1.5 text-[9px] font-bold text-green-600">
            {((usedValue / purchasedValue || 0) * 100).toFixed(1)}% of inventory spent
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-premium">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Remaining Stock Value</p>
          <h3 className="mt-1 text-base font-black text-slate-800">{formatRupees(remainingValue)}</h3>
          <p className="mt-1.5 text-[9px] font-bold text-orange-500">
            {((remainingValue / purchasedValue || 0) * 100).toFixed(1)}% in warehouse
          </p>
        </div>
      </div>

      {/* Materials List Table */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-premium">
        
        {/* Filtering & Search row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search materials (e.g. Cement, Steel...)"
              className="w-full rounded-lg border border-slate-200 pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-600 focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Optimal">Optimal</option>
              <option value="Low Stock">Low Stock</option>
              <option value="To Order">To Order</option>
            </select>
          </div>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto border border-slate-100 rounded-lg">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <th className="py-2.5 px-4 font-bold text-[10px] uppercase">Material</th>
                <th className="py-2.5 px-3 font-bold text-[10px] uppercase w-20 text-center">Unit</th>
                <th className="py-2.5 px-3 font-bold text-[10px] uppercase text-right w-28">Planned Qty</th>
                <th className="py-2.5 px-3 font-bold text-[10px] uppercase text-right w-28">Purchased Qty</th>
                <th className="py-2.5 px-3 font-bold text-[10px] uppercase text-right w-28">Used Qty</th>
                <th className="py-2.5 px-3 font-bold text-[10px] uppercase text-right w-28">Remaining Qty</th>
                <th className="py-2.5 px-3 font-bold text-[10px] uppercase text-center w-28">Status</th>
                <th className="py-2.5 px-4 font-bold text-[10px] uppercase w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredMaterials.length > 0 ? (
                filteredMaterials.map((mat) => (
                  <tr 
                    key={mat.id} 
                    onClick={() => navigate(`/project/${project.id}/materials/${mat.id}`)}
                    className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-slate-800">{mat.name}</td>
                    <td className="py-3 px-3 text-center text-slate-400 font-semibold">{mat.unit}</td>
                    <td className="py-3 px-3 text-right">{Number(mat.planned || 0).toLocaleString()}</td>
                    <td className="py-3 px-3 text-right text-slate-800 font-semibold">{Number(mat.purchased || 0).toLocaleString()}</td>
                    <td className="py-3 px-3 text-right text-slate-800 font-semibold">{Number(mat.used || 0).toLocaleString()}</td>
                    <td className={`py-3 px-3 text-right font-bold ${mat.remaining < 200 && mat.remaining > 0 ? 'text-orange-500' : 'text-slate-800'}`}>
                      {Number(mat.remaining || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`rounded px-2 py-0.5 text-[8px] font-bold ${getStatusBadge(mat.status)}`}>
                        {mat.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors" />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-455">No materials matching filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
