import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import PDFForm from "./PDFForm";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <PDFForm />
  </StrictMode>
);
