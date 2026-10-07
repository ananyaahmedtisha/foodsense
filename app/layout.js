import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HomeBackLink from '@/components/HomeBackLink';

export const metadata = {
  title: 'FoodSense — Food Science for Student Life',
  description: 'Simple food safety, hygiene and nutrition for university students. SDG 3 • 4 • 12.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="max-w-6xl mx-auto px-4"><HomeBackLink />{children}</main>
        <Footer />
      </body>
    </html>
  );
}
