import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@fontsource/outfit/latin-400.css"
import "@fontsource/outfit/latin-500.css"
import "@fontsource/outfit/latin-600.css"
import "@fontsource/fraunces/latin-500-italic.css"
import "@fontsource/fraunces/latin-600.css"
import { App } from "./App"
import "./styles.css"

const root = document.getElementById("app")
if (!root) throw new Error("missing #app")

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
