// Module: cloud session access context
// Purpose: Make authenticated and seeded-demo capabilities explicit across the interface.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-16 | TZ: Asia/Jerusalem
// Notes: The API also enforces this client-side guard; the server remains authoritative.

import { createContext, useContext, type ReactNode } from 'react';

export interface SessionAccess {
  readOnly: boolean;
  readOnlyReason: string;
  localMode: boolean;
  recordingOwnerScope: string;
}

const SessionAccessContext = createContext<SessionAccess>({
  readOnly: false,
  readOnlyReason: '',
  localMode: false,
  recordingOwnerScope: 'local:device',
});

export function SessionAccessProvider({
  readOnly,
  readOnlyReason,
  localMode,
  recordingOwnerScope = 'local:device',
  children,
}: Omit<SessionAccess, 'recordingOwnerScope'> & {
  recordingOwnerScope?: string;
  children: ReactNode;
}): React.JSX.Element {
  return (
    <SessionAccessContext.Provider value={{
      readOnly,
      readOnlyReason,
      localMode,
      recordingOwnerScope,
    }}>
      {children}
    </SessionAccessContext.Provider>
  );
}

export function useSessionAccess(): SessionAccess {
  return useContext(SessionAccessContext);
}
