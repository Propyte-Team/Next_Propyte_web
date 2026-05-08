# UI/UX Audit — Diff before/after

Generado: 2026-05-08T21:23:08.364Z

Comparativa entre el estado **antes** de los fixes (baseline del primer audit) y el **estado actual** (después de aplicar tipografía fluida + P0 fixes).


## LOCAL — http://localhost:3000/es


### desktop

| Métrica | Antes | | Ahora |
|---|---|:-:|---|
| h1 fontSize | 56px | = | 56px |
| h2 fontSize | 36px | → | 35.9952px |
| h3 fontSize | 18px | → | 22px |
| overflow-x | ✅ false | = | ✅ false |
| tap-targets <36px | 0 | = | 0 |
| contrast samples (mostly false+) | 10 | = | 10 |

### tablet

| Métrica | Antes | | Ahora |
|---|---|:-:|---|
| h1 fontSize | 54px | → | 45.1832px |
| h2 fontSize | 36px | → | 30.5836px |
| h3 fontSize | 18px | → | 20.3791px |
| overflow-x | ❌ true | → | ✅ false |
| overflow extra px | 28px | → | 0px |
| tap-targets <36px | 0 | = | 0 |
| contrast samples (mostly false+) | 10 | = | 10 |

### mobile

| Métrica | Antes | | Ahora |
|---|---|:-:|---|
| h1 fontSize | 36px | → | 37.2534px |
| h2 fontSize | 28px | → | 26.6187px |
| h3 fontSize | 18px | → | 19.1892px |
| overflow-x | ✅ false | = | ✅ false |
| tap-targets <36px | 37 | → | 27 |
| contrast samples (mostly false+) | 8 | = | 8 |

## STAGING — https://dev.propyte.com/es


### desktop

| Métrica | Antes | | Ahora |
|---|---|:-:|---|
| h1 fontSize | 56px | = | 56px |
| h2 fontSize | 36px | = | 36px |
| h3 fontSize | 14px | = | 14px |
| overflow-x | ✅ false | = | ✅ false |
| tap-targets <36px | 0 | = | 0 |
| contrast samples (mostly false+) | 9 | → | 11 |

### tablet

| Métrica | Antes | | Ahora |
|---|---|:-:|---|
| h1 fontSize | 54px | = | 54px |
| h2 fontSize | 36px | = | 36px |
| h3 fontSize | 14px | = | 14px |
| overflow-x | ❌ true | = | ❌ true |
| overflow extra px | 28px | = | 28px |
| tap-targets <36px | 0 | = | 0 |
| contrast samples (mostly false+) | 9 | → | 11 |

### mobile

| Métrica | Antes | | Ahora |
|---|---|:-:|---|
| h1 fontSize | 36px | = | 36px |
| h2 fontSize | 28px | = | 28px |
| h3 fontSize | 14px | = | 14px |
| overflow-x | ✅ false | = | ✅ false |
| tap-targets <36px | 39 | = | 39 |
| contrast samples (mostly false+) | 9 | = | 9 |

---

## Notas

- **staging** sigue mostrando los valores baseline porque su build no se ha redeployado desde los fixes — los números cambiarán cuando hagas `vercel --prod` desde `develop`.
- **local** refleja el estado de la rama actual.
- Las "muestras de contraste" son en su mayoría falsos positivos del analyzer (texto blanco sobre overlay con padre transparente). Verificado manualmente con `find-teal-on-light.mjs`: 0 hits reales sobre fondo claro.
- Tap targets restantes en mobile son dots de carruseles secundarios (TrendingMarket / FeaturedProperties / etc.). El patrón de fix está documentado en `Testimonials.tsx:88-99`.

## Sistema tipográfico nuevo

Las utilities Tailwind `text-2xs/xs/sm/base/lg/xl/2xl/3xl/4xl/5xl/6xl/7xl` ahora son **fluidas** (clamp 320→1440). h2 y h3 escalan suavemente entre breakpoints en lugar de saltar discretamente.
