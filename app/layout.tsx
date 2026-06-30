import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AssetKeeper",
  description: "Personal asset maintenance reminder — connected to LINE",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* LIFF SDK */}
        <script
          src="https://static.line-scdn.net/liff/edge/versions/2.22.3/sdk.js"
          async
        />
      </head>
      <body className="bg-gray-50 text-gray-900 min-h-screen">{children}</body>
    </html>
  );
}
