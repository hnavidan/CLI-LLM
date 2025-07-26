import { useState, useEffect, useMemo } from 'react';
import { DataFrame } from '@grafana/data';
import { FieldOption } from '../types/index';
import { generateUniqueFieldId, extractMeasurementName } from '../utils/dataUtils';

/**
 * Hook for managing available data fields from the panel data
 */
export const useAvailableFields = (data?: { series?: DataFrame[] }) => {
  const [availableFields, setAvailableFields] = useState<FieldOption[]>([]);

  useEffect(() => {
    const fetchAvailableFields = () => {
      if (!data?.series || data.series.length === 0) {
        setAvailableFields([]);
        return;
      }

      const fieldMap = new Map<string, FieldOption>();

      data.series.forEach((series: DataFrame) => {
        const seriesName = series.name || '';

        series.fields
          .filter((f) => f.type !== 'time')
          .forEach((f) => {
            const uniqueId = generateUniqueFieldId(f, seriesName);
            const baseMeasurementName = extractMeasurementName(f);
            const thingIdLabel = f.labels?.thingId || f.labels?.tag_thingId;
            
            let displayTitle = baseMeasurementName;
            if (thingIdLabel) {
              displayTitle = `${baseMeasurementName} (${thingIdLabel})`;
            } else if (!thingIdLabel && seriesName && seriesName !== f.name && baseMeasurementName === "Value") {
              displayTitle = seriesName;
            }

            if (uniqueId && displayTitle && !fieldMap.has(uniqueId)) {
              fieldMap.set(uniqueId, {
                id: uniqueId,
                title: displayTitle,
              });
            }
          });
      });

      const fields = Array.from(fieldMap.values());
      setAvailableFields(fields);
    };

    fetchAvailableFields();
  }, [data]);

  const fieldOptions = useMemo(() => {
    return availableFields.map((field: FieldOption) => ({
      label: field.title,
      value: field.id,
    }));
  }, [availableFields]);

  return { availableFields, fieldOptions };
};
