import React, { useRef, useState } from 'react';
import { useAdminList } from "../../../utils/adminPortalStorage";

function DepositRequestList() {
    const toastTimerRef = useRef(null);
    const [depositRequests, setDepositRequests] = useAdminList('customer-deposits', [
        {
            id: 1,
            user: 'CHARAN REDDY (4866)',
            amount: 4000,
            type: 'NEFT',
            status: 'Rejected',
            userRemark: 'traction done',
            adminRemark: 'test',
            entryDate: '12:24 PM , 16 Mar 2026',
            transactionDate: '16 Mar 2026'
        },
        {
            id: 2,
            user: 'Amrutha Reddy (4869)',
            amount: 2500,
            type: 'Cash',
            status: 'Pending',
            userRemark: '-',
            adminRemark: '',
            entryDate: '04:16 PM , 13 Mar 2026',
            transactionDate: '13 Mar 2026'
        },
        {
            id: 3,
            user: 'Madhu Sharma (4693)',
            amount: 2000,
            type: 'Cash',
            status: 'Pending',
            userRemark: 'From Kurnool to Vizag',
            adminRemark: '',
            entryDate: '03:21 PM , 16 Feb 2026',
            transactionDate: '16 Feb 2026'
        }
    ]);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterOpen, setFilterOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState('All');
    const [typeFilter, setTypeFilter] = useState('All');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (message, tone = 'info') => {
        if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
        }
        setToast({ message, tone });
        toastTimerRef.current = setTimeout(() => setToast(null), 2400);
    };

    const filteredRequests = depositRequests
        .filter(request =>
            request.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
            request.userRemark.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .filter(request => (statusFilter === 'All' ? true : request.status === statusFilter))
        .filter(request => (typeFilter === 'All' ? true : request.type === typeFilter))
        .filter(request => (minAmount === '' ? true : request.amount >= Number(minAmount)))
        .filter(request => (maxAmount === '' ? true : request.amount <= Number(maxAmount)));

    const handleClearFilters = () => {
        setSearchQuery('');
        setStatusFilter('All');
        setTypeFilter('All');
        setMinAmount('');
        setMaxAmount('');
        setFilterOpen(false);
        showToast('Filters cleared.', 'info');
    };

    const handleExport = () => {
        const header = [
            'ID',
            'User',
            'Amount',
            'Type',
            'Status',
            'User Remark',
            'Admin Remark',
            'Entry Date',
            'Transaction Date'
        ];
        const rows = filteredRequests.map(r => [
            r.id,
            r.user,
            r.amount,
            r.type,
            r.status,
            r.userRemark,
            r.adminRemark,
            r.entryDate,
            r.transactionDate
        ]);
        const csv = [header, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'deposit-requests.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast('Export completed.', 'success');
    };

    const handleEditRemark = (request) => {
        const nextRemark = window.prompt('Update admin remark', request.adminRemark || '');
        if (nextRemark === null) {
            return;
        }
        setDepositRequests(prev =>
            prev.map(item =>
                item.id === request.id ? { ...item, adminRemark: nextRemark } : item
            )
        );
        showToast('Admin remark updated.', 'success');
    };

    const getNextStatus = (status) => {
        if (status === 'Pending') {
            return 'Approved';
        }
        if (status === 'Approved') {
            return 'Rejected';
        }
        return 'Pending';
    };

    const handleCycleStatus = (request) => {
        const nextStatus = getNextStatus(request.status);
        setDepositRequests(prev =>
            prev.map(item =>
                item.id === request.id ? { ...item, status: nextStatus } : item
            )
        );
        showToast(`Status set to ${nextStatus}.`, 'success');
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Rejected':
                return { background: 'rgba(217, 48, 37, 0.12)', color: 'var(--danger)', border: '1px solid rgba(217, 48, 37, 0.3)' };
            case 'Pending':
                return { background: 'rgba(74, 15, 26, 0.12)', color: 'var(--primary)', border: '1px solid rgba(74, 15, 26, 0.3)' };
            case 'Approved':
                return { background: 'rgba(30, 142, 62, 0.12)', color: 'var(--success)', border: '1px solid rgba(30, 142, 62, 0.3)' };
            default:
                return { background: 'var(--surface-soft)', color: 'var(--text-secondary)', border: '1px solid var(--border)' };
        }
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
            marginBottom: '24px',
            gap: '16px',
            flexWrap: 'wrap',
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
        actions: {
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
        },
        button: {
            padding: '10px 16px',
            borderRadius: '6px',
            border: '1px solid transparent',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.85rem',
        },
        filterBtn: {
            background: 'var(--primary)',
            color: '#ffffff',
            borderColor: 'var(--primary)',
        },
        clearBtn: {
            background: 'var(--panel)',
            color: 'var(--text-primary)',
            borderColor: 'var(--border)',
        },
        exportBtn: {
            background: 'var(--success)',
            color: '#ffffff',
            borderColor: 'var(--success)',
        },
        tableWrapper: {
            background: 'var(--panel)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
            overflowX: 'auto',
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.85rem',
        },
        thead: {
            background: 'linear-gradient(90deg, var(--primary), var(--primary-strong))',
            color: '#ffffff',
            fontWeight: 700,
            position: 'sticky',
            top: 0,
        },
        th: {
            padding: '12px 14px',
            textAlign: 'left',
            borderRight: '1px solid rgba(255, 255, 255, 0.2)',
            whiteSpace: 'nowrap',
        },
        td: {
            padding: '12px 14px',
            borderBottom: '1px solid var(--border)',
            color: 'var(--text-primary)',
        },
        tr: {
            transition: 'background-color 0.2s ease',
        },
        snBadge: {
            fontWeight: 700,
            color: 'var(--primary)',
            minWidth: '30px',
        },
        userCell: {
            fontWeight: 600,
            color: 'var(--text-primary)',
        },
        amountCell: {
            fontWeight: 700,
            color: 'var(--primary)',
        },
        statusBadge: {
            display: 'inline-block',
            padding: '6px 12px',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '0.75rem',
            border: '1px solid',
            cursor: 'pointer',
            background: 'transparent',
            fontFamily: 'inherit',
        },
        actionButtons: {
            display: 'flex',
            gap: '8px',
            flexWrap: 'nowrap',
        },
        actionBtn: {
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid transparent',
            fontWeight: 600,
            fontSize: '0.75rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '36px',
            height: '32px',
        },
        detailsBtn: {
            background: 'var(--surface-soft)',
            color: 'var(--text-primary)',
            borderColor: 'var(--border)',
        },
        editBtn: {
            background: 'var(--surface-soft)',
            color: 'var(--text-primary)',
            borderColor: 'var(--border)',
        },
        emptyState: {
            textAlign: 'center',
            padding: '40px 20px',
            color: 'var(--text-secondary)',
        },
        searchBox: {
            padding: '10px 14px',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '0.85rem',
            width: '200px',
            outline: 'none',
            transition: 'all 0.2s ease',
            background: 'var(--panel)',
            color: 'var(--text-primary)',
        },
        filterPanel: {
            marginTop: '12px',
            padding: '14px',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            background: 'var(--panel)',
            boxShadow: 'var(--shadow-sm)',
            display: 'grid',
            gap: '12px',
        },
        filterRow: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px',
        },
        filterGroup: {
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
        },
        filterLabel: {
            fontSize: '0.8rem',
            fontWeight: 700,
            color: 'var(--text-secondary)',
        },
        filterInput: {
            padding: '8px 10px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--panel)',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            outline: 'none',
        },
        filterSelect: {
            padding: '8px 10px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--panel)',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            outline: 'none',
        },
        detailCard: {
            padding: '16px',
            borderRadius: '14px',
            border: '1px solid var(--border)',
            background: 'var(--panel)',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '16px',
            display: 'grid',
            gap: '12px',
        },
        detailHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        detailTitle: {
            fontWeight: 700,
            color: 'var(--text-primary)',
        },
        detailGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px',
        },
        detailLabel: {
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            fontWeight: 700,
        },
        detailValue: {
            fontSize: '0.9rem',
            color: 'var(--text-primary)',
        },
        secondaryBtn: {
            padding: '6px 10px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--panel)',
            color: 'var(--text-primary)',
            fontWeight: 600,
            cursor: 'pointer',
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
                        <h1 style={styles.titleMain}>Deposit Request</h1>
                        <h2 style={styles.titleSub}>List</h2>
                    </div>
                    <div style={styles.actions}>
                        <input
                            type="text"
                            placeholder="Search requests..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={styles.searchBox}
                            onFocus={(e) => {
                                e.target.style.borderColor = 'var(--primary)';
                                e.target.style.boxShadow = '0 0 0 2px rgba(74, 15, 26, 0.15)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'var(--border)';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                        <button
                            style={{ ...styles.button, ...styles.filterBtn }}
                            onMouseEnter={(e) => {
                                e.target.style.background = 'var(--primary-strong)';
                                e.target.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'var(--primary)';
                                e.target.style.transform = 'translateY(0)';
                            }}
                            onClick={() => setFilterOpen(!filterOpen)}
                        >
                            Filter
                        </button>
                        <button
                            style={{ ...styles.button, ...styles.clearBtn }}
                            onMouseEnter={(e) => {
                                e.target.style.background = 'var(--primary)';
                                e.target.style.color = '#ffffff';
                                e.target.style.borderColor = 'var(--primary)';
                                e.target.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'var(--panel)';
                                e.target.style.color = 'var(--text-primary)';
                                e.target.style.borderColor = 'var(--border)';
                                e.target.style.transform = 'translateY(0)';
                            }}
                            onClick={handleClearFilters}
                        >
                            Clear Filter
                        </button>
                        <button
                            style={{ ...styles.button, ...styles.exportBtn }}
                            onMouseEnter={(e) => {
                                e.target.style.background = 'rgba(30, 142, 62, 0.85)';
                                e.target.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'var(--success)';
                                e.target.style.transform = 'translateY(0)';
                            }}
                            onClick={handleExport}
                        >
                            Export
                        </button>
                    </div>
                </div>

                {filterOpen && (
                    <div style={styles.filterPanel}>
                        <div style={styles.filterRow}>
                            <div style={styles.filterGroup}>
                                <label style={styles.filterLabel}>Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    style={styles.filterSelect}
                                >
                                    <option value="All">All</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>
                            <div style={styles.filterGroup}>
                                <label style={styles.filterLabel}>Type</label>
                                <select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    style={styles.filterSelect}
                                >
                                    <option value="All">All</option>
                                    <option value="Cash">Cash</option>
                                    <option value="NEFT">NEFT</option>
                                </select>
                            </div>
                            <div style={styles.filterGroup}>
                                <label style={styles.filterLabel}>Min Amount</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={minAmount}
                                    onChange={(e) => setMinAmount(e.target.value)}
                                    style={styles.filterInput}
                                    placeholder="0"
                                />
                            </div>
                            <div style={styles.filterGroup}>
                                <label style={styles.filterLabel}>Max Amount</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={maxAmount}
                                    onChange={(e) => setMaxAmount(e.target.value)}
                                    style={styles.filterInput}
                                    placeholder="5000"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {selectedRequest && (
                    <div style={styles.detailCard}>
                        <div style={styles.detailHeader}>
                            <div style={styles.detailTitle}>Request Details</div>
                            <button
                                type="button"
                                style={styles.secondaryBtn}
                                onClick={() => setSelectedRequest(null)}
                            >
                                Close
                            </button>
                        </div>
                        <div style={styles.detailGrid}>
                            <div>
                                <div style={styles.detailLabel}>User</div>
                                <div style={styles.detailValue}>{selectedRequest.user}</div>
                            </div>
                            <div>
                                <div style={styles.detailLabel}>Amount</div>
                                <div style={styles.detailValue}>Rs. {selectedRequest.amount}</div>
                            </div>
                            <div>
                                <div style={styles.detailLabel}>Type</div>
                                <div style={styles.detailValue}>{selectedRequest.type}</div>
                            </div>
                            <div>
                                <div style={styles.detailLabel}>Status</div>
                                <div style={styles.detailValue}>{selectedRequest.status}</div>
                            </div>
                            <div>
                                <div style={styles.detailLabel}>Entry Date</div>
                                <div style={styles.detailValue}>{selectedRequest.entryDate}</div>
                            </div>
                            <div>
                                <div style={styles.detailLabel}>Transaction Date</div>
                                <div style={styles.detailValue}>{selectedRequest.transactionDate}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div style={styles.tableWrapper}>
                    {filteredRequests.length > 0 ? (
                        <table style={styles.table}>
                            <thead style={styles.thead}>
                                <tr>
                                    <th style={styles.th}>SN.</th>
                                    <th style={styles.th}>User</th>
                                    <th style={styles.th}>Amount</th>
                                    <th style={styles.th}>Type</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>User Remark</th>
                                    <th style={styles.th}>Admin Remark</th>
                                    <th style={styles.th}>Entry Date</th>
                                    <th style={styles.th}>Trns. Date</th>
                                    <th style={styles.th}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRequests.map((request, index) => (
                                    <tr
                                        key={request.id}
                                        style={styles.tr}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(74, 15, 26, 0.06)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        <td style={{ ...styles.td, ...styles.snBadge }}>{index + 1}</td>
                                        <td style={{ ...styles.td, ...styles.userCell }}>{request.user}</td>
                                        <td style={{ ...styles.td, ...styles.amountCell }}>Rs. {request.amount}</td>
                                        <td style={styles.td}>{request.type}</td>
                                        <td style={styles.td}>
                                            <button
                                                type="button"
                                                style={{
                                                    ...styles.statusBadge,
                                                    ...getStatusStyle(request.status)
                                                }}
                                                onClick={() => handleCycleStatus(request)}
                                                onMouseEnter={(e) => {
                                                    e.target.style.opacity = '0.8';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.opacity = '1';
                                                }}
                                            >
                                                {request.status}
                                            </button>
                                        </td>
                                        <td style={styles.td}>{request.userRemark}</td>
                                        <td style={styles.td}>{request.adminRemark}</td>
                                        <td style={styles.td}>{request.entryDate}</td>
                                        <td style={styles.td}>{request.transactionDate}</td>
                                        <td style={{ ...styles.td, ...styles.actionButtons }}>
                                            <button
                                                type="button"
                                                style={{ ...styles.actionBtn, ...styles.detailsBtn }}
                                                onMouseEnter={(e) => {
                                                    e.target.style.background = 'rgba(74, 15, 26, 0.12)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.background = 'var(--surface-soft)';
                                                }}
                                                title="View Details"
                                                onClick={() => setSelectedRequest(request)}
                                            >
                                                Details
                                            </button>
                                            <button
                                                type="button"
                                                style={{ ...styles.actionBtn, ...styles.editBtn }}
                                                onMouseEnter={(e) => {
                                                    e.target.style.background = 'rgba(74, 15, 26, 0.18)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.background = 'var(--surface-soft)';
                                                }}
                                                title="Edit"
                                                onClick={() => handleEditRemark(request)}
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div style={styles.emptyState}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '10px' }}>No data</div>
                            <p>No deposit requests found matching "{searchQuery}"</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default DepositRequestList;



