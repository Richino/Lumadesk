import "./globals.css";
import "./checkout.css";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "LumaDesk Pro | Work, elevated.",
  description: "A premium standing desk crafted for a more intentional workday.",
  alternates: { canonical: "/" },
  openGraph: { title: "LumaDesk Pro | Work, elevated.", description: "A premium standing desk crafted for a more intentional workday.", images: ["/images/lumadesk-product-master.png"] },
  twitter: { card: "summary_large_image", title: "LumaDesk Pro | Work, elevated.", description: "A premium standing desk crafted for a more intentional workday.", images: ["/images/lumadesk-product-master.png"] },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fafafa",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
