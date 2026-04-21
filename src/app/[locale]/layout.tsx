import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WhatsAppButton from '@/components/shared/WhatsAppButton';
import Analytics from '@/components/shared/Analytics';
import { SearchProvider } from '@/context/SearchContext';
import { CurrencyProvider } from '@/context/CurrencyContext';

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

  const [messages, tA11y] = await Promise.all([
    getMessages({ locale }),
    getTranslations({ locale, namespace: 'a11y' }),
  ]);

  return (
    <NextIntlClientProvider messages={messages}>
      <CurrencyProvider>
      <SearchProvider>
        <a href="#main-content" className="skip-to-content">
          {tA11y('skipToContent')}
        </a>
        <Header />
        <div className="lg:ml-[72px]">
          <main
            id="main-content"
            className="flex-1 pb-20 md:pb-0"
            tabIndex={-1}
          >
            {children}
          </main>
          <Footer />
        </div>
        <WhatsAppButton />
        <Analytics />
      </SearchProvider>
      </CurrencyProvider>
    </NextIntlClientProvider>
  );
}
