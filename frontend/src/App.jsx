import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Upload,
  ShieldCheck,
  Database,
  History,
  Calculator,
  UserCheck,
  Eye,
  LogOut
} from 'lucide-react';
import { SignedIn, SignedOut, SignIn, useAuth, UserButton } from '@clerk/clerk-react';

const API_BASE = 'http://localhost:8000';

function LoginScreen({ onLogin, isClerkEnabled }) {
  const scrollToGateway = () => {
    document.getElementById('login-gateway')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{
      fontFamily: 'Outfit, Inter, system-ui, sans-serif',
      background: 'radial-gradient(circle at 50% 0%, #0d1530 0%, #030712 100%)',
      minHeight: '100vh',
      color: 'var(--text-primary)'
    }}>
      {/* Navigation Header */}
      <nav className="landing-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.8rem', filter: 'drop-shadow(0 0 10px rgba(0, 242, 254, 0.4))' }}>🛡️</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, background: 'var(--primary-glow)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ClaimsAgent AI
          </span>
        </div>
        <div className="nav-links">
          <span className="nav-link" onClick={scrollToGateway}>Features</span>
          <span className="nav-link" onClick={scrollToGateway}>Security & RAG</span>
          <span className="nav-link" onClick={scrollToGateway}>Developer Demo</span>
        </div>
        <button className="view-btn" onClick={scrollToGateway} style={{ padding: '0.5rem 1.1rem', borderRadius: '30px' }}>
          Launch Console
        </button>
      </nav>

      {/* Hero Section */}
      <header className="business-hero">
        <span className="hero-badge">🚀 Enterprise Multi-Agent Underwriting</span>
        <h1 style={{
          fontSize: '3.2rem',
          fontWeight: '800',
          lineHeight: '1.15',
          background: 'linear-gradient(135deg, #f8fafc 30%, #94a3b8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '1.25rem',
          letterSpacing: '-0.03em'
        }}>
          Autonomous Claims Verification.<br />
          <span style={{ background: 'var(--primary-glow)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Secured by Human Sign-off.</span>
        </h1>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '1.15rem',
          maxWidth: '720px',
          margin: '0 auto 2.5rem',
          lineHeight: '1.6',
          fontWeight: '400'
        }}>
          Accelerate your clinical invoice audits by de-coupling rote exception reviews. Validate claims against complex policy boundaries using semantic vector RAG re-ranking and stateful multi-agent pipelines with built-in human verification gates.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <button className="btn-primary" onClick={scrollToGateway} style={{ width: 'auto', padding: '0.8rem 2rem', borderRadius: '30px' }}>
            Access App Console
          </button>
          <button className="view-btn" onClick={() => window.open('https://github.com', '_blank')} style={{ padding: '0.8rem 2rem', borderRadius: '30px', fontSize: '0.95rem' }}>
            Read Specs & Docs
          </button>
        </div>

        {/* Live Business Metrics */}
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-number">98.4%</div>
            <div className="stat-label">Ingestion Extraction Accuracy</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">4.2x</div>
            <div className="stat-label">Faster Underwriting Turnaround</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">100%</div>
            <div className="stat-label">Durable Audit Log Traceability</div>
          </div>
        </div>
      </header>

      {/* Feature Pillar Grid */}
      <section className="business-features">
        <div className="landing-feature-card">
          <div className="feature-icon-box">
            <Database size={20} />
          </div>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', color: '#fff' }}>Semantic Clause RAG</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Queries policy terms with multi-variant semantic expansions, retrieves matching rules via Qdrant, and filters candidates using a clinical relevance re-ranking LLM.
          </p>
        </div>

        <div className="landing-feature-card">
          <div className="feature-icon-box" style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
            <History size={20} />
          </div>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', color: '#fff' }}>Durable State Machines</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Orchestrates claims audits through a LangGraph state machine. Automatically pauses execution at the human verification boundary and persists intermediate snapshots.
          </p>
        </div>

        <div className="landing-feature-card">
          <div className="feature-icon-box" style={{ color: '#3b82f6', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
            <Calculator size={20} />
          </div>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', color: '#fff' }}>Automated Limit Math</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Performs programmatic checks against policy lifetime limits and exclusions lists. Dynamically computes balances and warns if a claim exceeds coverage limits.
          </p>
        </div>

        <div className="landing-feature-card">
          <div className="feature-icon-box" style={{ color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
            <UserCheck size={20} />
          </div>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', color: '#fff' }}>Role-Based Verification</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Secures data at both API and database layers. Patients can submit and track claims, while claims officers have full access to policy ingestion and approvals.
          </p>
        </div>
      </section>

      {/* Login / Simulated Access Gateway */}
      <section id="login-gateway" style={{
        padding: '5rem 1.5rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'rgba(3, 7, 18, 0.4)',
        borderTop: '1px solid var(--border-light)'
      }}>
        <div className="glass-card" style={{
          maxWidth: '740px',
          width: '100%',
          padding: '3rem 2rem',
          border: '1px solid rgba(0, 242, 254, 0.15)',
          background: 'rgba(10, 18, 42, 0.55)',
          boxShadow: '0 15px 40px rgba(0, 0, 0, 0.45)',
          textAlign: 'center',
          borderRadius: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '2.5rem', filter: 'drop-shadow(0 0 10px rgba(0, 242, 254, 0.3))' }}>🛡️</span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: '#fff' }}>App Gateway Console</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '2.5rem', maxWidth: '480px', margin: '0 auto 2.5rem' }}>
            Access your secure portal workspace. Choose either production JWT verification or test simulated persona profiles below.
          </p>

          {isClerkEnabled ? (
            <div style={{ background: 'rgba(4, 8, 20, 0.4)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
              <h3 style={{ fontSize: '1.05rem', color: '#f8fafc', marginBottom: '1.25rem', fontWeight: 600 }}>Production Login (Clerk Single Sign-On)</h3>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <SignIn routing="hash" />
              </div>
            </div>
          ) : (
            <div>
              <h3 style={{
                fontSize: '0.9rem',
                color: 'var(--accent-cyan)',
                marginBottom: '1.5rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                background: 'rgba(0, 242, 254, 0.03)',
                display: 'inline-block',
                padding: '0.3rem 0.8rem',
                borderRadius: '6px',
                border: '1px solid rgba(0, 242, 254, 0.15)'
              }}>
                Developer Bypass Active (Select Persona to Demo)
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.5rem'
              }}>
                {/* Customer card */}
                <div 
                  className="persona-card"
                  onClick={() => onLogin('customer@example.com', 'customer')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div className="persona-icon-box" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                      👤
                    </div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', margin: 0 }}>Patient Workspace</h4>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.45', flexGrow: 1, margin: 0 }}>
                    Submit clinical bills/medical invoices, audit active coverage calculations, and view personalized status feeds.
                  </p>
                  <div style={{ marginTop: '1.25rem', fontSize: '0.8rem', color: '#3b82f6', fontWeight: '700', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                    Login as Customer (customer@example.com) →
                  </div>
                </div>

                {/* Officer card */}
                <div 
                  className="persona-card"
                  onClick={() => onLogin('officer@example.com', 'claim_officer')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div className="persona-icon-box" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                      💼
                    </div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', margin: 0 }}>Underwriter Console</h4>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.45', flexGrow: 1, margin: 0 }}>
                    Monitor claims underwriting queues, index policy PDFs into Qdrant, audit vector retrieval layers, and override sign-offs.
                  </p>
                  <div style={{ marginTop: '1.25rem', fontSize: '0.8rem', color: '#10b981', fontWeight: '700', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                    Login as Claims Officer (officer@example.com) →
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p style={{ marginBottom: '1rem' }}>© 2026 ClaimsAgent AI Inc. All rights reserved. Designed for agentic medical underwriting.</p>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span className="tech-tag">React 18</span>
          <span className="tech-tag">FastAPI</span>
          <span className="tech-tag">LangGraph</span>
          <span className="tech-tag">Qdrant Vector DB</span>
          <span className="tech-tag">Gemini 2.5 Flash</span>
          <span className="tech-tag">Clerk Auth</span>
          <span className="tech-tag">SQLModel</span>
        </div>
      </footer>
    </div>
  );
}

function Dashboard({ mockMode = true, getToken, initialUserEmail, initialUserRole, onLogout }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' or 'details'
  const [claims, setClaims] = useState([]);
  const [selectedClaimId, setSelectedClaimId] = useState(null);
  const [claimDetails, setClaimDetails] = useState(null);
  
  // Form States
  const [policyNo, setPolicyNo] = useState('');
  const [claimAmt, setClaimAmt] = useState('');
  const [claimFile, setClaimFile] = useState(null);
  
  const [regPolicyNo, setRegPolicyNo] = useState('');
  const [regHolder, setRegHolder] = useState('');
  const [regLimit, setRegLimit] = useState('');
  const [policyFile, setPolicyFile] = useState(null);
  
  // Feedback Messages
  const [claimMsg, setClaimMsg] = useState(null);
  const [policyMsg, setPolicyMsg] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);
  const [officerNotes, setOfficerNotes] = useState('');
  
  // Loading
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // Request Headers Generator for Clerk JWT / Mock Developer Mode
  const getRequestHeaders = async (isMultipart = false) => {
    const baseHeaders = {};
    if (isMultipart) {
      baseHeaders['Content-Type'] = 'multipart/form-data';
    }
    if (mockMode) {
      baseHeaders['X-Mock-User'] = currentUser?.email || 'customer@example.com';
    } else {
      const token = await getToken({ template: 'neon_rls' });
      baseHeaders['Authorization'] = `Bearer ${token}`;
    }
    return { headers: baseHeaders };
  };

  // Fetch logged in user profile from API on mount
  const fetchUserProfile = async () => {
    setProfileLoading(true);
    try {
      if (mockMode) {
        if (initialUserEmail) {
          setCurrentUser({ email: initialUserEmail, role: initialUserRole });
        }
      } else {
        const token = await getToken({ template: 'neon_rls' });
        const res = await axios.get(`${API_BASE}/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCurrentUser(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [initialUserEmail, mockMode]);

  // Fetch Claims
  const fetchClaims = async () => {
    if (!currentUser) return;
    setRefreshing(true);
    try {
      const headers = await getRequestHeaders();
      const res = await axios.get(`${API_BASE}/claims`, headers);
      setClaims(res.data);
    } catch (err) {
      console.error('Error fetching claims:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchClaims();
    }
  }, [currentUser]);

  // Fetch specific claim details
  const fetchClaimDetails = async (id) => {
    setLoading(true);
    try {
      const headers = await getRequestHeaders();
      const res = await axios.get(`${API_BASE}/claims/${id}`, headers);
      setClaimDetails(res.data);
      setSelectedClaimId(id);
    } catch (err) {
      console.error('Error fetching claim details:', err);
    } finally {
      setLoading(false);
    }
  };

  // Submit Claim
  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!claimFile) {
      setClaimMsg({ type: 'error', text: 'Please select a Claim invoice PDF.' });
      return;
    }
    
    const formData = new FormData();
    formData.append('policy_number', policyNo);
    formData.append('claim_amount', claimAmt);
    formData.append('customer_email', currentUser?.email);
    formData.append('file', claimFile);
    
    setLoading(true);
    setClaimMsg(null);
    try {
      const headers = await getRequestHeaders(true);
      await axios.post(`${API_BASE}/claims/submit`, formData, headers);
      setClaimMsg({ type: 'success', text: 'Claim submitted successfully! LangGraph agent initialized and paused for Human underwriting verification.' });
      setPolicyNo('');
      setClaimAmt('');
      setClaimFile(null);
      fetchClaims();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Claim submission failed.';
      setClaimMsg({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  // Register Policy
  const handlePolicySubmit = async (e) => {
    e.preventDefault();
    if (!policyFile) {
      setPolicyMsg({ type: 'error', text: 'Please select a Policy document PDF.' });
      return;
    }
    
    const formData = new FormData();
    formData.append('policy_number', regPolicyNo);
    formData.append('policy_holder', regHolder);
    formData.append('coverage_limit', regLimit);
    formData.append('file', policyFile);
    
    setLoading(true);
    setPolicyMsg(null);
    try {
      const headers = await getRequestHeaders(true);
      await axios.post(`${API_BASE}/policies/upload`, formData, headers);
      setPolicyMsg({ type: 'success', text: 'Policy successfully registered and embedded into Qdrant vector database!' });
      setRegPolicyNo('');
      setRegHolder('');
      setRegLimit('');
      setPolicyFile(null);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Policy upload failed.';
      setPolicyMsg({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  // Human Action (Approve / Reject)
  const handleHumanAction = async (action) => {
    if (!selectedClaimId) return;
    
    const formData = new FormData();
    formData.append('action', action);
    formData.append('notes', officerNotes);
    formData.append('officer_email', currentUser?.email || 'officer@example.com');
    
    setLoading(true);
    setActionMsg(null);
    try {
      const headers = await getRequestHeaders();
      headers.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      const res = await axios.post(`${API_BASE}/claims/${selectedClaimId}/action`, formData, headers);
      setActionMsg({ type: 'success', text: res.data.message });
      setOfficerNotes('');
      // Reload details & queue
      fetchClaimDetails(selectedClaimId);
      fetchClaims();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Action failed.';
      setActionMsg({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  // Render Role Badges
  const getRoleBadge = (role) => {
    if (role === 'claim_officer') {
      return <span className="badge approved" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>Claims Officer</span>;
    }
    return <span className="badge processing" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' }}>Customer</span>;
  };

  // Render Status Badges
  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="badge approved">Approved</span>;
      case 'rejected':
        return <span className="badge rejected">Rejected</span>;
      case 'pending_approval':
        return <span className="badge pending_approval">Needs Officer Sign-off</span>;
      default:
        return <span className="badge processing">{status}</span>;
    }
  };

  // Switch Role / Logout Persona
  const handlePersonaLogout = () => {
    setCurrentUser(null);
    setClaims([]);
    setClaimDetails(null);
    setSelectedClaimId(null);
    onLogout();
  };

  // Profile Loading View
  if (profileLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-space)' }}>
        <RefreshCw size={44} className="spin-anim" style={{ color: 'var(--accent-cyan)', marginBottom: '1rem' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading Secure AI Portal profile...</p>
      </div>
    );
  }

  // Not Logged In View
  if (!currentUser) {
    return <LoginScreen isClerkEnabled={!mockMode} onLogin={(email, role) => setCurrentUser({ email, role })} />;
  }

  const isOfficer = currentUser.role === 'claim_officer';

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="logo-section">
          <span className="logo-icon">🛡️</span>
          <div>
            <h1 className="logo-text">ClaimsAgent AI</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {isOfficer ? 'Claims Officer Underwriting Cockpit' : 'Secure Customer Claims Portal'}
            </p>
          </div>
        </div>
        
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1.25rem', marginRight: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', background: 'rgba(255, 255, 255, 0.03)', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Logged in:</span>
            {getRoleBadge(currentUser.role)}
            <span style={{ color: 'var(--text-secondary)', marginLeft: '0.25rem' }}>({currentUser.email})</span>
          </div>

          {!mockMode ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <button 
              className="view-btn" 
              onClick={handlePersonaLogout}
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', borderColor: 'var(--status-danger-border)', color: 'var(--status-danger)', background: 'var(--status-danger-bg)' }}
            >
              <LogOut size={12} /> Switch Persona
            </button>
          )}
        </div>
        
        <nav className="nav-tabs">
          <button 
            className={`tab-btn ${activeTab === 'queue' ? 'active' : ''}`}
            onClick={() => setActiveTab('queue')}
          >
            {isOfficer ? 'Underwriting Queue' : 'My Claims List'}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Explainability & RAG Audit
          </button>
        </nav>
      </header>

      {/* Tab Panels */}
      {activeTab === 'queue' && (
        <div>
          {/* KPI Metrics Banner */}
          <div className="kpi-container">
            <div className="kpi-card">
              <div className="kpi-icon-box">
                <FileText size={20} />
              </div>
              <div>
                <p className="kpi-label">{isOfficer ? 'Total Ingested Claims' : 'My Total Claims'}</p>
                <h3 className="kpi-value">{claims.length}</h3>
              </div>
            </div>
            
            <div className="kpi-card">
              <div className="kpi-icon-box pending">
                <Eye size={20} />
              </div>
              <div>
                <p className="kpi-label">Needs Sign-off</p>
                <h3 className="kpi-value">{claims.filter(c => c.status === 'pending_approval').length}</h3>
              </div>
            </div>
            
            <div className="kpi-card">
              <div className="kpi-icon-box success">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="kpi-label">Approved Claims</p>
                <h3 className="kpi-value">{claims.filter(c => c.status === 'approved').length}</h3>
              </div>
            </div>
            
            <div className="kpi-card">
              <div className="kpi-icon-box" style={{ background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger-border)', color: 'var(--status-danger)' }}>
                <XCircle size={20} />
              </div>
              <div>
                <p className="kpi-label">{isOfficer ? 'Auto-Rejection Rate' : 'Rejected claims'}</p>
                <h3 className="kpi-value">
                  {claims.length > 0 
                    ? ((claims.filter(c => c.status === 'rejected').length / claims.length) * 100).toFixed(0) + '%' 
                    : '0%'}
                </h3>
              </div>
            </div>
          </div>

          <div className="dashboard-grid">
            {/* Claims Queue Panel */}
            <div className="glass-card">
              <div className="panel-header" style={{ border: 'none', marginBottom: 0 }}>
                <h2 className="card-title">
                  <ShieldCheck size={20} /> {isOfficer ? 'System Underwriting Queue' : 'My Claim History'}
                </h2>
                <button className="view-btn" onClick={fetchClaims} disabled={refreshing} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                  <RefreshCw size={14} className={refreshing ? 'spin-anim' : ''} /> Refresh Queue
                </button>
              </div>
              
              <div className="claims-table-wrapper">
                <table className="claims-table">
                  <thead>
                    <tr>
                      <th>Claim ID</th>
                      <th>Policy No</th>
                      <th>Amount (INR)</th>
                      <th>Submitted On</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claims.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>
                          {isOfficer 
                            ? 'No claims registered in the underwriting queue.' 
                            : 'You have not submitted any claims yet. Use the claim upload form on the right.'}
                        </td>
                      </tr>
                    ) : (
                      claims.map((claim) => (
                        <tr key={claim.id}>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{claim.id.substring(0, 8)}...</td>
                          <td>{claim.policy_number}</td>
                          <td style={{ fontWeight: '600' }}>₹{claim.claim_amount.toLocaleString()}</td>
                          <td>{new Date(claim.created_at).toLocaleDateString()}</td>
                          <td>{getStatusBadge(claim.status)}</td>
                          <td>
                            <button 
                              className="view-btn" 
                              style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}
                              onClick={() => {
                                fetchClaimDetails(claim.id);
                                setActiveTab('details');
                              }}
                            >
                              <Eye size={12} /> {isOfficer ? 'Audit Review' : 'View Explainability'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sidebar Form Panel (Role-based) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* If Customer: Show Claim Submission Form */}
              {!isOfficer && (
                <div className="glass-card" style={{ border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                  <h2 className="card-title" style={{ borderLeftColor: 'var(--accent-blue)' }}>
                    <FileText size={18} /> Submit Claim Request
                  </h2>
                  
                  {claimMsg && (
                    <div className={`form-alert ${claimMsg.type}`}>
                      {claimMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                      {claimMsg.text}
                    </div>
                  )}

                  <form onSubmit={handleClaimSubmit}>
                    <div className="form-group">
                      <label className="form-label">Associated Policy Number</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. POL-1001"
                        value={policyNo}
                        onChange={(e) => setPolicyNo(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Claim Invoice Amount (INR)</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        placeholder="e.g. 45000"
                        value={claimAmt}
                        onChange={(e) => setClaimAmt(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Supporting Bills / Medical PDF</label>
                      <div className="file-upload-box" onClick={() => document.getElementById('claim-file-input').click()}>
                        <Upload className="file-upload-icon" />
                        <p style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                          {claimFile ? claimFile.name : 'Upload Invoices / Bills PDF'}
                        </p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click to browse computer</span>
                      </div>
                      <input 
                        type="file" 
                        id="claim-file-input" 
                        accept="application/pdf"
                        style={{ display: 'none' }}
                        onChange={(e) => setClaimFile(e.target.files[0])}
                      />
                    </div>
                    
                    <button type="submit" className="btn-primary" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }} disabled={loading}>
                      {loading ? 'Running AI Agents Pipeline...' : 'Initialize AI Agents Verify'}
                    </button>
                  </form>
                </div>
              )}

              {/* If Claims Officer: Show Policy Registering Form */}
              {isOfficer && (
                <div className="glass-card" style={{ border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                  <h2 className="card-title" style={{ borderLeftColor: '#10b981' }}>
                    <Database size={18} /> Register Insurance Policy
                  </h2>
                  
                  {policyMsg && (
                    <div className={`form-alert ${policyMsg.type}`}>
                      {policyMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                      {policyMsg.text}
                    </div>
                  )}

                  <form onSubmit={handlePolicySubmit}>
                    <div className="form-group">
                      <label className="form-label">Policy Number</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. POL-1001"
                        value={regPolicyNo}
                        onChange={(e) => setRegPolicyNo(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Policy Holder Name</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. MR. HARSH RAJ"
                        value={regHolder}
                        onChange={(e) => setRegHolder(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Maximum Coverage Limit (INR)</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        placeholder="e.g. 500000"
                        value={regLimit}
                        onChange={(e) => setRegLimit(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Exclusions Policy Document PDF</label>
                      <div className="file-upload-box" onClick={() => document.getElementById('policy-file-input').click()}>
                        <Upload className="file-upload-icon" />
                        <p style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                          {policyFile ? policyFile.name : 'Upload Exclusions Guidelines PDF'}
                        </p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Required for Qdrant RAG index</span>
                      </div>
                      <input 
                        type="file" 
                        id="policy-file-input" 
                        accept="application/pdf"
                        style={{ display: 'none' }}
                        onChange={(e) => setPolicyFile(e.target.files[0])}
                      />
                    </div>
                    
                    <button type="submit" className="btn-primary" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }} disabled={loading}>
                      {loading ? 'Ingesting Guidelines PDF...' : 'Index & Ingest Policy Clauses'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'details' && (
        <div>
          {!selectedClaimId ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
              <ShieldCheck size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
              <h3>Select a claim from the {isOfficer ? 'underwriting queue' : 'claims list'} to audit explainability logs.</h3>
              <button className="tab-btn active" style={{ marginTop: '1.25rem', float: 'none' }} onClick={() => setActiveTab('queue')}>
                View Claims List
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Main Panel Grid */}
              <div className="detail-grid">
                
                {/* Left Panel: Ingested & Extracted Metadata */}
                <div className="glass-card">
                  <div className="panel-header">
                    <h3>Structured Ingestion Details</h3>
                    {getStatusBadge(claimDetails?.claim?.status)}
                  </div>
                  
                  <p className="panel-section-title">Claim Invoice Extraction (Gemini 2.5)</p>
                  <div className="attributes-grid">
                    <div className="attr-item">
                      <span className="attr-label">Patient Name</span>
                      <span className="attr-value">{claimDetails?.graph_state?.extracted_claim?.patient_name || 'N/A'}</span>
                    </div>
                    <div className="attr-item">
                      <span className="attr-label">Claim Amount</span>
                      <span className="attr-value" style={{ fontWeight: '700' }}>
                        ₹{claimDetails?.graph_state?.extracted_claim?.claim_amount?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <div className="attr-item">
                      <span className="attr-label">Medical Treatment</span>
                      <span className="attr-value" style={{ color: 'var(--accent-cyan)' }}>
                        {claimDetails?.graph_state?.extracted_claim?.treatment || 'N/A'}
                      </span>
                    </div>
                    <div className="attr-item">
                      <span className="attr-label">Admission Dates</span>
                      <span className="attr-value" style={{ fontSize: '0.85rem' }}>
                        {claimDetails?.graph_state?.extracted_claim?.admission_date || 'N/A'} to {claimDetails?.graph_state?.extracted_claim?.discharge_date || 'N/A'}
                      </span>
                    </div>
                  </div>

                  <p className="panel-section-title">Verified Policy Registry Details</p>
                  <div className="attributes-grid">
                    <div className="attr-item">
                      <span className="attr-label">Policy Number</span>
                      <span className="attr-value">{claimDetails?.graph_state?.extracted_policy?.policy_number || claimDetails?.claim?.policy_number}</span>
                    </div>
                    <div className="attr-item">
                      <span className="attr-label">Policy Holder</span>
                      <span className="attr-value">{claimDetails?.graph_state?.extracted_policy?.policy_holder || 'N/A'}</span>
                    </div>
                    <div className="attr-item" style={{ gridColumn: 'span 2' }}>
                      <span className="attr-label">Maximum Policy Limit Balance</span>
                      <span className="attr-value">
                        ₹{claimDetails?.graph_state?.extracted_policy?.coverage_limit?.toLocaleString() || '0'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Panel: AI Explainability Panel */}
                <div className="glass-card">
                  <div className="panel-header">
                    <h3>AI Explainability & Reasoning</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Observability Context</span>
                  </div>
                  
                  {/* AI Recommendation Synthesis */}
                  <div className="rec-banner">
                    <span className="rec-banner-icon">🤖</span>
                    <div className="rec-banner-content">
                      <h4>
                        Agent Recommendation: {' '}
                        <span style={{ 
                          color: claimDetails?.graph_state?.ai_recommendation?.recommendation?.toUpperCase() === 'APPROVE' 
                            ? 'var(--status-success)' 
                            : 'var(--status-danger)', 
                          fontWeight: '800' 
                        }}>
                          {claimDetails?.graph_state?.ai_recommendation?.recommendation || 'PROCESSING'}
                        </span>
                      </h4>
                      <p>{claimDetails?.graph_state?.ai_recommendation?.reason || 'Agent reasoning in progress.'}</p>
                    </div>
                  </div>

                  {/* Criteria Checklist */}
                  <p className="panel-section-title">Eligibility Criteria Audit</p>
                  <div>
                    <div className="checklist-item">
                      {claimDetails?.graph_state?.eligibility_verdict?.eligible ? (
                        <CheckCircle2 className="checklist-icon pass" size={18} />
                      ) : (
                        <XCircle className="checklist-icon fail" size={18} />
                      )}
                      <div className="checklist-text">
                        <strong>Exclusions & Treatment Clearance:</strong>{' '}
                        {claimDetails?.graph_state?.eligibility_verdict?.reason || 'Validating exceptions.'}
                      </div>
                    </div>

                    <div className="checklist-item">
                      {!claimDetails?.graph_state?.coverage_math?.exceeds_limit ? (
                        <CheckCircle2 className="checklist-icon pass" size={18} />
                      ) : (
                        <XCircle className="checklist-icon fail" size={18} />
                      )}
                      <div className="checklist-text">
                        <strong>Remaining Coverage Limit Math:</strong>{' '}
                        Remaining policy limit: ₹{claimDetails?.graph_state?.coverage_math?.remaining_coverage_before?.toLocaleString() || '0'}.{' '}
                        Balance after claim: ₹{claimDetails?.graph_state?.coverage_math?.remaining_coverage_after?.toLocaleString() || '0'}.
                      </div>
                    </div>
                  </div>

                  {/* RAG Retrieved Clauses */}
                  <p className="panel-section-title" style={{ marginTop: '1.5rem' }}>Retrieved Policy Clauses (Qdrant RAG)</p>
                  <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                    {claimDetails?.graph_state?.retrieved_clauses?.map((clause, idx) => (
                      <div key={idx} className="clause-block">
                        {clause}
                      </div>
                    )) || <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No clauses queried.</p>}
                  </div>
                  
                  {/* Action Box (Secured by Role) */}
                  <div style={{ marginTop: '1.5rem' }}>
                    {isOfficer ? (
                      claimDetails?.claim?.status === 'pending_approval' ? (
                        <div className="action-box" style={{ border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                          <p className="panel-section-title" style={{ border: 'none', padding: 0 }}>Human Underwriter Intervention</p>
                          
                          {actionMsg && (
                            <div className={`form-alert ${actionMsg.type}`} style={{ marginTop: '0.5rem' }}>
                              {actionMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                              {actionMsg.text}
                            </div>
                          )}

                          <div className="form-group" style={{ marginTop: '0.75rem' }}>
                            <label className="form-label">Review Decision Notes / Audit Remarks</label>
                            <textarea 
                              className="form-input" 
                              rows="2" 
                              placeholder="e.g. Validated clinical billing details against exceptions. Clearance allowed."
                              value={officerNotes}
                              onChange={(e) => setOfficerNotes(e.target.value)}
                              style={{ resize: 'vertical' }}
                            />
                          </div>
                          
                          <div className="action-buttons">
                            <button className="btn-approve" onClick={() => handleHumanAction('APPROVED')}>
                              Approve Claim
                            </button>
                            <button className="btn-reject" onClick={() => handleHumanAction('REJECTED')}>
                              Reject Claim
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)', textAlign: 'center' }}>
                          ✅ Underwriting finalized. Status: <strong style={{ textTransform: 'uppercase' }}>{claimDetails?.claim?.status}</strong>
                        </div>
                      )
                    ) : (
                      /* Customer View: Action Locked */
                      <div style={{
                        fontSize: '0.88rem',
                        color: 'var(--status-pending)',
                        background: 'var(--status-pending-bg)',
                        padding: '1rem',
                        borderRadius: '10px',
                        border: '1px solid var(--status-pending-border)',
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'center'
                      }}>
                        <ShieldCheck size={18} />
                        <span>
                          {claimDetails?.claim?.status === 'pending_approval'
                            ? 'Claim is currently pending verification sign-off by a Claims Officer.'
                            : `Claim processing complete. Status: ${claimDetails?.claim?.status.toUpperCase()}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Audit History Timeline */}
              <div className="glass-card" style={{ marginTop: '1rem' }}>
                <h3 className="card-title" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <History size={18} /> Audit Trail Timeline Logs (Durable State)
                </h3>
                
                <div className="timeline">
                  {claimDetails?.db_audit_logs?.map((log, idx) => {
                    const isDecision = log.actor.includes('officer');
                    return (
                      <div className="timeline-item" key={log.id || idx}>
                        <div className={`timeline-dot ${isDecision ? 'decision' : ''}`} />
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <span className="timeline-actor">
                              {isDecision ? 'Human claims officer' : `Node: ${log.actor}`}
                            </span>
                            <span className="timeline-time">
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                          </div>
                          <div className="timeline-action">{log.action}</div>
                          {log.payload && Object.keys(log.payload).length > 0 && (
                            <pre className="timeline-payload">
                              {JSON.stringify(log.payload, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DashboardSecure() {
  const { getToken } = useAuth();
  return <Dashboard mockMode={false} getToken={getToken} />;
}

function AuthWrapper() {
  return (
    <>
      <SignedIn>
        <DashboardSecure />
      </SignedIn>
      <SignedOut>
        <LoginScreen isClerkEnabled={true} />
      </SignedOut>
    </>
  );
}

function App() {
  const isClerkEnabled = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  const [demoUser, setDemoUser] = useState(null);

  if (isClerkEnabled) {
    return <AuthWrapper />;
  }

  // Demo mode with persona selector
  if (!demoUser) {
    return (
      <LoginScreen 
        isClerkEnabled={false} 
        onLogin={(email, role) => setDemoUser({ email, role })} 
      />
    );
  }

  return (
    <Dashboard 
      mockMode={true} 
      initialUserEmail={demoUser.email} 
      initialUserRole={demoUser.role} 
      onLogout={() => setDemoUser(null)} 
    />
  );
}

export default App;
