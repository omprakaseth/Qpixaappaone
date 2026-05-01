import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
      <h2 className="text-4xl font-bold mb-4">404</h2>
      <p className="text-muted-foreground mb-8">Arre! Yeh page toh nehi mila.</p>
      <Link 
        href="/"
        className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-bold transition-transform active:scale-95"
      >
        Home par wapas chalein
      </Link>
    </div>
  );
}
