import React, { useState } from "react";
import "./Airline BrandList.css";
import { getNextNumericId, useAdminList } from "../../../utils/adminPortalStorage";

function AirlineBrands() {
  const [page, setPage] = useState("list");

  const [airlines, setAirlines] = useAdminList("airline-brands", [
    { id: 221, name: "IndiGo", code: "6E", status: "Active" },
    { id: 150, name: "Akasa Air", code: "QP", status: "Active" },
    { id: 149, name: "Air India", code: "AI", status: "Active" },
    { id: 148, name: "Air Asia India", code: "I5", status: "Active" }
  ]);

  const [newAirline, setNewAirline] = useState("");

  // Navigation
  const goToAdd = () => setPage("add");
  const goToList = () => setPage("list");

  // Add Airline
  const handleSubmit = () => {
    if (!newAirline) {
      alert("Enter airline name");
      return;
    }

    const newItem = {
      id: getNextNumericId(airlines, 1),
      name: newAirline,
      code: newAirline.slice(0, 2).toUpperCase(),
      status: "Active"
    };

    setAirlines([...airlines, newItem]);
    setNewAirline("");
    setPage("list");
  };

  // Delete
  const handleDelete = (id) => {
    setAirlines(airlines.filter((a) => a.id !== id));
  };

  // Toggle Status
  const toggleStatus = (id) => {
    const updated = airlines.map((a) =>
      a.id === id
        ? { ...a, status: a.status === "Active" ? "Inactive" : "Active" }
        : a
    );
    setAirlines(updated);
  };

  // Export (JSON download)
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(airlines, null, 2)], {
      type: "application/json"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "airlines.json";
    link.click();
  };

  return (
    <div className="container">

      {/* LIST PAGE */}
      {page === "list" && (
        <>
          <div className="header">
            <h2>Airline Brand List</h2>
            <div className="actions">
              <button className="btn filter">Filter</button>
              <button className="btn clear">Clear Filter</button>
              <button className="btn add" onClick={goToAdd}>
                + Add Airline Brand
              </button>
              <button className="btn export" onClick={handleExport}>
                Export
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
                <th>Image</th>
                <th>Status</th>
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

                  <td>
                    <button className="view-btn">View</button>
                  </td>

                  <td>
                    <span
                      className={
                        item.status === "Active"
                          ? "status active"
                          : "status inactive"
                      }
                    >
                      {item.status}
                    </span>
                  </td>

                  <td className="action-buttons">
                    <button
                      className="icon-btn view"
                      title="View"
                    >
                      👁
                    </button>

                    <button
                      className="icon-btn edit"
                      title="Toggle Status"
                      onClick={() => toggleStatus(item.id)}
                    >
                      ✏
                    </button>

                    <button
                      className="icon-btn delete"
                      title="Delete"
                      onClick={() => handleDelete(item.id)}
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* ADD PAGE */}
      {page === "add" && (
        <>
          <div className="header">
            <h2>Add Airline Brand</h2>
            <button className="btn back" onClick={goToList}>
              Airline Brand List
            </button>
          </div>

          <div className="form-box">
            <div className="form-title">Basic Details</div>

            <label>Airline</label>
            <input
              type="text"
              placeholder="AirLine"
              value={newAirline}
              onChange={(e) => setNewAirline(e.target.value)}
            />

            <button className="submit-btn" onClick={handleSubmit}>
              SUBMIT
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default AirlineBrands;

