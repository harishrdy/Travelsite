import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminList } from "../../../utils/adminPortalStorage";

function BlogSubCategoryList() {
    const navigate = useNavigate();
    const toastTimerRef = useRef(null);
    const [subCategories, setSubCategories] = useAdminList('blog-subcategories', [
        {
            id: 1,
            entryDate: '13 Sep 2025 03:34',
            image: 'honeymoon.jpg',
            name: 'Honeymoon',
            category: 'Travel',
            status: 'Active'
        },
        {
            id: 2,
            entryDate: '13 Sep 2025 03:34',
            image: '-',
            name: 'Family Holidays',
            category: 'Travel',
            status: 'Active'
        },
        {
            id: 3,
            entryDate: '12 Sep 2025 09:05',
            image: '-',
            name: 'Seasonal Offers',
            category: 'Offers',
            status: 'Inactive'
        }
    ]);

    const [filterOpen, setFilterOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [selectedSubCategory, setSelectedSubCategory] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (message, tone = 'info') => {
        if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
        }
        setToast({ message, tone });
        toastTimerRef.current = setTimeout(() => setToast(null), 2400);
    };

    const categoryOptions = ['All', ...new Set(subCategories.map(item => item.category))];

    const filteredSubCategories = subCategories
        .filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .filter(item => (statusFilter === 'All' ? true : item.status === statusFilter))
        .filter(item => (categoryFilter === 'All' ? true : item.category === categoryFilter));

    const handleClearFilters = () => {
        setSearchQuery('');
        setStatusFilter('All');
        setCategoryFilter('All');
        setFilterOpen(false);
        showToast('Filters cleared.', 'info');
    };

    const handleExport = () => {
        const header = ['ID', 'Name', 'Entry Date', 'Category', 'Status'];
        const rows = filteredSubCategories.map(item => [
            item.id,
            item.name,
            item.entryDate,
            item.category,
            item.status
        ]);
        const csv = [header, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'blog-sub-category-list.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast('Export completed.', 'success');
    };

    const handleToggleStatus = (id) => {
        setSubCategories(prev =>
            prev.map(item =>
                item.id === id
                    ? { ...item, status: item.status === 'Active' ? 'Inactive' : 'Active' }
                    : item
            )
        );
        showToast('Sub category status updated.', 'success');
    };

    const handleEditSubCategory = (item) => {
        const nextName = window.prompt('Update sub category name', item.name);
        if (nextName === null) {
            return;
        }
        if (!nextName.trim()) {
            showToast('Sub category name cannot be empty.', 'error');
            return;
        }
        setSubCategories(prev => prev.map(row => (row.id === item.id ? { ...row, name: nextName } : row)));
        showToast('Sub category updated.', 'success');
    };

    const handleDeleteSubCategory = (item) => {
        const confirmed = window.confirm(`Delete "${item.name}"?`);
        if (!confirmed) {
            return;
        }
        setSubCategories(prev => prev.filter(row => row.id !== item.id));
        showToast('Sub category deleted.', 'info');
    };

    const handleViewDetails = (item) => {
        setSelectedSubCategory(item);
        showToast('Showing sub category details.', 'info');
    };

    const handleAddSubCategory = () => {
        navigate('/admin/blog-management/add-blog-sub-category');
    };

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
            marginBottom: '20px',
            gap: '16px',
            flexWrap: 'wrap',
        },
        titleWrapper: {
            display: 'flex',
            alignItems: 'baseline',
            gap: '8px',
            borderBottom: '3px solid var(--primary)',
            paddingBottom: '8px',
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
            flexWrap: 'wrap',
        },
        button: {
            padding: '10px 16px',
            borderRadius: '8px',
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
        addBtn: {
            background: 'linear-gradient(135deg, var(--primary), var(--primary-strong))',
            color: '#ffffff',
        },
        exportBtn: {
            background: 'var(--success)',
            color: '#ffffff',
            borderColor: 'var(--success)',
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
        tableWrapper: {
            background: 'var(--panel)',
            borderRadius: '14px',
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
        sn: {
            fontWeight: 700,
            color: 'var(--primary)',
            minWidth: '40px',
        },
        badge: {
            display: 'inline-flex',
            alignItems: 'center',
            padding: '6px 10px',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '0.75rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            border: '1px solid var(--border)',
            background: 'var(--surface-soft)',
            color: 'var(--text-primary)',
        },
        statusBadge: {
            display: 'inline-flex',
            alignItems: 'center',
            padding: '6px 10px',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '0.75rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            border: '1px solid',
        },
        statusActive: {
            background: 'rgba(30, 142, 62, 0.12)',
            color: 'var(--success)',
            borderColor: 'rgba(30, 142, 62, 0.3)',
        },
        statusInactive: {
            background: 'rgba(217, 48, 37, 0.12)',
            color: 'var(--danger)',
            borderColor: 'rgba(217, 48, 37, 0.3)',
        },
        actionButtons: {
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
        },
        actionBtn: {
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid transparent',
            fontWeight: 600,
            fontSize: '0.75rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: 'var(--surface-soft)',
            color: 'var(--text-primary)',
        },
        deleteBtn: {
            background: 'rgba(217, 48, 37, 0.12)',
            color: 'var(--danger)',
            borderColor: 'rgba(217, 48, 37, 0.3)',
        },
        emptyState: {
            textAlign: 'center',
            padding: '40px 20px',
            color: 'var(--text-secondary)',
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

    const getStatusStyle = (status) => ({
        ...styles.statusBadge,
        ...(status === 'Active' ? styles.statusActive : styles.statusInactive),
    });

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
                <div style={styles.header}>
                    <div style={styles.titleWrapper}>
                        <h1 style={styles.titleMain}>Blog Sub Category</h1>
                        <h2 style={styles.titleSub}>List</h2>
                    </div>
                    <div style={styles.actions}>
                        <input
                            type="text"
                            placeholder="Search sub categories..."
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
                            type="button"
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
                            type="button"
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
                            type="button"
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
                        <button
                            type="button"
                            style={{ ...styles.button, ...styles.addBtn }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 4px 12px rgba(74, 15, 26, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = 'none';
                            }}
                            onClick={handleAddSubCategory}
                        >
                            Add Sub Category
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
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                            <div style={styles.filterGroup}>
                                <label style={styles.filterLabel}>Category</label>
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    style={styles.filterSelect}
                                >
                                    {categoryOptions.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {selectedSubCategory && (
                    <div style={styles.detailCard}>
                        <div style={styles.detailHeader}>
                            <div style={styles.detailTitle}>Sub Category Details</div>
                            <button
                                type="button"
                                style={styles.secondaryBtn}
                                onClick={() => setSelectedSubCategory(null)}
                            >
                                Close
                            </button>
                        </div>
                        <div style={styles.detailGrid}>
                            <div>
                                <div style={styles.detailLabel}>Name</div>
                                <div style={styles.detailValue}>{selectedSubCategory.name}</div>
                            </div>
                            <div>
                                <div style={styles.detailLabel}>Category</div>
                                <div style={styles.detailValue}>{selectedSubCategory.category}</div>
                            </div>
                            <div>
                                <div style={styles.detailLabel}>Entry Date</div>
                                <div style={styles.detailValue}>{selectedSubCategory.entryDate}</div>
                            </div>
                            <div>
                                <div style={styles.detailLabel}>Status</div>
                                <div style={styles.detailValue}>{selectedSubCategory.status}</div>
                            </div>
                        </div>
                    </div>
                )}

                <div style={styles.tableWrapper}>
                    {filteredSubCategories.length > 0 ? (
                        <table style={styles.table}>
                            <thead style={styles.thead}>
                                <tr>
                                    <th style={styles.th}>SN.</th>
                                    <th style={styles.th}>Entry Date</th>
                                    <th style={styles.th}>Image</th>
                                    <th style={styles.th}>Name</th>
                                    <th style={styles.th}>Category</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSubCategories.map((item, index) => (
                                    <tr
                                        key={item.id}
                                        style={styles.tr}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(74, 15, 26, 0.06)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        <td style={styles.td}><span style={styles.sn}>{index + 1}</span></td>
                                        <td style={styles.td}>{item.entryDate}</td>
                                        <td style={styles.td}>
                                            <button
                                                type="button"
                                                style={styles.badge}
                                                onClick={() => handleViewDetails(item)}
                                            >
                                                {item.image}
                                            </button>
                                        </td>
                                        <td style={styles.td}>{item.name}</td>
                                        <td style={styles.td}>
                                            <button
                                                type="button"
                                                style={styles.badge}
                                                onClick={() => handleViewDetails(item)}
                                            >
                                                {item.category}
                                            </button>
                                        </td>
                                        <td style={styles.td}>
                                            <button
                                                type="button"
                                                style={getStatusStyle(item.status)}
                                                onClick={() => handleToggleStatus(item.id)}
                                                onMouseEnter={(e) => {
                                                    e.target.style.opacity = '0.85';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.opacity = '1';
                                                }}
                                            >
                                                {item.status}
                                            </button>
                                        </td>
                                        <td style={{ ...styles.td, ...styles.actionButtons }}>
                                            <button
                                                type="button"
                                                style={styles.actionBtn}
                                                onMouseEnter={(e) => {
                                                    e.target.style.background = 'rgba(74, 15, 26, 0.12)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.background = 'var(--surface-soft)';
                                                }}
                                                onClick={() => handleViewDetails(item)}
                                            >
                                                Details
                                            </button>
                                            <button
                                                type="button"
                                                style={styles.actionBtn}
                                                onMouseEnter={(e) => {
                                                    e.target.style.background = 'rgba(74, 15, 26, 0.12)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.background = 'var(--surface-soft)';
                                                }}
                                                onClick={() => handleEditSubCategory(item)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                                                onMouseEnter={(e) => {
                                                    e.target.style.background = 'rgba(217, 48, 37, 0.2)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.background = 'rgba(217, 48, 37, 0.12)';
                                                }}
                                                onClick={() => handleDeleteSubCategory(item)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div style={styles.emptyState}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '10px' }}>No data</div>
                            <p>No sub categories found matching "{searchQuery}"</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default BlogSubCategoryList;
