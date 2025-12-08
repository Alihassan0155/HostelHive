// src/pages/Student/ReportIssue.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/UI/Header";
import Card from "../../components/UI/Card";
import Loader from "../../components/UI/Loader";
import issueService from "../../services/issueService";
import { useAuth } from "../../context/AuthContext";

const issueTypes = [
  { value: "electrical", label: "Electrical" },
  { value: "plumbing", label: "Plumbing" },
  { value: "cleaning", label: "Cleaning" },
  { value: "furniture", label: "Furniture" },
  { value: "internet", label: "Internet" },
  { value: "other", label: "Other" },
];

const ReportIssue = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "",
    roomNumber: "",
  });
  const [images, setImages] = useState([]);
  const [preview, setPreview] = useState([]);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreview(urls);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = "Title is required";
    if (!form.description.trim()) newErrors.description = "Description is required";
    if (!form.type) newErrors.type = "Type is required";
    if (!form.roomNumber.trim()) newErrors.roomNumber = "Room number is required";
    if (!userData?.hostelId) {
      newErrors.hostelId = "Hostel information is missing. Please contact admin.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const issueData = {
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.type,
        hostelId: userData.hostelId,
        roomNumber: form.roomNumber.trim(),
        photos: [], // TODO: Implement image upload to storage
      };

      await issueService.createIssue(issueData);

      // Success - navigate to my issues page
      navigate("/student/my-issues", { 
        state: { message: "Issue reported successfully!" } 
      });
    } catch (err) {
      console.error("Error submitting issue:", err);
      const errorMessage = err.response?.data?.error || "Failed to submit issue. Please try again.";
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 p-6">
      <Header title="Report New Issue" />

      <div className="max-w-3xl mx-auto">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Brief description of the issue"
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.title ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="4"
                placeholder="Describe the problem in detail..."
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.description ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            {/* Type and Urgency in a row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.type ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select type</option>
                  {issueTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
              </div>

            </div>

            {/* Room Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Room Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="roomNumber"
                value={form.roomNumber}
                onChange={handleChange}
                placeholder="e.g., A101"
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.roomNumber ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.roomNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.roomNumber}</p>
              )}
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload Images (Optional)
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
            </div>

            {/* Preview */}
            {preview.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                <div className="grid grid-cols-3 gap-3">
                  {preview.map((src, i) => (
                    <div key={i} className="relative">
                      <img
                        src={src}
                        alt={`Preview ${i + 1}`}
                        className="h-24 w-full object-cover rounded-lg shadow"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newImages = images.filter((_, idx) => idx !== i);
                          const newPreview = preview.filter((_, idx) => idx !== i);
                          setImages(newImages);
                          setPreview(newPreview);
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error message */}
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {errors.submit}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate("/student/my-issues")}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader size={20} />
                    <span className="ml-2">Submitting...</span>
                  </>
                ) : (
                  "Submit Issue"
                )}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export { ReportIssue };
export default ReportIssue;
