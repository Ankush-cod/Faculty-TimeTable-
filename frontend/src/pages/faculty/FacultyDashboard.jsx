import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { facultyAPI, authAPI, subjectsAPI } from '../../api/api';
import Confetti from '../../components/Confetti';
import './FacultyDashboard.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  '9:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '12:00 - 1:00',
  '2:30 - 3:30', '3:30 - 4:30', '4:30 - 5:30'
];



export default function FacultyDashboard() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [prefs, setPrefs] = useState({
    availableDays: [...DAYS],
    preferredTimeSlots: [...TIME_SLOTS],
    maxLecturesPerWeek: 15,
    consecutiveLecturesPreference: 'no-preference',
    preferredTimePeriod: 'both',
    lunchBreakPreference: '12-1',
    roomTypePreferences: [],
    floorPreference: 'any-floor',
    specialRequirements: '',
    constraints: '',
    preferredSubjects: [],
    unavailableSlots: [],
  });
  const [detailsModal, setDetailsModal] = useState(false);

  const [allSubjects, setAllSubjects] = useState([]);

  const fileInputRef = useRef(null);

  // Security state
  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    loadProfile();
    loadTimetable();
    loadAllSubjects();
  }, []);

  const loadAllSubjects = async () => {
    try {
      const res = await subjectsAPI.getAll();
      setAllSubjects(res.data || []);
    } catch (err) {
      console.error('Failed to load subjects:', err);
    }
  };

  const addPreferredSubject = (subjectId) => {
    if (!subjectId) return;
    setPrefs(prev => {
      const exists = prev.preferredSubjects.find(s => s.subjectId === subjectId);
      if (exists) return prev;
      
      const subject = allSubjects.find(s => s._id === subjectId);
      return {
        ...prev,
        preferredSubjects: [
          ...prev.preferredSubjects,
          { subjectId, subjectName: subject.name, priority: prev.preferredSubjects.length + 1 }
        ]
      };
    });
  };

  const removePreferredSubject = (subjectId) => {
    setPrefs(prev => ({
      ...prev,
      preferredSubjects: prev.preferredSubjects.filter(s => s.subjectId !== subjectId)
    }));
  };

  const updateSubjectPriority = (subjectId, priority) => {
    setPrefs(prev => ({
      ...prev,
      preferredSubjects: prev.preferredSubjects.map(s => 
        s.subjectId === subjectId ? { ...s, priority: parseInt(priority) } : s
      )
    }));
  };

  const toggleUnavailableSlot = (slot) => {
    setPrefs(prev => ({
      ...prev,
      unavailableSlots: prev.unavailableSlots.includes(slot)
        ? prev.unavailableSlots.filter(s => s !== slot)
        : [...prev.unavailableSlots, slot]
    }));
  };

  const loadProfile = async () => {
    try {
      const res = await facultyAPI.getProfile();
      setProfile(res.data);
      if (res.data.preferences) {
        setPrefs(prev => ({ ...prev, ...res.data.preferences }));
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTimetable = async () => {
    try {
      const res = await facultyAPI.getMyTimetable();
      setTimetable(res.data || []);
    } catch (err) {
      console.error('Failed to load timetable:', err);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await facultyAPI.updateImage(fd);
      setProfile(prev => ({ ...prev, image: res.data.image }));
      updateUser({ image: res.data.image });
      showToast('Profile image updated!');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      await facultyAPI.updatePreferences(prefs);
      showToast('Preferences saved successfully!');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };



  const changePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    setSaving(true);
    try {
      await facultyAPI.changePassword(passwords.oldPassword, passwords.newPassword, passwords.confirmPassword);
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



  const handleAllocationChoice = async (choice) => {
    if (!window.confirm(`Are you sure you want to ${choice.toUpperCase()} your current allocation?`)) return;
    setSaving(true);
    try {
      await facultyAPI.setAllocationChoice(choice);
      showToast(`Allocation marked as ${choice}`);
      loadProfile();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      // Ignore – clear local state anyway
    }
    logout();
    navigate('/login');
  };

  const toggleDay = (day) => {
    setPrefs(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day]
    }));
  };

  const toggleTimeSlot = (slot) => {
    setPrefs(prev => ({
      ...prev,
      preferredTimeSlots: prev.preferredTimeSlots.includes(slot)
        ? prev.preferredTimeSlots.filter(s => s !== slot)
        : [...prev.preferredTimeSlots, slot]
    }));
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

  const sidebarItems = [
    { id: 'profile', icon: '👤', label: 'Profile' },
    { id: 'preferences', icon: '⚙️', label: 'Preferences' },
    { id: 'timetable', icon: '📅', label: 'Timetable' },
    { id: 'classrooms', icon: '🏫', label: 'Classrooms' },
  ];

  if (loading) {
    return <div className="loader-page"><div className="loader"></div></div>;
  }

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
        <h2 className="mobile-title gradient-text">Faculty Dashboard</h2>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="14" fill="url(#sideLogoGrad)" />
              <path d="M14 34V14h6l4 12 4-12h6v20h-5V22l-3.5 12h-3L19 22v12h-5z" fill="white" />
              <defs>
                <linearGradient id="sideLogoGrad" x1="0" y1="0" x2="48" y2="48">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <h3 className="sidebar-brand gradient-text">Faculty Portal</h3>
            <p className="sidebar-role">Dashboard</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              className={`sidebar-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span>{item.label}</span>
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
        {/* ====== PROFILE SECTION ====== */}
        {activeSection === 'profile' && (
          <div className="section animate-fade-in-up">
            <div className="profile-hero glass-card">
              <div className="profile-hero-bg"></div>
              <div className="profile-info-row">
                <div className="avatar-wrapper" onClick={() => fileInputRef.current?.click()}>
                  {profile?.image ? (
                    <img src={profile.image} alt={profile.fullName} className="avatar-img" />
                  ) : (
                    <div className="avatar-placeholder">
                      {profile?.fullName?.charAt(0)?.toUpperCase() || 'F'}
                    </div>
                  )}
                  <div className="avatar-overlay">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} hidden />
                </div>
                <div className="profile-details">
                  <h1 className="profile-name">{profile?.fullName}</h1>
                  <p className="profile-designation">{profile?.designation || 'Faculty'}</p>
                  <div className="profile-meta">
                    <span>📧 {profile?.email}</span>
                    <span>🏢 {profile?.branch}</span>
                    <span>📅 {profile?.experience || 0} yrs exp</span>
                  </div>
                  <div className="profile-status-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    {getStatusBadge(profile?.status)}
                    {profile?.allocationStatus && profile.allocationStatus !== 'unallocated' && (
                      <span className="badge badge-primary">🔄 {profile.allocationStatus}</span>
                    )}
                    <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.8rem', padding: '4px 8px' }} onClick={() => setDetailsModal(true)}>
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Remarks */}
            {profile?.adminRemarks && (
              <div className="remarks-card glass-card animate-fade-in">
                <h3>📝 Admin Remarks</h3>
                <p>{profile.adminRemarks}</p>
              </div>
            )}

            {/* Quick Stats */}
            <div className="stats-grid">
              <div className="stat-card glass-card animate-fade-in-up" style={{animationDelay:'0.1s'}}>
                <div className="stat-icon" style={{background:'rgba(99,102,241,0.15)'}}>📚</div>
                <div className="stat-info">
                  <span className="stat-value">{prefs.preferredSubjects?.length || 0}</span>
                  <span className="stat-label">Prefs</span>
                </div>
              </div>
              <div className="stat-card glass-card animate-fade-in-up" style={{animationDelay:'0.2s'}}>
                <div className="stat-icon" style={{background:'rgba(34,197,94,0.15)'}}>📅</div>
                <div className="stat-info">
                  <span className="stat-value">{timetable.length}</span>
                  <span className="stat-label">Classes</span>
                </div>
              </div>
              <div className="stat-card glass-card animate-fade-in-up" style={{animationDelay:'0.3s'}}>
                <div className="stat-icon" style={{background:'rgba(245,158,11,0.15)'}}>⏰</div>
                <div className="stat-info">
                  <span className="stat-value">{prefs.maxLecturesPerWeek}</span>
                  <span className="stat-label">Max/Week</span>
                </div>
              </div>
              <div className="stat-card glass-card animate-fade-in-up" style={{animationDelay:'0.4s'}}>
                <div className="stat-icon" style={{background:'rgba(6,182,212,0.15)'}}>📆</div>
                <div className="stat-info">
                  <span className="stat-value">{prefs.availableDays.length}</span>
                  <span className="stat-label">Days</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====== PREFERENCES SECTION ====== */}
        {activeSection === 'preferences' && (
          <div className="section animate-fade-in-up">
            <div className="section-header">
              <h2 className="section-title">⚙️ Preferences</h2>
              <p className="section-desc">Configure your scheduling preferences</p>
            </div>

            <div className="pref-grid">
              {/* Available Days */}
              <div className="pref-card glass-card">
                <h3>Available Days</h3>
                <div className="chip-group">
                  {DAYS.map(day => (
                    <button
                      key={day}
                      className={`chip ${prefs.availableDays.includes(day) ? 'active' : ''}`}
                      onClick={() => toggleDay(day)}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Slots */}
              <div className="pref-card glass-card">
                <h3>Preferred Time Slots</h3>
                <div className="chip-group">
                  {TIME_SLOTS.map(slot => (
                    <button
                      key={slot}
                      className={`chip ${prefs.preferredTimeSlots.includes(slot) ? 'active' : ''}`}
                      onClick={() => toggleTimeSlot(slot)}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Lectures */}
              <div className="pref-card glass-card">
                <h3>Max Lectures Per Week: <span className="gradient-text">{prefs.maxLecturesPerWeek}</span></h3>
                <input
                  type="range"
                  min="5"
                  max="25"
                  value={prefs.maxLecturesPerWeek}
                  onChange={(e) => setPrefs(prev => ({ ...prev, maxLecturesPerWeek: parseInt(e.target.value) }))}
                  className="range-slider"
                />
                <div className="range-labels">
                  <span>5</span>
                  <span>15</span>
                  <span>25</span>
                </div>
              </div>

              {/* Consecutive Preference */}
              <div className="pref-card glass-card">
                <h3>Consecutive Lectures</h3>
                <div className="radio-group">
                  {['prefer-consecutive', 'no-preference', 'prefer-breaks'].map(opt => (
                    <label key={opt} className="radio-label">
                      <input
                        type="radio"
                        name="consecutive"
                        checked={prefs.consecutiveLecturesPreference === opt}
                        onChange={() => setPrefs(prev => ({ ...prev, consecutiveLecturesPreference: opt }))}
                      />
                      <span>{opt.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Time Period */}
              <div className="pref-card glass-card">
                <h3>Preferred Time Period</h3>
                <div className="radio-group">
                  {['morning', 'afternoon', 'both'].map(opt => (
                    <label key={opt} className="radio-label">
                      <input
                        type="radio"
                        name="timePeriod"
                        checked={prefs.preferredTimePeriod === opt}
                        onChange={() => setPrefs(prev => ({ ...prev, preferredTimePeriod: opt }))}
                      />
                      <span>{opt.charAt(0).toUpperCase() + opt.slice(1)}</span>
                    </label>
                  ))}
                </div>
              </div>



              {/* Floor Preference */}
              <div className="pref-card glass-card">
                <h3>Floor Preference</h3>
                <select
                  className="form-select"
                  value={prefs.floorPreference}
                  onChange={(e) => setPrefs(prev => ({ ...prev, floorPreference: e.target.value }))}
                >
                  <option value="any-floor">Any Floor</option>
                  <option value="ground-floor">Ground Floor</option>
                  <option value="1st-floor">1st Floor</option>
                  <option value="2nd-floor">2nd Floor</option>
                </select>
              </div>

              {/* Subject Preferences (Requirement 2) */}
              <div className="pref-card glass-card full-width">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3>Subject Preferences (Priority Wise)</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select 
                      className="form-select" 
                      style={{ width: 'auto', minWidth: '200px' }}
                      onChange={(e) => { addPreferredSubject(e.target.value); e.target.value = ""; }}
                    >
                      <option value="">Add Subject...</option>
                      {allSubjects
                        .filter(s => s.branch === profile?.branch && !prefs.preferredSubjects.find(ps => ps.subjectId === s._id))
                        .map(s => (
                          <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                        ))
                      }
                    </select>
                  </div>
                </div>
                
                {prefs.preferredSubjects.length === 0 ? (
                  <p style={{ opacity: 0.6, fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>No subjects selected. Add subjects from the dropdown above.</p>
                ) : (
                  <div className="pref-subjects-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {prefs.preferredSubjects.sort((a, b) => a.priority - b.priority).map((s, idx) => (
                      <div key={s.subjectId} className="glass-card" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <span style={{ fontWeight: 800, color: 'var(--primary-400)', fontSize: '1.1rem' }}>#{idx + 1}</span>
                          <div>
                            <div style={{ fontWeight: 600 }}>{s.subjectName}</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Priority Weight: {s.priority}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <select 
                            className="form-select" 
                            style={{ width: '100px' }}
                            value={s.priority}
                            onChange={(e) => updateSubjectPriority(s.subjectId, e.target.value)}
                          >
                            {[1,2,3,4,5,6,7,8,9,10].map(p => <option key={p} value={p}>P{p}</option>)}
                          </select>
                          <button className="btn-icon-remove" onClick={() => removePreferredSubject(s.subjectId)}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Not Available Slots (Requirement 2) */}
              <div className="pref-card glass-card">
                <h3>Not Available Slots</h3>
                <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '10px' }}>Select slots where you are absolutely not available.</p>
                <div className="chip-group">
                  {TIME_SLOTS.map(slot => (
                    <button
                      key={slot}
                      className={`chip ${prefs.unavailableSlots?.includes(slot) ? 'active-danger' : ''}`}
                      onClick={() => toggleUnavailableSlot(slot)}
                      style={{ 
                        borderColor: prefs.unavailableSlots?.includes(slot) ? '#ef4444' : '',
                        background: prefs.unavailableSlots?.includes(slot) ? 'rgba(239, 68, 68, 0.2)' : ''
                      }}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Special Requirements */}
              <div className="pref-card glass-card full-width">
                <h3>Special Requirements</h3>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="Any special requirements..."
                  value={prefs.specialRequirements}
                  onChange={(e) => setPrefs(prev => ({ ...prev, specialRequirements: e.target.value }))}
                />
              </div>

              {/* Constraints */}
              <div className="pref-card glass-card full-width">
                <h3>Constraints</h3>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="Any scheduling constraints..."
                  value={prefs.constraints}
                  onChange={(e) => setPrefs(prev => ({ ...prev, constraints: e.target.value }))}
                />
              </div>
            </div>

            <button className="btn btn-primary btn-lg save-pref-btn" onClick={savePreferences} disabled={saving}>
              {saving ? (
                <div className="loader" style={{ width: 20, height: 20, borderWidth: 2 }}></div>
              ) : (
                <>
                  💾 Save Preferences
                </>
              )}
            </button>
          </div>
        )}

        {/* ====== TIMETABLE SECTION ====== */}
        {activeSection === 'timetable' && (
          <div className="section animate-fade-in-up">
            <div className="section-header">
              <h2 className="section-title">📅 My Timetable</h2>
              <p className="section-desc">Your weekly class schedule</p>
            </div>

            {timetable.length === 0 ? (
              <div className="empty-state glass-card">
                <div className="empty-icon">📅</div>
                <h3>No Timetable Assigned</h3>
                <p>Your timetable will appear here once the admin assigns your schedule.</p>
              </div>
            ) : (
              <div className="timetable-grid glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>Allocation Round Status</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Current Status: <strong style={{ color: 'var(--primary-400)' }}>{profile?.allocationStatus || 'unallocated'}</strong></p>
                  </div>
                  {profile?.allocationStatus && ['allocated', 'upgraded'].includes(profile.allocationStatus) && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-success btn-sm" onClick={() => handleAllocationChoice('frozen')} disabled={saving}>❄️ Freeze</button>
                      <button className="btn btn-warning btn-sm" onClick={() => handleAllocationChoice('upgraded')} disabled={saving}>⬆️ Upgrade</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleAllocationChoice('withdrawn')} disabled={saving}>🛑 Withdraw</button>
                    </div>
                  )}
                </div>
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
                {DAYS.map(day => (
                  <div key={day} className="tt-row">
                    <div className="tt-day-cell">{day.slice(0,3)}</div>
                    {[1, 2, 3, 4, 'LUNCH', 5, 6, 7].map(slot => {
                      if (slot === 'LUNCH') {
                        return (
                          <div key="lunch" className="tt-lunch-cell">LUNCH</div>
                        );
                      }
                      const entry = timetable.find(t => t.day === day && t.startSlot === slot);
                      const spannedByEntry = timetable.find(t => t.day === day && t.startSlot < slot && t.endSlot > slot);
                      
                      if (spannedByEntry) return null;
                      
                      const spanCount = entry ? (entry.endSlot - entry.startSlot) : 1;
                      const cellStyle = spanCount > 1 ? { gridColumn: `span ${spanCount}` } : {};

                      return (
                        <div key={slot} className={`tt-cell ${entry ? 'filled' : ''}`} style={cellStyle}>
                          {entry && (
                            <>
                              <span className="tt-subject">{entry.subject}</span>
                              <span className="tt-room">{entry.classroom}</span>
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
        )}

        {/* ====== CLASSROOMS SECTION ====== */}
        {activeSection === 'classrooms' && (
          <div className="section animate-fade-in-up">
            <div className="section-header">
              <h2 className="section-title">🏫 Classrooms</h2>
              <p className="section-desc">Your assigned classroom locations</p>
            </div>

            {timetable.length === 0 ? (
              <div className="empty-state glass-card">
                <div className="empty-icon">🏫</div>
                <h3>No Classrooms Assigned</h3>
                <p>Classroom information will appear once your timetable is set.</p>
              </div>
            ) : (
              <div className="classrooms-grid">
                {[...new Set(timetable.map(t => t.classroom))].map((room, index) => {
                  const roomEntries = timetable.filter(t => t.classroom === room);
                  return (
                    <div key={room} className="classroom-card glass-card animate-fade-in-up" style={{animationDelay:`${index * 0.1}s`}}>
                      <div className="classroom-header">
                        <span className="classroom-icon">🏫</span>
                        <h3>{room}</h3>
                      </div>
                      <div className="classroom-entries">
                        {roomEntries.map((entry, i) => (
                          <div key={i} className="classroom-entry">
                            <span className="ce-day">{entry.day.slice(0,3)}</span>
                            <span className="ce-slot">Slot {entry.startSlot}–{entry.endSlot}</span>
                            <span className="ce-subject">{entry.subject}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ====== PREFERENCES DETAILS MODAL ====== */}
        {detailsModal && (
          <div className="modal-overlay animate-fade-in" onClick={() => setDetailsModal(false)}>
            <div className="modal glass-card animate-scale-up" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <div className="modal-header">
                <h2 className="modal-title">Registration Details & Preferences</h2>
                <button className="modal-close" onClick={() => setDetailsModal(false)}>✕</button>
              </div>
              <div className="modal-body" style={{ marginTop: '1.5rem' }}>
                <div className="detail-section">
                  <h4 style={{marginBottom:'0.5rem', color:'var(--primary-400)'}}>Academic Information</h4>
                  <div className="detail-grid" style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:'1rem'}}>
                    <div className="detail-item">
                      <label style={{display:'block', fontSize:'0.75rem', opacity:0.7}}>Designation</label>
                      <p style={{fontWeight:600}}>{profile?.designation}</p>
                    </div>
                    <div className="detail-item">
                      <label style={{display:'block', fontSize:'0.75rem', opacity:0.7}}>Branch</label>
                      <p style={{fontWeight:600}}>{profile?.branch}</p>
                    </div>
                    <div className="detail-item">
                      <label style={{display:'block', fontSize:'0.75rem', opacity:0.7}}>Status</label>
                      <p style={{fontWeight:600}}>{profile?.status?.toUpperCase()}</p>
                    </div>
                  </div>
                </div>
                
                <div className="detail-section" style={{ marginTop: '1.5rem' }}>
                  <h4 style={{marginBottom:'0.5rem', color:'var(--primary-400)'}}>Subject Preferences</h4>
                  {prefs.preferredSubjects.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No subjects selected yet.</p>
                  ) : (
                    <div className="pref-subjects-list" style={{ display: 'grid', gap: '8px', marginTop: '8px' }}>
                      {prefs.preferredSubjects.sort((a,b) => a.priority - b.priority).map((s, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '8px' }}>
                          <span>{s.subjectName}</span>
                          <span style={{background:'rgba(99,102,241,0.2)', padding:'2px 8px', borderRadius:'4px', fontSize:'0.75rem'}}>Priority {s.priority}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="detail-section" style={{ marginTop: '1.5rem' }}>
                  <h4 style={{marginBottom:'0.5rem', color:'var(--primary-400)'}}>Time & Day Preferences</h4>
                  <p><strong>Days:</strong> {prefs.availableDays.join(', ')}</p>
                  <p><strong>Slots:</strong> {prefs.preferredTimeSlots.length} slots selected</p>
                  <p><strong>Max Lectures:</strong> {prefs.maxLecturesPerWeek} per week</p>
                </div>
              </div>
              <div className="modal-footer" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" onClick={() => setDetailsModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}
