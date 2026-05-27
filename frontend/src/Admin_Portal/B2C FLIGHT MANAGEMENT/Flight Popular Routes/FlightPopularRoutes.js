import React, { useState } from "react";
import { Check, Download, Eye, Plus, Trash2, X } from "lucide-react";
import "./FlightPopularRoutes.css";
import { csvCell } from "../../../utils/adminPortalUtils";
import { useAdminList } from "../../../utils/adminPortalStorage";

const INITIAL_FLIGHT_POPULAR_ROUTES = [
  {
    id: 201,
    fromAirport: "Indira Gandhi International Airport, Delhi (DEL) IN",
    toAirport: "Chhatrapati Shivaji Maharaj International Airport, Mumbai (BOM) IN",
    price: 4500,
    status: "active",
    imageName: "",
    imageUrl: "",
  },
  {
    id: 202,
    fromAirport: "Netaji Subhas Chandra Bose International Airport, Kolkata (CCU) IN",
    toAirport: "Jay Prakash Narayan International Airport, Patna (PAT) IN",
    price: 3500,
    status: "active",
    imageName: "",
    imageUrl: "",
  },
  {
    id: 203,
    fromAirport: "Indira Gandhi International Airport, Delhi (DEL) IN",
    toAirport: "Dubai International Airport, Dubai (DXB) AE",
    price: 15000,
    status: "active",
    imageName: "",
    imageUrl: "",
  },
  {
    id: 204,
    fromAirport: "Indira Gandhi International Airport, Delhi (DEL) IN",
    toAirport: "John F Kennedy International Airport, New York (JFK) US",
    price: 35000,
    status: "active",
    imageName: "",
    imageUrl: "",
  },
];


function createDefaultFlightPopularRouteForm() {
  return {
    fromAirport: "",
    toAirport: "",
    price: "",
    status: "active",
    imageName: "",
    imageUrl: "",
  };
}

