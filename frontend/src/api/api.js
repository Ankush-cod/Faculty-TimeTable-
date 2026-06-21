const API_BASE = 'http://localhost:5000/api/v1';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = localStorage.getItem('accessToken');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const config = { ...options, headers: { ...headers, ...options.headers } };
  const response = await fetch(url, config);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}

// --- Auth ---
export const authAPI = {
  login: (email, password) =>
    request('/users/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  register: (formData) =>
    request('/users/register', { method: 'POST', body: formData }),

  logout: () =>
    request('/users/logout', { method: 'POST' }),

  forgotPassword: (email) =>
    request('/users/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  refreshToken: (refreshToken) =>
    request('/users/refresh-token', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
};

// --- Faculty ---
export const facultyAPI = {
  getProfile: () =>
    request('/users/profile'),

  updateImage: (formData) =>
    request('/users/update-image', { method: 'PUT', body: formData }),

  updatePreferences: (preferences) =>
    request('/users/faculty/preferences', { method: 'PUT', body: JSON.stringify({ preferences }) }),

  changePassword: (oldPassword, newPassword, confirmPassword) =>
    request('/users/change-password', { method: 'PUT', body: JSON.stringify({ oldPassword, newPassword, confirmPassword }) }),

  getMyTimetable: () =>
    request('/timetables/faculty/my-timetable'),

  setAllocationChoice: (choice) =>
    request('/users/faculty/allocation-choice', { method: 'PUT', body: JSON.stringify({ choice }) }),
};

// --- Admin ---
export const adminAPI = {
  getDashboard: () =>
    request('/admin/dashboard'),

  getPendingRequests: () =>
    request('/admin/pending-requests'),

  getAllFaculty: () =>
    request('/admin/all-faculty'),

  getFacultyDetails: (facultyId) =>
    request(`/admin/faculty/${facultyId}`),

  approveFaculty: (facultyId) =>
    request('/admin/approve-faculty', { method: 'PUT', body: JSON.stringify({ facultyId }) }),

  rejectFaculty: (facultyId, remarks) =>
    request('/admin/reject-faculty', { method: 'PUT', body: JSON.stringify({ facultyId, remarks: remarks || "Rejected by admin" }) }),

  editFaculty: (facultyId, data) =>
    request(`/admin/edit-faculty/${facultyId}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteFaculty: (facultyId) =>
    request(`/admin/delete-faculty/${facultyId}`, { method: 'DELETE' }),

  registerAdmin: (email, password, fullName) =>
    request('/admin/register', { method: 'POST', body: JSON.stringify({ email, password, fullName }) }),

  changeAdminPassword: (oldPassword, newPassword, confirmPassword) =>
    request('/admin/change-password', { method: 'PUT', body: JSON.stringify({ oldPassword, newPassword, confirmPassword }) }),

  // Timetables
  getTimetables: () =>
    request('/timetables'),

  createTimetable: (data) =>
    request('/timetables', { method: 'POST', body: JSON.stringify(data) }),

  getTimetableById: (timetableId) =>
    request(`/timetables/${timetableId}`),

  updateTimetable: (timetableId, data) =>
    request(`/timetables/${timetableId}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteTimetable: (timetableId) =>
    request(`/timetables/${timetableId}`, { method: 'DELETE' }),

  approveTimetable: (timetableId) =>
    request(`/timetables/${timetableId}/approve`, { method: 'PUT' }),

  generateTimetable: (timetableId, data) =>
    request(`/timetables/${timetableId}/generate`, { method: 'POST', body: JSON.stringify(data) }),

  autoGenerateTimetable: (timetableId, data) =>
    request(`/timetables/${timetableId}/auto-generate`, { method: 'POST', body: JSON.stringify(data) }),

  runAllocationRound: (timetableId) =>
    request(`/timetables/${timetableId}/run-round`, { method: 'POST', body: JSON.stringify({}) }),

  addTimeSlot: (timetableId, data) =>
    request(`/timetables/${timetableId}/time-slots`, { method: 'POST', body: JSON.stringify(data) }),

  deleteTimeSlot: (slotId) =>
    request(`/timetables/time-slots/${slotId}`, { method: 'DELETE' }),

  generateAllClassesTimetable: () =>
    request(`/timetables/generate-all`, { method: 'POST' }),

  getClassTimetable: (classId) =>
    request(`/timetables/class/${classId}`),
};

// --- Subjects ---
export const subjectsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/subjects${query ? `?${query}` : ''}`);
  },
  create: (data) =>
    request('/subjects', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    request(`/subjects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) =>
    request(`/subjects/${id}`, { method: 'DELETE' }),
  uploadExcel: (formData) =>
    request('/admin/subjects/upload', { method: 'POST', body: formData }),
  toggleApproval: (id) =>
    request(`/admin/subjects/${id}/toggle-approval`, { method: 'PUT' }),
};

// --- Classes ---
export const classesAPI = {
  getAll: () => request('/classes'),
  uploadExcel: (formData) => request('/classes/upload', { method: 'POST', body: formData }),
};
