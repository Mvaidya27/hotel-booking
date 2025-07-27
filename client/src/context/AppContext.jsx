import axios from "axios";
import { createContext } from "react";

axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

const AppContext = createContext();

export const AppProvider = ({children})=> {
    return (
        <AppContext.Provider>
            
        </AppContext.Provider>
    )
}