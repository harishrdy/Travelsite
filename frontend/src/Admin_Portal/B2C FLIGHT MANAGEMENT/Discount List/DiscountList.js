import { useEffect, useMemo, useState } from 'react';
import { FaEdit, FaEye, FaPlus, FaTrashAlt, FaFileExport, FaChevronDown } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './DiscountList.css';
import {
  listFlightDiscounts,
  deleteFlightDiscount,
  listDiscountConditions,
} from '../../../services/flightBookingService';

const mapFromBackendDiscount = (dbRow) => {
  return {
    id: dbRow.id,
    value: dbRow.value,
    type: dbRow.discountType,
    entryDate: dbRow.entryDate || dbRow.createdAt || new Date().toLocaleString(),
    updateDate: dbRow.updateDate || dbRow.updatedAt || new Date().toLocaleString(),
    updatedBy: dbRow.updatedBy || "Admin",
    remark: dbRow.remark || "",
    status: dbRow.status || "Active",
  };
};

const escapeCsvValue = (value) => {
  const safeValue = String(value ?? '');
  if (/[",\n]/.test(safeValue)) {
    return `"${safeValue.replace(/"/g, '""')}"`;
  }
  return safeValue;
};

const renderDateTime = (dateStr) => {
  if (!dateStr) return '--';
  const parts = String(dateStr).split(', ');
  if (parts.length === 2) {
    return (
      <div style={{ whiteSpace: 'nowrap' }}>
        {parts[0]}
        <br />
        <span style={{ fontSize: '11px', color: 'var(--admin-muted)', fontWeight: 'normal' }}>{parts[1]}</span>
      </div>
    );
  }
  return dateStr;
};

function DiscountList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedRow, setSelectedRow] = useState(null);
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  const [selectedConditions, setSelectedConditions] = useState([]);
  const [isLoadingConditions, setIsLoadingConditions] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!event.target.closest('.actions-dropdown-container')) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  const loadDiscounts = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const data = await listFlightDiscounts();
      const mapped = Array.isArray(data) ? data.map(mapFromBackendDiscount) : [];
      setRows(mapped);
    } catch (err) {
      setErrorMessage(err.message || "Failed to load discounts.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDiscounts();
  }, []);

  useEffect(() => {
    if (!selectedRow) {
      setSelectedConditions([]);
      return;
    }
    const loadConditions = async () => {
      setIsLoadingConditions(true);
      try {
        const conditions = await listDiscountConditions(selectedRow.id);
        setSelectedConditions(Array.isArray(conditions) ? conditions : []);
      } catch {
        setSelectedConditions([]);
      } finally {
        setIsLoadingConditions(false);
      }
    };
    loadConditions();
  }, [selectedRow]);

  const filteredDiscounts = useMemo(() => {
    const sorted = [...rows].sort((a, b) => {
      const numA = parseInt(String(a.id).replace(/\D/g, '')) || 0;
      const numB = parseInt(String(b.id).replace(/\D/g, '')) || 0;
      if (numA !== numB) {
        return numB - numA;
      }
      return String(b.id).localeCompare(String(a.id));
    });

    return sorted.filter((row) => {
      const matchesSearch =
        String(row.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(row.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(row.remark || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'All' || row.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [rows, searchTerm, statusFilter]);

  const activeCount = rows.filter((row) => row.status === 'Active').length;
  const inactiveCount = rows.filter((row) => row.status === 'Inactive').length;

  const handleExport = () => {
    const headers = [
      'ID',
      'Value',
      'Discount Type',
      'Entry Date',
      'Update Date',
      'Updated By',
      'Remark',
      'Status',
    ];

    const csvContent = [
      headers,
      ...filteredDiscounts.map((row) => [
        row.id,
        row.value,
        row.type,
        row.entryDate,
        row.updateDate,
        row.updatedBy,
        row.remark,
        row.status,
      ]),
    ]
      .map((row) => row.map(escapeCsvValue).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `b2c-flight-discount-list-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleView = (row) => {
    setSelectedRow(row);
  };

  const handleEdit = (row) => {
    navigate('/admin/b2c-flight/discounts/new', { state: { mode: 'edit', row } });
  };

  const handleDelete = async (rowId) => {
    if (!window.confirm("Are you sure you want to delete this discount?")) {
      return;
    }
    try {
      await deleteFlightDiscount(rowId);
      setRows((prev) => prev.filter((row) => row.id !== rowId));
      if (selectedRow?.id === rowId) {
        setSelectedRow(null);
      }
    } catch (err) {
      alert(err.message || "Failed to delete discount.");
    }
  };

  return (
    <div className="discount-list-page-container">
      <section className="discount-heading">
        <p className="discount-heading-main">B2C Flight Management</p>
        <p className="discount-heading-sub">Discount List</p>
      </section>

      {selectedRow ? (
        <section className="details-panel">
          <div className="details-header">
            <div>
              <p className="details-title">View B2C Flight Discount Details</p>
              <p className="details-subtitle">Basic Details</p>
            </div>
            <div className="details-actions">
              <button type="button" className="ghost-btn" onClick={() => handleEdit(selectedRow)}>
                Edit B2C Discount
              </button>
              <button
                type="button"
                className="primary-btn"
                onClick={() => setSelectedRow(null)}
              >
                B2C Flight Discount List
              </button>
            </div>
          </div>
          <div className="details-grid">
            <div className="details-item">
              <span className="details-label">ID</span>
              <span className="details-value">{selectedRow.id}</span>
            </div>
            <div className="details-item">
              <span className="details-label">Discount Type</span>
              <span className="details-value">{selectedRow.type}</span>
            </div>
            <div className="details-item">
              <span className="details-label">Value</span>
              <span className="details-value">INR {selectedRow.value}</span>
            </div>
            <div className="details-item">
              <span className="details-label">Status</span>
              <span className="details-value">{selectedRow.status}</span>
            </div>
            <div className="details-item">
              <span className="details-label">Entry Date</span>
              <span className="details-value">{selectedRow.entryDate}</span>
            </div>
            <div className="details-item">
              <span className="details-label">Update Date</span>
              <span className="details-value">{selectedRow.updateDate}</span>
            </div>
            <div className="details-item">
              <span className="details-label">Updated By</span>
              <span className="details-value">{selectedRow.updatedBy}</span>
            </div>
            <div className="details-item wide">
              <span className="details-label">Remark</span>
              <span className="details-value">{selectedRow.remark}</span>
            </div>
            <div className="details-item wide">
              <span className="details-label">Eligibility Conditions</span>
              <span className="details-value">
                {isLoadingConditions ? (
                  "Loading eligibility conditions..."
                ) : selectedConditions.length === 0 ? (
                  "No custom eligibility conditions configured (applies to all)."
                ) : (
                  <ul style={{ margin: "5px 0 0 20px", padding: 0 }}>
                    {selectedConditions.map((cond, idx) => (
                      <li key={cond.id || idx}>
                        <strong>{cond.conditionType}</strong> {cond.conditionOperator || "Equals"} <code>{cond.value1}</code>
                        {cond.value2 ? ` - ${cond.value2}` : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </span>
            </div>
          </div>
        </section>
      ) : null}

      <section className="stats-row">
        <div className="stat-card total">
          <div className="stat-label">Total Discounts</div>
          <div className="stat-value">{rows.length}</div>
          <div className="stat-meta">Across all active airlines</div>
        </div>
        <div className="stat-card active">
          <div className="stat-label">Active</div>
          <div className="stat-value">{activeCount}</div>
          <div className="stat-meta">Currently visible to users</div>
        </div>
        <div className="stat-card inactive">
          <div className="stat-label">Inactive</div>
          <div className="stat-value">{inactiveCount}</div>
          <div className="stat-meta">Hidden from checkout</div>
        </div>
      </section>

      <section className="toolbar">
        <div className="toolbar-group">
          <label className="field">
            <span>Search discounts</span>
            <input
              type="text"
              placeholder="Search by ID, type, remark"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
          <label className="field">
            <span>Updated</span>
            <input type="date" />
          </label>
        </div>
        <div className="toolbar-actions">
          <label className="field">
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </label>
          <button type="button" className="primary-btn" onClick={() => navigate('/admin/b2c-flight/discounts/new')}>
            <FaPlus aria-hidden="true" />
            Add B2C Discount
          </button>
          <button type="button" className="primary-btn export-btn" onClick={handleExport}>
            <FaFileExport aria-hidden="true" />
            Export
          </button>
        </div>
      </section>

      <section className="discount-table-wrapper">
        <table className="discount-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Discount Type</th>
              <th>Value</th>
              <th>Status</th>
              <th>Entry Date</th>
              <th>Update Date</th>
              <th>Updated By</th>
              <th>Remark</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDiscounts.length === 0 ? (
              <tr>
                <td colSpan={9} className="empty-cell">
                  No discounts match your filters.
                </td>
              </tr>
            ) : (
              filteredDiscounts.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="id-chip">{row.id}</div>
                  </td>
                  <td>{row.type}</td>
                  <td className="amount-cell">INR {row.value}</td>
                  <td className="status-cell">
                    <span className={`discount-status-pill ${row.status.toLowerCase()}`}>
                      <span className="discount-status-dot" />
                      {row.status}
                    </span>
                  </td>
                  <td>{renderDateTime(row.entryDate)}</td>
                  <td>{renderDateTime(row.updateDate)}</td>
                  <td>{row.updatedBy}</td>
                  <td className="remark-cell">{row.remark}</td>
                  <td>
                    <div className="actions-dropdown-container">
                      <button
                        type="button"
                        className={`actions-trigger-btn ${activeDropdownId === row.id ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdownId(activeDropdownId === row.id ? null : row.id);
                        }}
                      >
                        <span>Actions</span>
                        <FaChevronDown className="chevron-icon" />
                      </button>
                      {activeDropdownId === row.id && (
                        <div className="actions-dropdown-menu">
                          <button
                            type="button"
                            className="dropdown-item view"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleView(row);
                              setActiveDropdownId(null);
                            }}
                          >
                            <FaEye className="item-icon" />
                            <span>View Mapping</span>
                          </button>
                          <button
                            type="button"
                            className="dropdown-item edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(row);
                              setActiveDropdownId(null);
                            }}
                          >
                            <FaEdit className="item-icon" />
                            <span>Edit Discount</span>
                          </button>
                          <button
                            type="button"
                            className="dropdown-item delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(row.id);
                              setActiveDropdownId(null);
                            }}
                          >
                            <FaTrashAlt className="item-icon" />
                            <span>Delete Discount</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default DiscountList;
