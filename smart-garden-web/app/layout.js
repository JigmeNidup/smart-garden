import { Inter } from 'next/font/google';
import { ConfigProvider } from 'antd';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Smart Garden Dashboard',
  description: 'Monitor your smart garden sensors in real-time',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#52c41a',
              borderRadius: 8,
            },
          }}
        >
          {children}
        </ConfigProvider>
      </body>
    </html>
  );
}