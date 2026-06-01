import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Search,
    Filter,
    X,
    Download,
    Eye,
    Edit2,
    Trash2,
    Calendar,
    User,
    Tag,
    FileText,
    Image as ImageIcon,
    Check,
    AlertCircle,
} from 'lucide-react';
import { useAdminList } from "../../../utils/adminPortalStorage";

function BlogList() {
    const navigate = useNavigate();
    const toastTimerRef = useRef(null);
    const [blogs, setBlogs] = useAdminList("blogs", [
        {
            id: 1,
            title: 'Why Bus Travel Is Still the Smartest Way To Travel - Book Easily With Pick N Book',
            entryDate: '13 Sep 2025 03:43',
            image: 'bus-travel.jpg',
            category: 'Travel',
            subCategory: 'Tips',
            status: 'Active',
            author: 'Admin',
        },
        {
            id: 2,
            title: 'Comfortable Overnight Bus Trips: A Practical Booking Guide',
            entryDate: '13 Sep 2025 03:35',
            image: 'bus-guide.jpg',
            category: 'Travel',
            subCategory: 'Guides',
            status: 'Active',
            author: 'Editor',
        },
        {
            id: 3,
            title: 'Five Budget Travel Hacks For First Time Bus Travelers',
            entryDate: '12 Sep 2025 10:10',
            image: 'budget-hacks.jpg',
            category: 'Travel',
            subCategory: 'Budget',
            status: 'Inactive',
            author: 'Admin',
        },
    ]);

    const [filterOpen, setFilterOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [subCategoryFilter, setSubCategoryFilter] = useState('All');
    const [selectedBlog, setSelectedBlog] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (message, tone = 'info') => {
        if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
        }
        setToast({ message, tone });
        toastTimerRef.current = setTimeout(() => setToast(null), 2400);
    };

    const categoryOptions = ['All', ...new Set(blogs.map((blog) => blog.category))];
    const subCategoryOptions = ['All', ...new Set(blogs.map((blog) => blog.subCategory))];

    const filteredBlogs = blogs
        .filter(
            (blog) =>
                blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                blog.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                blog.subCategory.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .filter((blog) => (statusFilter === 'All' ? true : blog.status === statusFilter))
        .filter((blog) => (categoryFilter === 'All' ? true : blog.category === categoryFilter))
        .filter((blog) =>
            subCategoryFilter === 'All' ? true : blog.subCategory === subCategoryFilter
        );

    const handleClearFilters = () => {
        setSearchQuery('');
        setStatusFilter('All');
        setCategoryFilter('All');
        setSubCategoryFilter('All');
        setFilterOpen(false);
        showToast('Filters cleared.', 'info');
    };

    const handleExport = () => {
        const header = ['ID', 'Title', 'Entry Date', 'Category', 'Sub Category', 'Status'];
        const rows = filteredBlogs.map((blog) => [
            blog.id,
            blog.title,
            blog.entryDate,
            blog.category,
            blog.subCategory,
            blog.status,
        ]);
        const csv = [header, ...rows].map((row) => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'blog-list.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast('Export completed.', 'success');
    };

    const handleToggleStatus = (id) => {
        setBlogs((prev) =>
            prev.map((blog) =>
                blog.id === id
                    ? { ...blog, status: blog.status === 'Active' ? 'Inactive' : 'Active' }
                    : blog
            )
        );
        showToast('Blog status updated.', 'success');
    };

    const handleEditBlogNavigate = (blog) => {
        navigate(`/admin/blog-management/edit-blog/${blog.id}`, { state: { blog } });
    };

    const handleDeleteBlog = (blog) => {
        const confirmed = window.confirm(`Delete "${blog.title}"?`);
        if (!confirmed) {
            return;
        }
        setBlogs((prev) => prev.filter((item) => item.id !== blog.id));
        showToast('Blog deleted.', 'info');
    };

    const handleViewDetails = (blog) => {
        setSelectedBlog(blog);
        showToast('Showing blog details.', 'info');
    };

    const handleViewAsset = (assetType, assetName) => {
        showToast(`${assetType} "${assetName}" opened.`, 'info');
    };

    const handleAddBlog = () => {
        navigate('/admin/blog-management/add-blog');
    };

    const styles = {
        container: {
            padding: '28px 32px',
            background: 'var(--page-bg)',
            minHeight: '100vh',
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px',
            gap: '16px',
            flexWrap: 'wrap',
        },
        titleWrapper: {
            display: 'flex',
            alignItems: 'baseline',
            gap: '12px',
            borderBottom: '3px solid var(--primary)',
            paddingBottom: '10px',
        },
        titleMain: {
            fontSize: '2.2rem',
            fontWeight: 900,
            color: 'var(--text-primary)',
            margin: 0,
            letterSpacing: '-0.5px',
        },
        titleSub: {
            fontSize: '1.4rem',
            fontWeight: 300,
            color: 'var(--text-secondary)',
            margin: 0,
        },
        actions: {
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            flexWrap: 'wrap',
        },
        button: {
            padding: '11px 18px',
            borderRadius: '10px',
            border: '1px solid transparent',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '0.9rem',
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
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-strong) 100%)',
            color: '#ffffff',
            boxShadow: '0 4px 14px rgba(74, 15, 26, 0.25)',
        },
        exportBtn: {
            background: 'var(--success)',
            color: '#ffffff',
            borderColor: 'var(--success)',
            boxShadow: '0 4px 14px rgba(30, 142, 62, 0.25)',
        },
        searchBox: {
            padding: '11px 16px',
            border: '1.5px solid var(--border)',
            borderRadius: '10px',
            fontSize: '0.9rem',
            width: '220px',
            outline: 'none',
            transition: 'all 0.3s ease',
            background: 'var(--panel)',
            color: 'var(--text-primary)',
        },
        filterPanel: {
            marginTop: '16px',
            padding: '18px',
            borderRadius: '14px',
            border: '1.5px solid var(--border)',
            background: 'var(--panel)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            display: 'grid',
            gap: '14px',
            animation: 'slideDown 0.3s ease',
        },
        filterRow: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
        },
        filterGroup: {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
        },
        filterLabel: {
            fontSize: '0.8rem',
            fontWeight: 800,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
        },
        filterSelect: {
            padding: '10px 12px',
            borderRadius: '10px',
            border: '1.5px solid var(--border)',
            background: 'var(--panel)',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            outline: 'none',
            transition: 'all 0.3s ease',
            fontWeight: 600,
        },
        detailCard: {
            padding: '20px',
            borderRadius: '16px',
            border: '1.5px solid var(--border)',
            background: 'var(--panel)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            marginBottom: '20px',
            display: 'grid',
            gap: '16px',
            animation: 'slideDown 0.3s ease',
        },
        detailHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        detailTitle: {
            fontWeight: 800,
            fontSize: '1.2rem',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
        },
        detailGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
        },
        detailLabel: {
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
        },
        detailValue: {
            fontSize: '0.95rem',
            color: 'var(--text-primary)',
            fontWeight: 600,
            marginTop: '4px',
        },
        secondaryBtn: {
            padding: '8px 14px',
            borderRadius: '10px',
            border: '1.5px solid var(--border)',
            background: 'var(--panel)',
            color: 'var(--text-primary)',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
        },
        tableWrapper: {
            background: 'var(--panel)',
            borderRadius: '16px',
            border: '1.5px solid var(--border)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            overflow: 'hidden',
            overflowX: 'auto',
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.9rem',
        },
        thead: {
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-strong) 100%)',
            color: '#ffffff',
            fontWeight: 800,
            borderBottom: '2px solid var(--primary)',
        },
        th: {
            padding: '16px 18px',
            textAlign: 'left',
            whiteSpace: 'nowrap',
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            fontWeight: 900,
            verticalAlign: 'middle',
            height: '56px',
        },
        td: {
            padding: '16px 18px',
            borderBottom: '1px solid var(--border)',
            color: 'var(--text-primary)',
            verticalAlign: 'middle',
            height: '70px',
        },
        tbody: {
            fontSize: '0.9rem',
        },
        tr: {
            transition: 'background-color 0.2s ease',
            borderBottom: '1px solid var(--border)',
            height: '70px',
        },
        sn: {
            fontWeight: 900,
            color: 'var(--primary)',
            minWidth: '35px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            background: 'rgba(74, 15, 26, 0.08)',
            borderRadius: '8px',
            fontSize: '0.85rem',
        },
        blogTitle: {
            maxWidth: '300px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: '1.5',
            fontSize: '0.9rem',
        },
        viewBtn: {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 12px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.7rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            border: '1.5px solid var(--border)',
            background: 'var(--surface-soft)',
            color: 'var(--text-primary)',
            gap: '0',
            minHeight: '36px',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontWeight: 800,
        },
        statusBadge: {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px 10px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.75rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            border: '1.5px solid',
            gap: '4px',
            minHeight: '32px',
            whiteSpace: 'nowrap',
        },
        statusActive: {
            background: 'rgba(30, 142, 62, 0.15)',
            color: 'var(--success)',
            borderColor: 'rgba(30, 142, 62, 0.35)',
        },
        statusInactive: {
            background: 'rgba(217, 48, 37, 0.15)',
            color: 'var(--danger)',
            borderColor: 'rgba(217, 48, 37, 0.35)',
        },
        actionButtons: {
            display: 'flex',
            gap: '10px',
            flexWrap: 'nowrap',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '160px',
            width: '100%',
        },
        actionColumn: {
            minWidth: '180px',
            textAlign: 'center',
        },
        actionCell: {
            borderBottom: 'none',
            textAlign: 'center',
        },
        actionBtn: {
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            border: '1.5px solid var(--border)',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            background: 'var(--surface-soft)',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            padding: '0',
        },
        deleteBtn: {
            background: 'rgba(217, 48, 37, 0.15)',
            color: 'var(--danger)',
            borderColor: 'rgba(217, 48, 37, 0.35)',
        },
        emptyState: {
            textAlign: 'center',
            padding: '60px 20px',
            color: 'var(--text-secondary)',
        },
        emptyStateIcon: {
            fontSize: '3rem',
            marginBottom: '16px',
            opacity: 0.6,
        },
        toast: {
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1.5px solid var(--border)',
            background: 'var(--panel)',
            color: 'var(--text-primary)',
            fontWeight: 700,
            fontSize: '0.9rem',
            marginBottom: '16px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'slideDown 0.3s ease',
        },
        toastSuccess: {
            borderColor: 'rgba(30, 142, 62, 0.4)',
            background: 'rgba(30, 142, 62, 0.12)',
            color: 'var(--success)',
        },
        toastError: {
            borderColor: 'rgba(217, 48, 37, 0.4)',
            background: 'rgba(217, 48, 37, 0.12)',
            color: 'var(--danger)',
        },
        toastInfo: {
            borderColor: 'rgba(74, 15, 26, 0.3)',
            background: 'rgba(74, 15, 26, 0.1)',
            color: 'var(--primary)',
        },
    };

    const getStatusStyle = (status) => ({
        ...styles.statusBadge,
        ...(status === 'Active' ? styles.statusActive : styles.statusInactive),
    });

    const getToastStyle = () => ({
        ...styles.toast,
        ...(toast?.tone === 'success'
            ? styles.toastSuccess
            : toast?.tone === 'error'
                ? styles.toastError
                : styles.toastInfo),
    });

    const getToastIcon = () => {
        if (toast?.tone === 'success') return <Check size={18} />;
        if (toast?.tone === 'error') return <AlertCircle size={18} />;
        return <AlertCircle size={18} />;
    };

    return (
        <>
            <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        tbody tr:hover {
          background-color: rgba(74, 15, 26, 0.04) !important;
        }
        
        input:focus {
          border-color: var(--primary) !important;
          box-shadow: 0 0 0 3px rgba(74, 15, 26, 0.1) !important;
        }
        
        select:focus {
          border-color: var(--primary) !important;
          box-shadow: 0 0 0 3px rgba(74, 15, 26, 0.1) !important;
        }
        
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        table {
          table-layout: auto;
        }

        thead tr {
          display: table-row;
        }

        tbody tr {
          display: table-row;
        }

        td, th {
          box-sizing: border-box;
        }
      `}</style>

            <div style={styles.container}>
                {toast && (
                    <div style={getToastStyle()}>
                        {getToastIcon()}
                        <span>{toast.message}</span>
                    </div>
                )}

                <div style={styles.header}>
                    <div style={styles.titleWrapper}>
                        <h1 style={styles.titleMain}>Blog</h1>
                        <h2 style={styles.titleSub}>Management</h2>
                    </div>
                    <div style={styles.actions}>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <Search
                                size={18}
                                style={{
                                    position: 'absolute',
                                    left: '12px',
                                    color: 'var(--text-secondary)',
                                    pointerEvents: 'none',
                                }}
                            />
                            <input
                                type="text"
                                placeholder="Search blogs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    ...styles.searchBox,
                                    paddingLeft: '38px',
                                }}
                            />
                        </div>

                        <button
                            type="button"
                            style={{ ...styles.button, ...styles.filterBtn }}
                            onMouseEnter={(e) => {
                                e.target.style.background = 'var(--primary-strong)';
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 6px 20px rgba(74, 15, 26, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'var(--primary)';
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = 'none';
                            }}
                            onClick={() => setFilterOpen(!filterOpen)}
                        >
                            <Filter size={18} />
                            Filter
                        </button>

                        <button
                            type="button"
                            style={{ ...styles.button, ...styles.clearBtn }}
                            onMouseEnter={(e) => {
                                e.target.style.background = 'rgba(74, 15, 26, 0.1)';
                                e.target.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'var(--panel)';
                                e.target.style.transform = 'translateY(0)';
                            }}
                            onClick={handleClearFilters}
                        >
                            <X size={18} />
                            Clear
                        </button>

                        <button
                            type="button"
                            style={{ ...styles.button, ...styles.exportBtn }}
                            onMouseEnter={(e) => {
                                e.target.style.background = 'rgba(30, 142, 62, 0.9)';
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 6px 20px rgba(30, 142, 62, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'var(--success)';
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 14px rgba(30, 142, 62, 0.25)';
                            }}
                            onClick={handleExport}
                        >
                            <Download size={18} />
                            Export
                        </button>

                        <button
                            type="button"
                            style={{ ...styles.button, ...styles.addBtn }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 8px 24px rgba(74, 15, 26, 0.35)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 14px rgba(74, 15, 26, 0.25)';
                            }}
                            onClick={handleAddBlog}
                        >
                            <Plus size={20} strokeWidth={3} />
                            Add Blog
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
                                    {categoryOptions.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div style={styles.filterGroup}>
                                <label style={styles.filterLabel}>Sub Category</label>
                                <select
                                    value={subCategoryFilter}
                                    onChange={(e) => setSubCategoryFilter(e.target.value)}
                                    style={styles.filterSelect}
                                >
                                    {subCategoryOptions.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {selectedBlog && (
                    <div style={styles.detailCard}>
                        <div style={styles.detailHeader}>
                            <div style={styles.detailTitle}>
                                <FileText size={22} />
                                Blog Details
                            </div>
                            <button
                                type="button"
                                style={styles.secondaryBtn}
                                onMouseEnter={(e) => {
                                    e.target.style.background = 'rgba(74, 15, 26, 0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'var(--panel)';
                                }}
                                onClick={() => setSelectedBlog(null)}
                            >
                                <X size={16} />
                                Close
                            </button>
                        </div>
                        <div style={styles.detailGrid}>
                            <div>
                                <div style={styles.detailLabel}>
                                    <FileText size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                    Title
                                </div>
                                <div style={styles.detailValue}>{selectedBlog.title}</div>
                            </div>
                            <div>
                                <div style={styles.detailLabel}>
                                    <Tag size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                    Category
                                </div>
                                <div style={styles.detailValue}>{selectedBlog.category}</div>
                            </div>
                            <div>
                                <div style={styles.detailLabel}>
                                    <Tag size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                    Sub Category
                                </div>
                                <div style={styles.detailValue}>{selectedBlog.subCategory}</div>
                            </div>
                            <div>
                                <div style={styles.detailLabel}>
                                    <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                    Entry Date
                                </div>
                                <div style={styles.detailValue}>{selectedBlog.entryDate}</div>
                            </div>
                            <div>
                                <div style={styles.detailLabel}>
                                    <User size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                    Author
                                </div>
                                <div style={styles.detailValue}>{selectedBlog.author}</div>
                            </div>
                            <div>
                                <div style={styles.detailLabel}>Status</div>
                                <div style={getStatusStyle(selectedBlog.status)}>
                                    {selectedBlog.status === 'Active' ? (
                                        <Check size={14} />
                                    ) : (
                                        <AlertCircle size={14} />
                                    )}
                                    {selectedBlog.status}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div style={styles.tableWrapper}>
                    {filteredBlogs.length > 0 ? (
                        <table style={styles.table}>
                            <thead style={styles.thead}>
                                <tr>
                                    <th style={styles.th}>SN.</th>
                                    <th style={styles.th}>Title</th>
                                    <th style={styles.th}>Entry Date</th>
                                    <th style={styles.th}>Image</th>
                                    <th style={styles.th}>Category</th>
                                    <th style={styles.th}>Sub Category</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={{ ...styles.th, ...styles.actionColumn }}>Action</th>
                                </tr>
                            </thead>
                            <tbody style={styles.tbody}>
                                {filteredBlogs.map((blog, index) => (
                                    <tr key={blog.id} style={styles.tr}>
                                        <td style={styles.td}>
                                            <span style={styles.sn}>{index + 1}</span>
                                        </td>
                                        <td style={{ ...styles.td, ...styles.blogTitle }}>{blog.title}</td>
                                        <td style={styles.td}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {/* < size={14} style={{ opacity: 0.7, flexShrink: 0 }} /> */}
                                                <span>{blog.entryDate}</span>
                                            </div>
                                        </td>
                                        <td style={styles.td}>
                                            <button
                                                type="button"
                                                style={styles.viewBtn}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'rgba(74, 15, 26, 0.15)';
                                                    e.currentTarget.style.borderColor = 'var(--primary)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'var(--surface-soft)';
                                                    e.currentTarget.style.borderColor = 'var(--border)';
                                                }}
                                                onClick={() => handleViewAsset('Image', blog.image)}
                                            >
                                                View
                                            </button>
                                        </td>
                                        <td style={styles.td}>
                                            <button
                                                type="button"
                                                style={styles.viewBtn}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'rgba(74, 15, 26, 0.15)';
                                                    e.currentTarget.style.borderColor = 'var(--primary)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'var(--surface-soft)';
                                                    e.currentTarget.style.borderColor = 'var(--border)';
                                                }}
                                                onClick={() => handleViewAsset('Category', blog.category)}
                                            >
                                                View
                                            </button>
                                        </td>
                                        <td style={styles.td}>
                                            <button
                                                type="button"
                                                style={styles.viewBtn}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'rgba(74, 15, 26, 0.15)';
                                                    e.currentTarget.style.borderColor = 'var(--primary)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'var(--surface-soft)';
                                                    e.currentTarget.style.borderColor = 'var(--border)';
                                                }}
                                                onClick={() => handleViewAsset('Sub Category', blog.subCategory)}
                                            >
                                                View
                                            </button>
                                        </td>
                                        <td style={styles.td}>
                                            <button
                                                type="button"
                                                style={getStatusStyle(blog.status)}
                                                onMouseEnter={(e) => {
                                                    e.target.style.opacity = '0.85';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.opacity = '1';
                                                }}
                                                onClick={() => handleToggleStatus(blog.id)}
                                            >
                                                {blog.status === 'Active' ? (
                                                    <Check size={12} />
                                                ) : (
                                                    <AlertCircle size={12} />
                                                )}
                                                {blog.status}
                                            </button>
                                        </td>
                                        <td
                                            style={{
                                                ...styles.td,
                                                ...styles.actionColumn,
                                                ...styles.actionCell,
                                            }}
                                        >
                                            <div style={styles.actionButtons}>
                                                <button
                                                    type="button"
                                                    style={styles.actionBtn}
                                                    title="View Details"
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = 'rgba(74, 15, 26, 0.15)';
                                                        e.currentTarget.style.borderColor = 'var(--primary)';
                                                        e.currentTarget.style.transform = 'scale(1.08)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = 'var(--surface-soft)';
                                                        e.currentTarget.style.borderColor = 'var(--border)';
                                                        e.currentTarget.style.transform = 'scale(1)';
                                                    }}
                                                    onClick={() => handleViewDetails(blog)}
                                                >
                                                    <Eye size={20} strokeWidth={2} />
                                                </button>
                                                <button
                                                    type="button"
                                                    style={styles.actionBtn}
                                                    title="Edit Blog"
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = 'rgba(74, 15, 26, 0.15)';
                                                        e.currentTarget.style.borderColor = 'var(--primary)';
                                                        e.currentTarget.style.transform = 'scale(1.08)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = 'var(--surface-soft)';
                                                        e.currentTarget.style.borderColor = 'var(--border)';
                                                        e.currentTarget.style.transform = 'scale(1)';
                                                    }}
                                                    onClick={() => handleEditBlogNavigate(blog)}
                                                >
                                                    <Edit2 size={20} strokeWidth={2} />
                                                </button>
                                                <button
                                                    type="button"
                                                    style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                                                    title="Delete Blog"
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = 'rgba(217, 48, 37, 0.22)';
                                                        e.currentTarget.style.borderColor = 'var(--danger)';
                                                        e.currentTarget.style.transform = 'scale(1.08)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = 'rgba(217, 48, 37, 0.15)';
                                                        e.currentTarget.style.borderColor = 'rgba(217, 48, 37, 0.35)';
                                                        e.currentTarget.style.transform = 'scale(1)';
                                                    }}
                                                    onClick={() => handleDeleteBlog(blog)}
                                                >
                                                    <Trash2 size={20} strokeWidth={2} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div style={styles.emptyState}>
                            <div style={styles.emptyStateIcon}>
                                <FileText size={64} style={{ opacity: 0.5 }} />
                            </div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>
                                No blogs found
                            </div>
                            <p style={{ margin: 0, opacity: 0.8 }}>
                                {searchQuery
                                    ? `No blogs match "${searchQuery}"`
                                    : 'Start by adding your first blog post'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default BlogList
