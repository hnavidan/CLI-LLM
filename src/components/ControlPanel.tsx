import React from 'react';
import { css } from '@emotion/css';
import { Select, MultiSelect, Button, IconButton } from '@grafana/ui';
import { dateTime } from '@grafana/data';
import { CustomDateTimePicker } from './CustomDateTimePicker';
import { relativeTimeOptions, timeRangeTypeOptions } from '../constants/timeRanges';
import { FieldOption } from '../types/index';

interface ControlPanelProps {
  includePanel: boolean;
  setIncludePanel: (include: boolean) => void;
  fieldOptions: Array<{ label: string; value: string }>;
  selectedFieldIds: string[];
  setSelectedFieldIds: (ids: string[]) => void;
  availableFields: FieldOption[];
  handleSelectAllFields: () => void;
  selectedTimeRangeType: 'dashboard' | 'relative' | 'absolute';
  setSelectedTimeRangeType: (type: 'dashboard' | 'relative' | 'absolute') => void;
  relativeTime: string;
  setRelativeTime: (time: string) => void;
  absoluteTimeRange: { from: number; to: number };
  setAbsoluteTimeRange: React.Dispatch<React.SetStateAction<{ from: number; to: number }>>;
  includeScreenshot: boolean;
  setIncludeScreenshot: (include: boolean) => void;
  isAutoUpdateEnabled: boolean;
  setIsAutoUpdateEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  isAutoForwardingEnabled: boolean;
  setIsAutoForwardingEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  hasControlEndpoint: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  includePanel,
  setIncludePanel,
  fieldOptions,
  selectedFieldIds,
  setSelectedFieldIds,
  availableFields,
  handleSelectAllFields,
  selectedTimeRangeType,
  setSelectedTimeRangeType,
  relativeTime,
  setRelativeTime,
  absoluteTimeRange,
  setAbsoluteTimeRange,
  includeScreenshot,
  setIncludeScreenshot,
  isAutoUpdateEnabled,
  setIsAutoUpdateEnabled,
  isAutoForwardingEnabled,
  setIsAutoForwardingEnabled,
  hasControlEndpoint,
}) => {
  return (
    <div className={css`display: flex; flex-direction: column; flex: 1; gap: 8px;`}>
      <div className={css`font-weight: bold; margin-bottom: 8px;`}>Controls</div>
      
      <Button 
        onClick={() => setIncludePanel(!includePanel)} 
        variant={includePanel ? 'primary' : 'secondary'}
      >
        {includePanel ? 'Data Included' : 'Include Data'}
      </Button>
      
      {includePanel && (
        <>
          <div className={css`display: flex; align-items: center; margin-bottom: 4px;`}>
            <MultiSelect
              options={fieldOptions}
              value={selectedFieldIds}
              onChange={(items) => setSelectedFieldIds(items.map(item => item.value!).filter(Boolean))}
              placeholder="Select Data Fields"
              isClearable
              isSearchable
              className={css`
                flex: 1;
                
                /* Limit dropdown menu height */
                & > div:last-child > div {
                  max-height: 200px;
                  overflow-y: auto;
                }
                
                /* Ensure the component itself doesn't expand too much */
                & > div:first-child {
                  max-height: 32px;
                  overflow-y: hidden;
                  overflow-x: auto;
                }
                
                /* Make sure the input container wraps properly */
                & > div:first-child > div {
                  flex-wrap: nowrap;
                  overflow-x: auto;
                  scrollbar-width: thin;
                }
                
                /* Hide scrollbar for cleaner look (optional) */
                & > div:first-child > div::-webkit-scrollbar {
                  height: 4px;
                }
              `}
            />
            <IconButton
              name={selectedFieldIds.length === availableFields.length ? "check" : "plus"}
              tooltip={selectedFieldIds.length === availableFields.length ? "Deselect All Fields" : "Select All Fields"}
              onClick={handleSelectAllFields}
              className={css`margin-left: 8px;`}
            />
          </div>
        </>
      )}
      
      {includePanel && selectedFieldIds.length > 0 && (
        <>
          <div className={css`margin-top: 12px; font-weight: bold;`}>Data Time Range</div>
          <Select
            options={timeRangeTypeOptions}
            value={selectedTimeRangeType}
            onChange={(item) => setSelectedTimeRangeType(item.value as any)}
          />
          
          {selectedTimeRangeType === 'relative' && (
            <Select
              options={relativeTimeOptions}
              value={relativeTime}
              onChange={(item) => setRelativeTime(item.value!)}
            />
          )}
          
          {selectedTimeRangeType === 'absolute' && (
            <div className={css`position: relative; margin-bottom: 16px;`}>
              <div>
                <div className={css`font-size: 12px; margin-bottom: 4px;`}>From</div>
                <CustomDateTimePicker
                  date={dateTime(absoluteTimeRange.from)}
                  onChange={(date) => date && setAbsoluteTimeRange((prev) => ({ ...prev, from: date.valueOf() }))}
                />
              </div>
              <div>
                <div className={css`font-size: 12px; margin-top: 4px; margin-bottom: 4px;`}>To</div>
                <CustomDateTimePicker
                  date={dateTime(absoluteTimeRange.to)}
                  onChange={(date) => date && setAbsoluteTimeRange((prev) => ({ ...prev, to: date.valueOf() }))}
                />
              </div>
            </div>
          )}
        </>
      )}
      
      <Button 
        onClick={() => setIncludeScreenshot(!includeScreenshot)} 
        variant={includeScreenshot ? 'primary' : 'secondary'}
      >
        {includeScreenshot ? 'Screenshot Included' : 'Include Screenshot'}
      </Button>
      
      <Button
        variant={isAutoUpdateEnabled ? 'primary' : 'secondary'}
        icon={isAutoUpdateEnabled ? 'pause' : 'play'}
        onClick={() => setIsAutoUpdateEnabled(prev => !prev)}
        tooltip={isAutoUpdateEnabled ? 'Disable automatic data sending on refresh' : 'Enable automatic data sending on refresh'}
      >
        {isAutoUpdateEnabled ? 'Auto-Send Enabled' : 'Auto-Send Disabled'}
      </Button>
      
      <Button
        variant={isAutoForwardingEnabled ? 'primary' : 'secondary'}
        icon={isAutoForwardingEnabled ? 'pause' : 'upload'}
        onClick={() => setIsAutoForwardingEnabled(prev => !prev)}
        tooltip={isAutoForwardingEnabled ? 'Stop auto-forwarding new AI responses' : 'Automatically forward new AI responses to secondary endpoint'}
        disabled={!hasControlEndpoint}
      >
        {isAutoForwardingEnabled ? 'Auto-Forward Enabled' : 'Auto-Forward Disabled'}
      </Button>
    </div>
  );
};
