import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  Check, 
  X, 
  HelpCircle,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { formatRupees } from './Dashboard';

export default function BudgetPlanning({ project }) {
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    const fetchBudget = async () => {
      try {
        setLoading(true);
        const data = await api.getBudget(project.id);
        setBudget(data);
      } catch (err) {
        console.error("Error loading budget data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBudget();
  }, [project.id]);

  if (loading || !budget) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const handleEditCategory = (index, value) => {
    setEditingIndex(index);
    setEditValue(value.toString());
  };

  const handleSaveCategory = async (index) => {
    try {
      const updatedCategories = [...budget.categories];
      const val = parseFloat(editValue.replace(/,/g, ''));
      if (isNaN(val)) return;

      updatedCategories[index].allocated = val;
      updatedCategories[index].percentage = Number(((val / budget.totalBudget) * 100).toFixed(0));

      const updated = await api.updateBudget(project.id, updatedCategories);
      if (updated) {
        setBudget(updated);
        setEditingIndex(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getHealthBadge = (health) => {
    if (health === 'Healthy') {
      return (
        <span className="flex items-center gap-1 rounded bg-green-50 border border-green-100 px-2 py-0.5 text-[10px] font-bold text-green-600">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Healthy</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 rounded bg-red-50 border border-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
        <AlertCircle className="h-3.5 w-3.5" />
        <span>At Risk</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-base font-extrabold text-slate-800">Budget Allocation</h2>
        <p className="text-[10px] text-slate-400 font-medium">Allocate high-level cost baselines to distinct cost categories.</p>
      </div>

      {/* Financial Health Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-premium">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Budget</p>
          <h3 className="mt-1 text-base font-black text-slate-800">{formatRupees(budget.totalBudget)}</h3>
          <p className="mt-1.5 text-[9px] font-semibold text-slate-400">Total project financing allocation</p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-premium">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Allocated Budget</p>
          <h3 className="mt-1 text-base font-black text-slate-800">{formatRupees(budget.allocatedBudget)}</h3>
          <p className="mt-1.5 text-[9px] font-bold text-primary">
            {((budget.allocatedBudget / budget.totalBudget) * 100).toFixed(1)}% of total funds
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-premium">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Unallocated Budget</p>
          <h3 className={`mt-1 text-base font-black ${budget.unallocatedBudget < 0 ? 'text-red-600' : 'text-slate-800'}`}>
            {formatRupees(budget.unallocatedBudget)}
          </h3>
          <p className="mt-1.5 text-[9px] font-semibold text-slate-400">Funds available for categories</p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-premium flex flex-col justify-between">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Budget Health</p>
          <div className="mt-1.5 flex items-center justify-between">
            {getHealthBadge(budget.allocatedBudget > budget.totalBudget ? 'At Risk' : 'Healthy')}
          </div>
          <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div 
              className={`h-full rounded-full ${budget.allocatedBudget > budget.totalBudget ? 'bg-red-500' : 'bg-green-500'}`} 
              style={{ width: `${Math.min(100, (budget.allocatedBudget / budget.totalBudget) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Categories Allocations Grid */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-premium">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-xs font-bold text-slate-800">Financial Categories</h4>
            <p className="text-[9px] text-slate-400 font-semibold mt-0.5">High level cost divisions baseline and adjustments</p>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-lg">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <th className="py-2.5 px-4 font-bold text-[10px] uppercase min-w-[200px]">Cost Category</th>
                <th className="py-2.5 px-3 font-bold text-[10px] uppercase w-28 text-center">Allocated %</th>
                <th className="py-2.5 px-3 font-bold text-[10px] uppercase text-right w-44">Allocated Cost (₹)</th>
                <th className="py-2.5 px-3 font-bold text-[10px] uppercase text-right w-44">Spent to Date (₹)</th>
                <th className="py-2.5 px-4 font-bold text-[10px] uppercase text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {budget.categories.map((cat, idx) => (
                <tr key={cat.category} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-800">{cat.category}</td>
                  <td className="py-3 px-3 text-center">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-bold text-[10px] text-slate-600">
                      {((cat.allocated / budget.totalBudget) * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    {editingIndex === idx ? (
                      <input 
                        type="text"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className="w-32 rounded border border-slate-200 px-1.5 py-0.5 text-right font-bold focus:outline-none"
                      />
                    ) : (
                      <span className="font-bold text-slate-800">{formatRupees(cat.allocated)}</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-500">{formatRupees(cat.spent)}</td>
                  <td className="py-3 px-4 text-center">
                    {editingIndex === idx ? (
                      <div className="flex justify-center gap-1.5">
                        <button 
                          onClick={() => handleSaveCategory(idx)}
                          className="text-green-600 hover:bg-green-50 p-1 rounded transition-colors"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => setEditingIndex(null)}
                          className="text-slate-400 hover:bg-slate-50 p-1 rounded transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleEditCategory(idx, cat.allocated)}
                        className="text-primary hover:bg-primary-light p-1 rounded transition-colors font-bold text-[10px]"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
