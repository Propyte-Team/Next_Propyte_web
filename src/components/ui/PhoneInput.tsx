'use client';

import 'react-phone-number-input/style.css';
import ReactPhoneInputWithCountry from 'react-phone-number-input';
import type { Country } from 'react-phone-number-input';
import styles from './PhoneInput.module.css';

export { isValidPhoneNumber } from 'react-phone-number-input';

// El selector lista TODOS los países (hay compradores fuera de América: España,
// Alemania, Francia). Lo que se acota es el ORDEN: arriba los mercados de donde
// llegan los leads —México primero—, un separador, y detrás el resto del mundo
// en orden alfabético. Restringir la lista dejaba fuera lada legítima.
//
// UN SOLO `'|'`. La librería asigna `key: '|'` a todo separador
// (`CountrySelect.js`), así que dos dividers son dos hijos de React con la
// misma key: consola llena de «two children with the same key» y opciones que
// se pueden duplicar u omitir.
const PREFERRED_COUNTRIES: (Country | '|')[] = [
  'MX', 'US', 'CA',
  'AR', 'BO', 'BR', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'GT', 'HN',
  'NI', 'PA', 'PE', 'PR', 'PY', 'SV', 'UY', 'VE',
  'ES', 'FR', 'DE', 'GB', 'IT', 'NL', 'CH', 'BE', 'PT',
  '|',
  '...',
] as (Country | '|')[];

interface PhoneInputFieldProps {
  id: string;
  name?: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  onBlur?: () => void;
  placeholder?: string;
  invalid?: boolean;
  describedBy?: string;
  required?: boolean;
  /** Clases del contenedor (borde, alto, fondo, radio) — mismo rol que el
   *  `className` de un <input> normal en estos formularios. */
  className?: string;
  toolParamDescription?: string;
}

export default function PhoneInputField({
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  invalid,
  describedBy,
  required,
  className,
  toolParamDescription,
}: PhoneInputFieldProps) {
  return (
    <ReactPhoneInputWithCountry
      id={id}
      name={name}
      international
      defaultCountry="MX"
      countryOptionsOrder={PREFERRED_COUNTRIES}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      inputMode="numeric"
      autoComplete="tel"
      // `required` se queda en `aria-required` y NO baja al <input> nativo a
      // propósito. Si bajara, en los forms con Zod el teléfono sería el único
      // campo con validación del navegador: su burbuja saldría ANTES que los
      // errores en línea del resto y el visitante tendría que enviar dos veces.
      // La obligatoriedad la impone la guardia del submit en cada form, y el
      // respaldo real es `faltanDatosDeContacto()` en el servidor.
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      aria-required={required}
      toolparamdescription={toolParamDescription}
      className={`${styles.phoneInput} ${className || ''}`}
    />
  );
}
