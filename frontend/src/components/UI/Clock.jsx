// src/components/UI/Clock.jsx
import React, { useState, useEffect } from 'react';
import { Clock as ClockIcon } from 'lucide-react';

const Clock = ({ value, onChange, disabled = false, className = '', autoClose = true }) => {
  const [hours, setHours] = useState(12);
  const [minutes, setMinutes] = useState(0);
  const [isPM, setIsPM] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        let h = date.getHours();
        const m = date.getMinutes();
        setIsPM(h >= 12);
        if (h === 0) h = 12;
        else if (h > 12) h -= 12;
        setHours(h);
        setMinutes(m);
      }
    }
  }, [value]);

  const handleTimeChange = (newHours, newMinutes, newIsPM) => {
    let h = newHours;
    if (newIsPM && h !== 12) h += 12;
    else if (!newIsPM && h === 12) h = 0;

    const date = value ? new Date(value) : new Date();
    date.setHours(h, newMinutes, 0, 0);
    
    onChange(date);
  };

  const incrementHours = () => {
    let newHours = hours + 1;
    if (newHours > 12) newHours = 1;
    handleTimeChange(newHours, minutes, isPM);
  };

  const decrementHours = () => {
    let newHours = hours - 1;
    if (newHours < 1) newHours = 12;
    handleTimeChange(newHours, minutes, isPM);
  };

  const incrementMinutes = () => {
    let newMinutes = minutes + 15;
    if (newMinutes >= 60) newMinutes = 0;
    handleTimeChange(hours, newMinutes, isPM);
  };

  const decrementMinutes = () => {
    let newMinutes = minutes - 15;
    if (newMinutes < 0) newMinutes = 45;
    handleTimeChange(hours, newMinutes, isPM);
  };

  const toggleAMPM = () => {
    handleTimeChange(hours, minutes, !isPM);
  };

  const displayTime = () => {
    const h = hours.toString().padStart(2, '0');
    const m = minutes.toString().padStart(2, '0');
    return `${h}:${m} ${isPM ? 'PM' : 'AM'}`;
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-3 border rounded-lg
          focus:ring-2 focus:ring-blue-500 focus:border-transparent
          flex items-center justify-between gap-2
          bg-white text-gray-900
          ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'hover:border-gray-400'}
          ${className.includes('border-red-500') ? 'border-red-500' : 'border-gray-300'}
        `}
      >
        <div className="flex items-center gap-2">
          <ClockIcon className="w-5 h-5 text-gray-500" />
          <span className="font-medium">{displayTime()}</span>
        </div>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && !disabled && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 z-20 bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-[280px]">
            <div className="flex items-center justify-center gap-6 mb-4">
              {/* Hours */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={incrementHours}
                  className="p-2 rounded-lg hover:bg-gray-100 transition mb-2"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <div className="text-4xl font-bold text-gray-900 w-16 text-center py-2">
                  {hours.toString().padStart(2, '0')}
                </div>
                <button
                  type="button"
                  onClick={decrementHours}
                  className="p-2 rounded-lg hover:bg-gray-100 transition mt-2"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <span className="text-xs text-gray-500 mt-1">Hours</span>
              </div>

              <div className="text-4xl font-bold text-gray-400">:</div>

              {/* Minutes */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={incrementMinutes}
                  className="p-2 rounded-lg hover:bg-gray-100 transition mb-2"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <div className="text-4xl font-bold text-gray-900 w-16 text-center py-2">
                  {minutes.toString().padStart(2, '0')}
                </div>
                <button
                  type="button"
                  onClick={decrementMinutes}
                  className="p-2 rounded-lg hover:bg-gray-100 transition mt-2"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <span className="text-xs text-gray-500 mt-1">Minutes</span>
              </div>

              {/* AM/PM */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => !isPM && toggleAMPM()}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    !isPM 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  AM
                </button>
                <div className="h-2"></div>
                <button
                  type="button"
                  onClick={() => isPM && toggleAMPM()}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    isPM 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  PM
                </button>
              </div>
            </div>

            {autoClose && (
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Clock;

