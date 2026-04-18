import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F6F8]">
      <div className="text-center px-4">
        <h1 className="text-4xl font-bold text-[#1A2F3F] mb-4">404</h1>
        <p className="text-gray-600 mb-6">Página no encontrada</p>
        <Link href="/" className="inline-flex h-11 px-6 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-white font-semibold rounded-lg items-center transition-colors">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
