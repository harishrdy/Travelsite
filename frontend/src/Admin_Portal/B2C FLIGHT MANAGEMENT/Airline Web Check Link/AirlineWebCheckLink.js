import React, { useState } from "react";
import "./AirlineWebCheckLink.css";
import { getNextNumericId, useAdminList } from "../../../utils/adminPortalStorage";

function AirlineWebCheckLink() {
  const [page, setPage] = useState("list");

  const [airlines, setAirlines] = useAdminList("airline-webcheck", [
    { id: 38, name: "IndiGo", code: "6E", url: "https://www.goindigo.in/web-check-in.html" },
  ]);

  const [formData, setFormData] = useState({
    name: "",
    url: ""
  });

  // Navigation
  const goToAdd = () => setPage("add");
  const goToList = () => setPage("list");

  // Input Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Submit
  const handleSubmit = () => {
    if (!formData.name || !formData.url) {
      alert("Please fill all fields");
      return;
    }

    const newAirline = {
      id: getNextNumericId(airlines, 1),
      name: formData.name,
      code: formData.name.slice(0, 2).toUpperCase(),
      url: formData.url
    };

    setAirlines([...airlines, newAirline]);
    setFormData({ name: "", url: "" });
    setPage("list");
  };

  // Delete
  const handleDelete = (id) => {
    const updated = airlines.filter((a) => a.id !== id);
    setAirlines(updated);
  };

  // Clear Filter (reset demo data)
  const handleClear = () => {
    setAirlines([]);
  };

  return (
    <div className="container">

      {/* LIST PAGE */}
      {page === "list" && (
        <>
          <div className="header">
            <h2>Airline WebCheck Link List</h2>
            <div className="actions">
              <button className="btn filter">Filter</button>
              <button className="btn clear" onClick={handleClear}>
                Clear Filter
              </button>
              <button className="btn add" onClick={goToAdd}>
                + Add Airline Brand
              </button>
            </div>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>SN.</th>
                <th>ID</th>
                <th>Airline</th>
                <th>Airline Code</th>
                <th>Url</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {airlines.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.code}</td>
                  <td>{item.url}</td>
                  <td>
                    <button
                      className="delete"
                      onClick={() => handleDelete(item.id)}
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="note">
            * If the image is not displaying, please contact the tech team for assistance with the upload.
          </div>
        </>
      )}

      {/* ADD PAGE */}
      {page === "add" && (
        <>
          <div className="header">
            <h2>Add Airline WebCheck Link</h2>
            <button className="btn back" onClick={goToList}>
              Airline WebCheckin List
            </button>
          </div>

          <div className="form-box">
            <div className="form-title">Basic Details</div>

            <div className="form-row">
              <div className="input-group">
                <label>Airline</label>
                <input
                  type="text"
                  name="name"
                  placeholder="AirLine"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <label>Url</label>
                <input
                  type="text"
                  name="url"
                  placeholder="AirLine Url"
                  value={formData.url}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button className="submit-btn" onClick={handleSubmit}>
              SUBMIT
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default AirlineWebCheckLink;

