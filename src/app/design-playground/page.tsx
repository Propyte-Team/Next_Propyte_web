/**
 * /design-playground — Design Playground (herramienta interna).
 *
 * Server component: provee NextIntlClientProvider para que los showcases
 * puedan renderizar componentes reales del sitio que usan useTranslations.
 */

import { NextIntlClientProvider } from 'next-intl';
import DesignPlaygroundShell from '@/components/design-playground/DesignPlaygroundShell';
import messages from '@/i18n/messages/es.json';

export default function DesignPlaygroundPage() {
  return (
    <NextIntlClientProvider locale="es" messages={messages} timeZone="America/Mexico_City">
      <DesignPlaygroundShell />
    </NextIntlClientProvider>
  );
}
