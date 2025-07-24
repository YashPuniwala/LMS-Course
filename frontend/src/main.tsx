import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import {Provider} from "react-redux"
import { appStore } from "./app/store.ts";
import { Toaster } from "./components/ui/sonner.tsx";
import { useLoadUserQuery } from "./features/api/authApi.tsx";

const Custom = ({children}: {children: React.ReactNode}) => {
  const {isLoading} = useLoadUserQuery()
  return <>{isLoading ? <h1>Loading...</h1> : <>{children}</>}</>
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={appStore}>
      <Custom>
      <App />
      </Custom>
      <Toaster />
    </Provider>
  </StrictMode>
);
