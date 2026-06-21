import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI, authAPI, subjectsAPI, classesAPI } from '../../api/api';
import Confetti from '../../components/Confetti';
import './AdminDashboard.css';
const BRANCH_SUBJECTS = {
  'Computer Science': [
    'Data Structures', 'Algorithms', 'Operating Systems', 'Database Management Systems',
    'Computer Networks', 'Software Engineering', 'Compiler Design', 'Theory of Computation',
    'Artificial Intelligence', 'Machine Learning', 'Deep Learning', 'Web Development',
    'Object Oriented Programming', 'Computer Architecture', 'Discrete Mathematics',
    'Cyber Security', 'Cloud Computing', 'Big Data Analytics', 'Mobile App Development',
    'Data Mining', 'Computer Graphics', 'Distributed Systems', 'Natural Language Processing'
  ],
  'Electronics & Communication': [
    'Digital Electronics', 'Analog Electronics', 'Signals and Systems', 'Communication Systems',
    'Electromagnetic Theory', 'VLSI Design', 'Microprocessors', 'Control Systems',
    'Digital Signal Processing', 'Antenna and Wave Propagation', 'Embedded Systems',
    'Power Electronics', 'Electronic Circuits', 'Network Analysis', 'Optical Communication',
    'Wireless Communication', 'Robotics', 'IoT'
  ],
  'Electrical Engineering': [
    'Electrical Machines', 'Power Systems', 'Control Systems', 'Power Electronics',
    'Electrical Measurements', 'Network Analysis', 'Signal Processing',
    'Electromagnetic Fields', 'High Voltage Engineering', 'Switchgear Protection',
    'Renewable Energy Systems', 'Electric Drives', 'Industrial Automation',
    'Electrical Circuit Analysis', 'Microcontrollers'
  ],
  'Mechanical Engineering': [
    'Engineering Mechanics', 'Thermodynamics', 'Fluid Mechanics', 'Heat Transfer',
    'Manufacturing Processes', 'Machine Design', 'Strength of Materials',
    'Theory of Machines', 'Industrial Engineering', 'CAD/CAM', 'Automobile Engineering',
    'Refrigeration and Air Conditioning', 'Power Plant Engineering', 'Robotics',
    'Material Science', 'Vibration Analysis', 'Finite Element Analysis'
  ],
  'Civil Engineering': [
    'Structural Analysis', 'Concrete Technology', 'Geotechnical Engineering',
    'Fluid Mechanics', 'Surveying', 'Transportation Engineering', 'Environmental Engineering',
    'Steel Structures', 'Construction Management', 'Water Resources Engineering',
    'Soil Mechanics', 'Building Materials', 'Earthquake Engineering',
    'Highway Engineering', 'Hydrology', 'Town Planning'
  ],
  'Information Technology': [
    'Data Structures', 'Web Technologies', 'Database Management', 'Computer Networks',
    'Software Engineering', 'Information Security', 'Cloud Computing',
    'Mobile Computing', 'Data Warehousing', 'E-Commerce', 'Multimedia Systems',
    'Software Testing', 'IT Project Management', 'DevOps', 'Blockchain Technology'
  ],
  'Common Subjects': [
    'Mathematics I', 'Mathematics II', 'Mathematics III', 'Engineering Mathematics',
    'Applied Physics', 'Applied Chemistry', 'English Communication',
    'Engineering Drawing', 'Environmental Science', 'Professional Ethics',
    'Economics', 'Management', 'Entrepreneurship Development',
    'Constitution of India', 'Universal Human Values'
  ]
};

const ALL_SUBJECTS = [...new Set(Object.values(BRANCH_SUBJECTS).flat())].sort();

