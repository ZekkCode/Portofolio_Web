import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "8px",
          background: "linear-gradient(135deg, #1b45c4 0%, #0b2a8a 100%)",
          color: "#ffffff",
          fontSize: 20,
          fontWeight: 900,
          fontFamily: "sans-serif",
          letterSpacing: "-0.04em",
        }}
      >
        Z
      </div>
    ),
    {
      ...size,
    }
  );
}
