import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  ShoppingCart, 
  Plus, 
  ArrowRight, 
  ArrowLeft,
  User, 
  Clock, 
  Truck, 
  CheckCircle,
  Building,
  DollarSign
} from 'lucide-react';
import { api } from '../services/api';
import { formatRupees } from './Dashboard';

const statusNames = {
  requested: 'Requested',
  approved: 'Approved',
  vendor_assigned: 'Vendor Assigned',
  po_created: 'PO Created',
  delivered: 'Delivered'
};

const statusColors = {
  requested: 'bg-timeline-read border-blue-200 text-timeline-read',
  approved: 'bg-purple-500 border-purple-200 text-purple-500',
  vendor_assigned: 'bg-canvas-soft border-hairline text-primary',
  po_created: 'bg-timeline-thinking/200 border-amber-200 text-amber-500',
  delivered: 'bg-success border-green-200 text-success'
};

export default function Procurement({ project }) {
  const location = useLocation();
  const [requests, setRequests] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPageHistoryModal, setShowPageHistoryModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newRequest, setNewRequest] = useState({
    materialName: '',
    quantity: '',
    vendor: '',
    unitRate: ''
  });

  const getGlobalHistory = () => {
    const list = [];
    requests.forEach(req => {
      if (req.history && Array.isArray(req.history)) {
        req.history.forEach(h => {
          list.push({
            ...h,
            materialName: req.material,
            quantity: req.quantity,
            unit: req.unit,
            cost: req.cost,
            vendor: req.vendor,
            reqId: req.id
          });
        });
      }
    });
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  useEffect(() => {
    if (location.state && location.state.openModal) {
      setNewRequest({
        materialName: location.state.materialName || '',
        quantity: location.state.quantity || '',
        vendor: location.state.vendor || '',
        unitRate: location.state.unitRate || ''
      });
      setShowAddModal(true);
    }
  }, [location.state]);

  const fetchProcurementData = async () => {
    try {
      setLoading(true);
      const [pList, mList] = await Promise.all([
        api.getProcurement(project.id),
        api.getMaterials(project.id)
      ]);
      setRequests(pList);
      setMaterials(mList);
    } catch (err) {
      console.error("Error loading procurement details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcurementData();
  }, [project.id]);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!newRequest.materialName || !newRequest.quantity || !newRequest.vendor) return;

    try {
      const mat = materials.find(m => m.name === newRequest.materialName);
      await api.createProcurement(project.id, {
        material: newRequest.materialName,
        quantity: Number(newRequest.quantity),
        unit: mat ? mat.unit : 'Bags',
        vendor: newRequest.vendor,
        unitRate: Number(newRequest.unitRate || 400),
        requestedBy: "Arjun Reddy"
      });
      setShowAddModal(false);
      setNewRequest({ materialName: '', quantity: '', vendor: '', unitRate: '' });
      fetchProcurementData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTransitionStatus = async (id, currentStatus, direction) => {
    const statuses = ['requested', 'approved', 'vendor_assigned', 'po_created', 'delivered'];
    const currentIndex = statuses.indexOf(currentStatus);
    let nextIndex = currentIndex + direction;

    if (nextIndex >= 0 && nextIndex < statuses.length) {
      const nextStatus = statuses[nextIndex];
      try {
        await api.updateProcurementStatus(project.id, id, nextStatus);
        fetchProcurementData();
      } catch (err) {
        console.error("Error updating procurement stage:", err);
      }
    }
  };

  const columns = [
    { id: 'requested', title: 'Requested', color: 'border-t-blue-500 bg-timeline-read/5' },
    { id: 'approved', title: 'Approved', color: 'border-t-purple-500 bg-purple-500/5' },
    { id: 'vendor_assigned', title: 'Vendor Assigned', color: 'border-t-primary bg-canvas-soft/5' },
    { id: 'po_created', title: 'PO Created', color: 'border-t-amber-500 bg-timeline-thinking/200/5' },
    { id: 'delivered', title: 'Delivered', color: 'border-t-green-500 bg-success/5' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-normal text-ink">Procurement Workflow</h2>
          <p className="text-[10px] text-muted-soft font-medium">Coordinate orders and verify supplier deliveries through visual columns.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowPageHistoryModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-hairline bg-surface-card px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-canvas transition-colors"
          >
            <Clock className="h-4 w-4 text-muted" />
            <span>Workflow History</span>
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-white hover:bg-primary-active transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>New Requisition</span>
          </button>
        </div>
      </div>

      {/* Kanban Board Layout */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-5 overflow-x-auto min-h-[480px] pb-4">
          {columns.map((col) => {
            const colItems = requests.filter(r => r.status === col.id);
            return (
              <div 
                key={col.id} 
                className={`rounded-lg border border-hairline border-t-4 ${col.color} p-4 flex flex-col min-w-[200px] h-full`}
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-hairline-soft/50">
                  <h4 className="text-xs font-semibold text-ink">{col.title}</h4>
                  <span className="rounded bg-hairline/60 px-1.5 py-0.5 text-[10px] font-bold text-body">
                    {colItems.length}
                  </span>
                </div>

                {/* Column card listing */}
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[420px]">
                  {colItems.map((item) => (
                    <div 
                      key={item.id} 
                      className="rounded-lg border border-hairline bg-surface-card p-3.5 space-y-3"
                    >
                      <div>
                        <h5 className="text-xs font-semibold text-ink leading-snug">{item.material}</h5>
                        <div className="mt-1 flex items-center justify-between text-[10px] font-semibold text-muted-soft">
                          <span>Qty: <span className="text-body font-bold">{item.quantity.toLocaleString()} {item.unit}</span></span>
                          <span>{formatRupees(item.cost)}</span>
                        </div>
                      </div>

                      <div className="border-t border-hairline-soft pt-2.5 space-y-1 text-[9px] font-semibold text-muted">
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3 text-muted-soft" />
                          <span className="truncate">Vendor: {item.vendor}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-soft" />
                          <span className="truncate">By: {item.requestedBy}</span>
                        </div>
                        {item.date && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-soft" />
                            <span className="truncate">Updated: {item.date}</span>
                          </div>
                        )}
                      </div>

                      {/* Direction Transition Actions */}
                      <div className="flex items-center justify-between border-t border-hairline-soft pt-2 text-[9px] font-bold">
                        <button 
                          disabled={col.id === 'requested'}
                          onClick={() => handleTransitionStatus(item.id, item.status, -1)}
                          className="flex h-5 w-5 items-center justify-center rounded border border-hairline text-muted hover:bg-canvas transition-colors disabled:opacity-30"
                        >
                          <ArrowLeft className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setShowHistoryModal(true);
                          }}
                          className="px-2 py-0.5 rounded text-primary hover:bg-primary/5 transition-colors border border-primary/20 text-[8px] uppercase tracking-wider font-normal"
                        >
                          History
                        </button>
                        <button 
                          disabled={col.id === 'delivered'}
                          onClick={() => handleTransitionStatus(item.id, item.status, 1)}
                          className="flex h-5 w-5 items-center justify-center rounded border border-hairline text-muted hover:bg-canvas transition-colors disabled:opacity-30"
                        >
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {colItems.length === 0 && (
                    <div className="h-24 flex items-center justify-center border border-dashed rounded-lg text-muted-soft text-[10px] font-medium">
                      No orders
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Procurement Request Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-sm rounded-lg border border-hairline-soft bg-surface-card p-6">
            <h3 className="text-sm font-semibold text-ink">New Requisition Order</h3>
            
            <form onSubmit={handleCreateRequest} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[10px] font-semibold text-ink mb-1">Select Material</label>
                <select
                  required
                  value={newRequest.materialName}
                  onChange={e => setNewRequest({...newRequest, materialName: e.target.value})}
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
                  <label className="block text-[10px] font-semibold text-ink mb-1">Quantity</label>
                  <input 
                    type="number" 
                    required
                    value={newRequest.quantity}
                    onChange={e => setNewRequest({...newRequest, quantity: e.target.value})}
                    placeholder="e.g. 500"
                    className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-ink mb-1">Unit Rate (₹)</label>
                  <input 
                    type="number" 
                    value={newRequest.unitRate}
                    onChange={e => setNewRequest({...newRequest, unitRate: e.target.value})}
                    placeholder="e.g. 450"
                    className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-ink mb-1">Vendor Assignment</label>
                <input 
                  type="text" 
                  required
                  value={newRequest.vendor}
                  onChange={e => setNewRequest({...newRequest, vendor: e.target.value})}
                  placeholder="e.g. UltraTech Cements"
                  className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-hairline bg-surface-card px-4 py-1.5 text-xs font-bold text-body hover:bg-canvas transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-active transition-colors"
                >
                  Submit Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Timeline Modal */}
      {showHistoryModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-hairline-soft bg-surface-card p-6 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-hairline">
              <div>
                <h3 className="text-sm font-semibold text-ink">Requisition History</h3>
                <p className="text-[10px] text-muted-soft font-semibold mt-0.5">{selectedItem.material} ({selectedItem.quantity.toLocaleString()} {selectedItem.unit})</p>
              </div>
              <button 
                onClick={() => { setShowHistoryModal(false); setSelectedItem(null); }}
                className="text-muted hover:text-ink text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* Vertical Timeline Container */}
            <div className="mt-4 flex-1 overflow-y-auto pr-1 py-2 space-y-6 relative">
              {/* Vertical dotted/solid line */}
              <div className="absolute left-3 top-2 bottom-4 w-0.5 bg-canvas-soft border-l border-dashed border-hairline-strong"></div>

              {(selectedItem.history || []).map((event, index) => {
                const statusName = statusNames[event.status] || event.status;
                const colorClass = statusColors[event.status] || 'bg-muted-soft border-hairline';
                
                return (
                  <div key={index} className="relative pl-8 flex flex-col gap-1">
                    {/* Timeline dot */}
                    <div className={`absolute left-1.5 top-1 h-3.5 w-3.5 rounded-full border-2 border-white ${colorClass.split(' ')[0]}`} />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-normal text-ink uppercase tracking-wide">
                        {statusName}
                      </span>
                      <span className="text-[9px] font-bold text-muted-soft bg-canvas px-1.5 py-0.5 rounded border border-hairline-soft">
                        {event.date}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted font-medium flex items-center gap-1">
                      <User className="h-3 w-3 text-muted-soft" />
                      <span>Updated by <span className="font-semibold text-ink">{event.user}</span></span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-3 border-t border-hairline-soft flex justify-end">
              <button
                type="button"
                onClick={() => { setShowHistoryModal(false); setSelectedItem(null); }}
                className="rounded-lg bg-ink px-4 py-1.5 text-xs font-bold text-white hover:opacity-90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Page History Modal */}
      {showPageHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-lg rounded-lg border border-hairline-soft bg-surface-card p-6 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-hairline">
              <div>
                <h3 className="text-sm font-semibold text-ink">Procurement Workflow History</h3>
                <p className="text-[10px] text-muted-soft font-semibold mt-0.5">Timeline of all requisition actions and delivery events</p>
              </div>
              <button 
                onClick={() => setShowPageHistoryModal(false)}
                className="text-muted hover:text-ink text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* Scrollable vertical timeline */}
            <div className="mt-4 flex-1 overflow-y-auto pr-1 py-2 space-y-6 relative min-h-[300px]">
              {getGlobalHistory().length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-soft">
                  <Clock className="h-8 w-8 text-muted-soft mb-2 stroke-[1.5]" />
                  <p className="text-xs font-semibold">No workflow history logs found.</p>
                </div>
              ) : (
                <>
                  {/* Vertical dotted timeline line */}
                  <div className="absolute left-3 top-2 bottom-4 w-0.5 bg-canvas-soft border-l border-dashed border-hairline-strong"></div>
                  
                  {getGlobalHistory().map((event, index) => {
                    const statusName = statusNames[event.status] || event.status;
                    const colorClass = statusColors[event.status] || 'bg-muted-soft border-hairline';
                    
                    return (
                      <div key={index} className="relative pl-8 flex flex-col gap-1.5">
                        {/* Timeline dot */}
                        <div className={`absolute left-1.5 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white ${colorClass.split(' ')[0]}`} />
                        
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-normal text-ink uppercase tracking-wide">
                                {statusName}
                              </span>
                              <span className="text-[10px] font-semibold text-ink">
                                {event.materialName}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted font-medium">
                              Quantity: <span className="font-semibold text-ink">{event.quantity.toLocaleString()} {event.unit}</span> | Vendor: <span className="font-semibold text-ink">{event.vendor}</span>
                            </p>
                          </div>
                          <span className="text-[9px] font-bold text-muted-soft bg-canvas px-1.5 py-0.5 rounded border border-hairline-soft shrink-0">
                            {event.date}
                          </span>
                        </div>
                        
                        <div className="text-[10px] text-muted font-medium flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-soft" />
                          <span>Action by <span className="font-semibold text-ink">{event.user}</span></span>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            <div className="mt-6 pt-3 border-t border-hairline-soft flex justify-end">
              <button
                type="button"
                onClick={() => setShowPageHistoryModal(false)}
                className="rounded-lg bg-ink px-4 py-1.5 text-xs font-bold text-white hover:opacity-90 transition-colors"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
