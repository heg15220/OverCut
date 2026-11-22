import { createContext, useContext } from "react";

/** Everything a screen of the manager needs: the career and the ways to change it. */
export const ManagerContext = createContext(null);

export const useManager = () => useContext(ManagerContext);
