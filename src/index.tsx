import React from "react";
import "./index.css";
import App from "./App";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "../src/store/store";

class WebComponent extends HTMLElement {
  connectedCallback() {
    const root = createRoot(this);
    root.render(
      <React.StrictMode>
        <Provider store={store}>
          <App />
        </Provider>
      </React.StrictMode>
    );
  }
}

const ELEMENT_NAME = "afci-eclaim-cx";

if (!customElements.get(ELEMENT_NAME)) {
  customElements.define(ELEMENT_NAME, WebComponent);
}
