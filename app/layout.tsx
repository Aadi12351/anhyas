import type { Metadata } from 'next';import './globals.css';
export const metadata:Metadata={title:'अभ्यास | MPSC गट क',description:'मराठीत वेळबद्ध MPSC गट क सराव व वैयक्तिक अभ्यास विश्लेषण.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="mr"><body>{children}</body></html>;}
