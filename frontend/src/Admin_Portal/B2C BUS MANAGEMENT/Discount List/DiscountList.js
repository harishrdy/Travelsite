import { useEffect, useMemo, useState } from 'react';
import { FaEdit, FaEye, FaPlus, FaTrashAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './DiscountList.css';
import {
  listDiscounts,
  deleteDiscount
} from '../../../services/adminBusService';

const escapeCsvValue = (value) => {
  const safeValue = String(value ?? '');
  if (/[",\n]/.test(safeValue)) {
    return `"${safeValue.replace(/"/g, '""')}"`;
  }
  return safeValue;
};

const formatDate = (dateString) => {
  if (!dateString || dateString === 'N/A') return 'N/A';
  try {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return dateString;
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateString;
  }
};

const toBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  return String(value).trim().toLowerCase() === 'true';
};



function DiscountList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');



  const loadDiscounts = async () => {
    setLoading(true);
    try {
      const data = await listDiscounts();
      const normalized = (data || []).map((item) => ({
        id: item.id || item.discountId || '',
        code: item.code || item.discountCode || '',
        title: item.title || item.name || '',
        description: item.description || '',
        value: Number(item.value) || 0,
        type: item.discountType || item.type || 'Percentage',
        isAutoApply: toBoolean(item.isAutoApply, true),
        isExclusive: toBoolean(item.isExclusive, false),
        priority: Number(item.priority) || 0,
        minBookingAmount: Number(item.minBookingAmount) || 0,
        startDateUtc: item.startDateUtc || item.startDate || null,
        endDateUtc: item.endDateUtc || item.endDate || null,
        entryDate: item.entryDate || item.createdDate || item.createdAt || 'N/A',
        updateDate: item.updateDate || item.updatedDate || item.updatedAt || 'N/A',
        updatedBy: item.updatedBy || 'Pick N Book',
        remark: item.remark || '',
        status: item.status || 'Active',
      }));
      setRows(normalized);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load discounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiscounts();
  }, []);

  const filteredDiscounts = useMemo(() => {
    return rows.filter((row) => {
      const matchesSearch =
        String(row.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(row.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(row.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      'Code',
      'Title',
      'Value',
      'Discount Type',
      'Auto Apply',
      'Exclusive',
      'Priority',
      'Min Booking Amount',
      'Start Date',
      'End Date',
      'Entry Date',
      'Update Date',
      'Updated By',
      'Description',
      'Remark',
      'Status',
    ];

    const csvContent = [
      headers,
      ...filteredDiscounts.map((row) => [
        row.id,
        row.code,
        row.title,
        row.value,
        row.type,
        row.isAutoApply ? 'Yes' : 'No',
        row.isExclusive ? 'Yes' : 'No',
        row.priority,
        row.minBookingAmount,
        formatDate(row.startDateUtc),
        formatDate(row.endDateUtc),
        formatDate(row.entryDate),
        formatDate(row.updateDate),
        row.updatedBy,
        row.description,
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
    link.download = `b2c-bus-discount-list-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleView = (row) => {
    navigate('/admin/b2c-bus/discount-mapping', { state: { discountId: row.id } });
  };

  const handleEdit = (row) => {
    navigate('/admin/b2c-bus/discounts/new', { state: { mode: 'edit', row } });
  };

  const handleDelete = async (rowId) => {
    if (!window.confirm('Are you sure you want to delete this discount?')) {
      return;
    }
    try {
      await deleteDiscount(rowId);
      setRows((prev) => prev.filter((row) => row.id !== rowId));
    } catch (err) {
      alert(err.message || 'Failed to delete discount.');
    }
  };

  return (
    <div className="discount-list-page-container">
      <section className="discount-heading">
        <p className="discount-heading-main">B2C Bus Management</p>
        <p className="discount-heading-sub">Discount List</p>
      </section>

      <section className="stats-row">
        <div className="stat-card total">
          <div className="stat-label">Total Discounts</div>
          <div className="stat-value">{rows.length}</div>
          <div className="stat-meta">Across all active routes</div>
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

      {error && <p className="form-error" style={{ color: 'red', margin: '16px 0' }}>{error}</p>}

      <section className="toolbar">
        <div className="toolbar-group">
          <label className="field">
            <span>Search discounts</span>
            <input
              type="text"
              placeholder="Search by ID, code, title, type, remark"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
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
        </div>
        <div className="toolbar-actions">
          <button type="button" className="primary-btn" onClick={() => navigate('/admin/b2c-bus/discounts/new')}>
            <FaPlus aria-hidden="true" />
            Add B2C Discount
          </button>
          <button type="button" className="ghost-btn" onClick={handleExport}>
            Export
          </button>
        </div>
      </section>

      <section className="discount-table-wrapper">
        <table className="discount-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Discount / Code</th>
              <th>Value</th>
              <th>Apply Rules</th>
              <th>Min Booking</th>
              <th>Validity</th>
              <th>Status</th>
              <th>Updated By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="empty-cell">
                  Loading discounts...
                </td>
              </tr>
            ) : filteredDiscounts.length === 0 ? (
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
                  <td>
                    <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.title || '--'}</div>
                    <small style={{ color: 'var(--admin-muted)', fontSize: '10px' }}>
                      {row.code || '--'} &bull; {row.type}
                    </small>
                  </td>
                  <td className="amount-cell">
                    {row.type === 'Percentage' ? `${row.value}%` : `INR ${row.value}`}
                  </td>
                  <td>
                    <div style={{ fontSize: '11px' }}>{row.isAutoApply ? 'Auto' : 'Manual'}{row.isExclusive ? ' · Excl.' : ''}</div>
                    <small style={{ color: 'var(--admin-muted)', fontSize: '10px' }}>Pri: {row.priority}</small>
                  </td>
                  <td style={{ textAlign: 'right', fontSize: '11px' }}>{row.minBookingAmount ? `INR ${row.minBookingAmount}` : '--'}</td>
                  <td style={{ fontSize: '10px', lineHeight: 1.5 }}>
                    {formatDate(row.startDateUtc)}
                    <br />
                    {formatDate(row.endDateUtc)}
                  </td>
                  <td className="status-cell">
                    <span className={`status-pill ${row.status.toLowerCase()}`}>
                      <span className="status-dot" />
                      {row.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.updatedBy}</td>
                  <td>
                    <div className="table-actions">
                      <button type="button" className="ghost-btn small icon-btn" onClick={() => handleView(row)}>
                        <FaEye aria-hidden="true" />
                        <span className="sr-only">View</span>
                      </button>
                      <button
                        type="button"
                        className="ghost-btn small icon-btn"
                        onClick={() => handleEdit(row)}
                      >
                        <FaEdit aria-hidden="true" />
                        <span className="sr-only">Edit</span>
                      </button>
                      <button type="button" className="danger-btn small icon-btn" onClick={() => handleDelete(row.id)}>
                        <FaTrashAlt aria-hidden="true" />
                        <span className="sr-only">Delete</span>
                      </button>
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
