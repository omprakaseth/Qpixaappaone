import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const sora = Sora({ subsets: ["latin"], weight: ['400', '600'] });

export const metadata: Metadata = {
  title: "Qpixa - AI Image & Video Generator",
  description: "A full-featured AI art generation and social platform where creators can generate, share, and discover amazing AI-powered content.",
  manifest: "/manifest.json",
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for(let registration of registrations) {
                    registration.unregister();
                  }
                });
              }
            `,
          }}
        />
      </head>
      <body className={sora.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
