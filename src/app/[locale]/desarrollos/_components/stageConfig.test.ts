import { describe, expect, it } from 'vitest';
import { resolveStage } from './stageConfig';

describe('resolveStage', () => {
  it('reconoce las etiquetas tal como las guarda el Hub', () => {
    expect(resolveStage('En construcción')?.slug).toBe('construccion');
    expect(resolveStage('Preventa')?.slug).toBe('preventa');
    expect(resolveStage('Entrega inmediata')?.slug).toBe('entrega_inmediata');
    expect(resolveStage('Entregado')?.slug).toBe('entrega_inmediata');
  });

  it('acepta los slugs canónicos', () => {
    expect(resolveStage('construccion')?.slug).toBe('construccion');
    expect(resolveStage('preventa')?.slug).toBe('preventa');
  });

  it('sin dato no inventa una etapa', () => {
    expect(resolveStage(null)).toBeNull();
    expect(resolveStage('')).toBeNull();
    expect(resolveStage('algo raro')).toBeNull();
  });
});
