import { DataFrame, TimeRange, RawTimeRange, dateTime } from '@grafana/data';
import { SerializationResult, IncrementalDataResult } from '../types/index';
import { generateUniqueFieldId, formatTimestamp } from '../utils/dataUtils';
import { logger } from '../utils/logger';

export class DataProcessor {
  /**
   * Serializes data for multiple panels based on selected fields
   */
  static serializeDataForMultiplePanels(
    series: DataFrame,
    uniqueId: string,
    timeRange: { from: any; to: any },
    sinceTimestamp: number | null = null,
    autoPromptInterval: number | null = null
  ): SerializationResult {
    const timeColumn = series.fields.find((field) => field.type === 'time');
    const valueField = series.fields.find((field) => field.name === uniqueId);

    if (!timeColumn || !valueField) {
      logger.warn(`serializeData: Could not find time column or value field for uniqueId: ${uniqueId}`);
      return { data: {}, latestTimestamp: null };
    }

    const fromValue = typeof timeRange.from === 'number' ? timeRange.from : timeRange.from.valueOf();
    const toValue = typeof timeRange.to === 'number' ? timeRange.to : timeRange.to.valueOf();
    const times = timeColumn.values.toArray();
    const values = valueField.values.toArray();

    const startIndex = times.findIndex((time) => time >= fromValue);
    if (startIndex === -1) {
      return { data: {}, latestTimestamp: null };
    }
    const endIndex = times.findIndex((time) => time > toValue);
    const finalIndex = endIndex === -1 ? times.length - 1 : endIndex - 1;

    let latestTimestamp: number | null = null;
    for (let i = startIndex; i <= finalIndex; i++) {
      const timestamp = times[i];
      if (latestTimestamp === null || timestamp > latestTimestamp) {
        latestTimestamp = timestamp;
      }
    }

    const intervalStart =
      autoPromptInterval && sinceTimestamp !== null && latestTimestamp !== null
        ? latestTimestamp - autoPromptInterval * 1000
        : null;

    const data: Record<string, any> = {};

    for (let i = startIndex; i <= finalIndex; i++) {
      const timestamp = times[i];
      const value = values[i];

      if (
        (sinceTimestamp === null || timestamp > sinceTimestamp) &&
        (intervalStart === null || timestamp >= intervalStart) &&
        value !== null && value !== undefined
      ) {
        const formattedTimestamp = formatTimestamp(timestamp);
        data[formattedTimestamp] = data[formattedTimestamp] || {};
        data[formattedTimestamp][uniqueId] = value;
      }
    }

    return { data, latestTimestamp };
  }

  /**
   * Restructures panel data for combined output
   */
  static restructurePanelData(allFieldsData: Record<string, any[]>): Record<string, Record<string, any>> {
    const combinedData: Record<string, Record<string, any>> = {};

    Object.entries(allFieldsData).forEach(([uniqueId, seriesDataArray]) => {
      seriesDataArray.forEach((seriesData: Record<string, any>) => {
        Object.entries(seriesData).forEach(([timestamp, valuesAtTimestamp]) => {
          combinedData[timestamp] = combinedData[timestamp] || {};
          Object.assign(combinedData[timestamp], valuesAtTimestamp);
        });
      });
    });

    return combinedData;
  }

  /**
   * Processes incremental data updates
   */
  static processIncrementalData(
    data: { series?: DataFrame[] },
    selectedFieldIds: string[],
    sinceTimestamp: number | null
  ): IncrementalDataResult {
    const allFieldsData: Record<string, any[]> = {};
    let newLatestIncludedTimestamp: number | null = null;

    if (!data?.series || data.series.length === 0) {
      return { incrementalData: {}, latestTimestampInBatch: null };
    }

    data.series.forEach((series) => {
      const timeColumn = series.fields.find((f) => f.type === 'time');
      if (!timeColumn) {
        return;
      }

      series.fields
        .filter((f) => f.type !== 'time')
        .forEach((valueField) => {
          const uniqueId = generateUniqueFieldId(valueField, series.name || '');

          if (selectedFieldIds.includes(uniqueId)) {
            const times = timeColumn.values.toArray();
            const values = valueField.values.toArray();
            const seriesData: Record<string, any> = {};

            for (let i = 0; i < times.length; i++) {
              const timestamp = times[i];
              if (sinceTimestamp === null || timestamp > sinceTimestamp) {
                const formattedTimestamp = formatTimestamp(timestamp);
                seriesData[formattedTimestamp] = seriesData[formattedTimestamp] || {};
                seriesData[formattedTimestamp][uniqueId] = values[i];
                if (newLatestIncludedTimestamp === null || timestamp > newLatestIncludedTimestamp) {
                  newLatestIncludedTimestamp = timestamp;
                }
              }
            }
            if (Object.keys(seriesData).length > 0) {
              if (!allFieldsData[uniqueId]) {
                allFieldsData[uniqueId] = [];
              }
              allFieldsData[uniqueId].push(seriesData);
            }
          }
        });
    });

    const combinedData = this.restructurePanelData(allFieldsData);
    return { incrementalData: combinedData, latestTimestampInBatch: newLatestIncludedTimestamp };
  }

