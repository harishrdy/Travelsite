import React, { useState } from "react";
import "../../STYLES/traveller.css";

const AddTravelerForm = ({ onBack, onSubmit }) => {
  const [form, setForm] = useState({
    type: "",
    title: "",
    firstName: "",
    lastName: "",
    gender: "",
    age: "",
    mobile: "",
    email: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const validate = () => {
    const newErrors = {};

    if (!form.type) newErrors.type = "Select traveler type";
    if (!form.title) newErrors.title = "Select title";
    if (!form.firstName) newErrors.firstName = "First name required";
    if (!form.lastName) newErrors.lastName = "Last name required";
    if (!form.gender) newErrors.gender = "Select gender";
    if (!form.age) newErrors.age = "Age required";

    if (!form.mobile.trim()) {
      newErrors.mobile = "Mobile number required";
    } else if (!/^\d{10}$/.test(form.mobile.trim())) {
      newErrors.mobile = "Enter a valid 10-digit mobile number";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = "Enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;
    if (typeof onSubmit === "function") onSubmit(form);
    setForm({
      type: "",
      title: "",
      firstName: "",
      lastName: "",
      gender: "",
      age: "",
      mobile: "",
      email: "",
    });
    setErrors({});
  };

  return (
    <div className="card">
      <div className="flex-between">
        <div className="section-heading-block">
          <span className="section-kicker">Traveler Directory</span>
          <h2 className="title-text">Add Traveler</h2>
          <p className="section-subtitle">
            Save passenger details once and reuse them across future bookings.
          </p>
        </div>
        <button onClick={onBack} type="button" className="btn btn-red">
          Traveler List
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ overflow: "visible" }}>
        <div className="traveler-form-grid">

          {/* Row 1: Type | Title | Gender */}
          <div className="form-field-wrap">
                        <label>Select Type </label>

            <select name="type" value={form.type} onChange={handleChange} className="input-field">
              <option value="">Select Type (Adult/Child)</option>
              <option value="Adult">Adult</option>
              <option value="Child">Child</option>
            </select>
            {errors.type && <p className="error-text">{errors.type}</p>}
          </div>

          <div className="form-field-wrap">
              <label>Select Title </label>
            <select name="title" value={form.title} onChange={handleChange} className="input-field">
              <option value="">Select Title</option>
              <option>Mr</option>
              <option>Mrs</option>
              <option>Ms</option>
            </select>
            {errors.title && <p className="error-text">{errors.title}</p>}
          </div>

          

          {/* Row 2: First Name | Last Name | Age */}
          <div className="form-field-wrap">
            <label>First Name</label>
            <input
              name="firstName"
              placeholder="First Name"
              value={form.firstName}
              onChange={handleChange}
              className="input-field"
            />
            {errors.firstName && <p className="error-text">{errors.firstName}</p>}
          </div>

          <div className="form-field-wrap">
            <label>Last Name</label>  
            <input
              name="lastName"
              placeholder="Last Name"
              value={form.lastName}
              onChange={handleChange}
              className="input-field"
            />
            {errors.lastName && <p className="error-text">{errors.lastName}</p>}
          </div>
          <div className="form-field-wrap">
            <label>Gender</label> 
            <select name="gender" value={form.gender} onChange={handleChange} className="input-field">
              <option value="">Select Gender</option>
              <option>Male</option>
              <option>Female</option>
            </select>
            {errors.gender && <p className="error-text">{errors.gender}</p>}
          </div>

          <div className="form-field-wrap">
              <label>Age</label>  
            
            <input
              name="age"
              type="number"
              placeholder="Age"
              value={form.age}
              onChange={handleChange}
              className="input-field"
            />
            {errors.age && <p className="error-text">{errors.age}</p>}
          </div>

          {/* Row 3: Mobile | Email (email spans 2 cols) */}
          <div className="form-field-wrap">
              <label>Mobile Number</label>
            <input
              name="mobile"
              type="tel"
              placeholder="Mobile Number"
              value={form.mobile}
              onChange={handleChange}
              className="input-field"
              maxLength={10}
            />
            {errors.mobile && <p className="error-text">{errors.mobile}</p>}
          </div>

          <div className="form-field-wrap traveler-email-span">
              <label>Email Address</label>  
            <input
              name="email"
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              className="input-field"
            />
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>

        </div>

        <div className="submit-wrap">
          <button type="submit" className="btn btn-orange">
            Save Traveler
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTravelerForm;