import localFont from "next/font/local";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const inter = localFont({
  src: "./fonts/inter.woff2",
  variable: "--font-inter-sans",
  weight: "500",
});

export { geistMono, geistSans, inter };
