import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MainPadding from '@/components/layout/MainPadding';
import WhatsAppButton from '@/components/shared/WhatsAppButton';
import Analytics from '@/components/shared/Analytics';
import UTMCapture from '@/components/shared/UTMCapture';
import CookieBanner from '@/components/shared/CookieBanner';
import { Toaster } from 'sonner';
import { MotionConfig } from 'framer-motion';
import { SearchProvider } from '@/context/SearchContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { SiteVisibilityProvider } from '@/context/SiteVisibilityContext';
import { SiteConfigProvider } from '@/context/SiteConfigContext';
import { UnitsProvider } from '@/lib/units-context';
import { getVisibility } from '@/lib/visibility';
import { getSiteConfig } from '@/lib/hub-content';
import { fetchUsdMxnRate } from '@/lib/banxico/fetchUsdMxnRate';
import TokenSyncListener from '@/components/shared/TokenSyncListener';
import SchemaMarkup from '@/components/shared/SchemaMarkup';
import SmoothScrollProvider from '@/components/providers/SmoothScrollProvider';

// Enumerar locales para prerender — sin esto Next no puede construir rutas
// completas /{locale}/... y NINGUNA página hija se prerenderiza aunque su
// generateStaticParams devuelva slugs (todo cae a render on-demand).
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'es' | 'en')) {
    notFound();
  }

  // Enable static rendering — opts pages out of cookies()-based locale resolution
  setRequestLocale(locale);

  const [messages, tA11y, visibilityFlags, siteConfig, usdMxnRate] = await Promise.all([
    getMessages({ locale }),
    getTranslations({ locale, namespace: 'a11y' }),
    getVisibility(),
    getSiteConfig(),
    fetchUsdMxnRate(),
  ]);

  return (
    <NextIntlClientProvider messages={messages}>
      {/* Corrige <html lang> por locale ANTES de la hidratación. El root layout
          lo deja estático en "es" (leerlo con getLocale() ahí usa headers() y
          mata prerender/ISR de todo el sitio — incidentes 500 jul-2026). */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang=${JSON.stringify(locale)}`,
        }}
      />
      <SiteConfigProvider config={siteConfig}>
      <SiteVisibilityProvider flags={visibilityFlags}>
      <CurrencyProvider initialRate={usdMxnRate.rate} initialRateDate={usdMxnRate.date}>
      <UnitsProvider>
      <SearchProvider>
      <MotionConfig reducedMotion="user">
      <SmoothScrollProvider>
        {/* WebSite + SearchAction schema — global, habilita Sitelinks Search Box.
            Manual UX/UI §7.3. */}
        <SchemaMarkup type="website" />
        <a href="#main-content" className="skip-to-content">
          {tA11y('skipToContent')}
        </a>
        <Header siteConfig={siteConfig} />
        <div className="lg:ml-[72px]">
          <main
            id="main-content"
            className="flex-1 pb-20 md:pb-0"
            tabIndex={-1}
          >
            <MainPadding>{children}</MainPadding>
          </main>
          <Footer siteConfig={siteConfig} />
        </div>
        <TokenSyncListener />
        <WhatsAppButton siteConfig={siteConfig} />
        <Analytics />
        <UTMCapture />
        <CookieBanner />
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            classNames: {
              toast: 'font-sans',
            },
          }}
        />
      </SmoothScrollProvider>
      </MotionConfig>
      </SearchProvider>
      </UnitsProvider>
      </CurrencyProvider>
      </SiteVisibilityProvider>
      </SiteConfigProvider>
    </NextIntlClientProvider>
  );
}
