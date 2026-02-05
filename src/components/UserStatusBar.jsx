// UserStatusBar - shows user status and allows name claiming / transfer codes
import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext.jsx';

const styles = {
  container: {
    position: 'fixed',
    bottom: 8,
    right: 8,
    zIndex: 1000,
    fontFamily: 'monospace',
    fontSize: 12
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(0, 0, 0, 0.7)',
    padding: '6px 12px',
    borderRadius: 16,
    color: '#fff',
    cursor: 'pointer',
    border: '1px solid #444',
    transition: 'background 0.2s'
  },
  badgeHover: {
    background: 'rgba(0, 0, 0, 0.85)'
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: '#555',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10
  },
  name: {
    maxWidth: 120,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  anonymous: {
    color: '#888',
    fontStyle: 'italic'
  },
  dropdown: {
    position: 'absolute',
    bottom: '100%',
    right: 0,
    marginBottom: 4,
    background: 'rgba(20, 20, 20, 0.95)',
    border: '1px solid #444',
    borderRadius: 8,
    padding: 12,
    minWidth: 220,
    boxShadow: '0 -4px 12px rgba(0,0,0,0.5)'
  },
  section: {
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 10,
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 6
  },
  input: {
    width: '100%',
    padding: '6px 8px',
    background: '#333',
    border: '1px solid #555',
    borderRadius: 4,
    color: '#fff',
    fontSize: 12,
    fontFamily: 'monospace',
    boxSizing: 'border-box'
  },
  button: {
    width: '100%',
    padding: '8px 12px',
    background: '#4a9eff',
    border: 'none',
    borderRadius: 4,
    color: '#fff',
    fontSize: 12,
    cursor: 'pointer',
    marginTop: 6
  },
  buttonSecondary: {
    background: '#555'
  },
  buttonDisabled: {
    background: '#333',
    color: '#666',
    cursor: 'not-allowed'
  },
  error: {
    color: '#f66',
    fontSize: 11,
    marginTop: 4
  },
  success: {
    color: '#6f6',
    fontSize: 11,
    marginTop: 4
  },
  codeDisplay: {
    background: '#222',
    padding: '8px 12px',
    borderRadius: 4,
    textAlign: 'center',
    fontSize: 18,
    letterSpacing: 4,
    fontWeight: 'bold',
    color: '#4a9eff',
    marginTop: 6
  },
  divider: {
    borderTop: '1px solid #444',
    margin: '12px 0'
  },
  hint: {
    fontSize: 10,
    color: '#666',
    marginTop: 4
  }
};

export default function UserStatusBar() {
  const { user, loading, error, isAnonymous, displayName, claimName, getTransferCode, linkWithCode, clearError } = useUser();
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [transferCode, setTransferCode] = useState(user?.transferCode || null);
  const [localError, setLocalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return null;
  }

  const handleClaimName = async () => {
    if (!nameInput.trim() || submitting) return;
    setSubmitting(true);
    setLocalError('');
    setSuccessMsg('');
    clearError();

    const success = await claimName(nameInput.trim());
    if (success) {
      setSuccessMsg('Name claimed!');
      setNameInput('');
    }
    setSubmitting(false);
  };

  const handleGetCode = async () => {
    if (submitting) return;
    setSubmitting(true);
    setLocalError('');
    clearError();

    const code = await getTransferCode();
    if (code) {
      setTransferCode(code);
    }
    setSubmitting(false);
  };

  const handleUseCode = async () => {
    if (!codeInput.trim() || submitting) return;
    setSubmitting(true);
    setLocalError('');
    setSuccessMsg('');
    clearError();

    const success = await linkWithCode(codeInput.trim());
    if (success) {
      setSuccessMsg('Account linked!');
      setCodeInput('');
      setOpen(false);
    }
    setSubmitting(false);
  };

  const displayError = error || localError;

  return (
    <div style={styles.container}>
      <div
        style={{ ...styles.badge, ...(hover ? styles.badgeHover : {}) }}
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <div style={styles.avatar}>
          {isAnonymous ? '?' : displayName?.charAt(0).toUpperCase()}
        </div>
        <span style={{ ...styles.name, ...(isAnonymous ? styles.anonymous : {}) }}>
          {isAnonymous ? 'Anonymous' : displayName}
        </span>
      </div>

      {open && (
        <div style={styles.dropdown} onClick={e => e.stopPropagation()}>
          {isAnonymous ? (
            <>
              <div style={styles.section}>
                <div style={styles.sectionTitle}>Claim a Name</div>
                <input
                  type="text"
                  placeholder="Enter username (2-20 chars)"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleClaimName()}
                  style={styles.input}
                  maxLength={20}
                />
                <button
                  style={{ ...styles.button, ...(submitting ? styles.buttonDisabled : {}) }}
                  onClick={handleClaimName}
                  disabled={submitting || !nameInput.trim()}
                >
                  {submitting ? 'Saving...' : 'Claim Name'}
                </button>
                <div style={styles.hint}>
                  Get a name to appear on leaderboards
                </div>
              </div>

              <div style={styles.divider} />

              <div style={styles.section}>
                <div style={styles.sectionTitle}>Have a Transfer Code?</div>
                <input
                  type="text"
                  placeholder="Enter 6-character code"
                  value={codeInput}
                  onChange={e => setCodeInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleUseCode()}
                  style={styles.input}
                  maxLength={6}
                />
                <button
                  style={{ ...styles.button, ...styles.buttonSecondary, ...(submitting ? styles.buttonDisabled : {}) }}
                  onClick={handleUseCode}
                  disabled={submitting || codeInput.length !== 6}
                >
                  Link Account
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={styles.section}>
                <div style={styles.sectionTitle}>Your Name</div>
                <div style={{ fontSize: 14, color: '#fff' }}>{displayName}</div>
              </div>

              <div style={styles.divider} />

              <div style={styles.section}>
                <div style={styles.sectionTitle}>Transfer Code</div>
                {transferCode || user?.transferCode ? (
                  <>
                    <div style={styles.codeDisplay}>
                      {transferCode || user?.transferCode}
                    </div>
                    <div style={styles.hint}>
                      Use this code on another device to link your account
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      style={{ ...styles.button, ...styles.buttonSecondary, ...(submitting ? styles.buttonDisabled : {}) }}
                      onClick={handleGetCode}
                      disabled={submitting}
                    >
                      {submitting ? 'Generating...' : 'Get Transfer Code'}
                    </button>
                    <div style={styles.hint}>
                      Generate a code to use your account on other browsers
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {displayError && <div style={styles.error}>{displayError}</div>}
          {successMsg && <div style={styles.success}>{successMsg}</div>}
        </div>
      )}
    </div>
  );
}
