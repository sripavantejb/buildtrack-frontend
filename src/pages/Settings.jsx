import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertTriangle, ShieldCheck, Mail, Bell, Shield, Sliders, Info, Clock, CheckSquare, Layers } from 'lucide-react';
import { api } from '../services/api';

export default function SettingsPage({ project, setProject }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('project'); // 'project' | 'materials' | 'general' | 'advanced'
  const [error, setError] = useState('');
  
  const [projectDetails, setProjectDetails] = useState({
    name: project?.name || '',
    location: project?.location || '',
    budget: project?.budget || 0,
    area: project?.area || 0,
    duration: project?.duration || '',
    startDate: project?.startDate || '',
    endDate: project?.endDate || '',
    status: project?.status || 'Planning'
  });

  const [thresholds, setThresholds] = useState({
    budgetWarning: 90,
    costOverrunLimit: 10
  });

  const [materialThresholds, setMaterialThresholds] = useState({});

  const [notifyChannels, setNotifyChannels] = useState({
    email: true,
    sms: false,
    system: true
  });

  // Advanced settings states ("see more settings")
  const [advancedSettings, setAdvancedSettings] = useState({
    currency: 'INR (₹)',
    workHoursGoal: 9.0,
    sensitivity: 'Medium',
    autoDailySummary: true,
    autoWeeklyBudget: false,
    maintenanceMode: false
  });

  const [success, setSuccess] = useState(false);
  const currentUser = api.getCurrentUser();
  const canEditProject = ['Platform Owner', 'Super Admin'].includes(currentUser?.role);

  useEffect(() => {
    if (project) {
      setProjectDetails({
        name: project.name || '',
        location: project.location || '',
        budget: project.budget || 0,
        area: project.area || 0,
        duration: project.duration || '',
        startDate: project.startDate || '',
        endDate: project.endDate || '',
        status: project.status || 'Planning'
      });
    }
  }, [project]);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setLoading(true);
        const data = await api.getMaterials(project.id);
        setMaterials(data);
        
        // Load custom thresholds
        const customAlerts = {};
        data.forEach(m => {
          customAlerts[m.id] = m.lowStockThreshold !== undefined ? m.lowStockThreshold : (m.name.toLowerCase().includes('cement') ? 200 : m.name.toLowerCase().includes('steel') ? 15 : 100);
        });
        setMaterialThresholds(customAlerts);
      } catch (err) {
        console.error("Error loading settings materials:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, [project.id]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    try {
      if (activeTab === 'project') {
        if (!canEditProject) {
          setError("Access Denied: Only Super Admins and Platform Owners can edit project details.");
          return;
        }
        const updated = await api.updateProject(project.id, {
          ...projectDetails,
          budget: Number(projectDetails.budget),
          area: Number(projectDetails.area)
        });
        if (setProject) {
          setProject(updated);
        }
      } else {
        // 1. Update all materials thresholds in backend
        await Promise.all(
          materials.map(mat => {
            const customVal = materialThresholds[mat.id];
            return api.updateMaterial(project.id, mat.id, {
              lowStockThreshold: Number(customVal) || 0
            });
          })
        );
      }
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving settings:", err);
      setError(err.message || "Error saving configuration settings.");
    }
  };

  const handleMaterialThresholdChange = (id, val) => {
    setMaterialThresholds(prev => ({
      ...prev,
      [id]: val
    }));
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-base font-normal text-ink">Workspace Settings</h2>
        <p className="text-[10px] text-muted-soft font-medium">Configure project configurations, warning thresholds, and notification alerts.</p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-hairline text-xs font-bold text-muted-soft gap-6">
        <button 
          type="button"
          onClick={() => setActiveTab('project')}
          className={`pb-2 transition-colors ${activeTab === 'project' ? 'border-b-2 border-primary text-primary font-black' : 'hover:text-body'}`}
        >
          Project Details
        </button>
        <button 
          type="button"
          onClick={() => setActiveTab('materials')}
          className={`pb-2 transition-colors ${activeTab === 'materials' ? 'border-b-2 border-primary text-primary font-black' : 'hover:text-body'}`}
        >
          Material Alert Settings
        </button>
        <button 
          type="button"
          onClick={() => setActiveTab('general')}
          className={`pb-2 transition-colors ${activeTab === 'general' ? 'border-b-2 border-primary text-primary font-black' : 'hover:text-body'}`}
        >
          General & Channels
        </button>
        <button 
          type="button"
          onClick={() => setActiveTab('advanced')}
          className={`pb-2 transition-colors ${activeTab === 'advanced' ? 'border-b-2 border-primary text-primary font-black' : 'hover:text-body'}`}
        >
          Advanced Settings
        </button>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
        
        {/* Success Notice */}
        {success && (
          <div className="rounded-lg border border-green-150 bg-timeline-grep/20 p-4 text-xs font-medium text-green-700 flex items-center gap-2 animate-fade-in">
            <ShieldCheck className="h-4.5 w-4.5 text-success" />
            <span>Settings saved successfully. Threshold baselines updated in cost engine.</span>
          </div>
        )}

        {/* Error Notice */}
        {error && (
          <div className="rounded-lg border border-red-150 bg-canvas-soft p-4 text-xs font-medium text-red-700 flex items-center gap-2 animate-fade-in">
            <AlertTriangle className="h-4.5 w-4.5 text-error" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <>
            {/* TAB 0: Project Details */}
            {activeTab === 'project' && (
              <div className="rounded-lg border border-hairline bg-surface-card p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-hairline-soft">
                  <Sliders className="h-4.5 w-4.5 text-primary" />
                  <div>
                    <h4 className="text-xs font-semibold text-ink">Core Project Specifications</h4>
                    <p className="text-[9px] text-muted-soft font-semibold mt-0.5">Manage project scope, budget allocation, and duration baselines.</p>
                  </div>
                </div>

                {!canEditProject && (
                  <div className="rounded-lg border border-amber-150 bg-timeline-thinking/20 p-3 text-[10px] font-medium text-amber-700 flex items-center gap-2">
                    <Info className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    <span>View-only mode: Only Super Admins and Platform Owners can edit project specifications.</span>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-ink mb-1">Project Name *</label>
                    <input 
                      type="text"
                      required
                      disabled={!canEditProject}
                      value={projectDetails.name}
                      onChange={e => setProjectDetails({ ...projectDetails, name: e.target.value })}
                      className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none disabled:bg-canvas disabled:text-muted"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-ink mb-1">Location *</label>
                    <input 
                      type="text"
                      required
                      disabled={!canEditProject}
                      value={projectDetails.location}
                      onChange={e => setProjectDetails({ ...projectDetails, location: e.target.value })}
                      className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none disabled:bg-canvas disabled:text-muted"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-ink mb-1">Total Budget (INR ₹) *</label>
                    <input 
                      type="number"
                      required
                      disabled={!canEditProject}
                      value={projectDetails.budget}
                      onChange={e => setProjectDetails({ ...projectDetails, budget: e.target.value })}
                      className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none disabled:bg-canvas disabled:text-muted"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-ink mb-1">Built-up Area (Sq Ft)</label>
                    <input 
                      type="number"
                      disabled={!canEditProject}
                      value={projectDetails.area}
                      onChange={e => setProjectDetails({ ...projectDetails, area: e.target.value })}
                      className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none disabled:bg-canvas disabled:text-muted"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-ink mb-1">Estimated Duration</label>
                    <input 
                      type="text"
                      disabled={!canEditProject}
                      value={projectDetails.duration}
                      onChange={e => setProjectDetails({ ...projectDetails, duration: e.target.value })}
                      placeholder="e.g. 12 Months"
                      className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none disabled:bg-canvas disabled:text-muted"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-ink mb-1">Project Status</label>
                    <select
                      disabled={!canEditProject}
                      value={projectDetails.status}
                      onChange={e => setProjectDetails({ ...projectDetails, status: e.target.value })}
                      className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none disabled:bg-canvas"
                    >
                      <option value="Planning">Planning</option>
                      <option value="In Progress">In Progress</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-ink mb-1">Start Date</label>
                    <input 
                      type="date"
                      disabled={!canEditProject}
                      value={projectDetails.startDate}
                      onChange={e => setProjectDetails({ ...projectDetails, startDate: e.target.value })}
                      className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none disabled:bg-canvas"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-ink mb-1">End Date</label>
                    <input 
                      type="date"
                      disabled={!canEditProject}
                      value={projectDetails.endDate}
                      onChange={e => setProjectDetails({ ...projectDetails, endDate: e.target.value })}
                      className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none disabled:bg-canvas"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 1: Material Alert Settings */}
            {activeTab === 'materials' && (
              <div className="rounded-lg border border-hairline bg-surface-card p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-hairline-soft">
                  <AlertTriangle className="h-4.5 w-4.5 text-timeline-done" />
                  <div>
                    <h4 className="text-xs font-semibold text-ink">Individual Material Thresholds</h4>
                    <p className="text-[9px] text-muted-soft font-semibold mt-0.5">Define custom low stock warning limits for each site material.</p>
                  </div>
                </div>

                {materials.length === 0 ? (
                  <p className="text-xs text-muted-soft">No baseline materials available to configure alerts.</p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {materials.map(mat => (
                      <div key={mat.id}>
                        <label className="block text-[10px] font-semibold text-ink mb-1">
                          {mat.name} Low Stock Threshold ({mat.unit})
                        </label>
                        <input 
                          type="number"
                          value={materialThresholds[mat.id] !== undefined ? materialThresholds[mat.id] : ''}
                          onChange={e => handleMaterialThresholdChange(mat.id, e.target.value)}
                          placeholder="e.g. 100"
                          className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: General & Channels */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                {/* General Alert & Warning Thresholds */}
                <div className="rounded-lg border border-hairline bg-surface-card p-5 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-hairline-soft">
                    <Sliders className="h-4.5 w-4.5 text-primary" />
                    <div>
                      <h4 className="text-xs font-semibold text-ink">Budget Alert & Warning Thresholds</h4>
                      <p className="text-[9px] text-muted-soft font-semibold mt-0.5">Configure system thresholds for budget overruns and warnings.</p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-ink mb-1">Budget Allocation Warning Limit (%)</label>
                      <input 
                        type="number"
                        value={thresholds.budgetWarning}
                        onChange={e => setThresholds({ ...thresholds, budgetWarning: e.target.value })}
                        className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-ink mb-1">Max Cost Overrun Flag Limit (%)</label>
                      <input 
                        type="number"
                        value={thresholds.costOverrunLimit}
                        onChange={e => setThresholds({ ...thresholds, costOverrunLimit: e.target.value })}
                        className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Communication Channels */}
                <div className="rounded-lg border border-hairline bg-surface-card p-5 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-hairline-soft">
                    <Bell className="h-4.5 w-4.5 text-timeline-read" />
                    <div>
                      <h4 className="text-xs font-semibold text-ink">Alert Delivery Channels</h4>
                      <p className="text-[9px] text-muted-soft font-semibold mt-0.5">Select preferred channels for receiving project notifications.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center gap-3 text-xs font-semibold text-ink cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={notifyChannels.email}
                        onChange={e => setNotifyChannels({ ...notifyChannels, email: e.target.checked })}
                        className="rounded border-hairline-strong text-primary h-4 w-4"
                      />
                      Email Alerts (Daily digests and urgent stockout alerts)
                    </label>
                    <label className="flex items-center gap-3 text-xs font-semibold text-ink cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={notifyChannels.sms}
                        onChange={e => setNotifyChannels({ ...notifyChannels, sms: e.target.checked })}
                        className="rounded border-hairline-strong text-primary h-4 w-4"
                      />
                      MAIL Notifications (Critical material delivery delays)
                    </label>
                    <label className="flex items-center gap-3 text-xs font-semibold text-ink cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={notifyChannels.system}
                        onChange={e => setNotifyChannels({ ...notifyChannels, system: e.target.checked })}
                        className="rounded border-hairline-strong text-primary h-4 w-4"
                      />
                      In-App Notification Cards (Dashboard and Sidebar highlights)
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Advanced Settings ("see more settings") */}
            {activeTab === 'advanced' && (
              <div className="rounded-lg border border-hairline bg-surface-card p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-hairline-soft">
                  <Sliders className="h-4.5 w-4.5 text-primary" />
                  <div>
                    <h4 className="text-xs font-semibold text-ink">Advanced Preferences</h4>
                    <p className="text-[9px] text-muted-soft font-semibold mt-0.5">Customize default metrics and automated audit report delivery rules.</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-ink mb-1">Workspace Currency Display</label>
                    <select
                      value={advancedSettings.currency}
                      onChange={e => setAdvancedSettings({ ...advancedSettings, currency: e.target.value })}
                      className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
                    >
                      <option>INR (₹)</option>
                      <option>USD ($)</option>
                      <option>EUR (€)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-ink mb-1">Default Working Hours Goal</label>
                    <input 
                      type="number"
                      step="0.5"
                      value={advancedSettings.workHoursGoal}
                      onChange={e => setAdvancedSettings({ ...advancedSettings, workHoursGoal: Number(e.target.value) })}
                      className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-ink mb-1">Project Risk Alert Sensitivity</label>
                    <select
                      value={advancedSettings.sensitivity}
                      onChange={e => setAdvancedSettings({ ...advancedSettings, sensitivity: e.target.value })}
                      className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
                    >
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2 pt-1">
                    <label className="block text-[10px] font-semibold text-ink mb-0.5">Automated Report Subscriptions</label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={advancedSettings.autoDailySummary}
                        onChange={e => setAdvancedSettings({ ...advancedSettings, autoDailySummary: e.target.checked })}
                        className="rounded border-hairline-strong text-primary h-3.5 w-3.5"
                      />
                      Daily Inventory Summary
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={advancedSettings.autoWeeklyBudget}
                        onChange={e => setAdvancedSettings({ ...advancedSettings, autoWeeklyBudget: e.target.checked })}
                        className="rounded border-hairline-strong text-primary h-3.5 w-3.5"
                      />
                      Weekly Budget Performance Reports
                    </label>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Submit Actions */}
        <div className="flex justify-end pt-2">
          <button 
            type="submit"
            disabled={activeTab === 'project' && !canEditProject}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-active transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            <span>Save Configuration</span>
          </button>
        </div>

      </form>
    </div>
  );
}
