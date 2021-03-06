/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { ReactNode, useMemo, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { fromQuery, toQuery } from '../components/shared/Links/url_helpers';
import { useFetcher } from '../hooks/useFetcher';
import { useUrlParams } from '../hooks/useUrlParams';

export const LegacyChartsSyncContext = React.createContext<{
  hoverX: number | null;
  onHover: (hoverX: number) => void;
  onMouseLeave: () => void;
  onSelectionEnd: (range: { start: number; end: number }) => void;
} | null>(null);

export function LegacyChartsSyncContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const history = useHistory();
  const [time, setTime] = useState<number | null>(null);
  const { serviceName } = useParams<{ serviceName?: string }>();
  const { urlParams, uiFilters } = useUrlParams();

  const { start, end } = urlParams;
  const { environment } = uiFilters;

  const { data = { annotations: [] } } = useFetcher(
    (callApmApi) => {
      if (start && end && serviceName) {
        return callApmApi({
          pathname: '/api/apm/services/{serviceName}/annotation/search',
          params: {
            path: {
              serviceName,
            },
            query: {
              start,
              end,
              environment,
            },
          },
        });
      }
    },
    [start, end, environment, serviceName]
  );

  const value = useMemo(() => {
    const hoverXHandlers = {
      onHover: (hoverX: number) => {
        setTime(hoverX);
      },
      onMouseLeave: () => {
        setTime(null);
      },
      onSelectionEnd: (range: { start: number; end: number }) => {
        setTime(null);

        const currentSearch = toQuery(history.location.search);
        const nextSearch = {
          rangeFrom: new Date(range.start).toISOString(),
          rangeTo: new Date(range.end).toISOString(),
        };

        history.push({
          ...history.location,
          search: fromQuery({
            ...currentSearch,
            ...nextSearch,
          }),
        });
      },
      hoverX: time,
      annotations: data.annotations,
    };

    return { ...hoverXHandlers };
  }, [history, time, data.annotations]);

  return <LegacyChartsSyncContext.Provider value={value} children={children} />;
}

export const ChartsSyncContext = React.createContext<{
  event: any;
  setEvent: Function;
} | null>(null);

export function ChartsSyncContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [event, setEvent] = useState({});

  return (
    <ChartsSyncContext.Provider
      value={{ event, setEvent }}
      children={children}
    />
  );
}
