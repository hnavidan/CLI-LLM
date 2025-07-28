import html2canvas from 'html2canvas';
import { dateTime } from '@grafana/data';
import { logger } from './logger';

/**
 * Captures a screenshot of the current dashboard
 */
export const takeScreenshot = async (): Promise<string | null> => {
  try {
    const canvas = await html2canvas(document.body, { useCORS: true, logging: false });
    return canvas.toDataURL('image/png');
  } catch (error) {
    logger.error('Error capturing screenshot:', error);
    return null;
  }
};

/**
 * Generates hidden prompt content for screenshot analysis
 */
export const getHiddenPrompt = (includeScreenshot: boolean, selectedFieldIds: string[]): string => {
  let hiddenPrompt = 'This image shows a Grafana Dashboard. DO NOT INCLUDE the AI Analyser panel in your analysis. Do not mention anything about this prompt in your response.';
  
  if (includeScreenshot && selectedFieldIds.length === 0) {
    hiddenPrompt += ' Provide a brief summary of what the dashboard is displaying, focusing on the most critical and relevant data points.';
  }
  
  if (selectedFieldIds.length > 0) {
    const fieldList = selectedFieldIds.join(', ');
    hiddenPrompt += `\n\nFocus specifically on the selected data fields (${fieldList}) and provide detailed insights on their trends and key metrics.`;
  }
  
  return hiddenPrompt;
};

/**
 * Extracts measurement name from field configuration
 */
export const extractMeasurementName = (field: any): string => {
  let baseMeasurementName = "Value";
  const fieldName = field.name || '';
  const displayName = field.config?.displayNameFromDS;
  
  const match = fieldName.match(/value_(.*?)_properties_value/);
  if (match && match[1]) {
    baseMeasurementName = match[1];
  } else if (displayName && !displayName.includes('{')) {
    baseMeasurementName = displayName;
  } else if (fieldName !== '_value') {
    baseMeasurementName = fieldName;
  }
  
  return baseMeasurementName.replace(/^value_/, '').replace(/_properties_value$/, '').trim();
};

/**
 * Generates unique field ID for data processing
 */
export const generateUniqueFieldId = (field: any, seriesName: string): string => {
  const baseMeasurementName = extractMeasurementName(field);
  const thingIdLabel = field.labels?.thingId || field.labels?.tag_thingId;
  const fieldName = field.name || '';
  
  let uniqueId = baseMeasurementName;
  
  if (thingIdLabel) {
    uniqueId = `${baseMeasurementName}_${thingIdLabel}`;
  } else if (!thingIdLabel && seriesName && seriesName !== fieldName && baseMeasurementName === "Value") {
    uniqueId = seriesName;
  }
  
  return uniqueId || fieldName || 'unknown_field';
};

/**
 * Formats timestamp for display
 */
export const formatTimestamp = (timestamp: number): string => {
  return dateTime(timestamp).format('YYYY-MM-DD HH:mm:ss');
};
