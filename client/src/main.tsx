import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; // ✅ import router
import App from "./App";
import "./index.css";

// ✅ Grab the root element safely
const container = document.getElementById("root");

if (!container) {
  throw new Error("Root element #root not found in index.html");
}

// ✅ Create React root & render App inside Router
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
