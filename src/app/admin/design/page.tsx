/**
 * /admin/design — Design Playground.
 *
 * Server component: carga messages ES por defecto para que el preview pueda
 * renderizar componentes reales del sitio (que usan useTranslations).
 */

import { NextIntlClientProvider } from 'next-intl';
import PlaygroundShell from '@/components/playground/PlaygroundShell';
import messages from '@/i18n/messages/es.json';

export default function DesignPlaygroundPage() {
  return (
    <NextIntlClientProvider locale="es" messages={messages} timeZone="America/Mexico_City">
      <PlaygroundShell />
    </NextIntlClientProvider>
  );
}
