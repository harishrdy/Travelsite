import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAuthSession } from '../../services/authSession';

function getInitials(name) {
    const words = String(name || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (words.length === 0) {
        return 'AD';
    }

    return words
        .slice(0, 2)
        .map((word) => word[0])
        .join('')
        .toUpperCase();
}

function getAdminProfile() {
    const name =
        localStorage.getItem('adminName') ||
        localStorage.getItem('adminEmail') ||
        'Admin';

    return {
        adminId: localStorage.getItem('adminId') || '--',
        adminName: name,
        adminEmail: localStorage.getItem('adminEmail') || '',
        avatarInitials: getInitials(name),
        avatarBg: 'linear-gradient(135deg, var(--primary), var(--primary-strong))',
    };
}

function Topbar() {
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isBalanceVisible, setIsBalanceVisible] = useState(false);
    const [showTopupModal, setShowTopupModal] = useState(false);
    const [topupAmount, setTopupAmount] = useState('');

    const [adminData] = useState(() => getAdminProfile());

    // Dynamic balance data
    const [balanceData] = useState({
        amount: 0,
        currency: 'INR',
    });

    const handleLogout = () => {
        [
            'adminToken',
            'adminRole',
            'adminId',
            'adminName',
            'adminEmail',
            'adminLoginEmail',
            'adminChallengeId',
            'token',
            'authToken',
            'accessToken',
            'user',
            'userId',
            'UserId',
            'x-user-id',
            'role',
            'challengeId',
        ].forEach((key) => localStorage.removeItem(key));
        [
            'adminToken',
            'adminRole',
            'adminId',
            'token',
            'authToken',
            'accessToken',
            'user',
            'userId',
            'UserId',
            'x-user-id',
            'role',
            'challengeId',
            'bus_booking_flow_state_v1',
            'flight_booking_flow_state_v1',
            'selectedOffer',
        ].forEach((key) => sessionStorage.removeItem(key));
        clearAuthSession();
        setIsDropdownOpen(false);
        navigate('/admin/login', { replace: true });
    };

    const handleClearCache = () => {
        console.log('Clear Cache & Cookies clicked');
        setIsDropdownOpen(false);
    };

    const handleChangePassword = () => {
        console.log('Change Password clicked');
        setIsDropdownOpen(false);
    };

    const handleChangePin = () => {
        console.log('Change PIN clicked');
        setIsDropdownOpen(false);
    };

    const handleTopupClick = () => {
        console.log('Top up request clicked');
        setShowTopupModal(true);
    };

    const handleTopupSubmit = () => {
        if (topupAmount.trim()) {
            console.log(`Top up request submitted: INR ${topupAmount}`);
            setTopupAmount('');
            setShowTopupModal(false);
        }
    };

    // Inline Styles with Theme Colors
    const styles = {
        topbar: {
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '12px',
            marginLeft: 'calc(var(--panel-padding-x) * -1)',
            marginRight: 'calc(var(--panel-padding-x) * -1)',
            marginTop: 'calc(var(--panel-padding-y) * -1)',
            paddingRight: 'var(--panel-padding-x)',
            paddingLeft: 'var(--panel-padding-x)',
            paddingBottom: '12px',
            paddingTop: '12px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--panel)',
            position: 'relative',
            flexShrink: 0,
        },
        topbarActions: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            position: 'relative',
        },
        balancePill: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            borderRadius: '20px',
            background: 'var(--panel)',
            border: '1px solid var(--text-primary)',
            color: 'var(--text-primary)',
            fontWeight: 600,
            fontSize: '0.9rem',
            transition: 'all 0.2s ease',
        },
        balanceText: {
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
        },
        eyeToggle: {
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            width: '24px',
            height: '24px',
        },
        topupButton: {
            height: '36px',
            width: '36px',
            borderRadius: '8px',
            border: '1px solid var(--text-primary)',
            background: 'var(--panel)',
            color: 'var(--text-primary)',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
        },
        notificationBtn: {
            position: 'relative',
            height: '36px',
            width: '36px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--panel)',
            color: 'var(--text-primary)',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
        },
        notificationBadge: {
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            background: 'var(--danger)',
            color: '#FFFFFF',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.65rem',
            fontWeight: 700,
        },
        profileDropdownWrapper: {
            position: 'relative',
        },
        avatarBtn: {
            height: '36px',
            width: '36px',
            borderRadius: '50%',
            border: '2px solid var(--border)',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 800,
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontSize: '0.75rem',
            padding: 0,
            background: adminData.avatarBg,
        },
        profileDropdownMenu: {
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '12px',
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            boxShadow: 'var(--shadow)',
            width: '320px',
            overflow: 'hidden',
            zIndex: 1000,
            animation: 'dropdownSlideDown 0.2s ease',
        },
        dropdownHeader: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px',
            background: 'linear-gradient(135deg, rgba(74, 15, 26, 0.08), rgba(47, 47, 47, 0.08))',
            borderBottom: '1px solid var(--border)',
        },
        dsaAvatar: {
            height: '48px',
            width: '48px',
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 800,
            color: 'white',
            fontSize: '0.75rem',
            flexShrink: 0,
            background: adminData.avatarBg,
            boxShadow: '0 4px 12px rgba(227, 28, 95, 0.25)',
        },
        dsaInfo: {
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
        },
        dsaName: {
            fontWeight: 700,
            color: 'var(--text-primary)',
            fontSize: '0.95rem',
        },
        dsaId: {
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
        },
        dropdownDivider: {
            height: '1px',
            background: 'var(--border)',
            margin: 0,
        },
        dropdownMenuItems: {
            display: 'flex',
            flexDirection: 'column',
            padding: '8px 0',
        },
        dropdownMenuItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            background: 'none',
            border: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 500,
            transition: 'all 0.2s ease',
            textAlign: 'left',
            width: '100%',
        },
        logoutBtn: {
            color: 'var(--danger)',
        },
        dropdownBackdrop: {
            position: 'fixed',
            inset: 0,
            zIndex: 999,
        },
        svg: {
            flexShrink: 0,
            color: 'currentColor',
        },
        span: {
            flex: 1,
        },
        modalBackdrop: {
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
        },
        modal: {
            background: 'var(--panel)',
            borderRadius: '16px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
        },
        modalTitle: {
            fontSize: '1.2rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '16px',
        },
        modalInput: {
            width: '100%',
            padding: '10px 12px',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '0.9rem',
            marginBottom: '16px',
            color: 'var(--text-primary)',
            outline: 'none',
            transition: 'border-color 0.2s ease',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
        },
        modalButtons: {
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end',
        },
        modalBtn: {
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
        },
        modalBtnCancel: {
            background: 'var(--surface-soft)',
            color: 'var(--text-primary)',
        },
        modalBtnSubmit: {
            background: 'var(--primary)',
            color: '#FFFFFF',
        },
    };

    // Add keyframe animation
    const styleSheet = document.createElement('style');
    styleSheet.innerHTML = `
    @keyframes dropdownSlideDown {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
    if (!document.head.querySelector('style[data-topbar-animation]')) {
        styleSheet.setAttribute('data-topbar-animation', 'true');
        document.head.appendChild(styleSheet);
    }

    return (
        <>
            <header style={styles.topbar}>
                {/* Right Actions - Cash Balance, Plus, Notifications & Profile */}
                <div style={styles.topbarActions}>
                    {/* Cash Balance Pill */}
                    <div
                        style={styles.balancePill}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--text-primary)';
                            e.currentTarget.style.color = '#FFFFFF';
                            e.currentTarget.style.borderColor = 'var(--text-primary)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--panel)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                            e.currentTarget.style.borderColor = 'var(--text-primary)';
                        }}
                    >
                        <span style={styles.balanceText}>
                            Cash Balance:
                            <strong>
                                {isBalanceVisible ? `${balanceData.currency} ${balanceData.amount}` : '••••'}
                            </strong>
                        </span>
                        {/* Eye Toggle Icon */}
                        <button
                            style={styles.eyeToggle}
                            onClick={() => setIsBalanceVisible(!isBalanceVisible)}
                            title={isBalanceVisible ? 'Hide balance' : 'Show balance'}
                            aria-label={isBalanceVisible ? 'Hide balance' : 'Show balance'}
                            onMouseEnter={(e) => {
                                e.target.style.opacity = '0.8';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.opacity = '1';
                            }}
                        >
                            {isBalanceVisible ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* Top Up Button */}
                    <button
                        style={styles.topupButton}
                        onClick={handleTopupClick}
                        title="Request Top Up"
                        aria-label="Request Top Up"
                        onMouseEnter={(e) => {
                            const button = e.currentTarget;
                            button.style.transform = 'scale(1.05)';
                            button.style.background = 'var(--text-primary)';
                            button.style.color = '#FFFFFF';
                            button.style.borderColor = 'var(--text-primary)';
                            button.style.boxShadow = '0 4px 12px rgba(31, 31, 31, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                            const button = e.currentTarget;
                            button.style.transform = 'scale(1)';
                            button.style.background = 'var(--panel)';
                            button.style.color = 'var(--text-primary)';
                            button.style.borderColor = 'var(--text-primary)';
                            button.style.boxShadow = 'none';
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </button>

                    {/* Notification Bell Button */}
                    <button
                        style={styles.notificationBtn}
                        type="button"
                        aria-label="Notifications"
                        onMouseEnter={(e) => {
                            e.target.style.background = 'var(--surface-soft)';
                            e.target.style.borderColor = 'var(--primary)';
                            e.target.style.color = 'var(--primary)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'var(--panel)';
                            e.target.style.borderColor = 'var(--border)';
                            e.target.style.color = 'var(--text-primary)';
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
                        <span style={styles.notificationBadge}>3</span>
                    </button>

                    {/* Profile Avatar Dropdown */}
                    <div style={styles.profileDropdownWrapper}>
                        <button
                            style={styles.avatarBtn}
                            type="button"
                            aria-label="Profile Menu"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            onMouseEnter={(e) => {
                                e.target.style.borderColor = 'var(--primary)';
                                e.target.style.boxShadow = '0 4px 12px rgba(74, 15, 26, 0.25)';
                                e.target.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.borderColor = 'var(--border)';
                                e.target.style.boxShadow = 'none';
                                e.target.style.transform = 'scale(1)';
                            }}
                        >
                            {adminData.avatarInitials}
                        </button>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <div style={styles.profileDropdownMenu}>
                                {/* Header with DSA Info */}
                                <div style={styles.dropdownHeader}>
                                    <div style={styles.dsaAvatar}>
                                        {adminData.avatarInitials}
                                    </div>
                                    <div style={styles.dsaInfo}>
                                        <div style={styles.dsaName}>{adminData.adminName}</div>
                                        <div style={styles.dsaId}>Admin ID: {adminData.adminId}</div>
                                        {adminData.adminEmail && (
                                            <div style={styles.dsaId}>{adminData.adminEmail}</div>
                                        )}
                                    </div>
                                </div>

                                <div style={styles.dropdownDivider}></div>

                                {/* Menu Items */}
                                <div style={styles.dropdownMenuItems}>
                                    <button
                                        style={styles.dropdownMenuItem}
                                        onClick={handleClearCache}
                                        type="button"
                                        onMouseEnter={(e) => {
                                            e.target.style.background = 'var(--surface-soft)';
                                            e.target.style.color = 'var(--primary)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.background = 'none';
                                            e.target.style.color = 'var(--text-primary)';
                                        }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.svg}>
                                            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                                            <path d="M21 3v5h-5"></path>
                                            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                                            <path d="M3 21v-5h5"></path>
                                        </svg>
                                        <span style={styles.span}>Clear Cache & Cookies</span>
                                    </button>

                                    <button
                                        style={styles.dropdownMenuItem}
                                        onClick={handleChangePassword}
                                        type="button"
                                        onMouseEnter={(e) => {
                                            e.target.style.background = 'var(--surface-soft)';
                                            e.target.style.color = 'var(--primary)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.background = 'none';
                                            e.target.style.color = 'var(--text-primary)';
                                        }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.svg}>
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                        </svg>
                                        <span style={styles.span}>Change Password</span>
                                    </button>

                                    <button
                                        style={styles.dropdownMenuItem}
                                        onClick={handleChangePin}
                                        type="button"
                                        onMouseEnter={(e) => {
                                            e.target.style.background = 'var(--surface-soft)';
                                            e.target.style.color = 'var(--primary)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.background = 'none';
                                            e.target.style.color = 'var(--text-primary)';
                                        }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.svg}>
                                            <circle cx="12" cy="12" r="1"></circle>
                                            <circle cx="19" cy="12" r="1"></circle>
                                            <circle cx="5" cy="12" r="1"></circle>
                                        </svg>
                                        <span style={styles.span}>Change PIN</span>
                                    </button>
                                </div>

                                <div style={styles.dropdownDivider}></div>

                                {/* Logout Button */}
                                <button
                                    style={{ ...styles.dropdownMenuItem, ...styles.logoutBtn }}
                                    onClick={handleLogout}
                                    type="button"
                                    onMouseEnter={(e) => {
                                        e.target.style.background = 'rgba(217, 48, 37, 0.12)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = 'none';
                                    }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.svg}>
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                        <polyline points="16 17 21 12 16 7"></polyline>
                                        <line x1="21" y1="12" x2="9" y2="12"></line>
                                    </svg>
                                    <span style={styles.span}>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Backdrop to close dropdown */}
                {isDropdownOpen && (
                    <div
                        style={styles.dropdownBackdrop}
                        onClick={() => setIsDropdownOpen(false)}
                    ></div>
                )}
            </header>

            {/* Top Up Modal */}
            {showTopupModal && (
                <div style={styles.modalBackdrop} onClick={() => setShowTopupModal(false)}>
                    <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalTitle}>Request Top Up</div>
                        <input
                            type="number"
                            placeholder="Enter amount (INR)"
                            value={topupAmount}
                            onChange={(e) => setTopupAmount(e.target.value)}
                            style={styles.modalInput}
                            onFocus={(e) => {
                                e.target.style.borderColor = 'var(--primary)';
                                e.target.style.boxShadow = '0 0 0 3px rgba(74, 15, 26, 0.12)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'var(--border)';
                                e.target.style.boxShadow = 'none';
                            }}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleTopupSubmit();
                                }
                            }}
                            min="0"
                        />
                        <div style={styles.modalButtons}>
                            <button
                                style={{ ...styles.modalBtn, ...styles.modalBtnCancel }}
                                onClick={() => setShowTopupModal(false)}
                                onMouseEnter={(e) => {
                                    e.target.style.background = '#E5DFD1';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'var(--surface-soft)';
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                style={{ ...styles.modalBtn, ...styles.modalBtnSubmit }}
                                onClick={handleTopupSubmit}
                                onMouseEnter={(e) => {
                                    e.target.style.background = '#2F2F2F';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'var(--primary)';
                                }}
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Topbar;
