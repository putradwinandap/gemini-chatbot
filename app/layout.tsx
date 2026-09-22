import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gemini Chat", description: "Room based Gemini chatbot" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
