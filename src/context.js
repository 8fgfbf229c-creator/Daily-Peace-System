import { createContext, useContext } from 'react';

export const AppContext = createContext(null);

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('Reset is still starting.');
  return value;
}
