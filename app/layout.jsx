import './globals.css';

export const metadata = {
  title: 'Prop Firm Dashboard',
  description: 'Trading Dashboard for tracking equity and growth',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
