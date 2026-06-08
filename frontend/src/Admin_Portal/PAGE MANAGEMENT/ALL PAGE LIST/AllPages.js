import React, { useEffect } from "react";
import "./AllPages.css";
import { useNavigate } from "react-router-dom";
import { useAdminList } from "../../../utils/adminPortalStorage";
import { DEFAULT_CMS_PAGES, ensureCurrentLegalPageContent } from "../../../data/legalPages";

const AllPages = () => {
  const navigate = useNavigate();
  const pageCreatePath = "/admin/page-management/pages/new";

  const [pages, setPages] = useAdminList("cms-pages", DEFAULT_CMS_PAGES);

  useEffect(() => {
    const nextPages = ensureCurrentLegalPageContent(pages);
    if (JSON.stringify(nextPages) !== JSON.stringify(pages)) {
      setPages(nextPages);
    }
  }, [pages, setPages]);

  const handleDelete = (id) => {
    setPages(pages.filter((page) => page.id !== id));
  };

  const handleEdit = (page) => {
    navigate(pageCreatePath, { state: { page } });
  };

  return (
    <div className="page-container">
      <div className="header">
        <h2>All Page <span>List</span></h2>
        <button className="add-btn" onClick={() => navigate(pageCreatePath)}>
          + Add New Page
        </button>
      </div>

      <table className="page-table">
        <thead>
          <tr>
            <th>SN.</th>
            <th>Title</th>
            <th>Slug</th>
            <th>Image</th>
            <th>Module</th>
            <th>Update Date</th>
            <th>Entry Date</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {pages.map((page, index) => (
            <tr key={page.id}>
              <td>{index + 1}</td>
              <td>{page.title}</td>
              <td>{page.slug}</td>
              <td>-</td>
              <td>{page.module}</td>
              <td>{page.updateDate}</td>
              <td>{page.entryDate}</td>
              <td>
                <span className={`status ${page.status === "Inactive" ? "inactive" : "active"}`}>
                  {page.status || "Active"}
                </span>
              </td>
              <td>
                <button className="edit-btn" onClick={() => handleEdit(page)}>✏</button>
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(page.id)}
                >
                  🗑
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AllPages;