const TIME_SLOTS = [
  '9:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '12:00 - 1:00',
  '2:30 - 3:30', '3:30 - 4:30', '4:30 - 5:30'
];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [stats, setStats] = useState({ totalFaculty: 0, pending: 0, approved: 0, rejected: 0 });
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [toast, setToast] = useState(null);
  const [remarksModal, setRemarksModal] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [expandedFaculty, setExpandedFaculty] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingRequestsModal, setPendingRequestsModal] = useState(false);
  const [pendingList, setPendingList] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [timetableModal, setTimetableModal] = useState(false);
  const [classes, setClasses] = useState([]);
  const [classTimetableModal, setClassTimetableModal] = useState(false);
  const [selectedClassTimetable, setSelectedClassTimetable] = useState(null);
  const [selectedClassDetails, setSelectedClassDetails] = useState(null);
  const [uploadingClasses, setUploadingClasses] = useState(false);
  const [generatingAllClasses, setGeneratingAllClasses] = useState(false);
  const [generationLogs, setGenerationLogs] = useState(null);
  const [logsModal, setLogsModal] = useState(false);
  const [newTimetable, setNewTimetable] = useState({ name: '', semester: '', academicYear: '' });
  const [timeSlotModal, setTimeSlotModal] = useState(false);
  const [newTimeSlot, setNewTimeSlot] = useState({ facultyId: '', subject: '', day: 'Monday', startSlot: 1, endSlot: 2, classroom: '' });
  const [autoGenModal, setAutoGenModal] = useState(false);
  const [autoGenSections, setAutoGenSections] = useState([
    { sectionName: '', classroom: '', floor: 'any-floor', subjects: [{ subjectName: '', lecturesPerWeek: 3, isLab: false }] }
  ]);
  const [autoGenResult, setAutoGenResult] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [subjectModal, setSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [newSubject, setNewSubject] = useState({ name: '', code: '', semester: '', branch: '', isLab: false });
  const [uploadBranch, setUploadBranch] = useState('');
  const [subjectBranchFilter, setSubjectBranchFilter] = useState('');
  const [subjectSemesterFilter, setSubjectSemesterFilter] = useState('');
  // Auto-gen by branch/semester
  const [autoGenBranch, setAutoGenBranch] = useState('');
  const [autoGenSemester, setAutoGenSemester] = useState('');
  const [autoGenClassroom, setAutoGenClassroom] = useState('');
  const [autoGenFetchedSubjects, setAutoGenFetchedSubjects] = useState([]);

  // UI State Enhancements
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null);
  const [deleteFacultyConfirm, setDeleteFacultyConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);
  const [selectedBranchForSubjects, setSelectedBranchForSubjects] = useState('CSE');
  const [selectedSemForSubjects, setSelectedSemForSubjects] = useState(null);
  const [showSubjectPopup, setShowSubjectPopup] = useState(false);
  const [timetableSearchQuery, setTimetableSearchQuery] = useState('');
  const [facultySearchQuery, setFacultySearchQuery] = useState('');
  const [facultyStatusFilter, setFacultyStatusFilter] = useState('All');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === 'all') {
      loadFacultyByTab();
    } else if (activeTab === 'pending') {
      loadPendingRequests();
    } else if (activeTab === 'timetables') {
      loadTimetables();
    } else if (activeTab === 'subjects') {
      loadSubjects();
    } else if (activeTab === 'classes') {
      loadClasses();
    }
  }, [activeTab]);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const res = await classesAPI.getAll();
      setClasses(res.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClassesExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploadingClasses(true);
    try {
      const res = await classesAPI.uploadExcel(formData);
      showToast(res.message || 'Classes uploaded!', 'success');
      loadClasses();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUploadingClasses(false);
      e.target.value = '';
    }
  };

  const handleGenerateAllClassesTimetable = async () => {
    setGeneratingAllClasses(true);
    try {
      const res = await adminAPI.generateAllClassesTimetable();
      showToast(res.message || 'Timetable generated for all classes', 'success');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      setGenerationLogs(res.data.logs || []);
      setLogsModal(true);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setGeneratingAllClasses(false);
    }
  };

  const handleViewClassTimetable = async (cls) => {
    setSelectedClassDetails(cls);
    setLoading(true);
    setClassTimetableModal(true);
    try {
      const res = await adminAPI.getClassTimetable(cls._id);
      setSelectedClassTimetable(res.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = async () => {
    try {
      const res = await adminAPI.getDashboard();
      setStats(res.data);
    } catch (err) {
      console.error('Dashboard error:', err);
    }
  };

  const loadFacultyByTab = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getAllFaculty();
      setFacultyList(res.data || []);
    } catch (err) {
      console.error('Load faculty error:', err);
      setFacultyList([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const res = await adminAPI.getPendingRequests();
      setPendingList(res.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const res = await subjectsAPI.getAll();
      setSubjects(res.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectSubmit = async (e) => {
    e.preventDefault();
    setActionLoading('subject-submit');
    try {
      if (editingSubject) {
        await subjectsAPI.update(editingSubject._id, newSubject);
        showToast('Subject updated!');
      } else {
        await subjectsAPI.create(newSubject);
        showToast('Subject created!');
      }
      setSubjectModal(false);
      setEditingSubject(null);
      setNewSubject({ name: '', code: '', semester: '', branch: '' });
      loadSubjects();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    try {
      await subjectsAPI.delete(id);
      showToast('Subject deleted!');
      loadSubjects();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };



  const handleDeleteFaculty = (id, e) => {
    if (e) e.stopPropagation();
    setDeleteFacultyConfirm({ id });
  };

  const confirmDeleteFaculty = async () => {
    if (!deleteFacultyConfirm) return;
    const id = deleteFacultyConfirm.id;
    setIsDeleting(`fac-${id}`);
    
    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      await adminAPI.deleteFaculty(id);
      showToast('Faculty member deleted successfully!');
      loadDashboard();
      loadFacultyByTab();
      loadPendingRequests(); // Fix: Update pending list as well
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsDeleting(null);
      setDeleteFacultyConfirm(null);
    }
  };

  const loadTimetables = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getTimetables();
      setTimetables(res.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTimetable = async (e) => {
    e.preventDefault();
    setActionLoading('create-timetable');
    try {
      await adminAPI.createTimetable(newTimetable);
      showToast('Timetable created successfully!');
      setTimetableModal(false);
      setNewTimetable({ name: '', semester: '', academicYear: '' });
      loadTimetables();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!uploadBranch) {
      showToast('Please select a branch before uploading', 'error');
      e.target.value = '';
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('branch', uploadBranch);
    setLoading(true);
    try {
      const res = await subjectsAPI.uploadExcel(formData);
      showToast(res.message || 'Subjects uploaded!');
      loadSubjects();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleToggleSubjectApproval = async (id) => {
    try {
      await subjectsAPI.toggleApproval(id);
      showToast('Subject approval toggled!');
      loadSubjects();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleApproveTimetable = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await adminAPI.approveTimetable(id);
      showToast('Timetable approved and published to faculty!');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      loadTimetables();
      if (selectedTimetable) loadTimetableDetails(selectedTimetable.timetable._id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRunAllocationRound = async () => {
    if (!selectedTimetable) return;
    setGenerating(true);
    try {
      const res = await adminAPI.runAllocationRound(selectedTimetable.timetable._id);
      showToast(res.message);
      loadTimetableDetails(selectedTimetable.timetable._id);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteTimetable = (id, e) => {
    if (e) e.stopPropagation();
    setDeleteConfirmModal({ id });
  };

  const confirmDeleteTimetable = async () => {
    if (!deleteConfirmModal) return;
    const id = deleteConfirmModal.id;
    setIsDeleting(id);
    
    // Add small delay for animation
    await new Promise(resolve => setTimeout(resolve, 400));
    
    try {
      await adminAPI.deleteTimetable(id);
      showToast('Timetable Deleted Successfully', 'success');
      if (selectedTimetable && selectedTimetable.timetable._id === id) {
        setSelectedTimetable(null);
      }
      loadTimetables();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsDeleting(null);
      setDeleteConfirmModal(null);
    }
  };

  const loadTimetableDetails = async (id) => {
    setLoading(true);
    try {
      const res = await adminAPI.getTimetableById(id);
      setSelectedTimetable(res.data);
      const facRes = await adminAPI.getAllFaculty();
      setFacultyList(facRes.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTimeSlot = async (e) => {
    e.preventDefault();
    setActionLoading('add-slot');
    try {
      await adminAPI.addTimeSlot(selectedTimetable.timetable._id, newTimeSlot);
      showToast('Time slot added!');
      setTimeSlotModal(false);
      loadTimetableDetails(selectedTimetable.timetable._id);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };
  const addSection = () => {
    setAutoGenSections([
      ...autoGenSections,
      { sectionName: '', classroom: '', floor: 'any-floor', subjects: [{ subjectName: '', lecturesPerWeek: 3, isLab: false }] }
    ]);
  };

  const removeSection = (idx) => {
    if (autoGenSections.length <= 1) return;
    setAutoGenSections(autoGenSections.filter((_, i) => i !== idx));
  };

  const updateSection = (idx, field, value) => {
    const updated = [...autoGenSections];
    updated[idx] = { ...updated[idx], [field]: value };
    setAutoGenSections(updated);
  };

  const addSubjectToSection = (sectionIdx) => {
    const updated = [...autoGenSections];
    updated[sectionIdx].subjects.push({ subjectName: '', lecturesPerWeek: 3, isLab: false });
    setAutoGenSections(updated);
  };

  const removeSubjectFromSection = (sectionIdx, subIdx) => {
    const updated = [...autoGenSections];
    if (updated[sectionIdx].subjects.length <= 1) return;
    updated[sectionIdx].subjects = updated[sectionIdx].subjects.filter((_, i) => i !== subIdx);
    setAutoGenSections(updated);
  };

  const updateSubjectInSection = (sectionIdx, subIdx, field, value) => {
    const updated = [...autoGenSections];
    updated[sectionIdx].subjects[subIdx] = { ...updated[sectionIdx].subjects[subIdx], [field]: value };
    setAutoGenSections(updated);
  };

  const handleAutoGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setAutoGenResult(null);
    try {
      const res = await adminAPI.generateTimetable(selectedTimetable.timetable._id, {
        sections: autoGenSections,
        slotsPerDay: 7
      });
      setAutoGenResult(res.data);
      showToast(`${res.message}`, 'success');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      loadTimetableDetails(selectedTimetable.timetable._id);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  // Smart auto-generate by branch + semester
  const fetchSubjectsForAutoGen = async (branch, semester) => {
    if (!branch || !semester) { setAutoGenFetchedSubjects([]); return; }
    try {
      const res = await subjectsAPI.getAll({ branch, semester, approved: 'true' });
      setAutoGenFetchedSubjects(res.data || []);
    } catch (err) {
      showToast('Failed to fetch subjects: ' + err.message, 'error');
      setAutoGenFetchedSubjects([]);
    }
  };

  const handleSmartAutoGenerate = async (e) => {
    e.preventDefault();
    if (!autoGenBranch || !autoGenSemester || !autoGenClassroom) {
      showToast('Branch, semester, and classroom are required', 'error');
      return;
    }
    setGenerating(true);
    setAutoGenResult(null);
    try {
      const res = await adminAPI.autoGenerateTimetable(selectedTimetable.timetable._id, {
        branch: autoGenBranch,
        semester: autoGenSemester,
        classroom: autoGenClassroom
      });
      setAutoGenResult(res.data);
      showToast(`${res.message}`, 'success');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      loadTimetableDetails(selectedTimetable.timetable._id);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const resetAutoGenModal = () => {
    setAutoGenModal(false);
    setAutoGenResult(null);
    setAutoGenBranch('');
    setAutoGenSemester('');
    setAutoGenClassroom('');
    setAutoGenFetchedSubjects([]);
    setAutoGenSections([
      { sectionName: '', classroom: '', floor: 'any-floor', subjects: [{ subjectName: '', lecturesPerWeek: 3, isLab: false }] }
    ]);
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    setSaving(true);
    try {
      await adminAPI.changeAdminPassword(passwords.oldPassword, passwords.newPassword, passwords.confirmPassword);
      showToast('Password changed successfully!');
      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (facultyId) => {
    setActionLoading(facultyId);
    try {
      await adminAPI.approveFaculty(facultyId);
      showToast('Faculty approved successfully!');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      loadDashboard();
      loadFacultyByTab();
      loadPendingRequests();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    setActionLoading(remarksModal.facultyId);
    try {
      await adminAPI.rejectFaculty(remarksModal.facultyId, remarks || 'Rejected by admin');
      showToast('Faculty rejected');
      loadDashboard();
      loadFacultyByTab();
      loadPendingRequests();
      setRemarksModal(null);
      setRemarks('');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleExpand = async (facultyId) => {
    if (expandedFaculty?._id === facultyId) {
      setExpandedFaculty(null);
      return;
    }
    try {
      const res = await adminAPI.getFacultyDetails(facultyId);
      setExpandedFaculty(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleLogout = async () => {
    try { await authAPI.logout(); } catch {}
    logout();
    navigate('/login');
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: 'badge-pending',
      approved: 'badge-approved',
      rejected: 'badge-rejected',
      changes_requested: 'badge-changes',
    };
    const labels = {
      pending: '⏳ Pending',
      approved: '✅ Approved',
      rejected: '❌ Rejected',
      changes_requested: '🔄 Changes Requested',
    };
    return <span className={`badge ${map[status] || ''}`}>{labels[status] || status}</span>;
  };

  const tabs = [
    { id: 'pending', label: 'Pending Requests', icon: '⏳', count: stats.pending },
    { id: 'all', label: 'Faculty List', icon: '👥', count: stats.totalFaculty },
    { id: 'subjects', label: 'Subjects', icon: '📚', count: subjects.length || 0 },
    { id: 'classes', label: 'Classes', icon: '🏫', count: classes.length || 0 },
    { id: 'timetables', label: 'Timetables', icon: '📅', count: timetables.length || 0 },
  ];

  return (
    <div className="dashboard">
      <Confetti active={showConfetti} duration={3000} />

      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.type === 'success' ? '✅' : '❌'} {toast.message}
          </div>
        </div>
      )}

      {/* Mobile Header */}
      <div className="mobile-header">
        <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <span></span><span></span><span></span>
        </button>
        <h2 className="mobile-title gradient-text">Admin Panel</h2>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="14" fill="url(#admLogoGrad)" />
              <path d="M14 34V14h6l4 12 4-12h6v20h-5V22l-3.5 12h-3L19 22v12h-5z" fill="white" />
              <defs>
                <linearGradient id="admLogoGrad" x1="0" y1="0" x2="48" y2="48">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <h3 className="sidebar-brand gradient-text">Admin Panel</h3>
            <p className="sidebar-role">{user?.fullName}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`sidebar-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
            >
              <span className="sidebar-icon">{tab.icon}</span>
              <span>{tab.label}</span>
              <span className="sidebar-badge">{tab.count}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-item logout-btn" onClick={handleLogout}>
            <span className="sidebar-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="section">
          {/* Stats Cards */}
          <div className="admin-stats-grid">
            <div className="admin-stat-card glass-card animate-fade-in-up" style={{animationDelay:'0s'}}>
              <div className="admin-stat-icon total">👥</div>
              <div className="admin-stat-info">
                <span className="admin-stat-value">{stats.totalFaculty}</span>
                <span className="admin-stat-label">Total Faculty</span>
              </div>
            </div>
            <div className="admin-stat-card glass-card animate-fade-in-up" style={{animationDelay:'0.1s'}}>
              <div className="admin-stat-icon pending">⏳</div>
              <div className="admin-stat-info">
                <span className="admin-stat-value">{stats.pending}</span>
                <span className="admin-stat-label">Pending</span>
              </div>
            </div>
            <div className="admin-stat-card glass-card animate-fade-in-up" style={{animationDelay:'0.2s'}}>
              <div className="admin-stat-icon approved">✅</div>
              <div className="admin-stat-info">
                <span className="admin-stat-value">{stats.approved}</span>
                <span className="admin-stat-label">Approved</span>
              </div>
            </div>
            <div className="admin-stat-card glass-card animate-fade-in-up" style={{animationDelay:'0.3s'}}>
              <div className="admin-stat-icon rejected">❌</div>
              <div className="admin-stat-info">
                <span className="admin-stat-value">{stats.rejected}</span>
                <span className="admin-stat-label">Rejected</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="admin-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span className="tab-count">{tab.count}</span>
              </button>
            ))}
          </div>

          {/* Timetables Tab View */}
          {activeTab === 'timetables' && (
            <div className="timetables-container animate-fade-in">
              {!selectedTimetable ? (
                <>
                  <div className="flex justify-between items-center mb-4" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Manage Timetables</h2>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div className="search-bar" style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
                        <input 
                          type="text" 
                          placeholder="Search timetables..." 
                          className="form-input" 
                          style={{ paddingLeft: '32px', width: '220px' }}
                          value={timetableSearchQuery}
                          onChange={(e) => setTimetableSearchQuery(e.target.value)}
                        />
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={() => setTimetableModal(true)}>
                        + Create Timetable
                      </button>
                    </div>
                  </div>
                  {loading ? (
                    <div className="loader-page" style={{minHeight:'200px'}}>
                      <div className="loader"></div>
                    </div>
                  ) : timetables.length === 0 ? (
                    <div className="empty-state glass-card">
                      <div className="empty-icon">📅</div>
                      <h3>No Timetables Found</h3>
                      <p>Click "Create Timetable" to get started.</p>
                    </div>
                  ) : (
                    <div className="timetables-grid" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                      {timetables.filter(tt => tt.name.toLowerCase().includes(timetableSearchQuery.toLowerCase()) || tt.semester.toString().includes(timetableSearchQuery)).map(tt => (
                        <div 
                          key={tt._id} 
                          className={`glass-card tt-card ${isDeleting === tt._id ? 'animate-delete' : ''}`} 
                          style={{ cursor: 'pointer', position: 'relative', display: 'flex', flexDirection: 'column' }} 
                          onClick={() => loadTimetableDetails(tt._id)}
                        >
                          <div className="tt-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <div>
                              <h3 style={{ fontSize: '1.15rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)' }}>{tt.name}</h3>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <span className={`badge ${tt.status === 'published' ? 'tt-status-published' : 'tt-status-draft'}`}>
                                  {tt.status === 'published' ? '🟢 Published' : '⚪ Draft'}
                                </span>
                                {tt.isAdminApproved && <span className="badge tt-status-published">📢 Active</span>}
                              </div>
                            </div>
                            <div style={{display:'flex',gap:'6px'}}>
                              {!tt.isAdminApproved && (
                                <button className="btn-icon-check" onClick={(e) => handleApproveTimetable(tt._id, e)} title="Publish Timetable">
                                  ✔️
                                </button>
                              )}
                              <button className="btn-icon-remove-sm" onClick={(e) => handleDeleteTimetable(tt._id, e)} title="Delete Timetable">🗑️</button>
                            </div>
                          </div>
                          
                          <div className="tt-card-meta" style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span>📘</span> Semester: <strong>{tt.semester}</strong></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span>🎓</span> Academic Year: <strong>{tt.academicYear}</strong></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span>🔄</span> Round: <strong>{tt.allocationRound || 0}</strong></div>
                          </div>
                          
                          <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Created: {new Date(tt.createdAt).toLocaleDateString()}</span>
                            <span style={{ color: 'var(--primary-400)', fontWeight: 600, fontSize: '0.9rem' }}>Manage Slots ➔</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="timetable-details">
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setSelectedTimetable(null)}>
                      ⬅ Back
                    </button>
                    <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{selectedTimetable.timetable.name}</h2>
                    {getStatusBadge(selectedTimetable.timetable.status)}
                    <div style={{ flex: 1 }}></div>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: '#ef4444', border: '1px solid #ef4444' }}
                      onClick={() => handleDeleteTimetable(selectedTimetable.timetable._id)}
                    >
                      🗑️ Delete Timetable
                    </button>
                  </div>
                  
                  <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <h3 style={{ margin: 0 }}>Time Slots ({selectedTimetable.totalSlots})</h3>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-accent btn-sm" onClick={() => setAutoGenModal(true)}>
                          🤖 Auto-Generate
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={() => setTimeSlotModal(true)}>
                          + Add Time Slot
                        </button>
                      </div>
                    </div>

                    {selectedTimetable.timeSlots.length === 0 ? (
                      <p style={{ color: '#666' }}>No time slots added yet.</p>
                    ) : (
                      <div className="timetable-grid glass-card" style={{ padding: '16px', marginTop: '16px' }}>
                        <div className="tt-header-row">
                          <div className="tt-corner">Day / Time</div>
                          {[1, 2, 3, 4].map(slot => (
                            <div key={slot} className="tt-header-cell">{TIME_SLOTS[slot - 1]}</div>
                          ))}
                          <div className="tt-header-cell" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>LUNCH</div>
                          {[5, 6, 7].map(slot => (
                            <div key={slot} className="tt-header-cell">{TIME_SLOTS[slot - 1]}</div>
                          ))}
                        </div>
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                          <div key={day} className="tt-row">
                            <div className="tt-day-cell">{day.slice(0, 3)}</div>
                            {[1, 2, 3, 4, 'LUNCH', 5, 6, 7].map(slot => {
                              if (slot === 'LUNCH') {
                                return (
                                  <div key="lunch" className="tt-lunch-cell">LUNCH</div>
                                );
                              }
                              const entry = selectedTimetable.timeSlots.find(t => t.day === day && t.startSlot === slot);
                              const spannedByEntry = selectedTimetable.timeSlots.find(t => t.day === day && t.startSlot < slot && t.endSlot > slot);
                              
                              if (spannedByEntry) return null;
                              
                              const spanCount = entry ? (entry.endSlot - entry.startSlot) : 1;
                              const cellStyle = spanCount > 1 ? { gridColumn: `span ${spanCount}` } : {};

                              return (
                                <div key={slot} className={`tt-cell ${entry ? 'filled' : ''}`} style={cellStyle}>
                                  {entry && (
                                    <>
                                      <span className="tt-subject" title={entry.subject}>{entry.subject.length > 15 ? entry.subject.substring(0,15)+'...' : entry.subject}</span>
                                      <span className="tt-room">{entry.classroom}</span>
                                      <span className="tt-room" style={{fontSize:'0.6rem', opacity:0.8}}>{entry.facultyId?.fullName?.split(' ')[0] || ''}</span>
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Subjects Tab View */}
          {activeTab === 'subjects' && (
            <div className="subjects-container animate-fade-in">
              {/* Branch Bar */}
              <div className="branch-bar glass-card" style={{ display: 'flex', gap: '10px', padding: '10px', marginBottom: '1.5rem', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)' }}>
                {['CSE', 'IT', 'ECE', 'ME', 'CE', 'Other'].map(branch => (
                  <button 
                    key={branch} 
                    className={`btn ${selectedBranchForSubjects === branch ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setSelectedBranchForSubjects(branch)}
                    style={{ whiteSpace: 'nowrap', borderRadius: '10px' }}
                  >
                    {branch}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="loader-page" style={{minHeight:'200px'}}><div className="loader"></div></div>
              ) : (
                <div className="semester-selection-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.5rem' }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => {
                    const count = subjects.filter(s => s.branch === selectedBranchForSubjects && s.semester === sem).length;
                    return (
                      <div 
                        key={sem} 
                        className="sem-card glass-card animate-fade-in-up" 
                        style={{ 
                          padding: '24px', 
                          textAlign: 'center', 
                          cursor: 'pointer', 
                          border: '1px solid rgba(255,255,255,0.05)',
                          transition: 'all 0.3s ease',
                          animationDelay: `${sem * 0.05}s`
                        }}
                        onClick={() => { setSelectedSemForSubjects(sem); setShowSubjectPopup(true); }}
                        onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'var(--primary-400)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
                      >
                        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📚</div>
                        <h4 style={{ margin: 0, fontWeight: 700 }}>Semester {sem}</h4>
                        <p style={{ margin: '5px 0 0', fontSize: '0.85rem', opacity: 0.6 }}>{count} Subjects</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Subject Pop-up Modal */}
              {showSubjectPopup && (
                <div className="modal-overlay" onClick={() => setShowSubjectPopup(false)}>
                  <div className="modal glass-card-strong animate-scale-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <div>
                        <h2 className="modal-title" style={{ marginBottom: '4px' }}>{selectedBranchForSubjects} - Semester {selectedSemForSubjects}</h2>
                        <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>Detailed subject list and management</p>
                      </div>
                      <button className="btn btn-ghost" onClick={() => setShowSubjectPopup(false)} style={{ fontSize: '1.5rem', padding: '0 10px' }}>✕</button>
                    </div>

                    <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '5px' }}>
                      {subjects.filter(s => s.branch === selectedBranchForSubjects && s.semester === selectedSemForSubjects).length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>
                          <p>No subjects added for this semester yet.</p>
                          <button className="btn btn-primary btn-sm" onClick={() => { setShowSubjectPopup(false); setEditingSubject(null); setNewSubject({ ...newSubject, branch: selectedBranchForSubjects, semester: selectedSemForSubjects }); setSubjectModal(true); }}>+ Add First Subject</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {subjects.filter(s => s.branch === selectedBranchForSubjects && s.semester === selectedSemForSubjects).map(sub => (
                            <div key={sub._id} style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              background: sub.isApproved ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.03)', 
                              padding: '12px 16px', 
                              borderRadius: '12px', 
                              border: sub.isApproved ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(239,68,68,0.15)' 
                            }}>
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                  {sub.name} {sub.isApproved ? <span title="Approved">✅</span> : <span title="Pending" style={{ opacity: 0.6 }}>⏳</span>}
                                </div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '4px' }}>
                                  {sub.code} {sub.isLab ? '• 🔬 Lab' : ''} • {sub.lecturesPerWeek || 3} Lect/wk
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn-icon-sm" onClick={() => handleToggleSubjectApproval(sub._id)} style={{color: sub.isApproved ? '#ef4444' : '#22c55e'}} title={sub.isApproved ? "Unapprove" : "Approve"}>
                                  {sub.isApproved ? '🚫' : '✅'}
                                </button>
                                <button className="btn-icon-sm" onClick={() => { setShowSubjectPopup(false); setEditingSubject(sub); setNewSubject(sub); setSubjectModal(true); }}>✏️</button>
                                <button className="btn-icon-remove-sm" onClick={() => handleDeleteSubject(sub._id)}>🗑️</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="modal-actions" style={{ marginTop: '2rem' }}>
                      <button className="btn btn-ghost" onClick={() => setShowSubjectPopup(false)}>Close</button>
                      <button className="btn btn-primary" onClick={() => { setShowSubjectPopup(false); setEditingSubject(null); setNewSubject({ name: '', code: '', semester: selectedSemForSubjects, branch: selectedBranchForSubjects, isLab: false }); setSubjectModal(true); }}>+ Add Subject</button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}


          {/* ═══ CLASSES TAB ═══ */}
          {activeTab === 'classes' && (
            <div className="classes-tab animate-fade-in">
              <div className="list-controls-bar glass-card" style={{ marginBottom: '1.5rem', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>🏫 Manage Classes</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {uploadingClasses ? 'Uploading...' : '📁 Upload Excel'}
                    <input type="file" accept=".xlsx, .xls" onChange={handleUploadClassesExcel} style={{ display: 'none' }} disabled={uploadingClasses} />
                  </label>
                  <button className="btn btn-primary btn-sm" onClick={handleGenerateAllClassesTimetable} disabled={generatingAllClasses}>
                    {generatingAllClasses ? '🤖 Generating timetable...' : '🤖 Generate Timetable for All Classes'}
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="loader-page" style={{minHeight:'200px'}}><div className="loader"></div></div>
              ) : classes.length === 0 ? (
                <div className="empty-state glass-card">
                  <div className="empty-icon">🏫</div>
                  <h3>No Classes Found</h3>
                  <p>Upload an Excel file to get started.</p>
                </div>
              ) : (
                <div className="classes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  {classes.map((cls, index) => (
                    <div key={cls._id} className="class-card glass-card animate-fade-in-up" style={{ animationDelay: `${index * 0.05}s`, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }} onClick={() => handleViewClassTimetable(cls)}>
                      <h3 style={{ margin: '0 0 10px 0', color: 'var(--primary-400)' }}>{cls.className}</h3>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        <p style={{ margin: '4px 0' }}><strong>Branch:</strong> {cls.branch}</p>
                        <p style={{ margin: '4px 0' }}><strong>Semester:</strong> {cls.semester}</p>
                        <p style={{ margin: '4px 0' }}><strong>Year:</strong> {cls.year}</p>
                        <p style={{ margin: '4px 0' }}><strong>Room:</strong> {cls.room}</p>
                      </div>
                      <div style={{ marginTop: '15px', color: 'var(--primary-400)', fontSize: '0.85rem', fontWeight: 'bold' }}>
                        View Timetable ➔
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ PENDING REQUESTS TAB ═══ */}
          {activeTab === 'pending' && (
            <div className="faculty-list-tab animate-fade-in">
              <div className="list-controls-bar glass-card" style={{ marginBottom: '1.5rem', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: '#f59e0b' }}>⏳ Pending Registration Requests</h2>
                <span className="badge badge-warning" style={{ fontSize: '0.9rem', padding: '6px 14px' }}>{pendingList.length} pending</span>
              </div>
              {loading ? (
                <div className="loader-page" style={{minHeight:'200px'}}><div className="loader"></div></div>
              ) : pendingList.length === 0 ? (
                <div className="empty-state glass-card">
                  <div className="empty-icon">🎉</div>
                  <h3>No Pending Requests</h3>
                  <p>All faculty registrations have been processed.</p>
                </div>
              ) : (
                <div className="pending-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
                  {pendingList.map(req => (
                    <div key={req._id} className="pending-card glass-card-strong animate-fade-in-up" style={{ padding: '1.25rem', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div className="fc-avatar-placeholder" style={{ width: '45px', height: '45px' }}>{req.fullName.charAt(0)}</div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '1rem' }}>{req.fullName}</h4>
                            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.7 }}>{req.email}</p>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', fontWeight: 600 }}>{req.branch} • {req.designation}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                          <button className="btn btn-success btn-sm" onClick={() => handleApprove(req._id)} disabled={actionLoading === req._id}>
                            {actionLoading === req._id ? '...' : '✅ Approve'}
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => setRemarksModal({ facultyId: req._id, action: 'reject', name: req.fullName })}>❌ Reject</button>
                          <button className="btn btn-ghost btn-sm" style={{color:'#ef4444'}} onClick={(e) => handleDeleteFaculty(req._id, e)}>🗑️</button>
                        </div>
                      </div>
                      <div className="prefs-preview" style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: 600, marginBottom: '6px', color: '#f59e0b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Requested Preferences:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {req.preferences?.preferredSubjects?.length > 0 ? (
                            req.preferences.preferredSubjects.map((s, i) => (
                              <span key={i} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                                P{s.priority}: {s.subjectName}
                              </span>
                            ))
                          ) : <span style={{ opacity: 0.5 }}>No specific subjects requested</span>}
                        </div>
                        <div style={{ marginTop: '8px', display: 'flex', gap: '15px', opacity: 0.8 }}>
                          <span>🕒 {req.preferences?.maxLecturesPerWeek || 0} lec/wk</span>
                          <span>📅 {req.preferences?.availableDays?.length || 0} days</span>
                          <span>⏰ {req.preferences?.preferredTimePeriod || 'both'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ FACULTY LIST TAB (Approved Only) ═══ */}
          {activeTab === 'all' && (
            <div className="faculty-list-tab animate-fade-in">
              <div className="list-controls-bar glass-card" style={{ marginBottom: '1.5rem', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '300px' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>✅ Approved Faculty</h2>
                  <div className="search-bar" style={{ position: 'relative', flex: 1 }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
                    <input 
                      type="text" 
                      placeholder="Search name, email or branch..." 
                      className="form-input" 
                      style={{ paddingLeft: '35px', width: '100%' }}
                      value={facultySearchQuery}
                      onChange={(e) => setFacultySearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <section className="directory-section">
                {loading ? (
                  <div className="loader-page" style={{minHeight:'200px'}}><div className="loader"></div></div>
                ) : (() => {
                  const filtered = facultyList.filter(f => {
                    if (facultySearchQuery) {
                      const q = facultySearchQuery.toLowerCase();
                      return f.fullName.toLowerCase().includes(q) || f.email.toLowerCase().includes(q) || f.branch.toLowerCase().includes(q);
                    }
                    return true;
                  });

                  if (filtered.length === 0) return (
                    <div className="empty-state glass-card">
                      <h3>No approved faculty found</h3>
                      <p>Approve pending requests to see them here.</p>
                    </div>
                  );

                  return (
                    <div className="faculty-grid">
                      {filtered.map((faculty, index) => (
                        <div key={faculty._id} className="faculty-card glass-card animate-fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
                          <div className="fc-main">
                            <div className="fc-avatar" onClick={() => toggleExpand(faculty._id)}>
                              {faculty.image ? (
                                <img src={faculty.image} alt={faculty.fullName} />
                              ) : (
                                <div className="fc-avatar-placeholder">
                                  {faculty.fullName?.charAt(0)?.toUpperCase() || 'F'}
                                </div>
                              )}
                            </div>
                            <div className="fc-info" onClick={() => toggleExpand(faculty._id)}>
                              <h3 className="fc-name">{faculty.fullName}</h3>
                              <p className="fc-email">{faculty.email}</p>
                              <div className="fc-meta">
                                <span>🏢 {faculty.branch}</span>
                                <span>🎓 {faculty.designation}</span>
                                <span>📅 {faculty.experience || 0} yrs exp</span>
                              </div>
                              <div className="fc-status">
                                {getStatusBadge(faculty.status)}
                                {faculty.allocationStatus && faculty.allocationStatus !== 'unallocated' && (
                                  <span className="badge badge-primary" style={{marginLeft:'6px'}}>🔄 {faculty.allocationStatus}</span>
                                )}
                              </div>
                            </div>
                            <div className="fc-actions">
                              <button className="btn btn-danger btn-sm" onClick={(e) => handleDeleteFaculty(faculty._id, e)}>
                                🗑️ Delete
                              </button>
                            </div>
                          </div>

                          {expandedFaculty?._id === faculty._id && (
                            <div className="fc-expanded animate-fade-in">
                              <div className="fc-detail-grid">
                                <div className="fc-detail">
                                  <span className="fc-detail-label">Designation</span>
                                  <span className="fc-detail-value">{expandedFaculty.designation || 'N/A'}</span>
                                </div>
                                <div className="fc-detail">
                                  <span className="fc-detail-label">Branch</span>
                                  <span className="fc-detail-value">{expandedFaculty.branch}</span>
                                </div>
                                <div className="fc-detail">
                                  <span className="fc-detail-label">Experience</span>
                                  <span className="fc-detail-value">{expandedFaculty.experience || 0} years</span>
                                </div>
                                <div className="fc-detail">
                                  <span className="fc-detail-label">Max Lectures/Week</span>
                                  <span className="fc-detail-value">{expandedFaculty.preferences?.maxLecturesPerWeek || 'N/A'}</span>
                                </div>
                              </div>

                              {expandedFaculty.preferences?.preferredSubjects?.length > 0 && (
                                <div className="fc-subjects-row">
                                  <span className="fc-detail-label">Preferred Subjects:</span>
                                  <div className="fc-chips">
                                    {expandedFaculty.preferences.preferredSubjects.sort((a,b)=>a.priority-b.priority).map((s, i) => (
                                      <span key={i} className="chip active">P{s.priority}: {s.subjectName}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </section>
            </div>
          )}
        </div>
      </main>

      {/* Remarks Modal */}
      {remarksModal && (
        <div className="modal-overlay" onClick={() => { setRemarksModal(null); setRemarks(''); }}>
          <div className="modal glass-card-strong animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">
              {remarksModal.action === 'reject' ? '❌ Reject' : '🔄 Request Changes'}
            </h2>
            <p className="modal-subtitle">
              {remarksModal.action === 'reject'
                ? `Reject faculty: ${remarksModal.name}`
                : `Request changes from: ${remarksModal.name}`}
            </p>

            <div className="form-group">
              <label className="form-label">Remarks *</label>
              <textarea
                className="form-input"
                rows="4"
                placeholder="Enter your remarks..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                autoFocus
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => { setRemarksModal(null); setRemarks(''); }}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleReject}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <div className="loader" style={{ width: 18, height: 18, borderWidth: 2 }}></div>
                ) : 'Reject Faculty'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timetable Modal */}
      {timetableModal && (
        <div className="modal-overlay" onClick={() => setTimetableModal(false)}>
          <div className="modal glass-card-strong animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Create Timetable</h2>
            <form onSubmit={handleCreateTimetable}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Timetable Name *</label>
                <input required className="form-input" value={newTimetable.name} onChange={(e) => setNewTimetable({...newTimetable, name: e.target.value})} />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Semester *</label>
                <select required className="form-select" value={newTimetable.semester} onChange={(e) => setNewTimetable({...newTimetable, semester: e.target.value})}>
                  <option value="">Select Semester</option>
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Academic Year *</label>
                <select required className="form-select" value={newTimetable.academicYear} onChange={(e) => setNewTimetable({...newTimetable, academicYear: e.target.value})}>
                  <option value="">Select Year</option>
                  <option value="2023-2024">2023-2024</option>
                  <option value="2024-2025">2024-2025</option>
                  <option value="2025-2026">2025-2026</option>
                  <option value="2026-2027">2026-2027</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setTimetableModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading === 'create-timetable'}>
                  {actionLoading === 'create-timetable' ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Time Slot Modal */}
      {timeSlotModal && (
        <div className="modal-overlay" onClick={() => setTimeSlotModal(false)}>
          <div className="modal glass-card-strong animate-scale-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h2 className="modal-title">Add Time Slot</h2>
            <form onSubmit={handleAddTimeSlot}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Faculty *</label>
                <select required className="form-select" value={newTimeSlot.facultyId} onChange={(e) => setNewTimeSlot({...newTimeSlot, facultyId: e.target.value})}>
                  <option value="">Select Faculty...</option>
                  {facultyList.map(f => (
                    <option key={f._id} value={f._id}>{f.fullName} ({f.branch})</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Subject *</label>
                <input required className="form-input" value={newTimeSlot.subject} onChange={(e) => setNewTimeSlot({...newTimeSlot, subject: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Day *</label>
                  <select required className="form-select" value={newTimeSlot.day} onChange={(e) => setNewTimeSlot({...newTimeSlot, day: e.target.value})}>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Start Slot *</label>
                  <input type="number" min="1" max="8" required className="form-input" value={newTimeSlot.startSlot} onChange={(e) => setNewTimeSlot({...newTimeSlot, startSlot: parseInt(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Slot *</label>
                  <input type="number" min="2" max="9" required className="form-input" value={newTimeSlot.endSlot} onChange={(e) => setNewTimeSlot({...newTimeSlot, endSlot: parseInt(e.target.value)})} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Classroom *</label>
                <input required className="form-input" value={newTimeSlot.classroom} onChange={(e) => setNewTimeSlot({...newTimeSlot, classroom: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setTimeSlotModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading === 'add-slot'}>
                  {actionLoading === 'add-slot' ? 'Adding...' : 'Add Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auto-Generate Modal */}
      {autoGenModal && (
        <div className="modal-overlay" onClick={resetAutoGenModal}>
          <div className="modal auto-gen-modal glass-card-strong animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="auto-gen-header">
              <h2 className="modal-title">🤖 Auto-Generate Timetable</h2>
              <p className="modal-subtitle">Select branch & semester to auto-fetch subjects, or define sections manually below.</p>
            </div>

            {autoGenResult ? (
              <div className="auto-gen-results">
                <div className="auto-gen-result-summary">
                  <div className="result-stat result-success">
                    <span className="result-stat-value">{autoGenResult.totalCreated}</span>
                    <span className="result-stat-label">Slots Created</span>
                  </div>
                  {autoGenResult.warnings?.length > 0 && (
                    <div className="result-stat result-warning">
                      <span className="result-stat-value">{autoGenResult.warnings.length}</span>
                      <span className="result-stat-label">Warnings</span>
                    </div>
                  )}
                </div>

                {autoGenResult.warnings?.length > 0 && (
                  <div className="auto-gen-warnings">
                    <h4>⚠️ Warnings</h4>
                    <ul>
                      {autoGenResult.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="modal-actions">
                  <button className="btn btn-primary" onClick={resetAutoGenModal}>Done</button>
                </div>
              </div>
            ) : (
              <div className="auto-gen-form">
                {/* ── Smart Mode: Branch + Semester ── */}
                <div className="auto-gen-section-card" style={{ borderColor: 'rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.03)' }}>
                  <div className="section-card-header">
                    <span className="section-number" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>⚡ Smart Generate</span>
                  </div>
                  <div className="section-fields-grid">
                    <div className="form-group">
                      <label className="form-label">Branch *</label>
                      <select className="form-select" value={autoGenBranch} onChange={(e) => { setAutoGenBranch(e.target.value); fetchSubjectsForAutoGen(e.target.value, autoGenSemester); }}>
                        <option value="">Select Branch</option>
                        <option value="CSE">CSE</option><option value="IT">IT</option><option value="ECE">ECE</option>
                        <option value="ME">ME</option><option value="CE">CE</option><option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Semester *</label>
                      <select className="form-select" value={autoGenSemester} onChange={(e) => { setAutoGenSemester(e.target.value); fetchSubjectsForAutoGen(autoGenBranch, e.target.value); }}>
                        <option value="">Select Semester</option>
                        {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Classroom *</label>
                      <input className="form-input" placeholder="e.g. Room 101" value={autoGenClassroom} onChange={(e) => setAutoGenClassroom(e.target.value)} />
                    </div>
                  </div>

                  {autoGenFetchedSubjects.length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#22c55e', marginBottom: '8px' }}>
                        📚 {autoGenFetchedSubjects.length} subjects found for {autoGenBranch} Sem {autoGenSemester}:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {autoGenFetchedSubjects.map(s => (
                          <span key={s._id} style={{
                            background: s.isLab ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.1)',
                            color: s.isLab ? '#f59e0b' : 'var(--primary-400)',
                            padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600
                          }}>
                            {s.name} {s.isLab ? '🔬 (2hr)' : `(${s.lecturesPerWeek || 3}/wk)`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="modal-actions" style={{ marginTop: '16px' }}>
                    <button type="button" className="btn btn-primary" onClick={handleSmartAutoGenerate} disabled={generating || !autoGenBranch || !autoGenSemester || !autoGenClassroom || autoGenFetchedSubjects.length === 0}>
                      {generating ? (<><div className="loader" style={{ width: 16, height: 16, borderWidth: 2, display: 'inline-block', verticalAlign: 'middle', marginRight: 8 }}></div>Generating...</>) : '🚀 Smart Generate'}
                    </button>
                  </div>
                </div>

                <div style={{ textAlign: 'center', padding: '12px 0', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>— OR use manual mode below —</div>

                {/* ── Manual Mode (existing) ── */}
                <form onSubmit={handleAutoGenerate} className="auto-gen-form">
                <div className="auto-gen-sections">
                  {autoGenSections.map((section, sIdx) => (
                    <div key={sIdx} className="auto-gen-section-card">
                      <div className="section-card-header">
                        <span className="section-number">Section {sIdx + 1}</span>
                        {autoGenSections.length > 1 && (
                          <button type="button" className="btn-icon-remove" onClick={() => removeSection(sIdx)} title="Remove Section">
                            ✕
                          </button>
                        )}
                      </div>

                      <div className="section-fields-grid">
                        <div className="form-group">
                          <label className="form-label">Section Name *</label>
                          <input
                            required
                            className="form-input"
                            placeholder="e.g. CSE-A"
                            value={section.sectionName}
                            onChange={(e) => updateSection(sIdx, 'sectionName', e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Classroom *</label>
                          <input
                            required
                            className="form-input"
                            placeholder="e.g. Room 101"
                            value={section.classroom}
                            onChange={(e) => updateSection(sIdx, 'classroom', e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Floor</label>
                          <select
                            className="form-select"
                            value={section.floor}
                            onChange={(e) => updateSection(sIdx, 'floor', e.target.value)}
                          >
                            <option value="any-floor">Any Floor</option>
                            <option value="ground-floor">Ground Floor</option>
                            <option value="1st-floor">1st Floor</option>
                            <option value="2nd-floor">2nd Floor</option>
                          </select>
                        </div>
                      </div>

                      <div className="section-subjects">
                        <div className="section-subjects-header">
                          <span className="form-label" style={{ margin: 0 }}>Subjects</span>
                          <button type="button" className="btn-add-small" onClick={() => addSubjectToSection(sIdx)}>
                            + Add Subject
                          </button>
                        </div>
                        {section.subjects.map((sub, subIdx) => (
                          <div key={subIdx} className="subject-row">
                            <select
                              required
                              className="form-select"
                              style={{ flex: 1 }}
                              value={sub.subjectName}
                              onChange={(e) => updateSubjectInSection(sIdx, subIdx, 'subjectName', e.target.value)}
                            >
                              <option value="">Select Subject...</option>
                              {ALL_SUBJECTS.map(subject => (
                                <option key={subject} value={subject}>{subject}</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              required
                              className="form-input subject-lectures-input"
                              title="Lectures per week"
                              value={sub.lecturesPerWeek}
                              onChange={(e) => updateSubjectInSection(sIdx, subIdx, 'lecturesPerWeek', parseInt(e.target.value) || 1)}
                            />
                            <span className="lectures-label">/ week</span>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#666', marginLeft: '8px' }}>
                              <input
                                type="checkbox"
                                checked={sub.isLab}
                                onChange={(e) => updateSubjectInSection(sIdx, subIdx, 'isLab', e.target.checked)}
                              />
                              Is Lab (2hrs)
                            </label>
                            {section.subjects.length > 1 && (
                              <button type="button" className="btn-icon-remove-sm" onClick={() => removeSubjectFromSection(sIdx, subIdx)}>✕</button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <button type="button" className="btn-add-section" onClick={addSection}>
                  + Add Another Section
                </button>

                <div className="modal-actions">
                  <button type="button" className="btn btn-ghost" onClick={resetAutoGenModal}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={generating}>
                    {generating ? (
                      <><div className="loader" style={{ width: 16, height: 16, borderWidth: 2, display: 'inline-block', verticalAlign: 'middle', marginRight: 8 }}></div>Generating...</>
                    ) : '🚀 Generate Timetable'}
                  </button>
                </div>
              </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subject Modal */}
      {subjectModal && (
        <div className="modal-overlay" onClick={() => setSubjectModal(false)}>
          <div className="modal glass-card-strong animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{editingSubject ? 'Edit Subject' : 'Add New Subject'}</h2>
            <form onSubmit={handleSubjectSubmit}>
              <div className="form-group mb-3">
                <label className="form-label">Subject Name *</label>
                <input required className="form-input" value={newSubject.name} onChange={(e) => setNewSubject({...newSubject, name: e.target.value})} placeholder="e.g. Operating Systems" />
              </div>
              <div className="form-group mb-3">
                <label className="form-label">Subject Code *</label>
                <input required className="form-input" value={newSubject.code} onChange={(e) => setNewSubject({...newSubject, code: e.target.value})} placeholder="e.g. CS101" />
              </div>
              <div className="form-group mb-3">
                <label className="form-label">Semester *</label>
                <select required className="form-select" value={newSubject.semester} onChange={(e) => setNewSubject({...newSubject, semester: parseInt(e.target.value)})}>
                  <option value="">Select Semester</option>
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
              <div className="form-group mb-4">
                <label className="form-label">Branch *</label>
                <select required className="form-select" value={newSubject.branch} onChange={(e) => setNewSubject({...newSubject, branch: e.target.value})}>
                  <option value="">Select Branch</option>
                  <option value="CSE">CSE</option>
                  <option value="IT">IT</option>
                  <option value="ECE">ECE</option>
                  <option value="ME">ME</option>
                  <option value="CE">CE</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={newSubject.isLab || false} onChange={(e) => setNewSubject({...newSubject, isLab: e.target.checked, lecturesPerWeek: e.target.checked ? 2 : 3})} />
                  <span style={{ fontSize: '0.9rem' }}>🔬 Is Lab (2-hour slots)</span>
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setSubjectModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading === 'subject-submit'}>
                  {actionLoading === 'subject-submit' ? 'Saving...' : (editingSubject ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pending Requests Modal */}
      {pendingRequestsModal && (
        <div className="modal-overlay" onClick={() => setPendingRequestsModal(false)}>
          <div className="modal glass-card-strong animate-scale-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <h2 className="modal-title">📋 New Faculty Requests ({pendingList.length})</h2>
            <div style={{ maxHeight: '500px', overflowY: 'auto', padding: '4px' }}>
              {pendingList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>
                  <p>🎉 No pending requests!</p>
                </div>
              ) : (
                pendingList.map((faculty) => (
                  <div key={faculty._id} className="glass-card" style={{ marginBottom: '0.75rem', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                      <div>
                        <h4 style={{ margin: 0, fontWeight: 700 }}>{faculty.fullName}</h4>
                        <p style={{ margin: '2px 0', fontSize: '0.85rem', opacity: 0.7 }}>{faculty.email}</p>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px', fontSize: '0.8rem', flexWrap: 'wrap' }}>
                          <span>🏢 {faculty.branch}</span>
                          <span>🎓 {faculty.designation}</span>
                          <span>📅 {faculty.experience || 0} yrs</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <button className="btn btn-success btn-sm" onClick={() => handleApprove(faculty._id)} disabled={actionLoading === faculty._id}>
                          {actionLoading === faculty._id ? '...' : '✅'}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => { setPendingRequestsModal(false); setRemarksModal({ facultyId: faculty._id, action: 'reject', name: faculty.fullName }); }}>
                          ❌
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{color:'#ef4444'}} onClick={(e) => handleDeleteFaculty(faculty._id, e)}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setPendingRequestsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Generation Logs Modal */}
      {logsModal && (
        <div className="modal-overlay" onClick={() => setLogsModal(false)}>
          <div className="modal glass-card-strong animate-scale-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
            <h2 className="modal-title">🤖 Generation Logs</h2>
            <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'monospace' }}>
              {generationLogs && generationLogs.length > 0 ? (
                generationLogs.map((log, i) => (
                  <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', color: log.startsWith('Skipped') ? '#ef4444' : '#22c55e' }}>
                    {log}
                  </div>
                ))
              ) : (
                <p>No logs available.</p>
              )}
            </div>
            <div className="modal-actions" style={{ marginTop: '1rem' }}>
              <button className="btn btn-primary" onClick={() => setLogsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Class Timetable Modal */}
      {classTimetableModal && selectedClassDetails && (
        <div className="modal-overlay" onClick={() => setClassTimetableModal(false)}>
          <div className="modal glass-card-strong animate-scale-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', width: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 className="modal-title" style={{ marginBottom: '4px' }}>{selectedClassDetails.className} Timetable</h2>
                <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>{selectedClassDetails.branch} - Sem {selectedClassDetails.semester}</p>
              </div>
              <button className="btn btn-ghost" onClick={() => setClassTimetableModal(false)} style={{ fontSize: '1.5rem', padding: '0 10px' }}>✕</button>
            </div>

            {loading ? (
              <div className="loader-page" style={{minHeight:'200px'}}><div className="loader"></div></div>
            ) : selectedClassTimetable && selectedClassTimetable.length > 0 ? (
              <div className="timetable-grid glass-card" style={{ padding: '16px', overflowX: 'auto' }}>
                <div className="tt-header-row">
                  <div className="tt-corner">Day / Time</div>
                  {[1, 2, 3, 4].map(slot => (
                    <div key={slot} className="tt-header-cell">{TIME_SLOTS[slot - 1]}</div>
                  ))}
                  <div className="tt-header-cell" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>LUNCH</div>
                  {[5, 6].map(slot => (
                    <div key={slot} className="tt-header-cell">{TIME_SLOTS[slot - 1]}</div>
                  ))}
                </div>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                  <div key={day} className="tt-row">
                    <div className="tt-day-cell">{day.slice(0, 3)}</div>
                    {[1, 2, 3, 4, 'LUNCH', 5, 6].map(slot => {
                      if (slot === 'LUNCH') {
                        return <div key="lunch" className="tt-lunch-cell">LUNCH</div>;
                      }
                      const entry = selectedClassTimetable.find(t => t.day === day && t.startSlot === slot);
                      
                      return (
                        <div key={slot} className={`tt-cell ${entry ? 'filled' : ''}`}>
                          {entry && (
                            <>
                              <span className="tt-subject" title={entry.subject}>{entry.subject.length > 15 ? entry.subject.substring(0,15)+'...' : entry.subject}</span>
                              <span className="tt-room">{entry.classroom}</span>
                              <span className="tt-room" style={{fontSize:'0.6rem', opacity:0.8}}>{entry.facultyId?.fullName || ''}</span>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>
                <p>No timetable found for this class.</p>
              </div>
            )}
            
            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
              <button className="btn btn-ghost" onClick={() => setClassTimetableModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal && (
        <div className="modal-overlay">
          <div className="modal glass-card animate-fade-in-up">
            <h3 className="modal-title" style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>⚠️</span> Delete Timetable
            </h3>
            <p className="modal-subtitle">
              Are you sure you want to permanently delete this timetable? This action cannot be undone and will remove all associated time slots.
            </p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteConfirmModal(null)} disabled={!!isDeleting}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmDeleteTimetable} disabled={!!isDeleting}>
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Faculty Confirmation Modal */}
      {deleteFacultyConfirm && (
        <div className="modal-overlay">
          <div className="modal glass-card animate-fade-in-up">
            <h3 className="modal-title" style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>⚠️</span> Delete Faculty Member
            </h3>
            <p className="modal-subtitle">
              Are you sure you want to permanently delete this faculty member? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteFacultyConfirm(null)} disabled={!!isDeleting}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmDeleteFaculty} disabled={!!isDeleting}>
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
