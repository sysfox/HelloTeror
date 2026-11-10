import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@fontsource/inter/latin-400.css"
import "@fontsource/inter/latin-500.css"
import "@fontsource/inter/latin-600.css"
import "@fontsource/inter/latin-700.css"
import "@fontsource/inter/latin-900.css"
import "@fontsource/qwitcher-grypen/latin-700.css"
import "@fontsource/ma-shan-zheng/chinese-simplified-400.css"
import { App } from "./App"
import "./styles.css"

const root = document.getElementById("app")
if (!root) throw new Error("missing #app")

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
