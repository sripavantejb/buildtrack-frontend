import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  FileSpreadsheet, 
  File, 
  Printer,
  TrendingUp,
  CheckCircle,
  Eye
} from 'lucide-react';
import { api } from '../services/api';
import { formatRupees } from './Dashboard';

export default function Reports({ project }) {
  const [reportType, setReportType] = useState('health');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReportData = async () => {
      try {
        setLoading(true);
        const [materials, budget, tracking] = await Promise.all([
          api.getMaterials(project.id),
          api.getBudget(project.id),
          api.getDailyTracking(project.id)
        ]);
        setData({ materials, budget, tracking });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadReportData();
  }, [project.id]);

  if (loading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Handle Download CSV (Excel simulation)
  const handleExportExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (reportType === 'health' || reportType === 'budget') {
      csvContent += "Category,Allocated Baseline Cost,Spent to Date,Remaining Balance,Health Status\n";
      data.budget.categories.forEach(cat => {
        csvContent += `"${cat.category}",${cat.allocated},${cat.spent},${cat.allocated - cat.spent},"${cat.health}"\n`;
      });
    } else if (reportType === 'material') {
      csvContent += "Material Name,Planned Qty,Purchased Qty,Used Qty,Unit Rate,Actual Cost,Status\n";
      data.materials.forEach(m => {
        csvContent += `"${m.name}",${m.planned},${m.purchased},${m.used},${m.unitRate},${m.actualCost},"${m.status}"\n`;
      });
    } else {
      csvContent += "Log Date,Today Cost (INR),Material Units Used,Labour Attendance,Hours Worked,Issues Count\n";
      data.tracking.forEach(log => {
        csvContent += `${log.date},${log.todayCost},${log.materialsUsed},${log.labourPresent},${log.workingHours},${log.issues?.length || 0}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BuildTrack_Report_${reportType}_${project.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle PDF Export via printing window
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h2 className="text-base font-normal text-ink">Reports & Export</h2>
          <p className="text-[10px] text-muted-soft font-medium">Download audits of material consumption, category spending, and logs.</p>
        </div>
        
        {/* Export Action Triggers */}
        <div className="page-header-actions print:hidden">
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 rounded-lg border border-hairline bg-surface-card px-3.5 py-1.5 text-xs font-bold text-body hover:bg-canvas transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
            <span>Export Excel</span>
          </button>
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-white hover:bg-primary-active transition-colors"
          >
            <Printer className="h-4 w-4" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Report Customizer Controls */}
      <div className="rounded-lg border border-hairline bg-surface-card p-5 print:hidden">
        <h4 className="text-xs font-semibold text-ink mb-3.5">Report Settings</h4>
        
        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <label className="block text-[10px] font-semibold text-ink mb-1">Select Report Template</label>
            <select
              value={reportType}
              onChange={e => setReportType(e.target.value)}
              className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none cursor-pointer font-semibold"
            >
              <option value="health">Project Health Report</option>
              <option value="budget">Budget Variance Audit</option>
              <option value="material">Materials Consumption Log</option>
              <option value="daily">Daily Site Tracking Summary</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-ink mb-1">Date Scope</label>
            <select
              disabled
              className="w-full rounded-lg border border-hairline bg-canvas px-3 py-1.5 text-xs text-muted-soft focus:outline-none"
            >
              <option>Full Project Lifetime</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-ink mb-1">Format Type</label>
            <select
              disabled
              className="w-full rounded-lg border border-hairline bg-canvas px-3 py-1.5 text-xs text-muted-soft focus:outline-none"
            >
              <option>Tabular Detailed Spreadsheet</option>
            </select>
          </div>
        </div>
      </div>

      {/* Printable Report Preview Container */}
      <div className="rounded-lg border border-hairline bg-surface-card p-6 print:border-none print:shadow-none print:p-0">
        
        {/* Printable Header */}
        <div className="border-b border-hairline pb-5 mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-normal text-ink uppercase tracking-wide">BuildTrack Costs intelligence report</h1>
            <p className="text-[10px] text-muted-soft font-semibold mt-1">Project Name: {project.name}</p>
            <p className="text-[10px] text-muted-soft font-semibold">Location: {project.location}</p>
          </div>
          <div className="text-right">
            <h3 className="text-xs font-semibold text-ink">BuildTrack Inc</h3>
            <p className="text-[9px] text-muted mt-0.5">Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Dynamic Report Table Preview */}
        <div className="overflow-x-auto">
          {reportType === 'health' || reportType === 'budget' ? (
            <table className="w-full text-left border-collapse text-[11px] font-medium text-ink">
              <thead>
                <tr className="bg-canvas border-b border-hairline text-muted font-bold text-[9px] uppercase">
                  <th className="py-2.5 px-3">Cost Category</th>
                  <th className="py-2.5 px-3 text-right">Allocated Baseline</th>
                  <th className="py-2.5 px-3 text-right">Spent to Date</th>
                  <th className="py-2.5 px-3 text-right">Remaining Balance</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft">
                {data.budget.categories.map(cat => (
                  <tr key={cat.category} className="hover:bg-canvas/20">
                    <td className="py-2.5 px-3 font-semibold text-ink">{cat.category}</td>
                    <td className="py-2.5 px-3 text-right font-semibold">{formatRupees(cat.allocated)}</td>
                    <td className="py-2.5 px-3 text-right font-semibold">{formatRupees(cat.spent)}</td>
                    <td className={`py-2.5 px-3 text-right font-bold ${cat.allocated - cat.spent < 0 ? 'text-error' : 'text-ink'}`}>
                      {formatRupees(cat.allocated - cat.spent)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold ${
                        cat.health === 'Good' ? 'bg-timeline-grep/20 text-success' : 'bg-canvas-soft text-error'
                      }`}>
                        {cat.health === 'Good' ? 'Healthy' : 'Overrun'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : reportType === 'material' ? (
            <table className="w-full text-left border-collapse text-[11px] font-medium text-ink">
              <thead>
                <tr className="bg-canvas border-b border-hairline text-muted-soft font-bold text-[9px] uppercase">
                  <th className="py-2.5 px-3">Material Type</th>
                  <th className="py-2.5 px-3 text-right">Planned Qty</th>
                  <th className="py-2.5 px-3 text-right">Purchased Qty</th>
                  <th className="py-2.5 px-3 text-right">Used Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Rate</th>
                  <th className="py-2.5 px-3 text-right font-bold">Actual Cost</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft">
                {data.materials.map(m => (
                  <tr key={m.id} className="hover:bg-canvas/20">
                    <td className="py-2.5 px-3 font-semibold text-ink">{m.name}</td>
                    <td className="py-2.5 px-3 text-right">{m.planned.toLocaleString()} {m.unit}</td>
                    <td className="py-2.5 px-3 text-right">{m.purchased.toLocaleString()} {m.unit}</td>
                    <td className="py-2.5 px-3 text-right">{m.used.toLocaleString()} {m.unit}</td>
                    <td className="py-2.5 px-3 text-right">{formatRupees(m.unitRate)}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-ink">{formatRupees(m.actualCost)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold ${
                        m.status === 'Optimal' ? 'bg-timeline-grep/20 text-success' : 'bg-timeline-thinking/20 text-timeline-done'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse text-[11px] font-medium text-ink">
              <thead>
                <tr className="bg-canvas border-b border-hairline text-muted-soft font-bold text-[9px] uppercase">
                  <th className="py-2.5 px-3">Log Date</th>
                  <th className="py-2.5 px-3 text-right">Today Cost</th>
                  <th className="py-2.5 px-3 text-right">Material Units</th>
                  <th className="py-2.5 px-3 text-right">Labour Count</th>
                  <th className="py-2.5 px-3 text-right">Hours Worked</th>
                  <th className="py-2.5 px-3 text-center">Site Issues</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft">
                {data.tracking.map(log => (
                  <tr key={log.id} className="hover:bg-canvas/20">
                    <td className="py-2.5 px-3 font-semibold text-ink">{log.date}</td>
                    <td className="py-2.5 px-3 text-right font-semibold">{formatRupees(log.todayCost)}</td>
                    <td className="py-2.5 px-3 text-right font-semibold">{log.materialsUsed}</td>
                    <td className="py-2.5 px-3 text-right">{log.labourPresent} Workers</td>
                    <td className="py-2.5 px-3 text-right">{log.workingHours} hrs</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold ${
                        log.issues?.length > 0 ? 'bg-canvas-soft text-error' : 'bg-timeline-grep/20 text-success'
                      }`}>
                        {log.issues?.length || 0} issues
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
