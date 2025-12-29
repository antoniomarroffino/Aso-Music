import { createContext, useContext } from "react";

export type ProgressContextType = {
    progress: number;
    duration: number;
};

export const ProgressContext = createContext<ProgressContextType>({
    progress: 0,
    duration: 0,
});

export const useProgress = () => {
    return useContext(ProgressContext);
};