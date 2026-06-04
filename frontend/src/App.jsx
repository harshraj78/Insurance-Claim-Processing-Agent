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
  Eye
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';

function App() {
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

  // Fetch Claims
  const fetchClaims = async () => {
    setRefreshing(true);
    try {
      const res = await axios.get(`${API_BASE}/claims`);
      setClaims(res.data);
    } catch (err) {
      console.error('Error fetching claims:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  // Fetch specific claim details
  const fetchClaimDetails = async (id) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/claims/${id}`);
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
    formData.append('file', claimFile);
    
    setLoading(true);
    setClaimMsg(null);
    try {
      await axios.post(`${API_BASE}/claims/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setClaimMsg({ type: 'success', text: 'Claim submitted successfully. Agent graph run paused at Human verification step.' });
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
      await axios.post(`${API_BASE}/policies/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
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
    formData.append('officer_email', 'officer@example.com');
    
    setLoading(true);
    setActionMsg(null);
    try {
      const res = await axios.post(`${API_BASE}/claims/${selectedClaimId}/action`, formData);
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

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="logo-section">
          <span className="logo-icon">🛡️</span>
          <div>
            <h1 className="logo-text">ClaimsAgent AI</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Human-in-the-Loop Claims Processing Engine</p>
          </div>
        </div>
        
        <nav className="nav-tabs">
          <button 
            className={`tab-btn ${activeTab === 'queue' ? 'active' : ''}`}
            onClick={() => setActiveTab('queue')}
          >
            Claims Queue
          </button>
          <button 
            className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Claim Review & Explainability
          </button>
        </nav>
      </header>

      {/* Tabs panels */}
      {activeTab === 'queue' && (
        <div>
          {/* KPI Metrics Banner */}
          <div className="kpi-container">
            <div className="kpi-card">
              <div className="kpi-icon-box">
                <FileText size={20} />
              </div>
              <div>
                <p className="kpi-label">Total Ingested Claims</p>
                <h3 className="kpi-value">{claims.length}</h3>
              </div>
            </div>
            
            <div className="kpi-card">
              <div className="kpi-icon-box pending">
                <Eye size={20} />
              </div>
              <div>
                <p className="kpi-label">Needs Officer Sign-off</p>
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
                <p className="kpi-label">Auto-Rejection Rate</p>
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
                <ShieldCheck size={20} /> Underwriting Queue
              </h2>
              <button className="view-btn" onClick={fetchClaims} disabled={refreshing} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                <RefreshCw size={14} className={refreshing ? 'spin-anim' : ''} /> Refresh
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
                      <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                        No claims registered. Submit a claim using the form on the right.
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
                            <Eye size={12} /> Audit Review
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Forms Sidebar Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Form: Submit Claim */}
            <div className="glass-card">
              <h2 className="card-title">
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
                  <label className="form-label">Policy Number</label>
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
                
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Running AI Agents...' : 'Initialize AI Agents Pipeline'}
                </button>
              </form>
            </div>

            {/* Form: Register Policy */}
            <div className="glass-card">
              <h2 className="card-title">
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
                    placeholder="e.g. John Doe"
                    value={regHolder}
                    onChange={(e) => setRegHolder(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Coverage limit (INR)</label>
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
                      {policyFile ? policyFile.name : 'Upload Policy Guidelines PDF'}
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
                
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Embedding PDF...' : 'Index & Ingest Policy clauses'}
                </button>
              </form>
            </div>
          </div>
        </div>
        </div>
      )}


      {activeTab === 'details' && (
        <div>
          {!selectedClaimId ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
              <ShieldCheck size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
              <h3>Select a claim from the underwriting queue to audit.</h3>
              <button className="tab-btn active" style={{ marginTop: '1rem', float: 'none' }} onClick={() => setActiveTab('queue')}>
                Go to Claims Queue
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Main Panel grid */}
              <div className="detail-grid">
                
                {/* Left Panel: Ingested & Extracted Metadata */}
                <div className="glass-card">
                  <div className="panel-header">
                    <h3>Structured Ingestion Details</h3>
                    {getStatusBadge(claimDetails?.claim?.status)}
                  </div>
                  
                  <p className="panel-section-title">Claim invoice extraction (Gemini 2.5)</p>
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
                      <span className="attr-label">Medical treatment</span>
                      <span className="attr-value" style={{ color: 'var(--primary-accent)' }}>
                        {claimDetails?.graph_state?.extracted_claim?.treatment || 'N/A'}
                      </span>
                    </div>
                    <div className="attr-item">
                      <span className="attr-label">Admission dates</span>
                      <span className="attr-value" style={{ fontSize: '0.85rem' }}>
                        {claimDetails?.graph_state?.extracted_claim?.admission_date || 'N/A'} to {claimDetails?.graph_state?.extracted_claim?.discharge_date || 'N/A'}
                      </span>
                    </div>
                  </div>

                  <p className="panel-section-title">Verified policy details</p>
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
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}> observability context</span>
                  </div>
                  
                  {/* AI Recommendation synthesis */}
                  <div className="rec-banner">
                    <span className="rec-banner-icon">🤖</span>
                    <div className="rec-banner-content">
                      <h4>
                        Recommendation: {' '}
                        <span style={{ 
                          color: claimDetails?.graph_state?.ai_recommendation?.recommendation?.toUpperCase() === 'APPROVE' 
                            ? 'var(--color-success)' 
                            : 'var(--color-danger)', 
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
                        Remaining policy limit: ₹{claimDetails?.graph_state?.coverage_math?.remaining_coverage_before?.toLocaleString()}.{' '}
                        Balance after claim: ₹{claimDetails?.graph_state?.coverage_math?.remaining_coverage_after?.toLocaleString()}.
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
                  
                  {/* Action box */}
                  {claimDetails?.claim?.status === 'pending_approval' && (
                    <div className="action-box">
                      <p className="panel-section-title" style={{ border: 'none', padding: 0 }}>Durable Officer Intervention</p>
                      
                      {actionMsg && (
                        <div className={`form-alert ${actionMsg.type}`} style={{ marginTop: '0.5rem' }}>
                          {actionMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                          {actionMsg.text}
                        </div>
                      )}

                      <div className="form-group" style={{ marginTop: '0.75rem' }}>
                        <label className="form-label">Review Decisions notes / audit remarks</label>
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
                  )}
                </div>
              </div>

              {/* Audit history timeline */}
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

export default App;
