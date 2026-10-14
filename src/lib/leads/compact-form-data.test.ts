import { describe, expect, it } from 'vitest';
import { compactFormData } from './compact-form-data';

describe('compactFormData', () => {
  it('quita null, undefined y cadena vacía; conserva lo demás', () => {
    expect(
      compactFormData({ name: 'Ana', email: '', phone: null, city: undefined, isBroker: true }),
    ).toEqual({ name: 'Ana', isBroker: true });
  });

  it('null si no queda nada que guardar', () => {
    expect(compactFormData({ name: '', email: null })).toBeNull();
  });
});
