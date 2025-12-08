import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../config/axios.js';

const Signup = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: 'student',
    // Student/Admin fields
    hostelId: '',
    roomNumber: '',
    // Admin - New Hostel fields
    isNewHostel: false,
    hostelName: '',
    hostelAddress: '',
    hostelTotalRooms: '',
    // Worker fields
    skills: [],
    hostelIds: [],
  });

  const [hostels, setHostels] = useState([]);
  const [loadingHostels, setLoadingHostels] = useState(true);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const workerSkills = ['electrical', 'plumbing', 'cleaning', 'carpentry', 'painting', 'general'];

  // Fetch hostels on component mount
  useEffect(() => {
    const fetchHostels = async () => {
      try {
        setLoadingHostels(true);
        const response = await apiClient.get('/hostels/public');
        setHostels(response.data.hostels || []);
      } catch (error) {
        console.error('Error fetching hostels:', error);
        setGeneralError('Failed to load hostels. Please refresh the page.');
      } finally {
        setLoadingHostels(false);
      }
    };

    fetchHostels();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'skills') {
        const skills = [...formData.skills];
        if (checked) {
          skills.push(value);
        } else {
          const index = skills.indexOf(value);
          if (index > -1) skills.splice(index, 1);
        }
        setFormData({ ...formData, skills });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    if (generalError) {
      setGeneralError('');
    }
  };

  // Validate Pakistani phone number
  // User enters only 10 digits, we prepend +92
  const validatePakistaniPhone = (phone) => {
    if (!phone) return false;
    
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Should be exactly 10 digits (without +92)
    return /^[0-9]{10}$/.test(digitsOnly);
  };

  const validateForm = () => {
    const newErrors = {};

    // Common validations
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!validatePakistaniPhone(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    // Role-specific validations
    if (formData.role === 'student') {
      if (!formData.hostelId) {
        newErrors.hostelId = 'Please select a hostel';
      }
      if (!formData.roomNumber.trim()) {
        newErrors.roomNumber = 'Room number is required';
      }
    }

    if (formData.role === 'admin') {
      // Admin must create a new hostel
      if (!formData.hostelName.trim()) {
        newErrors.hostelName = 'Hostel name is required';
      }
      if (!formData.hostelAddress.trim()) {
        newErrors.hostelAddress = 'Hostel address is required';
      }
      if (!formData.hostelTotalRooms || parseInt(formData.hostelTotalRooms, 10) < 1) {
        newErrors.hostelTotalRooms = 'Total rooms must be at least 1';
      }
    }

    if (formData.role === 'worker') {
      if (formData.skills.length === 0) {
        newErrors.skills = 'Please select at least one skill';
      }
      if (formData.hostelIds.length === 0) {
        newErrors.hostelIds = 'Please select at least one hostel';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare registration data based on role
      // Ensure phone number has +92 prefix
      const phoneNumber = formData.phoneNumber.trim();
      const formattedPhoneNumber = phoneNumber.startsWith('+92') 
        ? phoneNumber 
        : `+92${phoneNumber}`;
      
      const registrationData = {
        email: formData.email.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: formattedPhoneNumber,
        role: formData.role,
      };

      if (formData.role === 'student') {
        registrationData.hostelId = formData.hostelId;
        registrationData.roomNumber = formData.roomNumber.trim();
      }

      if (formData.role === 'admin') {
        // Admin must always create a new hostel
        registrationData.hostelId = 'new';
        registrationData.hostelName = formData.hostelName.trim();
        registrationData.hostelAddress = formData.hostelAddress.trim();
        registrationData.hostelTotalRooms = parseInt(formData.hostelTotalRooms, 10);
      }

      if (formData.role === 'worker') {
        registrationData.skills = formData.skills;
        registrationData.hostelIds = formData.hostelIds;
      }

      const response = await register(registrationData);
      
      // Registration successful - redirect to login
      navigate('/login', { 
        state: { 
          message: 'Registration successful! Please log in with your credentials.' 
        } 
      });
    } catch (err) {
      console.error('Registration error:', err);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setGeneralError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleHostelSelection = (hostelId) => {
    if (formData.role === 'worker') {
      // For workers, handle multi-select
      const hostelIds = [...formData.hostelIds];
      const index = hostelIds.indexOf(hostelId);
      if (index > -1) {
        hostelIds.splice(index, 1);
      } else {
        hostelIds.push(hostelId);
      }
      setFormData({ ...formData, hostelIds });
    } else {
      // For students/admins, single select
      setFormData({ ...formData, hostelId, isNewHostel: hostelId === 'new' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-purple-700 flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full">
        {/* Signup Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-600 mb-2">HostelHelp</h1>
            <p className="text-gray-600 text-sm">Create your account</p>
          </div>

          {/* General Error Message */}
          {generalError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {generalError}
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I am a
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['student', 'admin', 'worker'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      setFormData({ 
                        ...formData, 
                        role,
                        hostelId: role === 'admin' ? 'new' : '',
                        hostelIds: [],
                        isNewHostel: role === 'admin',
                        hostelName: '',
                        hostelAddress: '',
                        hostelTotalRooms: '',
                        roomNumber: '',
                        skills: [],
                        phoneNumber: formData.phoneNumber, // Keep phone number when changing role
                      });
                      setErrors({});
                      setGeneralError('');
                    }}
                    className={`px-4 py-3 rounded-lg font-medium transition ${
                      formData.role === role
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Common Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition ${
                    errors.firstName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="John"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition ${
                    errors.lastName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="john.doe@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number (Pakistani) *
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-medium">
                  +92
                </div>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => {
                    // Only allow digits, remove any non-digit characters
                    const digitsOnly = e.target.value.replace(/\D/g, '');
                    // Limit to 10 digits
                    const limited = digitsOnly.slice(0, 10);
                    // Prepend +92
                    setFormData({ ...formData, phoneNumber: limited });
                    // Clear error when user starts typing
                    if (errors.phoneNumber) {
                      setErrors({ ...errors, phoneNumber: '' });
                    }
                  }}
                  className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition ${
                    errors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="XXXXXXXXXX"
                  maxLength={10}
                />
              </div>
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="At least 6 characters"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Re-enter password"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Student Fields */}
            {formData.role === 'student' && (
              <>
                <div>
                  <label htmlFor="hostelId" className="block text-sm font-medium text-gray-700 mb-2">
                    Hostel *
                  </label>
                  {loadingHostels ? (
                    <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                      Loading hostels...
                    </div>
                  ) : (
                    <select
                      id="hostelId"
                      name="hostelId"
                      value={formData.hostelId}
                      onChange={(e) => handleHostelSelection(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition ${
                        errors.hostelId ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select a hostel</option>
                      {hostels.map((hostel) => (
                        <option key={hostel.id} value={hostel.id}>
                          {hostel.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.hostelId && (
                    <p className="mt-1 text-sm text-red-600">{errors.hostelId}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="roomNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Room Number *
                  </label>
                  <input
                    type="text"
                    id="roomNumber"
                    name="roomNumber"
                    value={formData.roomNumber}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition ${
                      errors.roomNumber ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="A101"
                  />
                  {errors.roomNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.roomNumber}</p>
                  )}
                </div>
              </>
            )}

            {/* Admin Fields */}
            {formData.role === 'admin' && (
              <>
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> As an admin, you must create a new hostel. You cannot select an existing hostel.
                  </p>
                </div>

                <div>
                  <label htmlFor="hostelName" className="block text-sm font-medium text-gray-700 mb-2">
                    Hostel Name *
                  </label>
                  <input
                    type="text"
                    id="hostelName"
                    name="hostelName"
                    value={formData.hostelName}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition ${
                      errors.hostelName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Hostel A"
                  />
                  {errors.hostelName && (
                    <p className="mt-1 text-sm text-red-600">{errors.hostelName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="hostelAddress" className="block text-sm font-medium text-gray-700 mb-2">
                    Hostel Address *
                  </label>
                  <input
                    type="text"
                    id="hostelAddress"
                    name="hostelAddress"
                    value={formData.hostelAddress}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition ${
                      errors.hostelAddress ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="123 Main St, City"
                  />
                  {errors.hostelAddress && (
                    <p className="mt-1 text-sm text-red-600">{errors.hostelAddress}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="hostelTotalRooms" className="block text-sm font-medium text-gray-700 mb-2">
                    Total Rooms *
                  </label>
                  <input
                    type="number"
                    id="hostelTotalRooms"
                    name="hostelTotalRooms"
                    value={formData.hostelTotalRooms}
                    onChange={handleChange}
                    min="1"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition ${
                      errors.hostelTotalRooms ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="50"
                  />
                  {errors.hostelTotalRooms && (
                    <p className="mt-1 text-sm text-red-600">{errors.hostelTotalRooms}</p>
                  )}
                </div>
              </>
            )}

            {/* Worker Fields */}
            {formData.role === 'worker' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skills * (Select at least one)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {workerSkills.map((skill) => (
                      <label key={skill} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="skills"
                          value={skill}
                          checked={formData.skills.includes(skill)}
                          onChange={handleChange}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700 capitalize">{skill}</span>
                      </label>
                    ))}
                  </div>
                  {errors.skills && (
                    <p className="mt-1 text-sm text-red-600">{errors.skills}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hostels * (Select hostels you work for)
                  </label>
                  {loadingHostels ? (
                    <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                      Loading hostels...
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
                      {hostels.map((hostel) => (
                        <label key={hostel.id} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded">
                          <input
                            type="checkbox"
                            checked={formData.hostelIds.includes(hostel.id)}
                            onChange={() => handleHostelSelection(hostel.id)}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-700">{hostel.name}</span>
                        </label>
                      ))}
                      {hostels.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No hostels available. Please contact an admin.
                        </p>
                      )}
                    </div>
                  )}
                  {errors.hostelIds && (
                    <p className="mt-1 text-sm text-red-600">{errors.hostelIds}</p>
                  )}
                  {formData.hostelIds.length > 0 && (
                    <p className="mt-2 text-xs text-gray-500">
                      Selected: {formData.hostelIds.length} hostel(s)
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-primary-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition transform hover:scale-[1.02]"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <p className="text-center text-white/80 text-sm mt-6">
          Hostel Maintenance Management System
        </p>
      </div>
    </div>
  );
};

export default Signup;

