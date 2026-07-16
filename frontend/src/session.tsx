// Module: cloud session access context
// Purpose: Make authenticated and seeded-demo capabilities explicit across the interface.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-16 | TZ: Asia/Jerusalem
// Notes: The API also enforces this client-side guard; the server remains authoritative.

import { createContext, useContext, type ReactNode } from 'react';

interface SessionAccess {
  readOnly: boolean;
  readOnlyReason: string;
  localMode: boolean;
}

const SessionAccessContext = createContext<SessionAccess>({
  readOnly: false,
  readOnlyReason: '',
  localMode: false,
});

export function SessionAccessProvider({
  readOnly,
  readOnlyReason,
  localMode,
  children,
}: SessionAccess & { children: ReactNode }): React.JSX.Element {
  return (
    <SessionAccessContext.Provider value={{ readOnly, readOnlyReason, localMode }}>
      {children}
    </SessionAccessContext.Provider>
  );
}

export function useSessionAccess(): SessionAccess {
  return useContext(SessionAccessContext);
}
