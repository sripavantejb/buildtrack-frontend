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
  requested: 'bg-blue-500 border-blue-200 text-blue-500',
  approved: 'bg-purple-500 border-purple-200 text-purple-500',
  vendor_assigned: 'bg-indigo-500 border-indigo-200 text-indigo-500',
  po_created: 'bg-amber-500 border-amber-200 text-amber-500',
  delivered: 'bg-green-500 border-green-200 text-green-500'
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
    { id: 'requested', title: 'Requested', color: 'border-t-blue-500 bg-blue-500/5' },
    { id: 'approved', title: 'Approved', color: 'border-t-purple-500 bg-purple-500/5' },
    { id: 'vendor_assigned', title: 'Vendor Assigned', color: 'border-t-indigo-500 bg-indigo-500/5' },
    { id: 'po_created', title: 'PO Created', color: 'border-t-amber-500 bg-amber-500/5' },
    { id: 'delivered', title: 'Delivered', color: 'border-t-green-500 bg-green-500/5' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-800">Procurement Workflow</h2>
          <p className="text-[10px] text-slate-400 font-medium">Coordinate orders and verify supplier deliveries through visual columns.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowPageHistoryModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-premium transition-colors"
          >
            <Clock className="h-4 w-4 text-slate-500" />
            <span>Workflow History</span>
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-white hover:bg-primary-hover shadow-premium transition-colors"
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
                className={`rounded-xl border border-slate-200 border-t-4 ${col.color} p-4 flex flex-col min-w-[200px] h-full`}
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100/50">
                  <h4 className="text-xs font-bold text-slate-700">{col.title}</h4>
                  <span className="rounded bg-slate-200/60 px-1.5 py-0.5 text-[10px] font-bold text-slate-650">
                    {colItems.length}
                  </span>
                </div>

                {/* Column card listing */}
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[420px]">
                  {colItems.map((item) => (
                    <div 
                      key={item.id} 
                      className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-premium space-y-3"
                    >
                      <div>
                        <h5 className="text-xs font-bold text-slate-800 leading-snug">{item.material}</h5>
                        <div className="mt-1 flex items-center justify-between text-[10px] font-semibold text-slate-400">
                          <span>Qty: <span className="text-slate-650 font-bold">{item.quantity.toLocaleString()} {item.unit}</span></span>
                          <span>{formatRupees(item.cost)}</span>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-2.5 space-y-1 text-[9px] font-semibold text-slate-500">
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3 text-slate-400" />
                          <span className="truncate">Vendor: {item.vendor}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-slate-400" />
                          <span className="truncate">By: {item.requestedBy}</span>
                        </div>
                        {item.date && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            <span className="truncate">Updated: {item.date}</span>
                          </div>
                        )}
                      </div>

                      {/* Direction Transition Actions */}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[9px] font-bold">
                        <button 
                          disabled={col.id === 'requested'}
                          onClick={() => handleTransitionStatus(item.id, item.status, -1)}
                          className="flex h-5 w-5 items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-30"
                        >
                          <ArrowLeft className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setShowHistoryModal(true);
                          }}
                          className="px-2 py-0.5 rounded text-primary hover:bg-primary/5 transition-colors border border-primary/20 text-[8px] uppercase tracking-wider font-extrabold"
                        >
                          History
                        </button>
                        <button 
                          disabled={col.id === 'delivered'}
                          onClick={() => handleTransitionStatus(item.id, item.status, 1)}
                          className="flex h-5 w-5 items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-30"
                        >
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {colItems.length === 0 && (
                    <div className="h-24 flex items-center justify-center border border-dashed rounded-lg text-slate-350 text-[10px] font-medium">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-100 bg-white p-6 shadow-dropdown">
            <h3 className="text-sm font-bold text-slate-800">New Requisition Order</h3>
            
            <form onSubmit={handleCreateRequest} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Select Material</label>
                <select
                  required
                  value={newRequest.materialName}
                  onChange={e => setNewRequest({...newRequest, materialName: e.target.value})}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-primary focus:outline-none"
                >
                  <option value="">-- Choose Material --</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.name}>{m.name} ({m.unit})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Quantity</label>
                  <input 
                    type="number" 
                    required
                    value={newRequest.quantity}
                    onChange={e => setNewRequest({...newRequest, quantity: e.target.value})}
                    placeholder="e.g. 500"
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Unit Rate (₹)</label>
                  <input 
                    type="number" 
                    value={newRequest.unitRate}
                    onChange={e => setNewRequest({...newRequest, unitRate: e.target.value})}
                    placeholder="e.g. 450"
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Vendor Assignment</label>
                <input 
                  type="text" 
                  required
                  value={newRequest.vendor}
                  onChange={e => setNewRequest({...newRequest, vendor: e.target.value})}
                  placeholder="e.g. UltraTech Cements"
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
                  Submit Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Timeline Modal */}
      {showHistoryModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-100 bg-white p-6 shadow-dropdown flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-150">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Requisition History</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{selectedItem.material} ({selectedItem.quantity.toLocaleString()} {selectedItem.unit})</p>
              </div>
              <button 
                onClick={() => { setShowHistoryModal(false); setSelectedItem(null); }}
                className="text-slate-450 hover:text-slate-700 text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* Vertical Timeline Container */}
            <div className="mt-4 flex-1 overflow-y-auto pr-1 py-2 space-y-6 relative">
              {/* Vertical dotted/solid line */}
              <div className="absolute left-3 top-2 bottom-4 w-0.5 bg-slate-100 border-l border-dashed border-slate-350"></div>

              {(selectedItem.history || []).map((event, index) => {
                const statusName = statusNames[event.status] || event.status;
                const colorClass = statusColors[event.status] || 'bg-slate-400 border-slate-200';
                
                return (
                  <div key={index} className="relative pl-8 flex flex-col gap-1">
                    {/* Timeline dot */}
                    <div className={`absolute left-1.5 top-1 h-3.5 w-3.5 rounded-full border-2 border-white shadow-md ${colorClass.split(' ')[0]}`} />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                        {statusName}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                        {event.date}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                      <User className="h-3 w-3 text-slate-400" />
                      <span>Updated by <span className="font-semibold text-slate-700">{event.user}</span></span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => { setShowHistoryModal(false); setSelectedItem(null); }}
                className="rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-750 shadow-premium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Page History Modal */}
      {showPageHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-100 bg-white p-6 shadow-dropdown flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-150">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Procurement Workflow History</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Timeline of all requisition actions and delivery events</p>
              </div>
              <button 
                onClick={() => setShowPageHistoryModal(false)}
                className="text-slate-450 hover:text-slate-700 text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* Scrollable vertical timeline */}
            <div className="mt-4 flex-1 overflow-y-auto pr-1 py-2 space-y-6 relative min-h-[300px]">
              {getGlobalHistory().length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                  <Clock className="h-8 w-8 text-slate-350 mb-2 stroke-[1.5]" />
                  <p className="text-xs font-semibold">No workflow history logs found.</p>
                </div>
              ) : (
                <>
                  {/* Vertical dotted timeline line */}
                  <div className="absolute left-3 top-2 bottom-4 w-0.5 bg-slate-100 border-l border-dashed border-slate-350"></div>
                  
                  {getGlobalHistory().map((event, index) => {
                    const statusName = statusNames[event.status] || event.status;
                    const colorClass = statusColors[event.status] || 'bg-slate-400 border-slate-200';
                    
                    return (
                      <div key={index} className="relative pl-8 flex flex-col gap-1.5">
                        {/* Timeline dot */}
                        <div className={`absolute left-1.5 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white shadow-md ${colorClass.split(' ')[0]}`} />
                        
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                                {statusName}
                              </span>
                              <span className="text-[10px] font-bold text-slate-700">
                                {event.materialName}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium">
                              Quantity: <span className="font-semibold text-slate-700">{event.quantity.toLocaleString()} {event.unit}</span> | Vendor: <span className="font-semibold text-slate-700">{event.vendor}</span>
                            </p>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 shrink-0">
                            {event.date}
                          </span>
                        </div>
                        
                        <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                          <User className="h-3 w-3 text-slate-400" />
                          <span>Action by <span className="font-semibold text-slate-700">{event.user}</span></span>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPageHistoryModal(false)}
                className="rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-750 shadow-premium transition-colors"
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
