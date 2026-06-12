import React, { useEffect, useState } from "react";
import "./AirlineWebCheckLink.css";
import {
  listAirlineWebChecks,
  createAirlineWebCheck,
  deleteAirlineWebCheck,
} from "../../../services/flightBookingService";

const mapFromBackendWebCheck = (dbRow) => {
  return {
    id: dbRow.id,
    name: dbRow.airlineName || "",
    code: dbRow.airlineCode || "",
    url: dbRow.webCheckinUrl || "",
  };
};

function AirlineWebCheckLink() {
  const [page, setPage] = useState("list");
  const [airlines, setAirlines] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    url: ""
  });

  const loadAirlines = async () => {
    setIsLoading(true);
    try {
      const data = await listAirlineWebChecks();
      const mapped = Array.isArray(data) ? data.map(mapFromBackendWebCheck) : [];
      setAirlines(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAirlines();
  }, []);

  // Navigation
  const goToAdd = () => setPage("add");
  const goToList = () => setPage("list");

  // Input Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Submit
  const handleSubmit = async () => {
    if (!formData.name || !formData.url) {
      alert("Please fill all fields");
      return;
    }

    const payload = {
      airlineName: formData.name,
      airlineCode: formData.name.slice(0, 2).toUpperCase(),
      webCheckinUrl: formData.url
    };

    try {
      await createAirlineWebCheck(payload);
      setFormData({ name: "", url: "" });
      await loadAirlines();
      setPage("list");
    } catch (err) {
      alert(err.message || "Failed to create airline check-in link.");
    }
  };

  // Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this link?")) {
      return;
    }
    try {
      await deleteAirlineWebCheck(id);
      await loadAirlines();
    } catch (err) {
      alert(err.message || "Failed to delete link.");
    }
  };

  // Clear Filter
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
