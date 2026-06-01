import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNextNumericId, useAdminList } from "../../../utils/adminPortalStorage";

const formatEntryDate = (date = new Date()) =>
    date
        .toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        })
        .replace(',', '');

function AddBlogCategory() {
    const navigate = useNavigate();
    const toastTimerRef = useRef(null);
    const [categories, setCategories] = useAdminList('blog-categories', []);
    const [formData, setFormData] = useState({
        categoryName: '',
        categorySlug: '',
        categoryImage: null,
        metaTitle: '',
        metaKeyword: '',
        metaDescription: '',
    });
    const [toast, setToast] = useState(null);

    const showToast = (message, tone = 'info') => {
        if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
        }
        setToast({ message, tone });
        toastTimerRef.current = setTimeout(() => setToast(null), 2400);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        setFormData(prev => ({
            ...prev,
            categoryImage: e.target.files[0]
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.categoryName.trim()) {
            showToast('Category name is required.', 'error');
            return;
        }
        const entryDate = formatEntryDate(new Date());
        const newCategory = {
            id: getNextNumericId(categories, 1),
            entryDate,
            image: formData.categoryImage?.name || '-',
            name: formData.categoryName.trim(),
            status: 'Active',
            slug: formData.categorySlug || '',
            metaTitle: formData.metaTitle || '',
            metaKeyword: formData.metaKeyword || '',
            metaDescription: formData.metaDescription || '',
        };

        setCategories((previous) => [newCategory, ...previous]);
        showToast('Category saved locally.', 'success');
        navigate('/admin/blog-management/blog-category-list');
    };

    const handleReset = () => {
        setFormData({
            categoryName: '',
            categorySlug: '',
            categoryImage: null,
            metaTitle: '',
            metaKeyword: '',
            metaDescription: '',
        });
        showToast('Form reset.', 'info');
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
            marginBottom: '24px',
            gap: '12px',
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
            borderRadius: '14px',
            padding: '28px',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border)',
        },
        formGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
            marginBottom: '20px',
            alignItems: 'flex-start',
        },
        formGridTwoCol: {
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px',
            marginBottom: '20px',
        },
        formGroupSmall: {
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            flex: 1,
        },
        formGroup: {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flex: 1,
        },
        label: {
            fontSize: '0.9rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
        },
        requiredMark: {
            color: 'var(--danger)',
            marginLeft: '4px',
        },
        input: {
            padding: '10px 12px',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            fontSize: '0.9rem',
            outline: 'none',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit',
            background: 'var(--panel)',
            color: 'var(--text-primary)',
        },
        textarea: {
            padding: '10px 12px',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            fontSize: '0.9rem',
            outline: 'none',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit',
            minHeight: '90px',
            resize: 'vertical',
            background: 'var(--panel)',
            color: 'var(--text-primary)',
        },
        fileInputWrapper: {
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
        },
        fileLabel: {
            padding: '8px 12px',
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.85rem',
            transition: 'all 0.2s ease',
            display: 'inline-block',
            whiteSpace: 'nowrap',
            color: 'var(--text-primary)',
        },
        fileInputHidden: {
            display: 'none',
        },
        fileName: {
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
        },
        fileSection: {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
        },
        buttonGroup: {
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid var(--border)',
        },
        submitBtn: {
            padding: '12px 40px',
            background: 'var(--primary)',
            color: '#ffffff',
            border: '1px solid var(--primary)',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            letterSpacing: '1px',
        },
        cancelBtn: {
            padding: '12px 40px',
            background: 'var(--panel)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.95rem',
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
                <div style={styles.header}>
                    <div style={styles.titleWrapper}>
                        <h1 style={styles.titleMain}>Add Blog</h1>
                        <h2 style={styles.titleSub}>Category</h2>
                    </div>
                    <button
                        type="button"
                        style={styles.backBtn}
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
                        onClick={() => navigate('/admin/blog-management/blog-category-list')}
                    >
                        Category List
                    </button>
                </div>

                <div style={styles.formContainer}>
                    <form onSubmit={handleSubmit}>
                        <div style={styles.formGrid}>
                            <div style={styles.formGroupSmall}>
                                <label style={styles.label}>
                                    Category Name
                                    <span style={styles.requiredMark}>*</span>
                                </label>
                                <input
                                    type="text"
                                    name="categoryName"
                                    placeholder="Enter category name"
                                    value={formData.categoryName}
                                    onChange={handleChange}
                                    style={styles.input}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = 'var(--primary)';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(74, 15, 26, 0.15)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = 'var(--border)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                    required
                                />
                            </div>

                            <div style={styles.formGroupSmall}>
                                <label style={styles.label}>Category Slug</label>
                                <input
                                    type="text"
                                    name="categorySlug"
                                    placeholder="category-slug"
                                    value={formData.categorySlug}
                                    onChange={handleChange}
                                    style={styles.input}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = 'var(--primary)';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(74, 15, 26, 0.15)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = 'var(--border)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </div>

                            <div style={styles.fileSection}>
                                <label style={styles.label}>
                                    Category Image
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '4px' }}>[max: 4MB]</span>
                                </label>
                                <div style={styles.fileInputWrapper}>
                                    <label style={styles.fileLabel}>
                                        Choose File
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            style={styles.fileInputHidden}
                                        />
                                    </label>
                                    <span style={styles.fileName}>
                                        {formData.categoryImage ? formData.categoryImage.name : 'No file chosen'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div style={styles.formGridTwoCol}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Meta Title</label>
                                <input
                                    type="text"
                                    name="metaTitle"
                                    placeholder="Enter meta title"
                                    value={formData.metaTitle}
                                    onChange={handleChange}
                                    style={styles.input}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = 'var(--primary)';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(74, 15, 26, 0.15)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = 'var(--border)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Meta Keyword</label>
                                <textarea
                                    name="metaKeyword"
                                    placeholder="Enter meta keyword"
                                    value={formData.metaKeyword}
                                    onChange={handleChange}
                                    style={{ ...styles.textarea, minHeight: '46px' }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = 'var(--primary)';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(74, 15, 26, 0.15)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = 'var(--border)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Meta Description</label>
                            <textarea
                                name="metaDescription"
                                placeholder="Enter meta description"
                                value={formData.metaDescription}
                                onChange={handleChange}
                                style={styles.textarea}
                                onFocus={(e) => {
                                    e.target.style.borderColor = 'var(--primary)';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(74, 15, 26, 0.15)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = 'var(--border)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        <div style={styles.buttonGroup}>
                            <button
                                type="button"
                                style={styles.cancelBtn}
                                onMouseEnter={(e) => {
                                    e.target.style.background = 'var(--surface-soft)';
                                    e.target.style.borderColor = 'var(--primary)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'var(--panel)';
                                    e.target.style.borderColor = 'var(--border)';
                                }}
                                onClick={handleReset}
                            >
                                Reset
                            </button>
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
                                Submit
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

export default AddBlogCategory;
