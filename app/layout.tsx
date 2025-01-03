import './globals.css';
import { Manrope } from 'next/font/google';

export const metadata = {
  title: 'Crypto Analyzer',
  description: 'Cryptocurrency analysis and recommendations',
};

const manrope = Manrope({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${manrope.className} bg-gray-50`}>
        {children}
      </body>
    </html>
  );
}
