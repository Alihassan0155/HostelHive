// src/components/UI/Calendar.jsx
import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  getDaysInMonth, 
  getFirstDayOfMonth, 
  getMonthName, 
  isSameDay,
  isToday,
  isPast
} from '../../utils/dateUtils';

const Calendar = ({ value, onChange, disabled = false, minDate = null, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
        setCurrentMonth(new Date(date.getFullYear(), date.getMonth()));
      }
    }
  }, [value]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const handleDateSelect = (day) => {
    const newDate = new Date(year, month, day);
    if (minDate) {
      const min = new Date(minDate);
      min.setHours(0, 0, 0, 0);
      newDate.setHours(0, 0, 0, 0);
      if (newDate < min) return;
    }
    
    setSelectedDate(newDate);
    onChange(newDate);
    setIsOpen(false);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(year, month - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth()));
    setSelectedDate(today);
    onChange(today);
  };

  const displayDate = () => {
    if (!selectedDate) return 'Select date';
    return selectedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const days = [];
  
  // Empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

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
          <CalendarIcon className="w-5 h-5 text-gray-500" />
          <span className="font-medium">{displayDate()}</span>
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
          <div className="absolute top-full left-0 mt-2 z-20 bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-[320px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={goToPreviousMonth}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              
              <div className="text-lg font-semibold text-gray-900">
                {getMonthName(month)} {year}
              </div>
              
              <button
                type="button"
                onClick={goToNextMonth}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* Day labels */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                <div key={idx} className="text-center text-xs font-semibold text-gray-500 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, idx) => {
                if (day === null) {
                  return <div key={idx} className="aspect-square" />;
                }

                const date = new Date(year, month, day);
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                const isCurrentDay = isToday(date);
                const isDisabled = minDate && date < new Date(minDate);

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => !isDisabled && handleDateSelect(day)}
                    disabled={isDisabled}
                    className={`
                      aspect-square rounded-lg text-sm font-medium transition
                      ${isSelected 
                        ? 'bg-blue-600 text-white' 
                        : isCurrentDay
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        : 'hover:bg-gray-100 text-gray-700'
                      }
                      ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex gap-2 pt-4 mt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={goToToday}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Calendar;

