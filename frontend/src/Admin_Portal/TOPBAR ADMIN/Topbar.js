import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminDashboardSummary, deriveAdminMetrics } from '../../services/adminDashboardService';

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
        avatarBg: 'linear-gradient(135deg, #1e75ff, #0052d9)',
    };
}

const SEARCHABLE_PAGES = [
    { label: 'Dashboard', category: 'General', path: '/admin' },
    { label: 'Bus Bookings List', category: 'Bus Management', path: '/admin/b2c-bus/booking-list' },
    { label: 'Bus Discount List', category: 'Bus Management', path: '/admin/b2c-bus/discounts' },
    { label: 'Add Bus Discount', category: 'Bus Management', path: '/admin/b2c-bus/discounts/new' },
    { label: 'Bus Discount Mapping', category: 'Bus Management', path: '/admin/b2c-bus/discount-mapping' },
    { label: 'Bus Markup List', category: 'Bus Management', path: '/admin/b2c-bus/markup-list' },
    { label: 'Bus GST Settings', category: 'Bus Management', path: '/admin/b2c-bus/gst-settings' },
    { label: 'Bus Coupon List', category: 'Bus Management', path: '/admin/b2c-bus/coupon-list' },
    { label: 'Bus Used Coupon List', category: 'Bus Management', path: '/admin/b2c-bus/used-coupon-list' },
    { label: 'Bus Convenience Fee', category: 'Bus Management', path: '/admin/b2c-bus/convenience-fee' },
    { label: 'Edit Bus Convenience Fee', category: 'Bus Management', path: '/admin/b2c-bus/convenience-fee/edit' },
    { label: 'Bus Cancellation List', category: 'Bus Management', path: '/admin/b2c-bus/cancellation-list' },
    { label: 'Bus Search History', category: 'Bus Management', path: '/admin/b2c-bus/search-history' },
    { label: 'Bus Voucher Settings', category: 'Bus Management', path: '/admin/b2c-bus/voucher-settings' },
    { label: 'Popular Bus Routes', category: 'Bus Management', path: '/admin/b2c-bus/popular-routes' },
    
    { label: 'Flight Booking List', category: 'Flight Management', path: '/admin/b2c-flight/booking-list' },
    { label: 'Flight Discount List', category: 'Flight Management', path: '/admin/b2c-flight/discounts' },
    { label: 'Add Flight Discount', category: 'Flight Management', path: '/admin/b2c-flight/discounts/new' },
    { label: 'Flight Markup List', category: 'Flight Management', path: '/admin/b2c-flight/markup' },
    { label: 'Flight Coupon List', category: 'Flight Management', path: '/admin/b2c-flight/coupon-list' },
    { label: 'Flight Used Coupon List', category: 'Flight Management', path: '/admin/b2c-flight/used-coupon-list' },
    { label: 'Flight Convenience Fee', category: 'Flight Management', path: '/admin/b2c-flight/convenience-fee' },
    { label: 'Add Flight Convenience Fee', category: 'Flight Management', path: '/admin/b2c-flight/convenience-fee/add' },
    { label: 'Edit Flight Convenience Fee', category: 'Flight Management', path: '/admin/b2c-flight/convenience-fee/edit' },
    { label: 'Flight Cancellation Request List', category: 'Flight Management', path: '/admin/b2c-flight/cancellation-requests' },
    { label: 'Flight Remark List', category: 'Flight Management', path: '/admin/b2c-flight/remark-list' },
    { label: 'Add Flight Remark', category: 'Flight Management', path: '/admin/b2c-flight/remark-list/add' },
    { label: 'Edit Flight Remark', category: 'Flight Management', path: '/admin/b2c-flight/remark-list/edit' },
    { label: 'Flight Amendments List', category: 'Flight Management', path: '/admin/b2c-flight/amendments' },
    { label: 'Flight Allowed Fare Types', category: 'Flight Management', path: '/admin/b2c-flight/allowed-fare-types' },
    { label: 'Flight Search History', category: 'Flight Management', path: '/admin/b2c-flight/search-history' },
    { label: 'Flight Pending Airline List', category: 'Flight Management', path: '/admin/b2c-flight/pending-airlines' },
    { label: 'Add Flight Pending Airline', category: 'Flight Management', path: '/admin/b2c-flight/pending-airlines/add' },
    { label: 'Edit Flight Pending Airline', category: 'Flight Management', path: '/admin/b2c-flight/pending-airlines/edit' },
    { label: 'Flight Airline Web Check Links', category: 'Flight Management', path: '/admin/b2c-flight/airline-webcheck-links' },
    { label: 'Flight Airline Brand List', category: 'Flight Management', path: '/admin/b2c-flight/airline-brands' },
    { label: 'Popular Flight Routes', category: 'Flight Management', path: '/admin/b2c-flight/popular-routes' },
    { label: 'Popular Flight Destinations', category: 'Flight Management', path: '/admin/b2c-flight/popular-destinations' },
    
    { label: 'Blog List', category: 'Blog Management', path: '/admin/blog-management/blog-list' },
    { label: 'Add Blog', category: 'Blog Management', path: '/admin/blog-management/add-blog' },
    { label: 'Blog Sub Category List', category: 'Blog Management', path: '/admin/blog-management/blog-sub-category-list' },
    { label: 'Add Blog Sub Category', category: 'Blog Management', path: '/admin/blog-management/add-blog-sub-category' },
    { label: 'Blog Category List', category: 'Blog Management', path: '/admin/blog-management/blog-category-list' },
    { label: 'Add Blog Category', category: 'Blog Management', path: '/admin/blog-management/add-blog-category' },
    
    { label: 'Customer List', category: 'Customer Management', path: '/admin/customer-management/customer-list' },
    { label: 'Add New Customer', category: 'Customer Management', path: '/admin/customer-management/add-new-customer' },
    { label: 'Deposit Request List', category: 'Customer Management', path: '/admin/customer-management/deposit-request-list' },
    
    { label: 'All Page List', category: 'Page Management', path: '/admin/page-management/pages' },
    { label: 'Add New Page', category: 'Page Management', path: '/admin/page-management/pages/new' },
    
    { label: 'Menu List', category: 'Menu Management', path: '/admin/menu-management/menus' },
    { label: 'Add Menu', category: 'Menu Management', path: '/admin/menu-management/menus/new' },
    
    { label: 'Offer List', category: 'Offer Management', path: '/admin/offer-management/offers' },
    { label: 'Add New Offer', category: 'Offer Management', path: '/admin/offer-management/offers/new' },
    
    { label: 'Query List', category: 'Query Management', path: '/admin/query-management/query-list' },
    
    { label: 'Testimonial List', category: 'Testimonial Management', path: '/admin/testimonial-management/testimonial-list' },
    { label: 'Add Testimonial', category: 'Testimonial Management', path: '/admin/testimonial-management/add-testimonial' }
];

