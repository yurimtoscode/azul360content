import type { Metadata } from 'next';
import './globals.css';
import { artworkCSS } from '@/components/templates/Artwork';
import { carouselCSS } from '@/components/templates/CarouselArtwork';
export const metadata: Metadata = { title: 'Azul360 Content Studio', description: 'Criação e revisão de conteúdo da Azul360' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR"><head><style dangerouslySetInnerHTML={{ __html: artworkCSS + carouselCSS }} /></head><body>{children}</body></html>;
}
