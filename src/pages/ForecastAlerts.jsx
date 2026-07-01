import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Play, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { api } from '../services/api';
import { formatRupees } from './Dashboard';

export default function ForecastAlerts({ project }) {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [aList, mList] = await Promise.all([
          api.getAlerts(project.id),
          api.getMaterials(project.id)
        ]);
        setAlerts(aList);
        setMaterials(mList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [project.id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Generate predictive recommendation cards
  const predictions = [
    {
      id: "p-1",
      title: "Cement Depletion Risk",
      metric: "6 Days Remaining",
      desc: "Based on the average daily consumption rate of 120 Bags for Block A columns casting, the remaining stock of 1,300 Bags will deplete entirely by 23 June.",
      recommendation: "Issue a purchase order of 1,000 Bags of Cement (53 Grade) to UltraTech Cements immediately to avoid site delay.",
      type: "Critical",
      actionLabel: "Generate Purchase Order"
    },
    {
      id: "p-2",
      title: "Steel Cost Overrun Forecast",
      metric: "+8.3% Cost Variance",
      desc: "Current reinforcement spacing tweaks in structural design have raised actual steel quantities. Steel (TMT Bars) is on track to overshoot plan by 12 Tons.",
      recommendation: "Review structural spacing benchmarks with design consultant Meera Nair or adjust structural contingency allocations.",
      type: "Warning",
      actionLabel: "Adjust Allocation"
    },
    {
      id: "p-3",
      title: "Schedule Slippage Threat",
      metric: "5 Days Delay",
      desc: "Vibrator equipment breakdown on 12 June and late aggregate delivery have pushed back slab preparation by 5 days relative to baseline.",
      recommendation: "Authorize extra shifts for structural labor crews on 18-20 June to compress tasks and regain baseline milestones.",
      type: "Warning",
      actionLabel: "View Schedule Timeline"
    },
    {
      id: "p-4",
      title: "Optimized procurement savings",
      metric: "₹1,20,000 Saved",
      desc: "Bulk purchasing sand logs directly from regional mining zones instead of dealers minimized rates by 8% per load.",
      recommendation: "Maintain bulk direct buying patterns for sand in Phase 2 columns structure. Replicate pattern for Aggregate purchases.",
      type: "Success",
      actionLabel: "Lock Vendor Pricing"
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-normal text-ink">Forecast & Predictive Alerts</h2>
          <p className="text-[10px] text-muted-soft font-medium">Automatic system forecasts on stock levels, budget, and project scheduling.</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-canvas-soft border border-hairline px-3 py-1.5 text-[10px] font-bold text-primary">
          <Zap className="h-3.5 w-3.5 fill-timeline-edit" />
          <span>AI Insights Active</span>
        </div>
      </div>

      {/* Predictions grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {predictions.map((p) => {
          let typeColor, typeBg, typeBorder, alertIcon;
          switch (p.type) {
            case 'Critical':
              typeColor = 'text-error';
              typeBg = 'bg-canvas-soft/25';
              typeBorder = 'border-red-150';
              alertIcon = <AlertTriangle className="h-4.5 w-4.5" />;
              break;
            case 'Warning':
              typeColor = 'text-timeline-done';
              typeBg = 'bg-timeline-thinking/20/25';
              typeBorder = 'border-orange-150';
              alertIcon = <AlertTriangle className="h-4.5 w-4.5" />;
              break;
            case 'Success':
              typeColor = 'text-success';
              typeBg = 'bg-timeline-grep/20/25';
              typeBorder = 'border-green-150';
              alertIcon = <CheckCircle2 className="h-4.5 w-4.5" />;
              break;
            default:
              typeColor = 'text-timeline-read';
              typeBg = 'bg-timeline-read/20/25';
              typeBorder = 'border-blue-150';
              alertIcon = <Clock className="h-4.5 w-4.5" />;
              break;
          }

          return (
            <div 
              key={p.id} 
              className={`rounded-lg border ${typeBorder} ${typeBg} p-5 flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={typeColor}>{alertIcon}</span>
                    <h4 className="text-xs font-semibold text-ink">{p.title}</h4>
                  </div>
                  <span className={`rounded px-2 py-0.5 text-[9px] font-bold ${
                    p.type === 'Critical' ? 'bg-canvas-soft text-error border border-hairline' :
                    p.type === 'Warning' ? 'bg-timeline-thinking/20 text-timeline-done border border-hairline' :
                    p.type === 'Success' ? 'bg-timeline-grep/20 text-success border border-hairline' : 'bg-timeline-read/20 text-timeline-read border border-hairline'
                  }`}>
                    {p.metric}
                  </span>
                </div>

                <p className="mt-3 text-xs text-muted font-medium leading-relaxed">
                  {p.desc}
                </p>

                <div className="mt-4 border-t border-hairline-soft pt-3">
                  <p className="text-[9px] font-bold text-muted-soft uppercase tracking-wider">Recommendation</p>
                  <p className="mt-1 text-[11px] font-semibold text-ink leading-normal">
                    {p.recommendation}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button 
                  onClick={() => {
                    if (p.id === 'p-1') {
                      navigate(`/project/${project.id}/procurement`, {
                        state: {
                          openModal: true,
                          materialName: 'Cement (53 Grade)',
                          quantity: 1000,
                          vendor: 'UltraTech Cements',
                          unitRate: 450
                        }
                      });
                    } else if (p.id === 'p-2') {
                      navigate(`/project/${project.id}/budget`);
                    } else if (p.id === 'p-3') {
                      navigate(`/project/${project.id}/daily-tracking`);
                    } else if (p.id === 'p-4') {
                      navigate(`/project/${project.id}/settings`);
                    }
                  }}
                  className="flex items-center gap-1 rounded-lg bg-surface-card border border-hairline hover:bg-canvas text-body hover:text-ink px-3 py-1.5 text-[10px] font-bold transition-all"
                >
                  <span>{p.actionLabel}</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