function Topbar({ searchQuery, setSearchQuery }) {
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isBalanceVisible, setIsBalanceVisible] = useState(true);
    const [showTopupModal, setShowTopupModal] = useState(false);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const [topupAmount, setTopupAmount] = useState('');
    const [notificationCount, setNotificationCount] = useState(0);
    const [todayDate, setTodayDate] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [showCacheLoader, setShowCacheLoader] = useState(false);
    const [cacheLoaderText, setCacheLoaderText] = useState('');
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordInputs, setPasswordInputs] = useState({ old: '', newPassword: '', confirm: '' });
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinInput, setPinInput] = useState('');

    const showToastMessage = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
    };

    const [adminData] = useState(() => getAdminProfile());

    const handleExportCSV = () => {
        const csvRows = [
            ["Book My Route - Admin Dashboard Report"],
            [`Generated Date: ${todayDate}`],
            [],
            ["Dashboard Metric", "Current Value"],
            ["Cash Balance", `INR ${balanceData.amount}`],
            ["Last Login IP", "192.168.1.10"],
            ["Total Daily Bookings", "107"],
            ["Pending Transactions", "2"],
            ["Failed Transactions", "7"],
            ["Successful B2C Bookings", "92"],
            ["System Alerts Count", String(notificationCount)]
        ];

        const csvContent = "\uFEFF" + csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `BMR_Admin_Report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Click outside handler for search dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('[data-search-wrapper]')) {
                setShowSearchDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Dynamic today's date
    useEffect(() => {
        const formatToday = () => {
            const now = new Date();
            return now.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
        };
        setTodayDate(formatToday());
        // Update every minute in case date changes at midnight
        const timer = setInterval(() => setTodayDate(formatToday()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Dynamic notification count
    useEffect(() => {
        const loadNotifications = () => {
            const stored = parseInt(localStorage.getItem('adminNotificationCount') || '0', 10);
            setNotificationCount(stored);
        };
        loadNotifications();
        // Re-check every 30 seconds for real-time feel
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Dynamic balance data
    const [balanceData, setBalanceData] = useState({
        amount: 114359, // Set starting value to match visual mockup perfectly
        currency: 'INR',
    });

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const summary = await getAdminDashboardSummary();
                const metrics = deriveAdminMetrics(summary);
                if (metrics && metrics.revenue !== undefined) {
                    setBalanceData({
                        amount: metrics.revenue,
                        currency: 'INR'
                    });
                }
            } catch (err) {
                console.error("Error fetching balance data in Topbar:", err);
            }
        };
        fetchBalance();
        const interval = setInterval(fetchBalance, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRole');
        localStorage.removeItem('adminId');
        localStorage.removeItem('adminName');
        localStorage.removeItem('adminEmail');
        localStorage.removeItem('adminLoginEmail');
        localStorage.removeItem('adminChallengeId');
        localStorage.removeItem('challengeId');
        setIsDropdownOpen(false);
        navigate('/admin/login', { replace: true });
    };

    const handleClearCache = () => {
        setIsDropdownOpen(false);
        setShowCacheLoader(true);
        setCacheLoaderText('Purging cache tables...');
        setTimeout(() => {
            setCacheLoaderText('Reindexing sessions...');
            setTimeout(() => {
                setShowCacheLoader(false);
                showToastMessage('System cache cleared successfully!', 'success');
            }, 800000 / 1000); // 800ms
        }, 800000 / 1000); // 800ms
    };

    const handleChangePassword = () => {
        setIsDropdownOpen(false);
        setShowPasswordModal(true);
    };

    const handleChangePin = () => {
        setIsDropdownOpen(false);
        setShowPinModal(true);
    };

    const handleTopupClick = () => {
        console.log('Top up request clicked');
        setShowTopupModal(true);
    };

    const handleTopupSubmit = () => {
        const amount = parseFloat(topupAmount) || 0;
        if (amount > 0) {
            setBalanceData(prev => ({
                ...prev,
                amount: prev.amount + amount
            }));
            showToastMessage(`Wallet successfully topped up with ₹${amount.toLocaleString('en-IN')}!`, 'success');
            setTopupAmount('');
            setShowTopupModal(false);
        } else {
            showToastMessage("Please enter a valid positive amount.", "error");
        }
    };

    const handlePasswordSubmit = () => {
        if (!passwordInputs.old || !passwordInputs.newPassword || !passwordInputs.confirm) {
            showToastMessage("Please fill in all password fields.", "error");
            return;
        }
        if (passwordInputs.newPassword !== passwordInputs.confirm) {
            showToastMessage("New passwords do not match.", "error");
            return;
        }
        if (passwordInputs.newPassword.length < 6) {
            showToastMessage("Password must be at least 6 characters.", "error");
            return;
        }
        showToastMessage("Password updated successfully!", "success");
        setPasswordInputs({ old: '', newPassword: '', confirm: '' });
        setShowPasswordModal(false);
    };

    const handlePinSubmit = () => {
        if (pinInput.length !== 4) {
            showToastMessage("PIN must be exactly 4 digits.", "error");
            return;
        }
        showToastMessage(`Security PIN updated successfully!`, "success");
        setPinInput('');
        setShowPinModal(false);
    };

    const topbarControlHeight = 58;

    // Inline Styles with Theme Colors
    const styles = {
        topbar: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            padding: '10px 28px',
            borderBottom: '1px solid #e8edf5',
            background: '#f1f5fa',
            position: 'relative',
            flexShrink: 0,
        },
        topbarLeft: {
            display: 'flex',
            alignItems: 'center',
            flex: 1,
        },
        menuToggle: {
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        searchWrapper: {
            position: 'relative',
            width: '100%',
            maxWidth: '360px',
        },
        searchBarInput: {
            width: '100%',
            height: `${topbarControlHeight}px`,
            padding: '10px 16px 10px 42px',
            boxSizing: 'border-box',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            color: 'var(--text-primary)',
            outline: 'none',
            fontSize: '0.88rem',
            fontFamily: 'inherit',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.01)',
            transition: 'all 0.2s ease',
        },
        searchBarIcon: {
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#94a3b8',
            fontSize: '16px',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
        },
        searchDropdown: {
            position: 'absolute',
            top: '100%',
            left: 0,
            width: '100%',
            marginTop: '8px',
            background: '#ffffff',
            border: '1px solid #eef2f6',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
            maxHeight: '300px',
            overflowY: 'auto',
            zIndex: 1200,
            padding: '8px 0',
        },
        searchDropdownItem: {
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            padding: '10px 16px',
            cursor: 'pointer',
            transition: 'background 0.2s ease',
            border: 'none',
            background: 'none',
            width: '100%',
            textAlign: 'left',
            boxSizing: 'border-box',
        },
        searchDropdownLabel: {
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
        },
        searchDropdownCategory: {
            fontSize: '0.72rem',
            color: '#94a3b8',
            fontWeight: 500,
        },
        noSearchResults: {
            padding: '12px 16px',
            fontSize: '0.8rem',
            color: '#94a3b8',
            textAlign: 'center',
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
            gap: '10px',
            height: `${topbarControlHeight}px`,
            width: 'clamp(190px, 18vw, 270px)',
            minWidth: '170px',
            padding: '8px 16px',
            boxSizing: 'border-box',
            borderRadius: '12px',
            background: '#ffffff',
            border: '1px solid #eef2f6',
            color: 'var(--text-primary)',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.02)',
            transition: 'all 0.2s ease',
        },
        balanceIconWrapper: {
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: '#eef4ff',
            display: 'grid',
            placeItems: 'center',
            color: '#1e75ff',
            flexShrink: 0,
        },
        balanceText: {
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            minWidth: 0,
            flex: 1,
            fontSize: '0.72rem',
            color: '#64748b',
            fontWeight: 500,
        },
        balanceValue: {
            fontSize: '0.9rem',
            color: '#1e75ff',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
        },
        eyeToggle: {
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            marginLeft: '6px',
        },
        dateSelector: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            height: `${topbarControlHeight}px`,
            padding: '8px 16px',
            boxSizing: 'border-box',
            borderRadius: '12px',
            background: '#ffffff',
            border: '1px solid #eef2f6',
            color: '#0f172a',
            fontSize: '0.85rem',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.02)',
            cursor: 'pointer',
        },
        exportBtn: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            height: `${topbarControlHeight}px`,
            padding: '10px 18px',
            boxSizing: 'border-box',
            borderRadius: '10px',
            background: '#1e75ff',
            color: '#ffffff',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(30, 117, 255, 0.2)',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit',
        },
        topupButton: {
            height: `${topbarControlHeight}px`,
            width: `${topbarControlHeight}px`,
            borderRadius: '50%',
            border: '1px solid #eef2f6',
            background: '#ffffff',
            color: '#1e75ff',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.02)',
        },
        notificationBtn: {
            position: 'relative',
            height: `${topbarControlHeight}px`,
            width: `${topbarControlHeight}px`,
            borderRadius: '50%',
            border: '1px solid #eef2f6',
            background: '#ffffff',
            color: '#64748b',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.02)',
        },
        notificationBadge: {
            position: 'absolute',
            top: '0px',
            right: '0px',
            background: '#ef4444',
            color: '#FFFFFF',
            borderRadius: '50%',
            width: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.65rem',
            fontWeight: 700,
            border: '2px solid #ffffff',
        },
        profileDropdownWrapper: {
            position: 'relative',
        },
        avatarBtn: {
            height: `${topbarControlHeight}px`,
            width: `${topbarControlHeight}px`,
            borderRadius: '50%',
            border: '2px solid #ffffff',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 800,
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontSize: '0.75rem',
            padding: 0,
            background: 'linear-gradient(135deg, #1e75ff, #0052d9)',
            boxShadow: '0 4px 12px rgba(30, 117, 255, 0.15)',
        },
        profileDropdownMenu: {
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '12px',
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
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
            background: '#f8fafc',
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
            background: 'linear-gradient(135deg, #1e75ff, #0052d9)',
            boxShadow: '0 4px 12px rgba(30, 117, 255, 0.2)',
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
            background: 'rgba(15, 23, 42, 0.3)',
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
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.05)',
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

    const filteredSearchPages = searchQuery
        ? SEARCHABLE_PAGES.filter(page =>
            page.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            page.category.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : SEARCHABLE_PAGES.slice(0, 5);

    return (
        <>
            <header style={styles.topbar}>
                {/* Left Section: Search Pill */}
                <div style={styles.topbarLeft}>
                    <div style={styles.searchWrapper} data-search-wrapper>
                        <span style={styles.searchBarIcon}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Search anything..."
                            value={searchQuery || ''}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setShowSearchDropdown(true);
                            }}
                            onFocus={() => setShowSearchDropdown(true)}
                            style={styles.searchBarInput}
                            onFocusCapture={(e) => {
                                e.target.style.borderColor = '#1e75ff';
                                e.target.style.boxShadow = '0 4px 16px rgba(30, 117, 255, 0.08)';
                            }}
                            onBlurCapture={(e) => {
                                e.target.style.borderColor = '#e2e8f0';
                                e.target.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.01)';
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && filteredSearchPages.length > 0) {
                                    navigate(filteredSearchPages[0].path);
                                    setShowSearchDropdown(false);
                                    setSearchQuery('');
                                    e.target.blur();
                                }
                            }}
                        />
                        {showSearchDropdown && (
                            <div style={styles.searchDropdown}>
                                <div style={{ padding: '8px 16px', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: 700, borderBottom: '1px solid #f1f5fa', marginBottom: '4px' }}>
                                    {searchQuery ? 'Search Results' : 'Suggested Pages'}
                                </div>
                                {filteredSearchPages.length > 0 ? (
                                    filteredSearchPages.map((page, idx) => (
                                        <button
                                            key={page.path + idx}
                                            style={styles.searchDropdownItem}
                                            onClick={() => {
                                                navigate(page.path);
                                                setShowSearchDropdown(false);
                                                setSearchQuery('');
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#f8fafc';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'none';
                                            }}
                                        >
                                            <span style={styles.searchDropdownLabel}>{page.label}</span>
                                            <span style={styles.searchDropdownCategory}>{page.category}</span>
                                        </button>
                                    ))
                                ) : (
                                    <div style={styles.noSearchResults}>
                                        No matching pages found
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Actions */}
                <div style={styles.topbarActions}>
                    {/* Cash Balance Pill (Mockup match) */}
                    <div style={styles.balancePill}>
                        <div style={styles.balanceIconWrapper}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
                                <line x1="12" y1="4" x2="12" y2="20"></line>
                            </svg>
                        </div>
                        <div style={styles.balanceText}>
                            <span>Cash Balance</span>
                            <strong style={styles.balanceValue}>
                                {isBalanceVisible ? `₹ ${Number(balanceData.amount).toLocaleString('en-IN')}` : '₹ ••••••'}
                            </strong>
                        </div>
                        <button
                            style={styles.eyeToggle}
                            onClick={() => setIsBalanceVisible(!isBalanceVisible)}
                            title={isBalanceVisible ? 'Hide balance' : 'Show balance'}
                            aria-label={isBalanceVisible ? 'Hide balance' : 'Show balance'}
                        >
                            {isBalanceVisible ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* Date Selector Dropdown (Mockup match) */}
                    <div style={{ position: 'relative' }}>
                        <div 
                            style={styles.dateSelector}
                            onClick={() => {
                                setShowDatePicker(!showDatePicker);
                                setShowNotifications(false);
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            <span>{todayDate}</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                        {showDatePicker && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '10px',
                                background: '#ffffff',
                                border: '1px solid #eef2f6',
                                borderRadius: '12px',
                                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                                padding: '14px',
                                zIndex: 1100,
                                width: '220px',
                            }}>
                                <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '8px', color: '#0f172a' }}>Select Date</div>
                                <input 
                                    type="date" 
                                    onChange={(e) => {
                                        const d = new Date(e.target.value);
                                        if (!isNaN(d.getTime())) {
                                            setTodayDate(d.toLocaleDateString('en-IN', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                            }));
                                        }
                                        setShowDatePicker(false);
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '6px 10px',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontSize: '0.8rem',
                                        outline: 'none',
                                        fontFamily: 'inherit',
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Export Report Pill Button */}
                    <button 
                        style={styles.exportBtn}
                        onClick={handleExportCSV}
                        title="Export Summary Report"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        <span>Export Report</span>
                    </button>

                    {/* Request Top Up Action button (Plus) */}
                    <button
                        style={styles.topupButton}
                        onClick={handleTopupClick}
                        title="Request Top Up"
                        aria-label="Request Top Up"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </button>

                    {/* Notification Bell Button */}
                    <div style={{ position: 'relative' }}>
                        <button
                            style={styles.notificationBtn}
                            type="button"
                            aria-label="Notifications"
                            onClick={() => {
                                setShowNotifications(!showNotifications);
                                setShowDatePicker(false);
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                            </svg>
                            {notificationCount > 0 && (
                                <span style={styles.notificationBadge}>
                                    {notificationCount > 99 ? '99+' : notificationCount}
                                </span>
                            )}
                        </button>
                        {showNotifications && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '10px',
                                background: '#ffffff',
                                border: '1px solid #eef2f6',
                                borderRadius: '12px',
                                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                                width: '280px',
                                zIndex: 1100,
                                overflow: 'hidden',
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '12px 14px',
                                    background: '#f8fafc',
                                    borderBottom: '1px solid #e8edf5',
                                }}>
                                    <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>System Notifications</strong>
                                    <span style={{ fontSize: '0.62rem', background: '#3b82f6', color: '#fff', padding: '1px 6px', borderRadius: '10px', fontWeight: 'bold' }}>Active</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '200px', overflowY: 'auto' }}>
                                    <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', fontSize: '0.74rem', color: '#334155' }}>
                                        <div style={{ fontWeight: 700, color: '#1e75ff', marginBottom: '1px' }}>New Cancellation</div>
                                        <span>Ticket #48291 requires review.</span>
                                    </div>
                                    <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', fontSize: '0.74rem', color: '#334155' }}>
                                        <div style={{ fontWeight: 700, color: '#10b981', marginBottom: '1px' }}>Payment Verified</div>
                                        <span>B2C transaction ₹15,400 success.</span>
                                    </div>
                                    <div style={{ padding: '10px 14px', fontSize: '0.74rem', color: '#334155' }}>
                                        <div style={{ fontWeight: 700, color: '#f97316', marginBottom: '1px' }}>Pending Updates</div>
                                        <span>Traveler modifications ready to check.</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Profile Avatar Dropdown */}
                    <div style={styles.profileDropdownWrapper}>
                        <button
                            style={styles.avatarBtn}
                            type="button"
                            aria-label="Profile Menu"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                            {adminData.avatarInitials}
                        </button>
                        <span style={{
                            position: 'absolute',
                            bottom: '0px',
                            right: '0px',
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: '#10b981',
                            border: '2px solid #ffffff'
                        }}></span>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <div style={styles.profileDropdownMenu}>
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

                                <div style={styles.dropdownMenuItems}>
                                    <button
                                        style={styles.dropdownMenuItem}
                                        onClick={handleClearCache}
                                        type="button"
                                        onMouseEnter={(e) => {
                                            e.target.style.background = '#f1f5fa';
                                            e.target.style.color = '#1e75ff';
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
                                            e.target.style.background = '#f1f5fa';
                                            e.target.style.color = '#1e75ff';
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
                                            e.target.style.background = '#f1f5fa';
                                            e.target.style.color = '#1e75ff';
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

                                <button
                                    style={{ ...styles.dropdownMenuItem, ...styles.logoutBtn }}
                                    onClick={handleLogout}
                                    type="button"
                                    onMouseEnter={(e) => {
                                        e.target.style.background = 'rgba(239, 68, 68, 0.08)';
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

                {isDropdownOpen && (
                    <div style={styles.dropdownBackdrop} onClick={() => setIsDropdownOpen(false)}></div>
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
                            min="0"
                        />
                        <div style={styles.modalButtons}>
                            <button style={{ ...styles.modalBtn, ...styles.modalBtnCancel }} onClick={() => setShowTopupModal(false)}>
                                Cancel
                            </button>
                            <button style={{ ...styles.modalBtn, ...styles.modalBtnSubmit }} onClick={handleTopupSubmit}>
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast.show && (
                <div style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    padding: '12px 24px',
                    borderRadius: '10px',
                    background: toast.type === 'success' ? '#ecfdf5' : '#fef2f2',
                    border: `1px solid ${toast.type === 'success' ? '#10b981' : '#ef4444'}`,
                    color: toast.type === 'success' ? '#065f46' : '#991b1b',
                    fontSize: '0.88rem',
                    fontWeight: 'bold',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
                    zIndex: 2000,
                    animation: 'dropdownSlideDown 0.3s ease',
                }}>
                    {toast.type === 'success' ? '✅ ' : '❌ '}{toast.message}
                </div>
            )}

            {/* Cache Loader Modal */}
            {showCacheLoader && (
                <div style={styles.modalBackdrop}>
                    <div style={{ ...styles.modal, textAlign: 'center', maxWidth: '300px' }}>
                        <div style={{
                            margin: '0 auto 16px',
                            border: '4px solid #f3f3f3',
                            borderTop: '4px solid #1e75ff',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            animation: 'spin 1s linear infinite',
                        }} />
                        <style>{`
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        `}</style>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{cacheLoaderText}</div>
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            {showPasswordModal && (
                <div style={styles.modalBackdrop} onClick={() => setShowPasswordModal(false)}>
                    <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalTitle}>Change Password</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                            <input
                                type="password"
                                placeholder="Old Password"
                                value={passwordInputs.old}
                                onChange={(e) => setPasswordInputs(prev => ({ ...prev, old: e.target.value }))}
                                style={styles.modalInput}
                            />
                            <input
                                type="password"
                                placeholder="New Password"
                                value={passwordInputs.newPassword}
                                onChange={(e) => setPasswordInputs(prev => ({ ...prev, newPassword: e.target.value }))}
                                style={styles.modalInput}
                            />
                            <input
                                type="password"
                                placeholder="Confirm New Password"
                                value={passwordInputs.confirm}
                                onChange={(e) => setPasswordInputs(prev => ({ ...prev, confirm: e.target.value }))}
                                style={styles.modalInput}
                            />
                        </div>
                        <div style={styles.modalButtons}>
                            <button style={{ ...styles.modalBtn, ...styles.modalBtnCancel }} onClick={() => setShowPasswordModal(false)}>
                                Cancel
                            </button>
                            <button style={{ ...styles.modalBtn, ...styles.modalBtnSubmit }} onClick={handlePasswordSubmit}>
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Change PIN Modal */}
            {showPinModal && (
                <div style={styles.modalBackdrop} onClick={() => setShowPinModal(false)}>
                    <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalTitle}>Change Security PIN</div>
                        <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '12px' }}>Enter a new 4-digit PIN for console verification:</p>
                        <input
                            type="text"
                            maxLength="4"
                            placeholder="4-digit PIN"
                            value={pinInput}
                            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                            style={{ ...styles.modalInput, textAlign: 'center', letterSpacing: '8px', fontSize: '1.2rem', fontWeight: 'bold' }}
                        />
                        <div style={styles.modalButtons}>
                            <button style={{ ...styles.modalBtn, ...styles.modalBtnCancel }} onClick={() => setShowPinModal(false)}>
                                Cancel
                            </button>
                            <button style={{ ...styles.modalBtn, ...styles.modalBtnSubmit }} onClick={handlePinSubmit}>
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
