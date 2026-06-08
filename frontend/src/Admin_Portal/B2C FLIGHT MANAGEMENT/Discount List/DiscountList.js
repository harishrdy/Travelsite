import { useEffect, useMemo, useState } from 'react';
import { FaEdit, FaEye, FaPlus, FaTrashAlt, FaFileExport, FaChevronDown } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './DiscountList.css';

const initialRows = [
  {
    id: 'FLD-1401',
    value: 1200,
    type: 'Fixed',
    entryDate: '12 Mar 2026, 10:20 AM',
    updateDate: '12 Mar 2026, 10:20 AM',
    updatedBy: 'Pick N Book',
    remark: 'Early bird saver fare',
    status: 'Active',
  },
  {
    id: 'FLD-1402',
    value: 10,
    type: 'Percentage',
    entryDate: '13 Mar 2026, 09:10 AM',
    updateDate: '13 Mar 2026, 11:05 AM',
    updatedBy: 'Revenue Desk',
    remark: 'Midweek red-eye deal',
    status: 'Active',
  },
  {
    id: 'FLD-1403',
    value: 1800,
    type: 'Fixed',
    entryDate: '14 Mar 2026, 02:45 PM',
    updateDate: '14 Mar 2026, 03:30 PM',
    updatedBy: 'Admin Team',
    remark: 'Corporate contract fare',
    status: 'Inactive',
  },
  {
    id: 'FLD-1404',
    value: 7,
    type: 'Percentage',
    entryDate: '15 Mar 2026, 08:40 AM',
    updateDate: '15 Mar 2026, 08:40 AM',
    updatedBy: 'Pick N Book',
    remark: 'Student holiday promo',
    status: 'Active',
  },
  {
    id: 'FLD-1405',
    value: 1500,
    type: 'Fixed',
    entryDate: '16 Mar 2026, 12:05 PM',
    updateDate: '16 Mar 2026, 01:10 PM',
    updatedBy: 'Operations',
    remark: 'Weekend getaway boost',
    status: 'Active',
  },
  {
    id: 'FLD-1406',
    value: 5,
    type: 'Percentage',
    entryDate: '17 Mar 2026, 09:55 AM',
    updateDate: '17 Mar 2026, 11:30 AM',
    updatedBy: 'Revenue Desk',
    remark: 'Last seat fill offer',
    status: 'Inactive',
  },
];

const STORAGE_KEY = 'admin_b2c_flight_discounts';

const readStoredRows = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
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
  const [rows, setRows] = useState(() => readStoredRows() || initialRows);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedRow, setSelectedRow] = useState(null);
  const [activeDropdownId, setActiveDropdownId] = useState(null);

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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  }, [rows]);

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
        row.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.remark.toLowerCase().includes(searchTerm.toLowerCase());

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

  const handleDelete = (rowId) => {
    setRows((prev) => prev.filter((row) => row.id !== rowId));
    if (selectedRow?.id === rowId) {
      setSelectedRow(null);
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
