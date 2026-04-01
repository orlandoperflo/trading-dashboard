// app/layout.jsx
import './globals.css';

export const metadata = {
  title: 'Prop Firm Dashboard',
  description: 'Trading dashboard',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
