"use client";

import { createContext, useContext, type ReactNode } from "react";

// Whether the current origin is a custom (customer) hostname — the value
// middleware derived from Host and the server layout read from x-custom-host
// (never client input). True only inside the (public) route group's layout;
// admin pages sit outside the provider and default to false (first-party).
const CustomHostContext = createContext(false);

export function CustomHostProvider({
  value,
  children,
}: {
  value: boolean;
  children: ReactNode;
}) {
  return (
    <CustomHostContext.Provider value={value}>
      {children}
    </CustomHostContext.Provider>
  );
}

export function useIsCustomHost(): boolean {
  return useContext(CustomHostContext);
}