  /**
   * Logs panel data with time range processing
   */
  static logPanelData(
    data: { series?: DataFrame[] },
    includePanel: boolean,
    selectedFieldIds: string[],
    timeRange: TimeRange,
    selectedTimeRangeType: 'dashboard' | 'relative' | 'absolute',
    relativeTime: string,
    absoluteTimeRange: { from: number; to: number },
    sinceTimestamp: number | null = null,
    autoPromptInterval: number | null = null
  ): { data: any; timeRange: TimeRange; latestTimestamp: number | null } | null {
    if (!data?.series) {
      logger.warn("logPanelData called with no data series.");
      return null;
    }
    if (!includePanel || selectedFieldIds.length === 0) {
      logger.log("logPanelData: Data inclusion disabled or no fields selected.");
      return null;
    }

    // Time Range Logic
    let customTimeRange: TimeRange = timeRange;
    let raw: RawTimeRange;
    
    if (selectedTimeRangeType === 'relative') {
      const now = dateTime();
      const num = parseInt(relativeTime.slice(0, -1), 10);
      const unitLetter = relativeTime.slice(-1);
      let unit: 'seconds' | 'minutes' | 'hours' | 'days';
      if (unitLetter === 's') { unit = 'seconds'; }
      else if (unitLetter === 'm') { unit = 'minutes'; }
      else if (unitLetter === 'h') { unit = 'hours'; }
      else { unit = 'days'; }
      const from = dateTime().subtract(num, unit);
      raw = { from: `now-${relativeTime}`, to: 'now' };
      customTimeRange = { from, to: now, raw };
    } else if (selectedTimeRangeType === 'absolute') {
      const from = dateTime(absoluteTimeRange.from);
      const to = dateTime(absoluteTimeRange.to);
      raw = { from, to };
      customTimeRange = { from, to, raw };
    } else {
      raw = timeRange.raw;
      customTimeRange = timeRange;
    }

    const allFieldsData: Record<string, any[]> = {};
    let latestTimestamp: number | null = null;

    data.series.forEach((series) => {
      series.fields
        .filter((f) => f.type !== 'time')
        .forEach((valueField) => {
          const uniqueId = generateUniqueFieldId(valueField, series.name || '');

          if (uniqueId && selectedFieldIds.includes(uniqueId)) {
            logger.log(`Processing data for selected field: ${uniqueId}`);
            const { data: seriesData, latestTimestamp: seriesLatestTimestamp } = this.serializeDataForMultiplePanels(
              series,
              uniqueId,
              customTimeRange,
              sinceTimestamp,
              autoPromptInterval
            );
            if (seriesData && Object.keys(seriesData).length > 0) {
              if (!allFieldsData[uniqueId]) {
                allFieldsData[uniqueId] = [];
              }
              allFieldsData[uniqueId].push(seriesData);
            }
            if (seriesLatestTimestamp !== null && (latestTimestamp === null || seriesLatestTimestamp > latestTimestamp)) {
              latestTimestamp = seriesLatestTimestamp;
            }
          }
        });
    });

    const combinedData = this.restructurePanelData(allFieldsData);
    logger.log('Final Combined Data before sending:', JSON.stringify(combinedData, null, 2));

    return { data: combinedData, timeRange: customTimeRange, latestTimestamp };
  }
}
