'use client';

import 'react-phone-number-input/style.css';
import ReactPhoneInputWithCountry from 'react-phone-number-input';
import type { Country } from 'react-phone-number-input';
import styles from './PhoneInput.module.css';

export { isValidPhoneNumber } from 'react-phone-number-input';

// México primero (mercado principal de Propyte), luego USA/Canadá y el resto
// de LATAM donde hay compradores/inversionistas/proveedores activos.
const SUPPORTED_COUNTRIES: Country[] = [
  'MX', 'US', 'CA',
  'AR', 'BO', 'BR', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'GT', 'HN',
  'NI', 'PA', 'PE', 'PR', 'PY', 'SV', 'UY', 'VE',
];

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
      countries={SUPPORTED_COUNTRIES}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      inputMode="numeric"
      autoComplete="tel"
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      aria-required={required}
      toolparamdescription={toolParamDescription}
      className={`${styles.phoneInput} ${className || ''}`}
    />
  );
}
