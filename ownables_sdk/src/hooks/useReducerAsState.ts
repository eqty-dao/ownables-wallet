import { useReducer } from "react";

export function useReducerAsState<T>(initialState: T) {
    const reducer = (state: T, newState: Partial<T>) => ({
      ...state,
      ...newState,
    });
    const [state, setState] = useReducer(reducer, initialState);
  
    return [state, setState] as const;
  }