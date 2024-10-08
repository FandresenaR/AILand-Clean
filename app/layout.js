import localFont from "next/font/local";
import "./globals.css";
import { Montserrat_Alternates } from 'next/font/google';
import Head from 'next/head';

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
const montserratAlternates = Montserrat_Alternates({
  subsets: ['latin'],
  weight: ['400', '700'], // Add the weights you need, e.g., normal (400) and bold (700)
  variable: '--font-montserrat-alternates',
});

export const metadata = {
  title: "AiLandClean",
  description: "Latrine Rate Metrics",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <Head>
        <link href='https://api.mapbox.com/mapbox-gl-js/v2.9.1/mapbox-gl.css' rel='stylesheet' />
      </Head>
      <body>{children}</body>
    </html>
  );
}
