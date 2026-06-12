import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './AddB2CFlightDiscount.css';
import {
  createFlightDiscount,
  updateFlightDiscount,
  addDiscountCondition,
  listDiscountConditions,
  deleteDiscountCondition,
} from '../../../services/flightBookingService';

const DEFAULT_FORM = {
  discountType: 'Percentage',
  value: '',
  status: 'Active',
  remark: '',
};

function buildInitialForm(row) {
  if (!row) {
    return DEFAULT_FORM;
  }

  return {
    discountType: row.type || row.discountType || 'Percentage',
    value: row.value !== undefined && row.value !== null ? String(row.value) : '',
    status: row.status || 'Active',
    remark: row.remark || '',
  };
}

export default function AddB2CFlightDiscount() {
  const navigate = useNavigate();
  const location = useLocation();
  const editingRow = useMemo(() => location.state?.row || null, [location.state]);

  const [formValues, setFormValues] = useState(() => buildInitialForm(editingRow));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Conditions state (only for edit mode)
  const [conditions, setConditions] = useState([]);
  const [isLoadingConditions, setIsLoadingConditions] = useState(false);
  const [conditionForm, setConditionForm] = useState({
    conditionType: 'Airline',
    operator: 'Equals',
    value1: '',
  });
  const [conditionError, setConditionError] = useState('');

  const loadConditions = async () => {
    if (!editingRow) return;
    setIsLoadingConditions(true);
    try {
      const data = await listDiscountConditions(editingRow.id);
      setConditions(Array.isArray(data) ? data : []);
    } catch {
      setConditions([]);
    } finally {
      setIsLoadingConditions(false);
    }
  };

  useEffect(() => {
    if (editingRow) {
      loadConditions();
    }
  }, [editingRow]);

  const handleChange = (field) => (event) => {
    setFormValues((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const val = Number(formValues.value);
    if (Number.isNaN(val) || val <= 0) {
      setError('Please enter a valid value greater than 0.');
      return;
    }

    if (formValues.discountType === 'Percentage' && val > 100) {
      setError('Percentage value must be between 0 and 100.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        discountType: formValues.discountType,
        value: val,
        status: formValues.status,
        updatedBy: 'AdminUser',
        remark: String(formValues.remark || '').trim(),
      };

      if (editingRow) {
        await updateFlightDiscount(editingRow.id, payload);
      } else {
        await createFlightDiscount(payload);
      }

      navigate('/admin/b2c-flight/discounts');
    } catch (err) {
      setError(err.message || 'Failed to save discount.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCondition = async (e) => {
    e.preventDefault();
    setConditionError('');

    if (!conditionForm.value1.trim()) {
      setConditionError('Condition value is required.');
      return;
    }

    try {
      const payload = {
        conditionType: conditionForm.conditionType,
        conditionOperator: conditionForm.operator,
        value1: conditionForm.value1.trim(),
        value2: null,
      };

      await addDiscountCondition(editingRow.id, payload);
      setConditionForm((prev) => ({ ...prev, value1: '' }));
      loadConditions();
    } catch (err) {
      setConditionError(err.message || 'Failed to add condition.');
    }
  };

  const handleDeleteCondition = async (conditionId) => {
    if (!window.confirm('Are you sure you want to delete this condition?')) {
      return;
    }
    try {
      await deleteDiscountCondition(conditionId);
      loadConditions();
    } catch (err) {
      alert(err.message || 'Failed to delete condition.');
    }
  };

  const handleReset = () => {
    setFormValues(buildInitialForm(editingRow));
    setError('');
  };

  return (
    <div className="admin-b2c-page">
      <section className="add-discount-card">
        <header className="add-discount-header">
          <div>
            <p className="add-discount-title">{editingRow ? 'Edit B2C Flight Discount' : 'Add B2C Flight Discount'}</p>
            <p className="add-discount-subtitle">Configure pricing rules and custom user eligibility conditions.</p>
          </div>
          <button type="button" className="ghost-btn" onClick={() => navigate('/admin/b2c-flight/discounts')}>
            B2C Flight Discount List
          </button>
        </header>

        <form className="add-discount-form" onSubmit={handleSubmit}>
          <label className="add-field">
            <span>Discount Type</span>
            <select
              value={formValues.discountType}
              onChange={handleChange('discountType')}
              disabled={submitting}
            >
              <option value="Percentage">Percentage</option>
              <option value="Fixed">Fixed</option>
            </select>
          </label>

          <label className="add-field">
            <span>Value</span>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={formValues.value}
              onChange={handleChange('value')}
              disabled={submitting}
            />
          </label>

          <label className="add-field">
            <span>Status</span>
            <select
              value={formValues.status}
              onChange={handleChange('status')}
              disabled={submitting}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </label>

          <label className="add-field add-field-medium">
            <span>Remark / Description</span>
            <textarea
              placeholder="E.g., Monsoon Saver Fare"
              value={formValues.remark}
              onChange={handleChange('remark')}
              disabled={submitting}
              rows={2}
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <div className="form-actions">
            <button type="submit" className="primary-btn" disabled={submitting}>
              {submitting ? 'Saving...' : 'Submit'}
            </button>
            <button type="button" className="ghost-btn" onClick={handleReset} disabled={submitting}>
              Reset
            </button>
          </div>
        </form>
      </section>

      {editingRow && (
        <section className="add-discount-card" style={{ marginTop: '24px' }}>
          <header className="add-discount-header">
            <div>
              <p className="add-discount-title">Eligibility Conditions</p>
              <p className="add-discount-subtitle">Restricts this discount to specific Airlines, Cabin Classes, etc. (Applies to all if empty)</p>
            </div>
          </header>

          <div className="conditions-section">
            <form className="add-condition-form" onSubmit={handleAddCondition}>
              <label className="add-field">
                <span>Condition Type</span>
                <select
                  value={conditionForm.conditionType}
                  onChange={(e) => setConditionForm((prev) => ({ ...prev, conditionType: e.target.value }))}
                >
                  <option value="Airline">Airline (e.g. AI, 6E)</option>
                  <option value="TravelClass">Travel Class (e.g. Economy, Business)</option>
                  <option value="TripType">Trip Type (OneWay, RoundTrip)</option>
                  <option value="PassengerCount">Passenger Count</option>
                </select>
              </label>

              <label className="add-field">
                <span>Operator</span>
                <select
                  value={conditionForm.operator}
                  onChange={(e) => setConditionForm((prev) => ({ ...prev, operator: e.target.value }))}
                >
                  <option value="Equals">Equals</option>
                  <option value="GreaterThan">GreaterThan</option>
                  <option value="LessThan">LessThan</option>
                  <option value="Contains">Contains</option>
                </select>
              </label>

              <label className="add-field">
                <span>Value</span>
                <input
                  type="text"
                  placeholder="e.g. AI or Economy"
                  value={conditionForm.value1}
                  onChange={(e) => setConditionForm((prev) => ({ ...prev, value1: e.target.value }))}
                />
              </label>

              <button type="submit" className="primary-btn" style={{ height: '42px', marginTop: '19px' }}>
                Add Rule
              </button>
            </form>

            {conditionError && <p className="form-error" style={{ gridColumn: '1 / -1' }}>{conditionError}</p>}

            <div className="conditions-list" style={{ marginTop: '20px' }}>
              <h3>Current Rules</h3>
              {isLoadingConditions ? (
                <p>Loading rules...</p>
              ) : conditions.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No rules set. This discount applies to all flights.</p>
              ) : (
                <table className="conditions-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Operator</th>
                      <th>Value</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conditions.map((cond) => (
                      <tr key={cond.id}>
                        <td>{cond.conditionType}</td>
                        <td>{cond.conditionOperator || 'Equals'}</td>
                        <td><code>{cond.value1}</code></td>
                        <td>
                          <button
                            type="button"
                            className="danger-icon-btn"
                            onClick={() => handleDeleteCondition(cond.id)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--admin-danger)', cursor: 'pointer' }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
