import Image from 'next/image';
import Link from 'next/link';
import { Home, Search, Building2, ArrowRight } from '@/lib/icons';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F8]">
      {/* Minimal header with branding */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <Link href="/es" className="inline-flex items-center gap-3">
          <Image
            src="/img/logos/logo-horizontal-dark.png"
            alt="Propyte"
            width={140}
            height={36}
            className="h-9 w-auto"
            priority
          />
        </Link>
      </header>

      {/* 404 content */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="text-center max-w-lg">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#5CE0D2]/10 rounded-2xl mb-6">
            <Search size={36} strokeWidth={1.5} className="text-[#0E7490]" />
          </div>

          <h1 className="text-6xl font-bold text-[#1A2F3F] mb-3">404</h1>
          <h2 className="text-xl font-semibold text-[#1A2F3F] mb-3">Página no encontrada</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            La URL que buscas no existe o fue movida. Si venías de un link guardado,
            puede que la dirección haya cambiado.
          </p>

          {/* Primary CTA */}
          <Link
            href="/es"
            className="inline-flex items-center gap-2 h-12 px-6 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-[#0F1923] font-semibold rounded-lg transition-colors mb-8"
          >
            <Home size={18} />
            Ir al inicio
          </Link>

          {/* Quick nav links */}
          <div className="border-t border-gray-200 pt-8">
            <p className="text-sm font-medium text-gray-600 mb-4">O explora estas secciones:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                href="/es/desarrollos"
                className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-[#5CE0D2] hover:shadow-sm transition-all text-sm font-medium text-[#1A2F3F]"
              >
                <Building2 size={16} className="text-[#0E7490]" />
                Desarrollos
                <ArrowRight size={14} className="ml-auto text-gray-400" />
              </Link>
              <Link
                href="/es/propiedades"
                className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-[#5CE0D2] hover:shadow-sm transition-all text-sm font-medium text-[#1A2F3F]"
              >
                <Search size={16} className="text-[#0E7490]" />
                Propiedades
                <ArrowRight size={14} className="ml-auto text-gray-400" />
              </Link>
              <Link
                href="/es/contacto"
                className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-[#5CE0D2] hover:shadow-sm transition-all text-sm font-medium text-[#1A2F3F]"
              >
                <Home size={16} className="text-[#0E7490]" />
                Contacto
                <ArrowRight size={14} className="ml-auto text-gray-400" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Minimal footer */}
      <footer className="bg-white border-t border-gray-100 px-6 py-4 text-center">
        <p className="text-xs text-gray-600">© {new Date().getFullYear()} Propyte. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
