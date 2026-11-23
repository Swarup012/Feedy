'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { ExpertRange } from './RangePills';

type DashboardRangeValue = {
  range: ExpertRange;
  setRange: (range: ExpertRange) => void;
};

const DashboardRangeContext = createContext<DashboardRangeValue>({
  range: '30d',
  setRange: () => {},
});

export function DashboardRangeProvider({ children }: { children: ReactNode }) {
  const [range, setRange] = useState<ExpertRange>('30d');
  return (
    <DashboardRangeContext.Provider value={{ range, setRange }}>
      {children}
    </DashboardRangeContext.Provider>
  );
}

export function useDashboardRange() {
  return useContext(DashboardRangeContext);
}
