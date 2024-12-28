import React from "react";

export const VisuallyHidden = ({ children }) => (
  <span
    style={{
      position: "absolute",
      width: "1px",
      height: "1px",
      margin: "-1px",
      padding: "0",
      border: "0",
      overflow: "hidden",
      clip: "rect(0, 0, 0, 0)",
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </span>
);
