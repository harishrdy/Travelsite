import React, { useMemo, useState } from "react";
import "./AddPage.css";
import { useLocation, useNavigate } from "react-router-dom";
import { getNextNumericId, useAdminList } from "../../../utils/adminPortalStorage";

const DEFAULT_FORM = {
  title: "",
  slug: "",
  status: "Active",
  module: "All",
  metaTitle: "",
  metaKeyword: "",
  metaDescription: "",
  description: "",
  imageName: "",
  bannerName: "",
};

const buildSlug = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const formatStamp = (date = new Date()) =>
  date
    .toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .replace(",", "");

const AddPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pageListPath = "/admin/page-management/pages";

  const editingPage = useMemo(() => location.state?.page || null, [location.state]);
  const [pages, setPages] = useAdminList("cms-pages", []);
  const [formData, setFormData] = useState(() => ({
    ...DEFAULT_FORM,
    title: editingPage?.title || "",
    slug: editingPage?.slug || "",
    status: editingPage?.status || "Active",
    module: editingPage?.module || "All",
    metaTitle: editingPage?.metaTitle || "",
    metaKeyword: editingPage?.metaKeyword || "",
    metaDescription: editingPage?.metaDescription || "",
    description: editingPage?.description || "",
    imageName: editingPage?.imageName || "",
    bannerName: editingPage?.bannerName || "",
  }));
  const [formError, setFormError] = useState("");
  const [saved, setSaved] = useState(false);

  const handleChange = (field) => (event) => {
    setFormData((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const handleFileChange = (field) => (event) => {
    const file = event.target.files?.[0];
    setFormData((previous) => ({ ...previous, [field]: file?.name || "" }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSaved(false);

    const title = String(formData.title || "").trim();
    if (!title) {
      setFormError("Page title is required.");
      return;
    }

    const slug = formData.slug?.trim() ? formData.slug.trim() : buildSlug(title);
    const timestamp = formatStamp(new Date());

    if (editingPage) {
      setPages((previous) =>
        previous.map((page) =>
          page.id === editingPage.id
            ? {
                ...page,
                title,
                slug,
                status: formData.status || "Active",
                module: formData.module || "All",
                updateDate: timestamp,
                metaTitle: formData.metaTitle || "",
                metaKeyword: formData.metaKeyword || "",
                metaDescription: formData.metaDescription || "",
                description: formData.description || "",
                imageName: formData.imageName || "",
                bannerName: formData.bannerName || "",
              }
            : page
        )
      );
    } else {
      const newPage = {
        id: getNextNumericId(pages, 1),
        title,
        slug,
        module: formData.module || "All",
        updateDate: timestamp,
        entryDate: timestamp,
        status: formData.status || "Active",
        metaTitle: formData.metaTitle || "",
        metaKeyword: formData.metaKeyword || "",
        metaDescription: formData.metaDescription || "",
        description: formData.description || "",
        imageName: formData.imageName || "",
        bannerName: formData.bannerName || "",
      };

      setPages((previous) => [newPage, ...previous]);
    }

    setFormError("");
    setSaved(true);
    navigate(pageListPath);
  };

  return (
    <div className="add-container">
      <div className="top-bar">
        <h2>{editingPage ? "Edit Page" : "Add New Page"}</h2>
        <button className="list-btn" onClick={() => navigate(pageListPath)}>
          All Page List
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="section">
          <h3>Basic Details</h3>

          <div className="form-grid">
            <input
              placeholder="Page title"
              value={formData.title}
              onChange={handleChange("title")}
            />
            <input
              placeholder="Page Slug"
              value={formData.slug}
              onChange={handleChange("slug")}
            />
            <input type="file" onChange={handleFileChange("imageName")} />

            <input type="file" onChange={handleFileChange("bannerName")} />
            <select value={formData.status} onChange={handleChange("status")}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <select value={formData.module} onChange={handleChange("module")}>
              <option value="All">All</option>
            </select>
          </div>

          <div className="form-grid">
            <textarea
              placeholder="Meta Title"
              value={formData.metaTitle}
              onChange={handleChange("metaTitle")}
            />
            <textarea
              placeholder="Meta Keyword"
              value={formData.metaKeyword}
              onChange={handleChange("metaKeyword")}
            />
            <textarea
              placeholder="Meta Description"
              value={formData.metaDescription}
              onChange={handleChange("metaDescription")}
            />
          </div>
        </div>

        <div className="section">
          <h3>Description</h3>
          <textarea
            className="editor"
            placeholder="Write description..."
            value={formData.description}
            onChange={handleChange("description")}
          />
        </div>

        {formError && <p className="admin-markup-form-error">{formError}</p>}
        {saved && <p className="menu-form-success">Page saved locally.</p>}

        <div className="submit-area">
          <button type="submit" className="submit-btn">
            {editingPage ? "UPDATE" : "SUBMIT"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPage;
