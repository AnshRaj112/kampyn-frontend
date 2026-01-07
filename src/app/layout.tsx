import Footer from "./components/Footer";
import "./globals.css"; // Optional global styles
import { GoogleOAuthProvider } from "@react-oauth/google";// Import AuthProvider
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { Metadata } from "next";
import { SearchCartProvider } from './components/context/SearchCartContext';
import ConditionalHeader from './components/ConditionalHeader';
import Snowflakes from './components/Snowflakes';

export const metadata: Metadata = {
  title: {
    default: "KAMPYN - Campus Food Ordering Platform",
    template: "%s | KAMPYN"
  },
  description: "KAMPYN is your one-stop solution for campus food ordering. Order from your favorite campus restaurants, track deliveries, and enjoy hassle-free food ordering at KIIT University.",
  keywords: ["campus food", "food delivery", "KIIT University", "online food ordering", "campus restaurants", "food delivery app"],
  authors: [{ name: "KAMPYN Team" }],
  creator: "KAMPYN",
  publisher: "KAMPYN",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://kampyn.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://kampyn.com',
    siteName: 'KAMPYN',
    title: 'KAMPYN - Campus Food Ordering Platform',
    description: 'Order food from your favorite campus restaurants at KIIT University',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'KAMPYN - Campus Food Ordering',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KAMPYN - Campus Food Ordering Platform',
    description: 'Order food from your favorite campus restaurants at KIIT University',
    images: ['/twitter-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  verification: {
    google: 'your-google-site-verification',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  return (
    <html lang="en">
      {/* <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </head> */}
      <body>
        <Snowflakes />
        <GoogleOAuthProvider clientId={googleClientId}>
            <SearchCartProvider>
              <ConditionalHeader />
              <main>{children}</main>
              <Footer />
            </SearchCartProvider>
        </GoogleOAuthProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