export default function AdminFlightPopularRoutesPage() {
  const [routes, setRoutes] = useAdminList("flight-popular-routes", INITIAL_FLIGHT_POPULAR_ROUTES);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState(createDefaultFlightPopularRouteForm);
  const [addError, setAddError] = useState("");
  const [viewRoute, setViewRoute] = useState(null);
  const [deleteRoute, setDeleteRoute] = useState(null);

  const headers = ["SN", "ID", "From Airport", "To Airport", "Price", "Image", "Status", "Action"];
  const colWidths = ["4%", "6%", "29%", "29%", "8%", "6%", "9%", "9%"];

  const handleOpenAddModal = () => {
    setAddError("");
    setAddForm(createDefaultFlightPopularRouteForm());
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setAddError("");
    setAddForm((previous) => {
      if (previous.imageUrl && String(previous.imageUrl).startsWith("blob:")) {
        URL.revokeObjectURL(previous.imageUrl);
      }
      return createDefaultFlightPopularRouteForm();
    });
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setAddForm((previous) => {
        if (previous.imageUrl && String(previous.imageUrl).startsWith("blob:")) {
          URL.revokeObjectURL(previous.imageUrl);
        }
        return { ...previous, imageName: "", imageUrl: "" };
      });
      return;
    }

    const nextUrl = URL.createObjectURL(file);

    setAddForm((previous) => {
      if (previous.imageUrl && String(previous.imageUrl).startsWith("blob:")) {
        URL.revokeObjectURL(previous.imageUrl);
      }
      return {
        ...previous,
        imageName: file.name,
        imageUrl: nextUrl,
      };
    });
  };

  const handleSaveRoute = () => {
    const fromAirport = String(addForm.fromAirport || "").trim();
    const toAirport = String(addForm.toAirport || "").trim();
    const price = Number(addForm.price);

    if (!fromAirport || !toAirport) {
      setAddError("From Airport and To Airport are required.");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setAddError("Enter a valid price.");
      return;
    }

    if (!addForm.imageUrl) {
      setAddError("Image is required.");
      return;
    }

    setRoutes((previous) => {
      const nextId =
        previous.reduce((highest, route) => Math.max(highest, Number(route.id) || 0), 0) + 1;

      return [
        ...previous,
        {
          id: nextId,
          fromAirport,
          toAirport,
          price,
          status: addForm.status,
          imageName: addForm.imageName,
          imageUrl: addForm.imageUrl,
        },
      ];
    });

    setIsAddModalOpen(false);
    setAddError("");
    setAddForm(createDefaultFlightPopularRouteForm());
  };

  const handleToggleStatus = (id) => {
    setRoutes((previous) =>
      previous.map((route) =>
        route.id === id
          ? { ...route, status: route.status === "active" ? "inactive" : "active" }
          : route
      )
    );
  };

  const handleConfirmDelete = () => {
    if (!deleteRoute) {
      return;
    }

    const toDelete = deleteRoute;

    setRoutes((previous) => previous.filter((route) => route.id !== toDelete.id));
    setDeleteRoute(null);

    if (toDelete.imageUrl && String(toDelete.imageUrl).startsWith("blob:")) {
      URL.revokeObjectURL(toDelete.imageUrl);
    }
  };

  const handleExport = () => {
    if (routes.length === 0) {
      return;
    }

    const header = ["SN", "ID", "From Airport", "To Airport", "Price", "Image", "Status"];
    const csvRows = routes.map((route, index) => [
      index + 1,
      route.id,
      route.fromAirport,
      route.toAirport,
      route.price,
      route.imageName || "View",
      route.status,
    ]);

    const csv = [header, ...csvRows]
      .map((line) => line.map((cell) => csvCell(cell)).join(","))
      .join("\n");

    const fileBlob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const fileUrl = URL.createObjectURL(fileBlob);
    const link = document.createElement("a");

    link.href = fileUrl;
    link.download = `flight-popular-routes-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    URL.revokeObjectURL(fileUrl);
  };

  return (
    <>
      <section className="flight-markup-panel">
        <header className="flight-markup-toolbar">
          <div className="flight-markup-title">
            <h1>
              <strong>B2C Popular</strong> Flight Routes
            </h1>
            <div className="flight-markup-title-underline" aria-hidden="true" />
          </div>

          <div className="flight-markup-actions">
            <button type="button" className="flight-markup-action-btn primary" onClick={handleOpenAddModal}>
              <Plus size={16} />
              <span>Add Popular Flight Route</span>
            </button>
            <button
              type="button"
              className="flight-markup-action-btn secondary"
              onClick={handleExport}
              disabled={routes.length === 0}
            >
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>
        </header>

        <section className="flight-markup-table-wrap">
          <div className="flight-markup-table-scroll">
            <table className="flight-markup-table flight-routes-table">
              <colgroup>
                {colWidths.map((width, index) => (
                  <col key={`${width}-${index}`} style={{ width }} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  {headers.map((headerLabel) => (
                    <th key={headerLabel}>
                      <div className="flight-markup-th-pill">
                        <span>{headerLabel}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {routes.length === 0 ? (
                  <tr>
                    <td colSpan={headers.length} className="flight-markup-empty-cell">
                      <span className="flight-markup-empty">No Record Found...</span>
                    </td>
                  </tr>
                ) : (
                  routes.map((route, index) => (
                    <tr key={route.id}>
                      <td>{index + 1}</td>
                      <td>{route.id}</td>
                      <td>{route.fromAirport}</td>
                      <td>{route.toAirport}</td>
                      <td>{route.price}</td>
                      <td>
                        <div className="markup-action-group">
                          <button
                            type="button"
                            title="View"
                            aria-label={`View image for route ${route.id}`}
                            onClick={() => setViewRoute(route)}
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`markup-status-toggle ${route.status}`}
                          onClick={() => handleToggleStatus(route.id)}
                          aria-label={`Set route ${route.id} status to ${
                            route.status === "active" ? "inactive" : "active"
                          }`}
                        >
                          {route.status === "active" ? <Check size={14} /> : <X size={14} />}
                          <span>{route.status === "active" ? "Active" : "Inactive"}</span>
                        </button>
                      </td>
                      <td>
                        <div className="markup-action-group">
                          <button
                            type="button"
                            title="Delete"
                            aria-label={`Delete route ${route.id}`}
                            className="danger"
                            onClick={() => setDeleteRoute(route)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      {isAddModalOpen && (
        <div className="admin-markup-coupon-backdrop" onClick={handleCloseAddModal}>
          <section
            className="admin-markup-coupon-modal generate"
            role="dialog"
            aria-modal="true"
            aria-label="Add popular flight route"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="generate-header">
              <h2>Add Popular Flight Route</h2>
            </header>

            <div className="admin-markup-coupon-form admin-markup-coupon-generate-form">
              <label>
                <span>From Airport :</span>
                <input
                  type="text"
                  placeholder="Enter from airport"
                  value={addForm.fromAirport}
                  onChange={(event) =>
                    setAddForm((previous) => ({ ...previous, fromAirport: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>To Airport :</span>
                <input
                  type="text"
                  placeholder="Enter to airport"
                  value={addForm.toAirport}
                  onChange={(event) =>
                    setAddForm((previous) => ({ ...previous, toAirport: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Status :</span>
                <select
                  value={addForm.status}
                  onChange={(event) =>
                    setAddForm((previous) => ({ ...previous, status: event.target.value }))
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
              <label>
                <span>Price :</span>
                <input
                  type="number"
                  min="1"
                  placeholder="Enter price"
                  value={addForm.price}
                  onChange={(event) =>
                    setAddForm((previous) => ({ ...previous, price: event.target.value }))
                  }
                />
              </label>
              <label className="wide">
                <span>Image :</span>
                <input type="file" accept="image/*" onChange={handleFileChange} />
              </label>
            </div>

            {addError && <p className="admin-markup-coupon-error">{addError}</p>}

            <div className="admin-markup-coupon-modal-actions generate-actions">
              <button type="button" className="primary generate-submit" onClick={handleSaveRoute}>
                <Check size={16} />
                <span>Submit</span>
              </button>
              <button type="button" className="danger generate-cancel" onClick={handleCloseAddModal}>
                <X size={16} />
                <span>Cancel</span>
              </button>
            </div>
          </section>
        </div>
      )}

      {viewRoute && (
        <div className="admin-markup-modal-backdrop" onClick={() => setViewRoute(null)}>
          <section
            className="admin-markup-modal small"
            role="dialog"
            aria-modal="true"
            aria-label="View route image"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2>Route Image</h2>
              <button type="button" onClick={() => setViewRoute(null)} aria-label="Close image">
                <X size={16} />
              </button>
            </header>

            <div className="flight-route-image-body">
              {viewRoute.imageUrl ? (
                <img src={viewRoute.imageUrl} alt="Popular flight route" />
              ) : (
                <p>No image uploaded.</p>
              )}
            </div>
          </section>
        </div>
      )}

      {deleteRoute && (
        <div className="admin-markup-modal-backdrop" onClick={() => setDeleteRoute(null)}>
          <section
            className="admin-markup-modal small"
            role="dialog"
            aria-modal="true"
            aria-label="Delete popular flight route"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2>Delete Popular Flight Route</h2>
              <button
                type="button"
                onClick={() => setDeleteRoute(null)}
                aria-label="Close delete route dialog"
              >
                <X size={16} />
              </button>
            </header>

            <p className="admin-markup-delete-copy">
              Are you sure you want to delete this route?
            </p>

            <div className="admin-markup-modal-actions">
              <button type="button" className="secondary" onClick={() => setDeleteRoute(null)}>
                Cancel
              </button>
              <button type="button" className="danger" onClick={handleConfirmDelete}>
                Delete
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}



