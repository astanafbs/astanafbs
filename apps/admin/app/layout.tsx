import './globals.css';

export const metadata = {
  title: 'FBS Astana Admin',
  description: 'Admin panel for FBS Astana',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
