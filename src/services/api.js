export const BASE_URL = import.meta.env.VITE_API_URL || 'https://buildtrack-backend.vercel.app/api';

const getHeaders = () => {
  const token = sessionStorage.getItem('buildtrack_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const api = {
  // Auth
  login: async (email, password) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await handleResponse(res);
    sessionStorage.setItem('buildtrack_token', data.token);
    sessionStorage.setItem('buildtrack_user', JSON.stringify(data.user));
    return data;
  },

  logout: () => {
    sessionStorage.removeItem('buildtrack_token');
    sessionStorage.removeItem('buildtrack_user');
  },

  getCurrentUser: () => {
    const user = sessionStorage.getItem('buildtrack_user');
    return user ? JSON.parse(user) : null;
  },

  // Credential requests (public)
  submitCredentialRequest: async ({ name, email, company, phone, message }) => {
    const res = await fetch(`${BASE_URL}/credential-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, company, phone, message }),
    });
    return handleResponse(res);
  },

  // Admin — users & credentials
  getAdminUsers: async () => {
    const res = await fetch(`${BASE_URL}/admin/users`, { headers: getHeaders() });
    return handleResponse(res);
  },

  createAdminUser: async (userData) => {
    const res = await fetch(`${BASE_URL}/admin/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  updateAdminUser: async (userId, updates) => {
    const res = await fetch(`${BASE_URL}/admin/users/${userId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },

  deleteAdminUser: async (userId) => {
    const res = await fetch(`${BASE_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getCredentialsRegistry: async () => {
    const res = await fetch(`${BASE_URL}/admin/credentials`, { headers: getHeaders() });
    return handleResponse(res);
  },

  getCredentialRequests: async () => {
    const res = await fetch(`${BASE_URL}/admin/credential-requests`, { headers: getHeaders() });
    return handleResponse(res);
  },

  updateCredentialRequest: async (requestId, updates) => {
    const res = await fetch(`${BASE_URL}/admin/credential-requests/${requestId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },

  // Projects
  getProjects: async () => {
    const res = await fetch(`${BASE_URL}/projects`, { headers: getHeaders() });
    return handleResponse(res);
  },

  getProjectById: async (id) => {
    const res = await fetch(`${BASE_URL}/projects/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  updateProject: async (id, projectData) => {
    const res = await fetch(`${BASE_URL}/projects/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(projectData)
    });
    return handleResponse(res);
  },

  createProject: async (projectData) => {
    const res = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(projectData)
    });
    return handleResponse(res);
  },

  addProjectPhase: async (projectId, phaseData) => {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/phases`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(phaseData)
    });
    return handleResponse(res);
  },

  updateProjectPhase: async (projectId, phaseId, phaseData) => {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/phases/${phaseId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(phaseData)
    });
    return handleResponse(res);
  },

  deleteProjectPhase: async (projectId, phaseId) => {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/phases/${phaseId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Budget
  getBudget: async (projectId) => {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/budget`, { headers: getHeaders() });
    return handleResponse(res);
  },

  updateBudget: async (projectId, categories) => {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/budget`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ categories })
    });
    return handleResponse(res);
  },

  // Materials
  getMaterials: async (projectId) => {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/materials`, { headers: getHeaders() });
    return handleResponse(res);
  },

  addMaterial: async (projectId, material) => {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/materials`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(material)
    });
    return handleResponse(res);
  },

  updateMaterial: async (projectId, materialId, updates) => {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/materials/${materialId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    return handleResponse(res);
  },

  deleteMaterial: async (projectId, materialId) => {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/materials/${materialId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Daily Tracking
  getDailyTracking: async (projectId) => {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/daily-tracking`, { headers: getHeaders() });
    return handleResponse(res);
  },

  createDailyEntry: async (projectId, entry) => {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/daily-tracking`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(entry)
    });
    return handleResponse(res);
  },

  // Inventory
  getInventory: async (projectId) => {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/inventory`, { headers: getHeaders() });
    return handleResponse(res);
  },

  addInventoryLog: async (projectId, log) => {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/inventory`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(log)
    });
    return handleResponse(res);
  },

  // Procurement
  getProcurement: async (projectId) => {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/procurement`, { headers: getHeaders() });
    return handleResponse(res);
  },

  createProcurement: async (projectId, request) => {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/procurement`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(request)
    });
    return handleResponse(res);
  },

  updateProcurementStatus: async (projectId, requestId, status) => {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/procurement/${requestId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    return handleResponse(res);
  },

  // Alerts
  getAlerts: async (projectId) => {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/alerts`, { headers: getHeaders() });
    return handleResponse(res);
  }
};
