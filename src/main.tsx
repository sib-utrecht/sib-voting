import { createRoot } from "react-dom/client";
import { ConvexProvider } from "convex/react";
import { ConvexReactClient } from "convex/react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App";
import ChooseRoom from "./pages/ChooseRoom";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <ConvexProvider client={convex}>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/choose" element={<ChooseRoom />} />
      </Routes>
    </ConvexProvider>
  </BrowserRouter>,
);
