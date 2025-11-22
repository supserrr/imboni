import React, { createContext, useState, useContext } from 'react';

type CallState = 'idle' | 'connecting' | 'connected' | 'rating';

type CallContextType = {
  callState: CallState;
  setCallState: (state: CallState) => void;
  isCallActive: boolean;
};

const CallContext = createContext<CallContextType>({
  callState: 'idle',
  setCallState: () => {},
  isCallActive: false,
});

export const useCall = () => useContext(CallContext);

export const CallProvider = ({ children }: { children: React.ReactNode }) => {
  const [callState, setCallState] = useState<CallState>('idle');

  const isCallActive = callState === 'connecting' || callState === 'connected';

  return (
    <CallContext.Provider value={{ callState, setCallState, isCallActive }}>
      {children}
    </CallContext.Provider>
  );
};

