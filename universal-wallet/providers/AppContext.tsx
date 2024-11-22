import React from "react";
export interface AppContextType {
    currentAction: CurrentState | string;
    setCurrentAction: (action: string) => void;
}

export const AppContext = React.createContext<AppContextType>({
    currentAction: "",
    setCurrentAction: () => { }
});

const AppProvider = ({ children }: { children: any }) => {
    const [currentAction, setCurrentAction] = React.useState<string>("");
    return (
        <AppContext.Provider value={{ currentAction, setCurrentAction }}>
            {children}
        </AppContext.Provider>
    );
};

const useAppContext = () => React.useContext(AppContext);
export { useAppContext, AppProvider };

export enum CurrentState {
    CHOSE_PHOTO_DIALOG_OPEN = "CHOSE_PHOTO_DIALOG_OPEN",
}