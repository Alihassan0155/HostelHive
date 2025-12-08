// src/components/UI/DateTimePicker.jsx
import React, { useState, useEffect } from 'react';
import { CalendarClock, X, AlertCircle } from 'lucide-react';
import Calendar from './Calendar';
import Clock from './Clock';
import { dateToInputFormat, inputFormatToDate } from '../../utils/dateUtils';

const DateTimePicker = ({ 
  value, 
  onChange, 
  disabled = false, 
  minDate = null,
  className = '',
  error = false 
}) => {
  const [dateTime, setDateTime] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [step, setStep] = useState('date'); // 'date' or 'time'
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (value) {
      const parsed = inputFormatToDate(value);
      if (parsed) {
        setDateTime(parsed);
        setSelectedDate(parsed);
      }
    }
  }, [value]);

  const handleOpenPicker = () => {
    if (disabled) return;
    
    // Initialize with current date/time if no value
    const initialDate = value ? inputFormatToDate(value) : new Date();
    setDateTime(initialDate);
    setSelectedDate(initialDate);
    setStep('date');
    setValidationError('');
    setShowPicker(true);
  };

  const handleDateConfirm = (date) => {
    if (!date) return;
    
    setSelectedDate(date);
    setDateTime(date);
    setSelectedTime(date);
    setStep('time');
    setValidationError('');
  };

  const handleTimeChange = (timeDate) => {
    if (!timeDate || !selectedDate) return;
    setSelectedTime(timeDate);
  };

  const handleTimeConfirm = () => {
    if (!selectedTime || !selectedDate) return;
    
    // Combine selected date with selected time
    const combined = new Date(selectedDate);
    combined.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
    
    // Validate: must be after current datetime
    const now = new Date();
    if (combined <= now) {
      setValidationError('Selected date and time must be in the future');
      return;
    }
    
    // Validate minDate if provided
    if (minDate) {
      const min = new Date(minDate);
      if (combined <= min) {
        setValidationError('Selected date and time must be after the minimum date');
        return;
      }
    }
    
    setValidationError('');
    setDateTime(combined);
    onChange(dateToInputFormat(combined));
    setShowPicker(false);
    setStep('date');
  };

  const handleCancel = () => {
    setShowPicker(false);
    setStep('date');
    setValidationError('');
    // Reset to original value
    if (value) {
      const parsed = inputFormatToDate(value);
      if (parsed) {
        setDateTime(parsed);
        setSelectedDate(parsed);
      }
    } else {
      setDateTime(null);
      setSelectedDate(null);
      setSelectedTime(null);
    }
  };

  const handleNowClick = () => {
    const now = new Date();
    // Set to 1 minute in the future to ensure it's always valid
    now.setMinutes(now.getMinutes() + 1);
    setDateTime(now);
    setSelectedDate(now);
    setValidationError('');
    onChange(dateToInputFormat(now));
    setShowPicker(false);
    setStep('date');
  };

  const displayDateTime = () => {
    if (!dateTime) return 'Select date & time';
    return dateTime.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpenPicker}
        disabled={disabled}
        className={`
          w-full px-4 py-3 border rounded-lg
          focus:ring-2 focus:ring-blue-500 focus:border-transparent
          flex items-center justify-between gap-2
          bg-white text-gray-900
          ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'hover:border-gray-400'}
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${className}
        `}
      >
        <div className="flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-gray-500" />
          <span className="font-medium">{displayDateTime()}</span>
        </div>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showPicker && !disabled && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={handleCancel}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto z-10">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <CalendarClock className="w-6 h-6 text-blue-600" />
                {step === 'date' ? 'Select Date' : 'Select Time'}
              </h2>
              <button
                type="button"
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {validationError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{validationError}</p>
                </div>
              )}

              {step === 'date' ? (
                <div className="space-y-4">
                  <Calendar
                    value={selectedDate || new Date()}
                    onChange={handleDateConfirm}
                    minDate={minDate || dateToInputFormat(new Date())}
                    className="w-full"
                  />
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">
                      Please select a date first, then you'll be able to select the time.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Selected Date: <span className="font-semibold text-gray-900">
                        {selectedDate?.toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </p>
                  </div>
                  <Clock
                    value={selectedTime || selectedDate || new Date()}
                    onChange={handleTimeChange}
                    autoClose={false}
                  />
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">
                      The selected time must be in the future. After selecting time, it will be validated automatically.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200">
              {step === 'time' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setStep('date')}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
                  >
                    ← Back to Date
                  </button>
                  <button
                    type="button"
                    onClick={handleTimeConfirm}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                  >
                    Confirm Time
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium text-sm"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleNowClick}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
                  >
                    Set to Now (+1 min)
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium text-sm"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DateTimePicker;
