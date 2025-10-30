"use client";

import React, { useState, useRef, useEffect } from "react";
import { Clock } from "lucide-react";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function TimePicker({
  value,
  onChange,
  placeholder = "Pilih waktu...",
  className = "",
  disabled = false,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState("");
  const [selectedMinute, setSelectedMinute] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const [hour, minute] = value.split(":");
      setSelectedHour(hour || "");
      setSelectedMinute(minute || "");
    } else {
      setSelectedHour("");
      setSelectedMinute("");
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatTime = (hour: string, minute: string) => {
    if (!hour || !minute) return "";
    return `${hour}:${minute}`;
  };

  const handleTimeSelect = (hour: string, minute: string) => {
    const timeString = formatTime(hour, minute);
    onChange(timeString);
    setIsOpen(false);
  };

  const generateHours = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push(i.toString().padStart(2, "0"));
    }
    return hours;
  };

  const generateMinutes = () => {
    const minutes = [];
    for (let i = 0; i < 60; i++) {
      minutes.push(i.toString().padStart(2, "0"));
    }
    return minutes;
  };

  const displayTime = value || placeholder;
  const isPlaceholder = !value;

  return (
    <div ref={pickerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          transition-all duration-200 ease-in-out
          ${
            disabled
              ? "bg-gray-100 cursor-not-allowed opacity-60"
              : "hover:border-gray-400 cursor-pointer"
          }
          ${isOpen ? "ring-2 ring-blue-500 border-blue-500" : ""}
          flex items-center justify-between
        `}
      >
        <span
          className={`block truncate ${
            !isPlaceholder ? "text-gray-900" : "text-gray-500"
          }`}
        >
          {isPlaceholder ? displayTime : `${selectedHour}:${selectedMinute}`}
        </span>
        <Clock className="w-5 h-5 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-72 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          {/* Time Selection */}
          <div className="p-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Pilih Waktu
              </h3>
              <div className="text-3xl font-mono font-bold text-blue-600">
                {selectedHour || "--"}:{selectedMinute || "--"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Hour Selection */}
              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Jam
                </label>
                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg bg-gray-50">
                  {generateHours().map((hour) => (
                    <button
                      key={hour}
                      type="button"
                      onClick={() => setSelectedHour(hour)}
                      className={`
                        w-full py-2 px-3 text-sm transition-colors hover:bg-blue-100
                        ${
                          selectedHour === hour
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "text-gray-700"
                        }
                      `}
                    >
                      {hour}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minute Selection */}
              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Menit
                </label>
                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg bg-gray-50">
                  {generateMinutes().map((minute) => (
                    <button
                      key={minute}
                      type="button"
                      onClick={() => setSelectedMinute(minute)}
                      className={`
                        w-full py-2 px-3 text-sm transition-colors hover:bg-blue-100
                        ${
                          selectedMinute === minute
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "text-gray-700"
                        }
                      `}
                    >
                      {minute}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Time Buttons */}
            <div className="mt-6">
              <p className="text-sm font-medium text-gray-700 mb-3 text-center">
                Waktu Cepat
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "04:00", value: "04:00" },
                  { label: "04:30", value: "04:30" },
                  { label: "12:00", value: "12:00" },
                  { label: "22:00", value: "22:00" },
                ].map((time) => (
                  <button
                    key={time.value}
                    type="button"
                    onClick={() =>
                      handleTimeSelect(
                        time.value.split(":")[0],
                        time.value.split(":")[1]
                      )
                    }
                    className="py-2 px-3 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors font-medium"
                  >
                    {time.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleTimeSelect(selectedHour, selectedMinute)}
                disabled={!selectedHour || !selectedMinute}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
              >
                Pilih
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
