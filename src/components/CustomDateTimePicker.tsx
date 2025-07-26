import React, { useState, useEffect, useRef } from 'react';
import { css } from '@emotion/css';
import { Button, useTheme2, IconButton } from '@grafana/ui';
import { dateTime } from '@grafana/data';
import { CustomDateTimePickerProps } from '../types/index';

export const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({ date, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dateValue, setDateValue] = useState(date.format('DD/MM/YYYY HH:mm:ss'));
  const [dateInputValue, setDateInputValue] = useState(date.format('YYYY-MM-DD'));
  const [timeInputValue, setTimeInputValue] = useState(date.format('HH:mm'));
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme2();

  useEffect(() => {
    setDateValue(date.format('DD/MM/YYYY HH:mm:ss'));
    setDateInputValue(date.format('YYYY-MM-DD'));
    setTimeInputValue(date.format('HH:mm'));
  }, [date]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateValue(e.target.value);
  };

  const handleBlur = () => {
    let newDate = dateTime(dateValue, 'DD/MM/YYYY HH:mm:ss');
    if (!newDate.isValid()) {
      newDate = dateTime(dateValue);
    }
    if (newDate.isValid()) {
      onChange(newDate);
    } else {
      setDateValue(date.format('DD/MM/YYYY HH:mm:ss'));
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateStr = e.target.value;
    setDateInputValue(dateStr);
    const dateParts = dateStr.split('-');
    if (dateParts.length === 3) {
      const euroDateStr = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
      const currentTime = timeInputValue || date.format('HH:mm');
      setDateValue(`${euroDateStr} ${currentTime}`);
    }
    const newDateTime = dateTime(`${dateStr} ${timeInputValue || date.format('HH:mm')}`);
    if (newDateTime.isValid()) {
      onChange(newDateTime);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeStr = e.target.value;
    setTimeInputValue(timeStr);
    const displayDate = date.format('DD/MM/YYYY');
    setDateValue(`${displayDate} ${timeStr}:00`);
    const currentDate = dateInputValue || date.format('YYYY-MM-DD');
    const newDateTime = dateTime(`${currentDate} ${timeStr}`);
    if (newDateTime.isValid()) {
      onChange(newDateTime);
    }
  };

  return (
    <div ref={containerRef} className={css`position: relative; width: 100%;`}>
      <div className={css`position: relative; display: flex; align-items: center;`}>
        <input
          type="text"
          value={dateValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          className={css`width: 100%; padding: 8px; padding-right: 40px; border: 1px solid ${theme.colors.border.medium}; border-radius: 2px;`}
        />
        <div className={css`position: absolute; right: 8px; top: 50%; transform: translateY(-50%); cursor: pointer;`}>
          <IconButton name="calendar-alt" onClick={() => setIsOpen(!isOpen)} tooltip="Select date and time" />
        </div>
      </div>
      {isOpen && (
        <div
          className={css`
            position: absolute; z-index: 1000; bottom: 100%; left: 0; margin-bottom: 4px;
            background: ${theme.colors.background.primary}; border: 1px solid ${theme.colors.border.medium};
            border-radius: 2px; box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.2); padding: 12px;
            display: flex; flex-direction: column; gap: 8px; min-width: 240px;
          `}
        >
          <div>
            <label className={css`display: block; margin-bottom: 4px; font-size: 12px;`}>Date:</label>
            <input
              type="date"
              value={dateInputValue}
              onChange={handleDateChange}
              className={css`width: 100%; padding: 6px; border: 1px solid ${theme.colors.border.medium}; border-radius: 2px;`}
            />
          </div>
          <div>
            <label className={css`display: block; margin-bottom: 4px; font-size: 12px;`}>Time:</label>
            <input
              type="time"
              value={timeInputValue}
              onChange={handleTimeChange}
              step="1"
              className={css`width: 100%; padding: 6px; border: 1px solid ${theme.colors.border.medium}; border-radius: 2px;`}
            />
          </div>
          <Button size="sm" onClick={() => setIsOpen(false)} variant="secondary">Close</Button>
        </div>
      )}
    </div>
  );
};
