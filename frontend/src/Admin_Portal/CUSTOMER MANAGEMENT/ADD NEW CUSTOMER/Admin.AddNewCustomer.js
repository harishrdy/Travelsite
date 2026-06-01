import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNextNumericId, useAdminList } from "../../../utils/adminPortalStorage";

function AddNewCustomer() {
    const navigate = useNavigate();
    const toastTimerRef = useRef(null);
    const [customers, setCustomers] = useAdminList('customers', []);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
        altMobile: '',
        gender: 'Male',
        currency: 'INR',
        status: 'Active',
        walletStatus: 'Active',
        loginId: '',
        password: '',
        confirmPassword: '',
        refferedBy: '',
        address: '',
        city: '',
        state: '',
        country: '',
        pincode: '',
        remark: '',
        aadharNumber: '',
        panNumber: '',
        panName: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const [toast, setToast] = useState(null);

    const showToast = (message, tone = 'info') => {
        if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
        }
        setToast({ message, tone });
        toastTimerRef.current = setTimeout(() => setToast(null), 2400);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            showToast('Password and confirm password do not match.', 'error');
            return;
        }
        const fullName = `${formData.firstName} ${formData.lastName}`.trim() || 'New Customer';
        const newCustomer = {
            id: getNextNumericId(customers, 1),
            status: formData.status || 'Active',
            customerName: fullName,
            emailId: formData.email || '',
            mobile: formData.mobile || '',
            walletStatus: formData.walletStatus || 'Active',
            walletBalance: 0,
            altMobile: formData.altMobile || '',
            gender: formData.gender || '',
            currency: formData.currency || 'INR',
            loginId: formData.loginId || '',
            address: formData.address || '',
            city: formData.city || '',
            state: formData.state || '',
            country: formData.country || '',
            pincode: formData.pincode || '',
            remark: formData.remark || '',
            aadharNumber: formData.aadharNumber || '',
            panNumber: formData.panNumber || '',
            panName: formData.panName || '',
            refferedBy: formData.refferedBy || '',
        };

        setCustomers((previous) => [newCustomer, ...previous]);
        showToast('Customer saved locally.', 'success');
        navigate('/admin/customer-management/customer-list');
    };

    const handleReset = () => {
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            mobile: '',
            altMobile: '',
            gender: 'Male',
            currency: 'INR',
            status: 'Active',
            walletStatus: 'Active',
            loginId: '',
            password: '',
            confirmPassword: '',
            refferedBy: '',
            address: '',
            city: '',
            state: '',
            country: '',
            pincode: '',
            remark: '',
            aadharNumber: '',
            panNumber: '',
            panName: '',
        });
        showToast('Form reset.', 'info');
    };

    // Inline Styles
    const styles = {
        container: {
            padding: '24px 32px',
            background: 'var(--page-bg)',
            minHeight: '100vh',
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '28px',
        },
        titleWrapper: {
            display: 'flex',
            alignItems: 'baseline',
            gap: '8px',
            borderBottom: '3px solid var(--primary)',
            paddingBottom: '8px',
            width: 'fit-content',
        },
        titleMain: {
            fontSize: '2rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            margin: 0,
        },
        titleSub: {
            fontSize: '1.5rem',
            fontWeight: 400,
            color: 'var(--text-secondary)',
            margin: 0,
        },
        backBtn: {
            padding: '10px 16px',
            background: 'var(--panel)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.9rem',
        },
        formContainer: {
            background: 'var(--panel)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
        },
        sectionHeader: {
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 20px',
            background: 'linear-gradient(90deg, var(--primary), var(--primary-strong))',
            color: '#ffffff',
            fontWeight: 700,
            borderRadius: '12px 12px 0 0',
            margin: '0',
            marginTop: '0',
            fontSize: '0.95rem',
        },
        firstSection: {
            borderRadius: '12px 12px 0 0',
        },
        sectionContent: {
            padding: '20px',
            background: 'var(--surface-soft)',
            borderRadius: '0 0 12px 12px',
            marginBottom: '20px',
            border: '1px solid var(--border)',
            borderTop: 'none',
        },
        formGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginBottom: '16px',
        },
        formGrid2: {
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
            marginBottom: '16px',
        },
        formGroup: {
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
        },
        label: {
            fontSize: '0.85rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
        },
        requiredMark: {
            color: 'var(--danger)',
        },
        input: {
            padding: '9px 11px',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            fontSize: '0.85rem',
            outline: 'none',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit',
            background: 'var(--panel)',
            color: 'var(--text-primary)',
        },
        select: {
            padding: '9px 11px',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            fontSize: '0.85rem',
            outline: 'none',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit',
            background: 'var(--panel)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
        },
        buttonGroup: {
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            padding: '20px',
            background: 'var(--surface-soft)',
            borderTop: '1px solid var(--border)',
        },
        submitBtn: {
            padding: '12px 36px',
            background: 'var(--primary)',
            color: '#ffffff',
            border: '1px solid var(--primary)',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            letterSpacing: '0.5px',
        },
        resetBtn: {
            padding: '12px 36px',
            background: 'var(--panel)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
        },
        toast: {
            padding: '10px 14px',
            borderRadius: '10px',
            border: '1px solid var(--border)',
            background: 'var(--panel)',
            color: 'var(--text-primary)',
            fontWeight: 600,
            fontSize: '0.85rem',
            marginBottom: '16px',
            boxShadow: 'var(--shadow-sm)',
        },
        toastSuccess: {
            borderColor: 'rgba(30, 142, 62, 0.4)',
            background: 'rgba(30, 142, 62, 0.1)',
            color: 'var(--success)',
        },
        toastError: {
            borderColor: 'rgba(217, 48, 37, 0.4)',
            background: 'rgba(217, 48, 37, 0.1)',
            color: 'var(--danger)',
        },
        toastInfo: {
            borderColor: 'rgba(74, 15, 26, 0.25)',
            background: 'rgba(74, 15, 26, 0.08)',
            color: 'var(--primary)',
        },
    };

    return (
        <>
            <div style={styles.container}>
                {toast && (
                    <div
                        style={{
                            ...styles.toast,
                            ...(toast.tone === 'success'
                                ? styles.toastSuccess
                                : toast.tone === 'error'
                                    ? styles.toastError
                                    : styles.toastInfo),
                        }}
                    >
                        {toast.message}
                    </div>
                )}
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.titleWrapper}>
                        <h1 style={styles.titleMain}>Add New</h1>
                        <h2 style={styles.titleSub}>Customer</h2>
                    </div>
                    <button
                        style={styles.backBtn}
                        onClick={() => navigate('/admin/customer-management/customer-list')}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'var(--primary)';
                            e.target.style.color = '#ffffff';
                            e.target.style.borderColor = 'var(--primary)';
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 4px 12px rgba(74, 15, 26, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'var(--panel)';
                            e.target.style.color = 'var(--text-primary)';
                            e.target.style.borderColor = 'var(--border)';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'none';
                        }}
                    >
                        Customer List
                    </button>
                </div>

                {/* Form Container */}
                <div style={styles.formContainer}>
                    <form onSubmit={handleSubmit}>
                        {/* ===== CUSTOMER BASIC INFORMATION ===== */}
                        <div style={{ ...styles.sectionHeader, ...styles.firstSection }}>
                            Customer Basic Information
                        </div>
                        <div style={styles.sectionContent}>
                            <div style={styles.formGrid}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>
                                        First Name<span style={styles.requiredMark}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        placeholder="Enter Customer First Name"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        style={styles.input}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = 'var(--primary)';
                                            e.target.style.boxShadow = '0 0 0 2px rgba(74, 15, 26, 0.15)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'var(--border)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                        required
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Last Name</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        placeholder="Enter Customer Last Name"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        style={styles.input}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = 'var(--primary)';
                                            e.target.style.boxShadow = '0 0 0 2px rgba(74, 15, 26, 0.15)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'var(--border)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>
                                        Email<span style={styles.requiredMark}>*</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Email ID"
                                        value={formData.email}
                                        onChange={handleChange}
                                        style={styles.input}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = 'var(--primary)';
                                            e.target.style.boxShadow = '0 0 0 2px rgba(74, 15, 26, 0.15)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'var(--border)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={styles.formGrid}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>
                                        Mobile<span style={styles.requiredMark}>*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        name="mobile"
                                        placeholder="Mobile Number"
                                        value={formData.mobile}
                                        onChange={handleChange}
                                        style={styles.input}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = 'var(--primary)';
                                            e.target.style.boxShadow = '0 0 0 2px rgba(74, 15, 26, 0.15)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'var(--border)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                        required
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Gender</label>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        style={styles.select}
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>
                                        ALT. Mobile<span style={styles.requiredMark}>*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        name="altMobile"
                                        placeholder="ALT. Mobile Number"
                                        value={formData.altMobile}
                                        onChange={handleChange}
                                        style={styles.input}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = 'var(--primary)';
                                            e.target.style.boxShadow = '0 0 0 2px rgba(74, 15, 26, 0.15)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'var(--border)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={styles.formGrid}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Currency</label>
                                    <input
                                        type="text"
                                        value="INR"
                                        placeholder="INR"
                                        disabled
                                        style={{ ...styles.input, background: 'var(--surface-soft)', color: 'var(--text-muted)' }}
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        style={styles.select}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Wallet Status</label>
                                    <select
                                        name="walletStatus"
                                        value={formData.walletStatus}
                                        onChange={handleChange}
                                        style={styles.select}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div style={styles.formGrid}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Login ID</label>
                                    <input
                                        type="text"
                                        name="loginId"
                                        placeholder=""
                                        value={formData.loginId}
                                        onChange={handleChange}
                                        style={styles.input}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = 'var(--primary)';
                                            e.target.style.boxShadow = '0 0 0 2px rgba(74, 15, 26, 0.15)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'var(--border)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>
                                        Password<span style={styles.requiredMark}>*</span>
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        placeholder="Login Password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        style={styles.input}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = 'var(--primary)';
                                            e.target.style.boxShadow = '0 0 0 2px rgba(74, 15, 26, 0.15)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'var(--border)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                        required
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>
                                        Confirm Password<span style={styles.requiredMark}>*</span>
                                    </label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        placeholder="Confirm Password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        style={styles.input}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = 'var(--primary)';
                                            e.target.style.boxShadow = '0 0 0 2px rgba(74, 15, 26, 0.15)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'var(--border)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={styles.formGrid2}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Reffered By</label>
                                    <input
                                        type="text"
                                        name="refferedBy"
                                        placeholder="Enter Reffered By Name"
                                        value={formData.refferedBy}
                                        onChange={handleChange}
                                        style={styles.input}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = 'var(--primary)';
                                            e.target.style.boxShadow = '0 0 0 2px rgba(74, 15, 26, 0.15)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'var(--border)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ===== CONTACT INFORMATION ===== */}
                        <div style={styles.sectionHeader}>
                            Contact Information
                        </div>
                        <div style={styles.sectionContent}>
                            <div style={styles.formGrid}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Address</label>
                                    <input
                                        type="text"
                                        name="address"
                                        placeholder="Enter Address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        style={styles.input}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = 'var(--primary)';
                                            e.target.style.boxShadow = '0 0 0 2px rgba(74, 15, 26, 0.15)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'var(--border)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        placeholder="Enter city name"
                                        value={formData.city}
                                        onChange={handleChange}
                                        style={styles.input}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = 'var(--primary)';
                                            e.target.style.boxShadow = '0 0 0 2px rgba(74, 15, 26, 0.15)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'var(--border)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>State</label>
                                    <input
                                        type="text"
                                        name="state"
                                        placeholder="Enter state name"
                                        value={formData.state}
                                        onChange={handleChange}
                                        style={styles.input}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = 'var(--primary)';
                                            e.target.style.boxShadow = '0 0 0 2px rgba(74, 15, 26, 0.15)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'var(--border)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={styles.formGrid}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Country</label>
                                    <input
                                        type="text"
                                        name="country"
                                        placeholder="Enter Country Name"
                                        value={formData.country}
                                        onChange={handleChange}
                                        style={styles.input}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = 'var(--primary)';
                                            e.target.style.boxShadow = '0 0 0 2px rgba(74, 15, 26, 0.15)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'var(--border)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Pincode</label>
                                    <input
                                        type="text"
                                        name="pincode"
                                        placeholder="Enter Pincode"
                                        value={formData.pincode}
                                        onChange={handleChange}
                                        style={styles.input}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = 'var(--primary)';
                                            e.target.style.boxShadow = '0 0 0 2px rgba(74, 15, 26, 0.15)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'var(--border)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Remark</label>
                                    <input
                                        type="text"
                                        name="remark"
                                        placeholder="Enter Remark"
                                        value={formData.remark}
                                        onChange={handleChange}
                                        style={styles.input}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = 'var(--primary)';
                                            e.target.style.boxShadow = '0 0 0 2px rgba(74, 15, 26, 0.15)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'var(--border)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ===== DOCUMENTATION ===== */}
                        <div style={styles.sectionHeader}>
                            Documentation
                        </div>
                        <div style={styles.sectionContent}>
                            <div style={styles.formGrid}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Aadhar Number</label>
                                    <input
                                        type="text"
                                        name="aadharNumber"
                                        placeholder=""
                                        value={formData.aadharNumber}
                                        onChange={handleChange}
                                        style={styles.input}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = 'var(--primary)';
                                            e.target.style.boxShadow = '0 0 0 2px rgba(74, 15, 26, 0.15)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'var(--border)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>PAN Number</label>
                                    <input
                                        type="text"
                                        name="panNumber"
                                        placeholder=""
                                        value={formData.panNumber}
                                        onChange={handleChange}
                                        style={styles.input}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = 'var(--primary)';
                                            e.target.style.boxShadow = '0 0 0 2px rgba(74, 15, 26, 0.15)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'var(--border)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>PAN Name</label>
                                    <input
                                        type="text"
                                        name="panName"
                                        placeholder=""
                                        value={formData.panName}
                                        onChange={handleChange}
                                        style={styles.input}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = 'var(--primary)';
                                            e.target.style.boxShadow = '0 0 0 2px rgba(74, 15, 26, 0.15)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'var(--border)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Button Group */}
                        <div style={styles.buttonGroup}>
                            <button
                                type="submit"
                                style={styles.submitBtn}
                                onMouseEnter={(e) => {
                                    e.target.style.background = 'var(--primary-strong)';
                                    e.target.style.borderColor = 'var(--primary-strong)';
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 4px 12px rgba(74, 15, 26, 0.2)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'var(--primary)';
                                    e.target.style.borderColor = 'var(--primary)';
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            >
                                REGISTER
                            </button>
                            <button
                                type="button"
                                style={styles.resetBtn}
                                onClick={handleReset}
                                onMouseEnter={(e) => {
                                    e.target.style.background = 'var(--surface-soft)';
                                    e.target.style.borderColor = 'var(--primary)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'var(--panel)';
                                    e.target.style.borderColor = 'var(--border)';
                                }}
                            >
                                RESET
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

export default AddNewCustomer;

