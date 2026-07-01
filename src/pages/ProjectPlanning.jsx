import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { 
  Edit2, 
  Trash2, 
  Plus, 
  Download, 
  Check, 
  Info,
  Calendar,
  Building,
  DollarSign,
  Maximize2,
  Filter,
  Eye
} from 'lucide-react';
import { api } from '../services/api';
import { formatRupees } from './Dashboard';

export default function ProjectPlanning({ project, setProject }) {
  const navigate = useNavigate();
  const [details, setDetails] = useState({ ...project });
  const [phases, setPhases] = useState(project.phases || []);
  const [materials, setMaterials] = useState([]);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [showAddPhase, setShowAddPhase] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showColFilterDropdown, setShowColFilterDropdown] = useState(false);
  const [hiddenMaterialIds, setHiddenMaterialIds] = useState([]);
  const [hiddenColumnIds, setHiddenColumnIds] = useState([]);

  const toggleMaterialVisibility = (id) => {
    setHiddenMaterialIds(prev => 
      prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
    );
  };

  const handleSelectAllMaterials = () => {
    setHiddenMaterialIds([]);
  };

  const handleDeselectAllMaterials = () => {
    setHiddenMaterialIds(materials.map(m => m.id));
  };

  const toggleColumnVisibility = (colId) => {
    setHiddenColumnIds(prev =>
      prev.includes(colId) ? prev.filter(id => id !== colId) : [...prev, colId]
    );
  };

  const handleSelectAllColumns = () => {
    setHiddenColumnIds([]);
  };

  const handleDeselectAllColumns = () => {
    setHiddenColumnIds(allColumns.map(c => c.id));
  };

  const allColumns = [
    { id: 'material', name: 'Material' },
    { id: 'unit', name: 'Unit' },
    ...phases.map(ph => ({ id: ph.id, name: `${ph.name} (Qty)` })),
    { id: 'planned', name: 'Total Planned Qty' },
    { id: 'rate', name: 'Unit Rate' },
    { id: 'cost', name: 'Total Cost' },
    { id: 'actions', name: 'Actions' }
  ];

  useEffect(() => {
    const handleOutsideClick = (e) => {
      const btn = document.getElementById('filter-materials-btn');
      if (btn && !btn.contains(e.target)) {
        setShowFilterDropdown(false);
      }
    };
    if (showFilterDropdown) {
      document.addEventListener('click', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [showFilterDropdown]);

  useEffect(() => {
    const handleColOutsideClick = (e) => {
      const btn = document.getElementById('filter-columns-btn');
      if (btn && !btn.contains(e.target)) {
        setShowColFilterDropdown(false);
      }
    };
    if (showColFilterDropdown) {
      document.addEventListener('click', handleColOutsideClick);
    }
    return () => {
      document.removeEventListener('click', handleColOutsideClick);
    };
  }, [showColFilterDropdown]);

  const [newMat, setNewMat] = useState({
    name: '',
    unit: 'Bags',
    planned: '',
    unitRate: ''
  });

  const [newMatPhases, setNewMatPhases] = useState({});

  const [newPhase, setNewPhase] = useState({
    name: '',
    targetArea: '',
    duration: '',
    budget: '',
    status: 'Upcoming'
  });

  const [showEditPhase, setShowEditPhase] = useState(false);
  const [editPhaseData, setEditPhaseData] = useState({
    id: '',
    name: '',
    targetArea: '',
    duration: '',
    budget: '',
    status: 'Upcoming'
  });

  useEffect(() => {
    setDetails({ ...project });
    setPhases(project.phases || []);
  }, [project]);

  const handleAddPhase = async (e) => {
    e.preventDefault();
    if (!newPhase.name || !newPhase.targetArea || !newPhase.duration || !newPhase.budget) return;

    try {
      const created = await api.addProjectPhase(project.id, {
        name: newPhase.name,
        targetArea: newPhase.targetArea,
        duration: newPhase.duration,
        budget: Number(newPhase.budget),
        status: newPhase.status
      });
      setPhases([...phases, created]);
      setShowAddPhase(false);
      setNewPhase({
        name: '',
        targetArea: '',
        duration: '',
        budget: '',
        status: 'Upcoming'
      });
      if (setProject) {
        const updatedProj = await api.getProjectById(project.id);
        setProject(updatedProj);
      }
    } catch (err) {
      console.error("Error adding project phase:", err);
    }
  };

  const handleEditPhase = async (e) => {
    e.preventDefault();
    if (!editPhaseData.name || !editPhaseData.targetArea || !editPhaseData.duration || !editPhaseData.budget) return;

    try {
      const updated = await api.updateProjectPhase(project.id, editPhaseData.id, {
        name: editPhaseData.name,
        targetArea: editPhaseData.targetArea,
        duration: editPhaseData.duration,
        budget: Number(editPhaseData.budget),
        status: editPhaseData.status
      });
      if (updated) {
        setPhases(phases.map(p => p.id === editPhaseData.id ? updated : p));
        setShowEditPhase(false);
        if (setProject) {
          const updatedProj = await api.getProjectById(project.id);
          setProject(updatedProj);
        }
      }
    } catch (err) {
      console.error("Error updating project phase:", err);
    }
  };

  const handleStartEditPhase = (ph) => {
    setEditPhaseData({
      id: ph.id,
      name: ph.name,
      targetArea: ph.targetArea,
      duration: ph.duration,
      budget: ph.budget,
      status: ph.status || 'Upcoming'
    });
    setShowEditPhase(true);
  };

  const handleDeletePhase = async (phaseId) => {
    if (!window.confirm("Are you sure you want to delete this project phase?")) return;

    try {
      await api.deleteProjectPhase(project.id, phaseId);
      setPhases(phases.filter(p => p.id !== phaseId));
      if (setProject) {
        const updatedProj = await api.getProjectById(project.id);
        setProject(updatedProj);
      }
    } catch (err) {
      console.error("Error deleting project phase:", err);
    }
  };

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setLoading(true);
        const data = await api.getMaterials(project.id);
        setMaterials(data);
      } catch (err) {
        console.error("Error loading planned materials:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, [project.id]);

  const handleSaveDetails = async () => {
    try {
      const updated = await api.updateProject(project.id, {
        area: Number(details.area),
        budget: Number(details.budget),
        duration: details.duration,
        startDate: details.startDate,
        endDate: details.endDate
      });
      if (updated) {
        setProject(updated);
        setIsEditingDetails(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    if (!newMat.name || !newMat.unitRate) return;

    let totalPlanned = 0;
    const phasePayload = {};

    if (phases.length > 0) {
      phases.forEach(phase => {
        const qty = Number(newMatPhases[phase.id]) || 0;
        phasePayload[phase.id] = qty;
        totalPlanned += qty;
      });
    } else {
      if (!newMat.planned) return;
      totalPlanned = Number(newMat.planned) || 0;
    }

    try {
      const created = await api.addMaterial(project.id, {
        name: newMat.name,
        unit: newMat.unit,
        planned: totalPlanned,
        unitRate: Number(newMat.unitRate),
        purchased: 0,
        used: 0,
        ...phasePayload
      });
      setMaterials([...materials, created]);
      setShowAddMaterial(false);
      setNewMat({ name: '', unit: 'Bags', planned: '', unitRate: '' });
      setNewMatPhases({});
      if (setProject) {
        const updatedProj = await api.getProjectById(project.id);
        setProject(updatedProj);
      }
    } catch (err) {
      console.error(err);
    }
  };
 
  const handleUpdateMaterialRate = async (id, rate) => {
    try {
      const updated = await api.updateMaterial(project.id, id, { unitRate: Number(rate) });
      if (updated) {
        setMaterials(materials.map(m => m.id === id ? updated : m));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateMaterialPhaseQty = async (materialId, phaseId, newQtyVal) => {
    const qty = Number(newQtyVal) || 0;
    const targetMat = materials.find(m => m.id === materialId);
    if (!targetMat) return;

    const updatedPhases = { ...targetMat, [phaseId]: qty };
    const newTotal = phases.reduce((sum, phase) => {
      const pQty = updatedPhases[phase.id] !== undefined ? updatedPhases[phase.id] : 0;
      return sum + pQty;
    }, 0);

    try {
      const updated = await api.updateMaterial(project.id, materialId, {
        [phaseId]: qty,
        planned: newTotal
      });
      if (updated) {
        setMaterials(materials.map(m => m.id === materialId ? updated : m));
        if (setProject) {
          const updatedProj = await api.getProjectById(project.id);
          setProject(updatedProj);
        }
      }
    } catch (err) {
      console.error("Error updating phase quantity:", err);
    }
  };

  const handleUpdateMaterialTotalQty = async (materialId, newTotalVal) => {
    const total = Number(newTotalVal) || 0;
    try {
      const updated = await api.updateMaterial(project.id, materialId, {
        planned: total
      });
      if (updated) {
        setMaterials(materials.map(m => m.id === materialId ? updated : m));
        if (setProject) {
          const updatedProj = await api.getProjectById(project.id);
          setProject(updatedProj);
        }
      }
    } catch (err) {
      console.error("Error updating total quantity:", err);
    }
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.name.split('.').pop().toLowerCase();
    const reader = new FileReader();

    if (fileType === 'csv') {
      reader.onload = async (evt) => {
        try {
          const text = evt.target.result;
          await parseAndImportCSV(text);
        } catch (err) {
          console.error(err);
          alert("Error parsing CSV. Format should be: MaterialName,Unit,PlannedQty,UnitRate");
        }
      };
      reader.readAsText(file);
    } else if (fileType === 'xlsx' || fileType === 'xls') {
      reader.onload = async (evt) => {
        try {
          const data = new Uint8Array(evt.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          
          let importCount = 0;
          // Format expected: Row 0 is headers (Material, Unit, PlannedQty, UnitRate)
          // Data starts at Row 1
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length < 4) continue;
            
            const name = String(row[0] || '').trim();
            const unit = String(row[1] || '').trim();
            const planned = Number(row[2]);
            const unitRate = Number(row[3]);
            
            if (isNaN(planned) || isNaN(unitRate) || !name) continue;
            
            await api.addMaterial(project.id, {
              name,
              unit,
              planned,
              unitRate,
              purchased: 0,
              used: 0
            });
            importCount++;
          }
          
          const updatedList = await api.getMaterials(project.id);
          setMaterials(updatedList);
          if (setProject) {
            const updatedProj = await api.getProjectById(project.id);
            setProject(updatedProj);
          }
          alert(`Successfully imported ${importCount} baseline materials from Excel!`);
        } catch (err) {
          console.error(err);
          alert("Error parsing Excel file. Ensure sheet contains headers in the first row and data in columns: Material, Unit, PlannedQty, UnitRate");
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert("Unsupported file format. Please upload a .csv, .xlsx, or .xls file.");
    }
  };

  const parseAndImportCSV = async (text) => {
    const lines = text.split(/\r?\n/);
    let importCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split(',');
      if (parts.length < 4) continue;
      
      const name = parts[0].trim();
      const unit = parts[1].trim();
      const planned = Number(parts[2].trim());
      const unitRate = Number(parts[3].trim());
      
      if (isNaN(planned) || isNaN(unitRate) || !name) continue;
      
      await api.addMaterial(project.id, {
        name,
        unit,
        planned,
        unitRate,
        purchased: 0,
        used: 0
      });
      importCount++;
    }
    
    const updatedList = await api.getMaterials(project.id);
    setMaterials(updatedList);
    if (setProject) {
      const updatedProj = await api.getProjectById(project.id);
      setProject(updatedProj);
    }
    alert(`Successfully imported ${importCount} baseline materials from CSV!`);
  };

  const handleDeleteMaterial = async (id) => {
    if (!window.confirm("Are you sure you want to delete this baseline material?")) return;
    try {
      await api.deleteMaterial(project.id, id);
      setMaterials(materials.filter(m => m.id !== id));
      if (setProject) {
        const updatedProj = await api.getProjectById(project.id);
        setProject(updatedProj);
      }
    } catch (err) {
      console.error("Error deleting baseline material:", err);
    }
  };

  const totalEstimatedCost = materials.reduce((sum, m) => sum + (m.planned * m.unitRate), 0);
  const displayedMaterials = materials.filter(m => !hiddenMaterialIds.includes(m.id));
  
  const visibleColumnsCount = 1 + (hiddenColumnIds.includes('material') ? 0 : 1)
    + (hiddenColumnIds.includes('unit') ? 0 : 1)
    + phases.filter(ph => !hiddenColumnIds.includes(ph.id)).length
    + (hiddenColumnIds.includes('planned') ? 0 : 1)
    + (hiddenColumnIds.includes('rate') ? 0 : 1)
    + (hiddenColumnIds.includes('cost') ? 0 : 1)
    + (hiddenColumnIds.includes('actions') ? 0 : 1);

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="page-header">
        <div>
          <h2 className="text-base font-normal text-ink">Project Planning</h2>
          <p className="text-[10px] text-muted-soft font-medium">Define project details, phases, and baseline material plan.</p>
        </div>
        <div className="page-header-actions">
          {isEditingDetails ? (
            <button 
              onClick={handleSaveDetails}
              className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-active transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
              Save Details
            </button>
          ) : (
            <button 
              onClick={() => setIsEditingDetails(true)}
              className="flex items-center gap-1 rounded-lg border border-hairline bg-surface-card px-3 py-1.5 text-xs font-bold text-body hover:bg-canvas transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5 text-muted-soft" />
              Edit Details
            </button>
          )}
        </div>
      </div>

      {/* Project Details Grid */}
      <div className="rounded-lg border border-hairline bg-surface-card p-5">
        <h4 className="text-xs font-semibold text-ink mb-4">Project Details</h4>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-timeline-read/20 text-timeline-read">
              <Building className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-muted-soft uppercase tracking-wider">Area (SFT)</p>
              {isEditingDetails ? (
                <input 
                  type="number"
                  value={details.area || ''}
                  onChange={e => setDetails({ ...details, area: e.target.value })}
                  className="mt-0.5 w-full rounded border border-hairline px-1 py-0.5 text-xs font-bold focus:outline-none"
                />
              ) : (
                <p className="text-xs font-semibold text-ink mt-0.5">{Number(project.area || 0).toLocaleString()} SFT</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-canvas-soft text-primary">
              <Calendar className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-muted-soft uppercase tracking-wider">Duration</p>
              {isEditingDetails ? (
                <input 
                  type="text"
                  value={details.duration || ''}
                  onChange={e => setDetails({ ...details, duration: e.target.value })}
                  className="mt-0.5 w-full rounded border border-hairline px-1 py-0.5 text-xs font-bold focus:outline-none"
                />
              ) : (
                <p className="text-xs font-semibold text-ink mt-0.5">{project.duration}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-timeline-grep/20 text-success">
              <Calendar className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-muted-soft uppercase tracking-wider">Start Date</p>
              {isEditingDetails ? (
                <input 
                  type="date"
                  value={details.startDate || ''}
                  onChange={e => setDetails({ ...details, startDate: e.target.value })}
                  className="mt-0.5 w-full rounded border border-hairline px-1 py-0.5 text-xs focus:outline-none"
                />
              ) : (
                <p className="text-xs font-semibold text-ink mt-0.5">{project.startDate}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-canvas-soft text-error">
              <Calendar className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-muted-soft uppercase tracking-wider">End Date</p>
              {isEditingDetails ? (
                <input 
                  type="date"
                  value={details.endDate || ''}
                  onChange={e => setDetails({ ...details, endDate: e.target.value })}
                  className="mt-0.5 w-full rounded border border-hairline px-1 py-0.5 text-xs focus:outline-none"
                />
              ) : (
                <p className="text-xs font-semibold text-ink mt-0.5">{project.endDate}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 lg:col-span-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-timeline-thinking/20 text-timeline-done">
              <DollarSign className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-muted-soft uppercase tracking-wider">Total Budget</p>
              {isEditingDetails ? (
                <input 
                  type="number"
                  value={details.budget || ''}
                  onChange={e => setDetails({ ...details, budget: e.target.value })}
                  className="mt-0.5 w-full rounded border border-hairline px-1 py-0.5 text-xs font-bold focus:outline-none"
                />
              ) : (
                <p className="text-xs font-black text-ink mt-0.5">{formatRupees(project.budget)}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Project Phases */}
      <div className="rounded-lg border border-hairline bg-surface-card p-5">
        <div className="page-header mb-4">
          <h4 className="text-xs font-semibold text-ink">Project Phases</h4>
          <button 
            onClick={() => setShowAddPhase(true)}
            className="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary-hover"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Phase</span>
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {phases.length > 0 ? (
            phases.map((ph, idx) => (
              <div key={ph.id || idx} className="rounded-lg border border-hairline p-4 relative bg-canvas/20">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-muted-soft">Phase {idx + 1}</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleStartEditPhase(ph)}
                      className="text-muted-soft hover:text-primary transition-colors p-0.5 rounded hover:bg-canvas-soft"
                      title="Edit Phase"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDeletePhase(ph.id)}
                      className="text-muted-soft hover:text-error transition-colors p-0.5 rounded hover:bg-canvas-soft"
                      title="Delete Phase"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold ${
                      ph.status === 'Active' ? 'bg-timeline-grep/20 text-success border border-hairline' : 'bg-canvas-soft text-muted'
                    }`}>
                      {ph.status}
                    </span>
                  </div>
                </div>
                <h5 className="mt-2 text-xs font-semibold text-ink">{ph.name}</h5>
                <div className="mt-4 grid grid-cols-1 gap-2 border-t border-hairline-soft pt-3 text-[10px] font-semibold text-muted sm:grid-cols-3">
                  <div>
                    <p className="text-[8px] text-muted-soft">Target Area</p>
                    <p className="mt-0.5 text-ink">{ph.targetArea}</p>
                  </div>
                  <div>
                    <p className="text-[8px] text-muted-soft">Duration</p>
                    <p className="mt-0.5 text-ink truncate">{ph.duration.split(' ')[2] || ph.duration}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] text-muted-soft">Budget</p>
                    <p className="mt-0.5 text-ink">{formatRupees(ph.budget)}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 py-6 text-center text-xs text-muted-soft border border-dashed rounded-lg">
              No phases defined for this project.
            </div>
          )}
        </div>
      </div>

      {/* Planned Materials Baseline Matrix */}
      <div className="rounded-lg border border-hairline bg-surface-card p-4 sm:p-5 overflow-hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-ink">Planned Materials (Baseline)</h4>
            <p className="text-[9px] text-muted-soft font-semibold mt-0.5">Baseline estimation quantity and costing for materials</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Dropdown */}
            <div className="relative">
              <button
                id="filter-materials-btn"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center gap-1.5 rounded-lg border border-hairline bg-surface-card px-2.5 py-1.5 text-[10px] font-bold text-body hover:bg-canvas transition-colors sm:px-3"
              >
                <Filter className="h-3.5 w-3.5 shrink-0 text-muted-soft" />
                <span className="whitespace-nowrap">
                  <span className="sm:hidden">Rows </span>
                  <span className="hidden sm:inline">Filter Rows </span>
                  ({materials.length - hiddenMaterialIds.length}/{materials.length})
                </span>
              </button>

              {showFilterDropdown && (
                <div className="absolute left-0 sm:left-auto sm:right-0 mt-1.5 z-40 w-[min(calc(100vw-2rem),14rem)] rounded-lg border border-hairline bg-surface-card p-3 flex flex-col gap-2 max-h-80 overflow-y-auto animate-fade-in">
                  <div className="flex items-center justify-between pb-1.5 border-b border-hairline-soft text-[10px] font-bold text-muted-soft uppercase tracking-wider">
                    <span>Show/Hide Rows</span>
                    <div className="flex gap-2 text-primary lowercase font-semibold">
                      <button onClick={handleSelectAllMaterials} className="hover:underline">All</button>
                      <span className="text-hairline">|</span>
                      <button onClick={handleDeselectAllMaterials} className="hover:underline">None</button>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 overflow-y-auto max-h-60 pr-0.5">
                    {materials.map(mat => {
                      const isVisible = !hiddenMaterialIds.includes(mat.id);
                      return (
                        <label 
                          key={mat.id}
                          className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-canvas cursor-pointer text-xs font-semibold text-ink transition-colors"
                        >
                          <input 
                            type="checkbox"
                            checked={isVisible}
                            onChange={() => toggleMaterialVisibility(mat.id)}
                            className="h-3.5 w-3.5 rounded border-hairline-strong text-primary focus:ring-primary focus:ring-0 cursor-pointer"
                          />
                          <span className="truncate">{mat.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Filter Columns Dropdown */}
            <div className="relative">
              <button
                id="filter-columns-btn"
                onClick={() => setShowColFilterDropdown(!showColFilterDropdown)}
                className="flex items-center gap-1.5 rounded-lg border border-hairline bg-surface-card px-2.5 py-1.5 text-[10px] font-bold text-body hover:bg-canvas transition-colors sm:px-3"
              >
                <Filter className="h-3.5 w-3.5 shrink-0 text-muted-soft" />
                <span className="whitespace-nowrap">
                  <span className="sm:hidden">Cols </span>
                  <span className="hidden sm:inline">Filter Columns </span>
                  ({allColumns.length - hiddenColumnIds.length}/{allColumns.length})
                </span>
              </button>

              {showColFilterDropdown && (
                <div className="absolute left-0 sm:left-auto sm:right-0 mt-1.5 z-40 w-[min(calc(100vw-2rem),14rem)] rounded-lg border border-hairline bg-surface-card p-3 flex flex-col gap-2 max-h-80 overflow-y-auto animate-fade-in">
                  <div className="flex items-center justify-between pb-1.5 border-b border-hairline-soft text-[10px] font-bold text-muted-soft uppercase tracking-wider">
                    <span>Show/Hide Columns</span>
                    <div className="flex gap-2 text-primary lowercase font-semibold">
                      <button onClick={handleSelectAllColumns} className="hover:underline">All</button>
                      <span className="text-hairline">|</span>
                      <button onClick={handleDeselectAllColumns} className="hover:underline">None</button>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 overflow-y-auto max-h-60 pr-0.5">
                    {allColumns.map(col => {
                      const isVisible = !hiddenColumnIds.includes(col.id);
                      return (
                        <label 
                          key={col.id}
                          className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-canvas cursor-pointer text-xs font-semibold text-ink transition-colors"
                        >
                          <input 
                            type="checkbox"
                            checked={isVisible}
                            onChange={() => toggleColumnVisibility(col.id)}
                            className="h-3.5 w-3.5 rounded border-hairline-strong text-primary focus:ring-primary focus:ring-0 cursor-pointer"
                          />
                          <span className="truncate">{col.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <label className="flex items-center gap-1.5 rounded-lg border border-hairline bg-surface-card px-2.5 py-1.5 text-[10px] font-bold text-body hover:bg-canvas transition-colors cursor-pointer sm:px-3">
              <Download className="h-3.5 w-3.5 shrink-0 text-muted-soft" />
              <span className="whitespace-nowrap">
                <span className="sm:hidden">Import</span>
                <span className="hidden sm:inline">Import Excel/CSV</span>
              </span>
              <input 
                type="file" 
                accept=".csv, .xlsx, .xls" 
                onChange={handleImportFile} 
                className="hidden" 
              />
            </label>
            <button 
              onClick={() => setShowAddMaterial(true)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-primary-active transition-colors sm:px-3"
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">Add Material</span>
            </button>
          </div>
        </div>

        {/* Spreadsheet Matrix Table */}
        <div className="table-scroll -mx-1 overflow-x-auto border border-hairline-soft rounded-lg px-1">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-canvas border-b border-hairline text-muted font-bold">
                <th className="py-2.5 px-4 font-bold text-[10px] uppercase w-12 text-center">#</th>
                {!hiddenColumnIds.includes('material') && <th className="py-2.5 px-3 font-bold text-[10px] uppercase min-w-[150px]">Material</th>}
                {!hiddenColumnIds.includes('unit') && <th className="py-2.5 px-3 font-bold text-[10px] uppercase w-20">Unit</th>}
                {phases.map((phase) => {
                  if (hiddenColumnIds.includes(phase.id)) return null;
                  return (
                    <th key={phase.id} className="py-2.5 px-3 font-bold text-[10px] uppercase text-right w-28 max-w-[120px] truncate">
                      {phase.name} (Qty)
                    </th>
                  );
                })}
                {!hiddenColumnIds.includes('planned') && <th className="py-2.5 px-3 font-bold text-[10px] uppercase text-right w-36">Total Planned Qty</th>}
                {!hiddenColumnIds.includes('rate') && <th className="py-2.5 px-3 font-bold text-[10px] uppercase text-right w-24">Unit Rate</th>}
                {!hiddenColumnIds.includes('cost') && <th className="py-2.5 px-4 font-bold text-[10px] uppercase text-right w-36">Total Cost</th>}
                {!hiddenColumnIds.includes('actions') && <th className="py-2.5 px-4 font-bold text-[10px] uppercase text-center w-20">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline-soft font-medium text-ink">
              {loading ? (
                <tr>
                  <td colSpan={visibleColumnsCount} className="py-8 text-center text-muted-soft">Loading materials baseline matrix...</td>
                </tr>
              ) : displayedMaterials.length > 0 ? (
                displayedMaterials.map((mat, idx) => (
                  <tr key={mat.id} className="hover:bg-canvas/50 transition-colors">
                    <td className="py-2 px-4 text-center font-bold text-muted-soft">{idx + 1}</td>
                    {!hiddenColumnIds.includes('material') && <td className="py-2 px-3 font-semibold text-ink">{mat.name}</td>}
                    {!hiddenColumnIds.includes('unit') && <td className="py-2 px-3 text-muted">{mat.unit}</td>}
                    {phases.map((phase) => {
                      if (hiddenColumnIds.includes(phase.id)) return null;
                      const phaseQty = mat[phase.id] !== undefined ? mat[phase.id] : 0;
                      return (
                        <td key={phase.id} className="py-2 px-3 text-right">
                          <input 
                            type="number"
                            value={phaseQty}
                            onChange={(e) => handleUpdateMaterialPhaseQty(mat.id, phase.id, e.target.value)}
                            className="w-16 rounded border border-hairline px-1 py-0.5 text-right text-xs focus:border-primary focus:outline-none"
                          />
                        </td>
                      );
                    })}
                    {!hiddenColumnIds.includes('planned') && (
                      <td className="py-2 px-3 text-right">
                        {phases.length > 0 ? (
                          <span className="font-semibold text-ink">{Number(mat.planned || 0).toLocaleString()}</span>
                        ) : (
                          <input 
                            type="number"
                            value={mat.planned}
                            onChange={(e) => handleUpdateMaterialTotalQty(mat.id, e.target.value)}
                            className="w-16 rounded border border-hairline px-1 py-0.5 text-right text-xs focus:border-primary focus:outline-none"
                          />
                        )}
                      </td>
                    )}
                    {!hiddenColumnIds.includes('rate') && (
                      <td className="py-2 px-3 text-right">
                        <input 
                          type="number"
                          defaultValue={mat.unitRate}
                          onBlur={(e) => handleUpdateMaterialRate(mat.id, e.target.value)}
                          className="w-16 rounded border border-hairline px-1 py-0.5 text-right text-xs focus:border-primary focus:outline-none"
                        />
                      </td>
                    )}
                    {!hiddenColumnIds.includes('cost') && (
                      <td className="py-2 px-4 text-right font-semibold text-ink">
                        {formatRupees(mat.planned * mat.unitRate)}
                      </td>
                    )}
                    {!hiddenColumnIds.includes('actions') && (
                      <td className="py-2 px-4 text-center">
                        <button 
                          onClick={() => handleDeleteMaterial(mat.id)}
                          className="text-error hover:text-red-700 p-1 rounded hover:bg-canvas-soft transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={visibleColumnsCount} className="py-8 text-center text-muted-soft">
                    {materials.length > 0 ? "All materials hidden by filter." : "No baseline materials configured yet."}
                  </td>
                </tr>
              )}
            </tbody>
            {/* Table Summation Footer */}
            {!loading && materials.length > 0 && (
              <tfoot>
                <tr className="bg-canvas/50 border-t-2 border-hairline font-semibold text-ink">
                  {!hiddenColumnIds.includes('cost') ? (
                    <>
                      <td 
                        colSpan={visibleColumnsCount - (hiddenColumnIds.includes('actions') ? 1 : 2)} 
                        className="py-3 px-4 text-left font-normal text-[10px] uppercase text-muted-soft tracking-wider"
                      >
                        Total Estimated Baseline Cost
                      </td>
                      <td className="py-3 px-4 text-right font-black text-primary text-sm">
                        {formatRupees(totalEstimatedCost)}
                      </td>
                      {!hiddenColumnIds.includes('actions') && <td></td>}
                    </>
                  ) : (
                    <td 
                      colSpan={visibleColumnsCount} 
                      className="py-3 px-4 text-right font-normal text-ink"
                    >
                      Total Estimated Baseline Cost: <span className="font-black text-primary text-sm ml-2">{formatRupees(totalEstimatedCost)}</span>
                    </td>
                  )}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Add Material Modal */}
      {showAddMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-sm rounded-lg border border-hairline-soft bg-surface-card p-6">
            <h3 className="text-sm font-semibold text-ink">Add Planned Material</h3>
            
            <form onSubmit={handleAddMaterial} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[10px] font-semibold text-ink mb-1">Material Name</label>
                <input 
                  type="text" 
                  required
                  value={newMat.name}
                  onChange={e => setNewMat({...newMat, name: e.target.value})}
                  placeholder="e.g. Cement (53 Grade)"
                  className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink placeholder:text-muted-soft focus:border-primary focus:outline-none"
                />
              </div>

              <div className={phases.length > 0 ? "block" : "form-grid-2"}>
                <div className={phases.length > 0 ? "mb-3.5" : ""}>
                  <label className="block text-[10px] font-semibold text-ink mb-1">Unit</label>
                  <select
                    value={newMat.unit}
                    onChange={e => setNewMat({...newMat, unit: e.target.value})}
                    className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
                  >
                    <option>Bags</option>
                    <option>Tons</option>
                    <option>Loads</option>
                    <option>Nos</option>
                    <option>Cum</option>
                    <option>Sheets</option>
                    <option>Kg</option>
                    <option>Lump Sum</option>
                    <option>Liters</option>
                    <option>SFT</option>
                  </select>
                </div>
                {phases.length === 0 && (
                  <div>
                    <label className="block text-[10px] font-semibold text-ink mb-1">Planned Qty</label>
                    <input 
                      type="number" 
                      required
                      value={newMat.planned}
                      onChange={e => setNewMat({...newMat, planned: e.target.value})}
                      placeholder="e.g. 1000"
                      className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {phases.length > 0 && (
                <div className="border border-hairline-soft rounded-lg p-3 bg-canvas/50 space-y-2 max-h-36 overflow-y-auto">
                  <span className="block text-[10px] font-bold text-muted uppercase">Phase Breakdown Qty</span>
                  {phases.map((phase) => (
                    <div key={phase.id} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-body truncate max-w-[160px] font-medium">{phase.name}</span>
                      <input 
                        type="number"
                        placeholder="Qty"
                        value={newMatPhases[phase.id] || ''}
                        onChange={(e) => setNewMatPhases({
                          ...newMatPhases,
                          [phase.id]: e.target.value
                        })}
                        className="w-24 rounded border border-hairline px-2 py-1 text-xs text-right focus:border-primary focus:outline-none bg-surface-card font-medium"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-semibold text-ink mb-1">Estimated Unit Rate (₹)</label>
                <input 
                  type="number" 
                  required
                  value={newMat.unitRate}
                  onChange={e => setNewMat({...newMat, unitRate: e.target.value})}
                  placeholder="e.g. 450"
                  className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => {
                    setShowAddMaterial(false);
                    setNewMatPhases({});
                  }}
                  className="rounded-lg border border-hairline bg-surface-card px-4 py-1.5 text-xs font-bold text-body hover:bg-canvas transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-active transition-colors"
                >
                  Add Baseline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Phase Modal */}
      {showAddPhase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-sm rounded-lg border border-hairline-soft bg-surface-card p-6">
            <h3 className="text-sm font-semibold text-ink">Add Project Phase</h3>
            
            <form onSubmit={handleAddPhase} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[10px] font-semibold text-ink mb-1">Phase Name</label>
                <input 
                  type="text" 
                  required
                  value={newPhase.name}
                  onChange={e => setNewPhase({...newPhase, name: e.target.value})}
                  placeholder="e.g. Foundation & Columns"
                  className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink placeholder:text-muted-soft focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-ink mb-1">Target Area</label>
                <input 
                  type="text" 
                  required
                  value={newPhase.targetArea}
                  onChange={e => setNewPhase({...newPhase, targetArea: e.target.value})}
                  placeholder="e.g. 20,000 SFT"
                  className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink placeholder:text-muted-soft focus:border-primary focus:outline-none"
                />
              </div>

              <div className="form-grid-2">
                <div>
                  <label className="block text-[10px] font-semibold text-ink mb-1">Duration</label>
                  <input 
                    type="text" 
                    required
                    value={newPhase.duration}
                    onChange={e => setNewPhase({...newPhase, duration: e.target.value})}
                    placeholder="e.g. 01 May - 30 Jun"
                    className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink placeholder:text-muted-soft focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-ink mb-1">Budget (₹)</label>
                  <input 
                    type="number" 
                    required
                    value={newPhase.budget}
                    onChange={e => setNewPhase({...newPhase, budget: e.target.value})}
                    placeholder="e.g. 12000000"
                    className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-ink mb-1">Status</label>
                <select
                  value={newPhase.status}
                  onChange={e => setNewPhase({...newPhase, status: e.target.value})}
                  className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
                >
                  <option>Active</option>
                  <option>Upcoming</option>
                  <option>Completed</option>
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowAddPhase(false)}
                  className="rounded-lg border border-hairline bg-surface-card px-4 py-1.5 text-xs font-bold text-body hover:bg-canvas transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-active transition-colors"
                >
                  Add Phase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Phase Modal */}
      {showEditPhase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-sm rounded-lg border border-hairline-soft bg-surface-card p-6">
            <h3 className="text-sm font-semibold text-ink">Edit Project Phase</h3>
            
            <form onSubmit={handleEditPhase} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[10px] font-semibold text-ink mb-1">Phase Name</label>
                <input 
                  type="text" 
                  required
                  value={editPhaseData.name}
                  onChange={e => setEditPhaseData({...editPhaseData, name: e.target.value})}
                  placeholder="e.g. Foundation & Columns"
                  className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink placeholder:text-muted-soft focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-ink mb-1">Target Area</label>
                <input 
                  type="text" 
                  required
                  value={editPhaseData.targetArea}
                  onChange={e => setEditPhaseData({...editPhaseData, targetArea: e.target.value})}
                  placeholder="e.g. 20,000 SFT"
                  className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink placeholder:text-muted-soft focus:border-primary focus:outline-none"
                />
              </div>

              <div className="form-grid-2">
                <div>
                  <label className="block text-[10px] font-semibold text-ink mb-1">Duration</label>
                  <input 
                    type="text" 
                    required
                    value={editPhaseData.duration}
                    onChange={e => setEditPhaseData({...editPhaseData, duration: e.target.value})}
                    placeholder="e.g. 01 May - 30 Jun"
                    className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink placeholder:text-muted-soft focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-ink mb-1">Budget (₹)</label>
                  <input 
                    type="number" 
                    required
                    value={editPhaseData.budget}
                    onChange={e => setEditPhaseData({...editPhaseData, budget: e.target.value})}
                    placeholder="e.g. 12000000"
                    className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-ink mb-1">Status</label>
                <select
                  value={editPhaseData.status}
                  onChange={e => setEditPhaseData({...editPhaseData, status: e.target.value})}
                  className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
                >
                  <option>Active</option>
                  <option>Upcoming</option>
                  <option>Completed</option>
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowEditPhase(false)}
                  className="rounded-lg border border-hairline bg-surface-card px-4 py-1.5 text-xs font-bold text-body hover:bg-canvas transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-active transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
