import React, { useState } from "react";
import { FiEdit2, FiSave, FiTrash2, FiX } from "react-icons/fi";
import "../../STYLES/traveller.css";

const TravelerTable = ({ data, onUpdate, onDelete }) => {
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [phoneError, setPhoneError] = useState("");

  const handleEdit = (row) => {
    setEditId(row.id);
    setEditData({ ...row });
    setPhoneError("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === "mobile") {
      if (!/^[0-9]*$/.test(value)) return;
      if (value.length > 10) return;
      setEditData({ ...editData, mobile: value });
      setPhoneError(value.length !== 10 ? "Phone must be 10 digits" : "");
      return;
    }
    setEditData({ ...editData, [name]: value });
  };

  const handleSave = () => {
    if (!/^[0-9]{10}$/.test(editData.mobile || "")) {
      setPhoneError("Phone must be exactly 10 digits");
      return;
    }
    onUpdate(editId, editData);
    setEditId(null);
  };

  return (
    <div className="table-wrapper">
      <table className="traveler-table">
        <thead>
          <tr>
            <th>Sr</th>
            <th>Name</th>
            <th>Type</th>
            <th>Gender</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan="7" className="table-empty">
                No Data Found
              </td>
            </tr>
          ) : (
            data.map((item, index) => {
              const isEdit = editId === item.id;
              return (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>
                    {isEdit ? (
                      <input
                        name="name"
                        value={editData.name}
                        onChange={handleChange}
                        className="input-field"
                      />
                    ) : (
                      item.name
                    )}
                  </td>
                      <td>{item.type || "Adult"}</td>
                  <td>
                    {isEdit ? (
                      <select
                        name="gender"
                        value={editData.gender}
                        onChange={handleChange}
                        className="input-field"
                      >
                        <option>Male</option>
                        <option>Female</option>
                      </select>
                    ) : (
                      item.gender
                    )}
                  </td>
                  <td>
                    {isEdit ? (
                      <input
                        name="email"
                        value={editData.email}
                        onChange={handleChange}
                        className="input-field"
                      />
                    ) : (
                      item.email
                    )}
                  </td>
                  <td>
                    {isEdit ? (
                      <div>
                        <input
                          name="mobile"
                          value={editData.mobile}
                          onChange={handleChange}
                          maxLength="10"
                          className="input-field"
                        />
                        {phoneError && <p className="error-text">{phoneError}</p>}
                      </div>
                    ) : (
                      item.mobile
                    )}
                  </td>
                  <td>
                    {!isEdit ? (
                      <>
                        <button
                          onClick={() => handleEdit(item)}
                          className="icon-btn icon-edit"
                          type="button"
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => onDelete(item.id)}
                          className="icon-btn icon-delete"
                          type="button"
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleSave}
                          className="icon-btn icon-save"
                          type="button"
                          title="Save"
                        >
                          <FiSave />
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="icon-btn icon-cancel"
                          type="button"
                          title="Cancel"
                        >
                          <FiX />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TravelerTable;
