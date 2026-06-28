import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./auth/AuthProvider";
import { queryClient } from "./shared/queryClient";

const app = (
  <BrowserRouter>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </AuthProvider>
  </BrowserRouter>
);

createRoot(document.getElementById("root")!).render(
  import.meta.env.DEV ? <StrictMode>{app}</StrictMode> : app
);
