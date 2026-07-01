import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { formatRupees } from './Dashboard';

export default function PlannedVsActual({ project }) {
  const [materials, setMaterials] = useState([]);
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('materials');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [mList, bData] = await Promise.all([
          api.getMaterials(project.id),
          api.getBudget(project.id)
        ]);
        setMaterials(mList);
        setBudget(bData);
      } catch (err) {
        console.error("Error loading planned vs actual data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [project.id]);

  if (loading || !budget) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Calculate Net Variance
  // Variance = Planned - Actual (Positive = Savings, Negative = Overrun)
  const totalPlannedMaterials = materials.reduce((sum, m) => sum + m.plannedCost, 0);
  const totalActualMaterials = materials.reduce((sum, m) => sum + m.actualCost, 0);
  const materialsVariance = totalPlannedMaterials - totalActualMaterials;

  const getVarianceColor = (val) => {
    return val >= 0 ? 'text-success' : 'text-error';
  };

  const getVarianceBg = (val) => {
    return val >= 0 ? 'bg-timeline-grep/20 border-hairline' : 'bg-canvas-soft border-hairline';
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-base font-normal text-ink">Planned vs Actual</h2>
        <p className="text-[10px] text-muted-soft font-medium">Verify actual expenses against initial planning baseline figures.</p>
      </div>

      {/* Summary Variance Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-hairline bg-surface-card p-4">
          <p className="text-[9px] font-bold text-muted-soft uppercase tracking-wider">Baseline Planned Cost</p>
          <h3 className="mt-1 text-base font-black text-ink">
            {activeTab === 'materials' ? formatRupees(totalPlannedMaterials) : formatRupees(budget.allocatedBudget)}
          </h3>
          <p className="mt-1.5 text-[9px] font-semibold text-muted-soft">Approved project plan</p>
        </div>

        <div className="rounded-lg border border-hairline bg-surface-card p-4">
          <p className="text-[9px] font-bold text-muted-soft uppercase tracking-wider">Actual Expense Cost</p>
          <h3 className="mt-1 text-base font-black text-ink">
            {activeTab === 'materials' ? formatRupees(totalActualMaterials) : formatRupees(budget.categories.reduce((sum, c) => sum + c.spent, 0))}
          </h3>
          <p className="mt-1.5 text-[9px] font-semibold text-muted-soft">Total incurred spend</p>
        </div>

        <div className={`rounded-lg border p-4 ${getVarianceBg(
          activeTab === 'materials' 
            ? materialsVariance 
            : (budget.allocatedBudget - budget.categories.reduce((sum, c) => sum + c.spent, 0))
        )}`}>
          <p className="text-[9px] font-bold text-muted-soft uppercase tracking-wider">Net Variance</p>
          <div className="mt-1 flex items-center justify-between">
            <h3 className={`text-base font-black ${getVarianceColor(
              activeTab === 'materials' 
                ? materialsVariance 
                : (budget.allocatedBudget - budget.categories.reduce((sum, c) => sum + c.spent, 0))
            )}`}>
              {formatRupees(Math.abs(
                activeTab === 'materials' 
                  ? materialsVariance 
                  : (budget.allocatedBudget - budget.categories.reduce((sum, c) => sum + c.spent, 0))
              ))}
            </h3>
            <span className={`text-[10px] font-bold uppercase ${getVarianceColor(
              activeTab === 'materials' 
                ? materialsVariance 
                : (budget.allocatedBudget - budget.categories.reduce((sum, c) => sum + c.spent, 0))
            )}`}>
              { (activeTab === 'materials' ? materialsVariance : (budget.allocatedBudget - budget.categories.reduce((sum, c) => sum + c.spent, 0))) >= 0 ? 'Savings' : 'Overrun' }
            </span>
          </div>
          <p className="mt-1.5 text-[9px] font-semibold text-muted">Difference value sum</p>
        </div>
      </div>

      {/* Tabs list */}
      <div className="border-b border-hairline">
        <div className="flex gap-6 -mb-px text-xs font-semibold">
          <button 
            onClick={() => setActiveTab('materials')}
            className={`pb-3 border-b-2 transition-colors ${activeTab === 'materials' ? 'border-primary text-primary' : 'border-transparent text-muted-soft hover:text-body'}`}
          >
            Materials Cost
          </button>
          <button 
            onClick={() => setActiveTab('budget')}
            className={`pb-3 border-b-2 transition-colors ${activeTab === 'budget' ? 'border-primary text-primary' : 'border-transparent text-muted-soft hover:text-body'}`}
          >
            Budget Categories
          </button>
        </div>
      </div>

      {/* Comparisons content cards list */}
      <div className="space-y-4">
        {activeTab === 'materials' ? (
          materials.map((mat) => {
            const variance = mat.plannedCost - mat.actualCost;
            const percentageUsed = (mat.actualCost / mat.plannedCost) * 100 || 0;

            return (
              <div key={mat.id} className="rounded-lg border border-hairline bg-surface-card p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                
                {/* Info block */}
                <div className="flex-1">
                  <h4 className="text-xs font-semibold text-ink">{mat.name}</h4>
                  <div className="mt-1.5 flex items-center gap-4 text-[10px] font-semibold text-muted-soft">
                    <div>Planned Qty: <span className="text-ink">{mat.planned.toLocaleString()} {mat.unit}</span></div>
                    <div>Actual Qty: <span className="text-ink">{mat.purchased.toLocaleString()} {mat.unit}</span></div>
                  </div>
                </div>

                {/* Progress bar comparison */}
                <div className="flex-1 max-w-xs">
                  <div className="flex items-center justify-between text-[9px] font-bold text-muted mb-1">
                    <span>Baseline Consumption</span>
                    <span>{percentageUsed.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-canvas-soft overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${percentageUsed > 100 ? 'bg-error' : 'bg-primary'}`} 
                      style={{ width: `${Math.min(100, percentageUsed)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Variance and pricing info */}
                <div className="flex items-center gap-6 text-right justify-between md:justify-end">
                  <div>
                    <p className="text-[9px] font-bold text-muted-soft uppercase tracking-wider">Planned vs Actual Cost</p>
                    <p className="text-xs font-semibold text-body mt-0.5">
                      {formatRupees(mat.plannedCost)} <span className="text-muted-soft">/</span> <span className="font-semibold text-ink">{formatRupees(mat.actualCost)}</span>
                    </p>
                  </div>
                  <div className={`rounded border px-2 py-1 min-w-[100px] text-center ${getVarianceBg(variance)}`}>
                    <p className="text-[8px] font-bold text-muted-soft uppercase tracking-wider">Variance</p>
                    <p className={`text-xs font-black ${getVarianceColor(variance)} mt-0.5`}>
                      {formatRupees(Math.abs(variance))}
                    </p>
                  </div>
                </div>

              </div>
            );
          })
        ) : (
          budget.categories.map((cat) => {
            const variance = cat.allocated - cat.spent;
            const percentageUsed = (cat.spent / cat.allocated) * 100 || 0;

            return (
              <div key={cat.category} className="rounded-lg border border-hairline bg-surface-card p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                
                {/* Info block */}
                <div className="flex-1">
                  <h4 className="text-xs font-semibold text-ink">{cat.category}</h4>
                  <p className="text-[10px] text-muted-soft font-semibold mt-1">High level cost tracking category</p>
                </div>

                {/* Progress bar comparison */}
                <div className="flex-1 max-w-xs">
                  <div className="flex items-center justify-between text-[9px] font-bold text-muted mb-1">
                    <span>Allocation Spent</span>
                    <span>{percentageUsed.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-canvas-soft overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${percentageUsed > 100 ? 'bg-error' : 'bg-primary'}`} 
                      style={{ width: `${Math.min(100, percentageUsed)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Variance and pricing info */}
                <div className="flex items-center gap-6 text-right justify-between md:justify-end">
                  <div>
                    <p className="text-[9px] font-bold text-muted-soft uppercase tracking-wider">Allocated vs Spent</p>
                    <p className="text-xs font-semibold text-body mt-0.5">
                      {formatRupees(cat.allocated)} <span className="text-muted-soft">/</span> <span className="font-semibold text-ink">{formatRupees(cat.spent)}</span>
                    </p>
                  </div>
                  <div className={`rounded border px-2 py-1 min-w-[100px] text-center ${getVarianceBg(variance)}`}>
                    <p className="text-[8px] font-bold text-muted-soft uppercase tracking-wider">Variance</p>
                    <p className={`text-xs font-black ${getVarianceColor(variance)} mt-0.5`}>
                      {formatRupees(Math.abs(variance))}
                    </p>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
