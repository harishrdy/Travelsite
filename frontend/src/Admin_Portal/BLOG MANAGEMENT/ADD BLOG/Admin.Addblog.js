import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getNextNumericId, useAdminList } from "../../../utils/adminPortalStorage";

const DEFAULT_FORM_STATE = {
    title: '',
    slug: '',
    image: null,
    imageName: '',
    category: '',
    subCategory: '',
    addedBy: '',
    subTitle: '',
    featured: 'No',
    isPublished: 'Yes',
    metaTitle: '',
    metaKeyword: '',
    metaDescription: '',
    ogImage: null,
    ogImageName: '',
};

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

const createFormState = (blog) => ({
    ...DEFAULT_FORM_STATE,
    title: blog?.title || '',
    slug: blog?.slug || '',
    imageName: blog?.image || '',
    category: blog?.category || '',
    subCategory: blog?.subCategory || '',
    addedBy: blog?.author || blog?.addedBy || '',
    subTitle: blog?.subTitle || '',
    featured: blog?.featured || 'No',
    isPublished:
        blog?.isPublished ||
        (blog?.status ? (blog.status === 'Inactive' ? 'No' : 'Yes') : 'Yes'),
    metaTitle: blog?.metaTitle || '',
    metaKeyword: blog?.metaKeyword || '',
    metaDescription: blog?.metaDescription || '',
    ogImageName: blog?.ogImage || '',
});

const AddBlogForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { blogId } = useParams();
    const toastTimerRef = useRef(null);
    const [blogs, setBlogs] = useAdminList('blogs', []);
    const editingBlog = useMemo(() => {
        if (location.state?.blog) {
            return location.state.blog;
        }
        if (blogId) {
            return blogs.find((blog) => String(blog.id) === String(blogId)) || null;
        }
        return null;
    }, [blogs, blogId, location.state]);
    const [formData, setFormData] = useState(() => createFormState(editingBlog));
    const [toast, setToast] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const showToast = (message, tone = 'info') => {
        if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
        }
        setToast({ message, tone });
        toastTimerRef.current = setTimeout(() => setToast(null), 2400);
    };

    const isEditing = Boolean(editingBlog);

    useEffect(() => {
        if (editingBlog) {
            setFormData(createFormState(editingBlog));
        }
    }, [editingBlog]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleFileChange = (name, labelField) => (e) => {
        const file = e.target.files?.[0] || null;
        setFormData((prev) => ({
            ...prev,
            [name]: file,
            [labelField]: file?.name || prev[labelField],
        }));
    };

    const buildSlug = (title) =>
        title
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

    const handleGenerateSlug = () => {
        const slug = buildSlug(formData.title);
        setFormData((prev) => ({ ...prev, slug }));
        showToast('Slug generated.', 'info');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            showToast('Title is required.', 'error');
            return;
        }
        if (!formData.category) {
            showToast('Category is required.', 'error');
            return;
        }
        if (!formData.subCategory) {
            showToast('Sub category is required.', 'error');
            return;
        }
        setIsSubmitting(true);
        const now = new Date();
        const slugValue = formData.slug?.trim() ? formData.slug.trim() : buildSlug(formData.title);
        const entryDate = editingBlog?.entryDate || formatEntryDate(now);
        const updatedDate = formatEntryDate(now);

        const nextRecord = {
            id: isEditing ? editingBlog.id : getNextNumericId(blogs, 1),
            title: formData.title.trim(),
            slug: slugValue,
            entryDate,
            updatedDate,
            image: formData.image?.name || formData.imageName || '-',
            category: formData.category,
            subCategory: formData.subCategory,
            status: formData.isPublished === 'Yes' ? 'Active' : 'Inactive',
            author: formData.addedBy || editingBlog?.author || 'Admin',
            subTitle: formData.subTitle || '',
            featured: formData.featured || 'No',
            isPublished: formData.isPublished || 'Yes',
            metaTitle: formData.metaTitle || '',
            metaKeyword: formData.metaKeyword || '',
            metaDescription: formData.metaDescription || '',
            ogImage: formData.ogImage?.name || formData.ogImageName || '',
        };

        if (isEditing) {
            setBlogs((previous) =>
                previous.map((blog) => (blog.id === editingBlog.id ? { ...blog, ...nextRecord } : blog))
            );
            showToast('Blog updated successfully.', 'success');
        } else {
            setBlogs((previous) => [nextRecord, ...previous]);
            showToast('Blog created successfully.', 'success');
        }

        setIsSubmitting(false);
        navigate('/admin/blog-management/blog-list');
    };

    const handleReset = () => {
        setFormData(createFormState(editingBlog));
        showToast(isEditing ? 'Changes reset.' : 'Form reset.', 'info');
    };

    const styles = {
        container: {
            padding: '24px 32px',
            background: 'var(--page-bg)',
            minHeight: '100vh',
        },
        card: {
            background: 'var(--panel)',
            borderRadius: '14px',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            padding: '24px',
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
        listBtn: {
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
        sectionHeader: {
            background: 'linear-gradient(90deg, var(--primary), var(--primary-strong))',
            color: '#ffffff',
            padding: '8px 15px',
            fontWeight: 700,
            borderRadius: '8px',
            marginTop: '24px',
            marginBottom: '16px',
            display: 'inline-block',
        },
        formGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '16px',
        },
        formGroup: {
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
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
        select: {
            padding: '10px 12px',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            fontSize: '0.9rem',
            outline: 'none',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit',
            background: 'var(--panel)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
        },
        textarea: {
            padding: '10px 12px',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            fontSize: '0.9rem',
            outline: 'none',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit',
            minHeight: '80px',
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
        slugRow: {
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
        },
        slugBtn: {
            padding: '10px 12px',
            background: 'var(--surface-soft)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
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
                        <h1 style={styles.titleMain}>{isEditing ? 'Edit' : 'Add'}</h1>
                        <h2 style={styles.titleSub}>Blog</h2>
                    </div>
                    <button
                        type="button"
                        style={styles.listBtn}
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
                        onClick={() => navigate('/admin/blog-management/blog-list')}
                    >
                        Blog List
                    </button>
                </div>

                <div style={styles.card}>
                    <form onSubmit={handleSubmit}>
                        <div style={styles.sectionHeader}>Basic Information</div>
                        <div style={styles.formGrid}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>
                                    Title
                                    <span style={styles.requiredMark}>*</span>
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    placeholder="Enter blog title"
                                    value={formData.title}
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
                                <label style={styles.label}>Slug</label>
                                <div style={styles.slugRow}>
                                    <input
                                        type="text"
                                        name="slug"
                                        placeholder="blog-slug"
                                        value={formData.slug}
                                        onChange={handleChange}
                                        style={{ ...styles.input, flex: 1 }}
                                    />
                                    <button type="button" style={styles.slugBtn} onClick={handleGenerateSlug}>
                                        Generate
                                    </button>
                                </div>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Image [max_size: 1MB]</label>
                                <div style={styles.fileInputWrapper}>
                                    <label style={styles.fileLabel}>
                                        Choose File
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange('image', 'imageName')}
                                            style={styles.fileInputHidden}
                                        />
                                    </label>
                                    <span style={styles.fileName}>
                                        {formData.image?.name || formData.imageName || 'No file chosen'}
                                    </span>
                                </div>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>
                                    Category
                                    <span style={styles.requiredMark}>*</span>
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    style={styles.select}
                                    required
                                >
                                    <option value="">Select Some Options</option>
                                    <option value="Travel">Travel</option>
                                    <option value="Offers">Offers</option>
                                </select>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>
                                    Sub Category
                                    <span style={styles.requiredMark}>*</span>
                                </label>
                                <select
                                    name="subCategory"
                                    value={formData.subCategory}
                                    onChange={handleChange}
                                    style={styles.select}
                                    required
                                >
                                    <option value="">Select Some Options</option>
                                    <option value="Tips">Tips</option>
                                    <option value="Guides">Guides</option>
                                    <option value="Budget">Budget</option>
                                </select>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Added By</label>
                                <input
                                    type="text"
                                    name="addedBy"
                                    placeholder="Added By Name"
                                    value={formData.addedBy}
                                    onChange={handleChange}
                                    style={styles.input}
                                />
                            </div>
                        </div>

                        <div style={styles.sectionHeader}>SEO And Metadata</div>
                        <div style={styles.formGrid}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Sub Title (Optional)</label>
                                <textarea
                                    name="subTitle"
                                    placeholder="Enter sub title"
                                    value={formData.subTitle}
                                    onChange={handleChange}
                                    style={styles.textarea}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Featured</label>
                                <select
                                    name="featured"
                                    value={formData.featured}
                                    onChange={handleChange}
                                    style={styles.select}
                                >
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Published</label>
                                <select
                                    name="isPublished"
                                    value={formData.isPublished}
                                    onChange={handleChange}
                                    style={styles.select}
                                >
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Meta Title</label>
                                <textarea
                                    name="metaTitle"
                                    placeholder="Enter meta title"
                                    value={formData.metaTitle}
                                    onChange={handleChange}
                                    style={styles.textarea}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Meta Keyword</label>
                                <textarea
                                    name="metaKeyword"
                                    placeholder="Enter meta keyword"
                                    value={formData.metaKeyword}
                                    onChange={handleChange}
                                    style={styles.textarea}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Meta Description</label>
                                <textarea
                                    name="metaDescription"
                                    placeholder="Enter meta description"
                                    value={formData.metaDescription}
                                    onChange={handleChange}
                                    style={styles.textarea}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>OG Image [max_size: 1MB]</label>
                                <div style={styles.fileInputWrapper}>
                                    <label style={styles.fileLabel}>
                                        Choose File
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange('ogImage', 'ogImageName')}
                                            style={styles.fileInputHidden}
                                        />
                                    </label>
                                    <span style={styles.fileName}>
                                        {formData.ogImage?.name || formData.ogImageName || 'No file chosen'}
                                    </span>
                                </div>
                            </div>
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
                                disabled={isSubmitting}
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
                                {isSubmitting ? 'Submitting...' : isEditing ? 'Update' : 'Submit'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default AddBlogForm;


