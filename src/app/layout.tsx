export const metadata = {
  title: 'JaloPermit Web',
  description: 'JaloPermit web application',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
