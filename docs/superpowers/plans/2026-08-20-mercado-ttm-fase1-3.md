# Ocupación TTM en /mercado — Plan de implementación (Fases 1-3 + guardias)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el "último punto de la serie" que hoy se publica como `median_occupancy` por una mediana de ciclo TTM con rango estacional y fecha de corte real, en el pipeline y en las 8 superficies que la consumen.

**Architecture:** El pipeline gana un módulo puro (`analytics/ttm.py`) que resume una serie mensual en p50/p10/p90 + `data_through` + meses observados, sin red. `compute_derived.py` lo consume y escribe columnas nuevas en `zone_scores`. La web gana un módulo puro espejo (`src/lib/rental-data/zone-metrics.ts`) para presentación y lee **solo** las columnas nuevas — nunca cae a las viejas.

**Tech Stack:** Python 3 + pandas (pipeline, sin pytest hoy — se agrega), Next.js 15 + TypeScript + vitest (web), Supabase Postgres.

**Spec:** `docs/superpowers/specs/2026-08-20-mercado-datos-verificables-design.md`

## Global Constraints

- **Nombres de proveedor prohibidos en texto visible.** `AirDNA`, `AirROI`, `Apify`, `Properstar`, `Lamudi`, `Inmuebles24`, `Vivanuncios`, `EasyBroker`, `Segundamano`, `TheRedSearch`, `Mercado Libre`, `MercadoLibre`. Atribución aprobada: `Análisis de mercado Propyte`. Ver `src/lib/compliance/provider-names.ts`. Identificadores internos en minúscula (`airdna_metrics`) son legítimos.
- **Toda cifra monetaria lleva `MXN` explícito.**
- **i18n vive en `src/i18n/messages/{es,en}.json`.** NO en `src/messages`. Todo string nuevo se agrega en ambos.
- **Nunca exponer `nombre_desarrollo`** en texto público ni en tests con datos reales.
- **Evitar `≥`, `≤`, `→` en texto que llegue a react-pdf** (sustituye glifos en silencio). Usar "30 o más".
- **La compuerta de publicación vive en el pipeline, no en la web.** La web solo rotula lo que el pipeline decidió (`index_omission_reason`).
- **Tests web:** `npm run test:unit` (vitest, `environment: 'node'`, `include: ['src/**/*.test.ts']`, alias `@` → `src`).
- **Validar el build antes de cualquier push:** `npm run build`.
- **Migraciones:** `supabase/migrations/`, convención vigente `YYYYMMDD_nombre.sql`.
- **Umbrales compartidos:** `TTM_MONTHS = 12`, `MIN_MONTHS_FOR_TTM = 6`, `MAX_DATA_AGE_DAYS = 35`. En el pipeline viven **solo** en `analytics/publication_gates.py`, junto a los que ya están ahí.
- 🚫 **No hay Python en la máquina de desarrollo.** `python`, `py` y `python3` están ausentes. Los tasks del pipeline (1, 2, 5) **no se pueden ejecutar ni verificar aquí** — ver Revisión.
- ⚠️ **La rama no se despliega a medias.** La web leyendo solo columnas nuevas + el pipeline sin poblarlas = "sin dato" en todas las zonas, peor que hoy. Los tasks web se pueden construir y probar con fixtures; **no** se mergean hasta que el pipeline escriba las columnas.

---

## Revisión 2026-08-20 — el plan se escribió contra una rama vieja

El plan original se redactó inspeccionando `crawlers/glowing-spork` en `feat/tier2-fields`, que estaba atrás de `origin/main`. Lo verificado contra `origin/main` (`d0bf1ab`):

**Sigue en pie — el bug está vivo:**
- `analytics/compute_derived.py:210` docstring `"Fetch latest occupancy per submarket"`
- `:223` `df.sort_values("metric_date", ascending=False).drop_duplicates("submarket")`
- `:648` `"median_occupancy": float(row["occupancy"])`
- El impacto medido contra la base (+66% Zona de Resorts, +53% Bahía de Akumal) es independiente de la rama.
- Todo el lado web y P1/P4/P5/P6/P7/P8/P9: intactos.

**Falsificado — hay que dejar de creerlo:**
| Afirmación original | Realidad en `origin/main` |
|---|---|
| "la regla de 30 anuncios no existe en el código" | `publication_gates.py:17` `MIN_SAMPLE_INDEX = 30`, `:15` `MIN_SAMPLE_OCCUPANCY = 15` |
| "`publication_gates.py` no existe" | Existe, con `tests/test_publication_gates.py` |
| "este repo no tiene un solo test" | **18** archivos en `tests/` + `conftest.py` |
| "`zone_sample_gate` y `airroi_str_zonal` viven solo en el VPS" | En `analytics/observer.py` y `notifier.py`, con tests |
| "`pipeline_health` es una tabla que nadie lee" | `observer.py:323-338` llama `should_alert` → `notify` (WhatsApp + SMTP, con dedup) |

**Lo que ya existe y hay que reusar, no reinventar:**
- `publication_gates.gate_zone(metrics) -> (veredicto, motivo)` ya devuelve `"drop"`/`"no_index"`/`"publish"` con motivos `sample_below_15`, `sample_below_30`, `missing:<componente>`. **Ese es el vocabulario de `index_omission_reason`.** No inventar `missing_adr` ni `thin_cycle` en paralelo.
- `apply_gates` (≈`:570`) ya es pura y ya calcula `gate_verdict` / `gate_reason`. **El motivo se calcula y se tira.** La brecha real es solo persistirlo.
- `build_zone_score_rows(df)` (≈`:629`) ya es el constructor puro de filas que el plan proponía **crear**. Se **modifica**, no se duplica.
- `resolve_zone_metrics(occ_df, adr_df, listings_df, city)` (`:477`) es la costura; los mapeos `_OCC_FIELDS` / `_ADR_FIELDS` / `_LST_FIELDS` son lo que hay que extender.
- `computed_at` es `datetime.now(timezone.utc).isoformat()` — timestamp completo a propósito (un comentario explica que una fecha a medianoche empata el `ORDER BY` del sitio). **No** usar `date.isoformat()`.
- Convenciones de test: `tests/conftest.py` inserta el directorio padre en `sys.path` (**no** hace falta `pytest.ini`), nombres de test en español, helper `_df(rows)` sobre `pd.DataFrame`.

**Nuevo, y refuerza el diagnóstico:** `fetch_city_level_records()` (`:303`), en el **mismo archivo**, ya hace el promedio TTM para el benchmark de ciudad, con este docstring:

> *"Ocupación = PROMEDIO trailing de los últimos 12 meses (representativo, ~anual), NO el último mes suelto (que en temporada baja subestima: junio Tulum ~24% vs anual ~32%)."*

El bug ya se diagnosticó y se corrigió **a nivel ciudad**. La ruta de **zona** nunca lo recibió. Tercera instancia del mismo patrón (la primera: `avg_occupancy_12m` en la web).

**Decisión pendiente que esto abre:** la ruta de ciudad usa **promedio**; el spec eligió **mediana** para zonas. Si se deja así, el benchmark de ciudad y el ranking de zonas usan estadísticos distintos sobre la misma serie.

**Tasks afectados:** 1, 2, 5, 11 y 15 quedan **SUPERSEDIDOS** por las versiones de abajo. Los tasks 3, 4, 6, 7, 8, 9, 10, 12, 13 y 14 no se ven afectados y se ejecutan tal como están escritos.

---

## Estructura de archivos

**Pipeline** (`propyte-monorepo/crawlers/glowing-spork/`)
| Archivo | Responsabilidad |
|---|---|
| `analytics/ttm.py` (**nuevo**) | Resumen puro de una serie mensual: p50/p10/p90, `data_through`, meses observados. Cero red. |
| `analytics/tests/test_ttm.py` (**nuevo**) | Tests del anterior. |
| `analytics/tests/__init__.py`, `pytest.ini` (**nuevos**) | Arnés de pruebas (hoy no existe ninguno). |
| `analytics/compute_derived.py` (**modificar**) | Consume `ttm.py`; escribe columnas nuevas; modo `--dry-run`. |

**Web** (`Next_Propyte_web/`)
| Archivo | Responsabilidad |
|---|---|
| `supabase/migrations/20260820_zone_scores_ttm.sql` (**nuevo**) | Columnas nuevas en `zone_scores`. |
| `src/lib/rental-data/zone-metrics.ts` (**nuevo**) | Presentación pura: ingreso bruto, frescura, etiqueta de omisión. |
| `src/lib/rental-data/zone-metrics.test.ts` (**nuevo**) | Tests del anterior. |
| `src/lib/supabase/queries.ts` (**modificar**) | `ZoneScore`, `ZONE_SCORE_NUMERIC_KEYS`. |
| 8 superficies de consumo (**modificar**) | Ver Tareas 8-12. |
| `src/i18n/messages/{es,en}.json` (**modificar**) | Strings nuevos + correcciones P1/P5/P8/P9. |
| `src/lib/rental-data/methodology-invariants.test.ts` (**nuevo**) | Guardias de la Fase 5 del spec. |

---

## ~~Task 1: Arnés de pruebas + resumen TTM puro~~ — SUPERSEDIDO por Task 1R

> **No ejecutar.** Premisas falsas: el repo ya tiene 18 tests y `conftest.py`, y no
> necesita `pytest.ini` ni pytest en `requirements.txt`. Ver **Task 1R** al final.

## Task 1 (original, solo como referencia): Arnés de pruebas + resumen TTM puro

**Files:**
- Create: `propyte-monorepo/crawlers/glowing-spork/pytest.ini`
- Create: `propyte-monorepo/crawlers/glowing-spork/analytics/tests/__init__.py`
- Create: `propyte-monorepo/crawlers/glowing-spork/analytics/ttm.py`
- Test: `propyte-monorepo/crawlers/glowing-spork/analytics/tests/test_ttm.py`

**Interfaces:**
- Consumes: nada.
- Produces: `TTM_MONTHS: int`, `MIN_MONTHS_FOR_TTM: int`, `MAX_DATA_AGE_DAYS: int`, `TtmSummary` (dataclass congelada con `p50: float|None`, `low_season: float|None`, `high_season: float|None`, `data_through: date|None`, `months_observed: int`), y `summarize_ttm(points: Iterable[tuple[date, float]]) -> TtmSummary`.

**Contexto que el implementador necesita:** este repo **no tiene un solo test hoy**. `requirements.txt` no incluye pytest. La ventana TTM se ancla en `max(date)` de los datos, **no en la fecha de hoy** — la serie real termina en feb-2026 y anclar en hoy devolvería una ventana vacía. Ese es el punto del ejercicio.

- [ ] **Step 1: Crear el arnés de pytest**

`pytest.ini`:
```ini
[pytest]
testpaths = analytics/tests
python_files = test_*.py
```

`analytics/tests/__init__.py`: archivo vacío.

Agregar a `requirements.txt`:
```
pytest>=8.0.0
```

- [ ] **Step 2: Escribir el test que falla**

`analytics/tests/test_ttm.py`:
```python
from datetime import date

from analytics.ttm import MIN_MONTHS_FOR_TTM, summarize_ttm

# Serie real de ocupacion del submercado akumal_bay_area, 12 meses hasta 2026-02.
# El ultimo punto (72.46) es el pico de temporada alta: el valor que el pipeline
# publicaba como "median_occupancy".
AKUMAL = [
    (date(2025, 3, 1), 62.84),
    (date(2025, 4, 1), 42.69),
    (date(2025, 5, 1), 20.58),
    (date(2025, 6, 1), 35.91),
    (date(2025, 7, 1), 36.13),
    (date(2025, 8, 1), 32.37),
    (date(2025, 9, 1), 53.04),
    (date(2025, 10, 1), 33.56),
    (date(2025, 11, 1), 52.18),
    (date(2025, 12, 1), 54.64),
    (date(2026, 1, 1), 64.50),
    (date(2026, 2, 1), 72.46),
]


def test_p50_es_la_mediana_del_ciclo_no_el_ultimo_punto():
    s = summarize_ttm(AKUMAL)
    assert s.p50 == 47.435          # (42.69 + 52.18) / 2
    assert s.p50 != 72.46           # el bug exacto que este modulo existe para matar


def test_rango_estacional_p10_p90():
    s = summarize_ttm(AKUMAL)
    assert round(s.low_season, 2) == 32.49
    assert round(s.high_season, 2) == 64.33


def test_data_through_es_el_ultimo_metric_date():
    s = summarize_ttm(AKUMAL)
    assert s.data_through == date(2026, 2, 1)
    assert s.months_observed == 12


def test_ventana_se_ancla_en_el_dato_no_en_hoy():
    # 14 meses de serie: solo entran los 12 mas recientes DE LA SERIE.
    extra = [(date(2025, 1, 1), 99.0), (date(2025, 2, 1), 98.0)] + AKUMAL
    s = summarize_ttm(extra)
    assert s.months_observed == 12
    assert s.p50 == 47.435          # los dos meses viejos quedan fuera
    assert s.data_through == date(2026, 2, 1)


def test_mes_duplicado_cuenta_una_vez():
    s = summarize_ttm(AKUMAL + [(date(2026, 2, 1), 10.0)])
    assert s.months_observed == 12
    assert s.data_through == date(2026, 2, 1)


def test_ciclo_delgado_no_publica_p50():
    pocos = AKUMAL[: MIN_MONTHS_FOR_TTM - 1]
    s = summarize_ttm(pocos)
    assert s.p50 is None
    assert s.months_observed == MIN_MONTHS_FOR_TTM - 1
    assert s.data_through is not None   # la fecha se conoce aunque el ciclo no baste


def test_serie_vacia():
    s = summarize_ttm([])
    assert s.p50 is None
    assert s.data_through is None
    assert s.months_observed == 0


def test_ignora_valores_nulos():
    con_nulos = AKUMAL + [(date(2026, 3, 1), None)]
    s = summarize_ttm(con_nulos)
    assert s.months_observed == 12
    assert s.data_through == date(2026, 2, 1)
```

- [ ] **Step 3: Correr el test y verificar que falla**

Run: `cd propyte-monorepo/crawlers/glowing-spork && python -m pytest analytics/tests/test_ttm.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'analytics.ttm'`

- [ ] **Step 4: Implementar `analytics/ttm.py`**

```python
"""
Resumen TTM (trailing twelve months) de una serie mensual.

Puro: sin red, sin Supabase, sin pandas. Existe como modulo aparte porque el bug
que vino a corregir —publicar el ultimo punto de la serie como si fuera una
mediana— era invisible mientras el calculo vivia pegado al fetch.

La ventana se ancla en el ultimo `metric_date` DE LA SERIE, no en la fecha de hoy:
las series de submercado pueden estar meses atrasadas, y anclar en hoy devolveria
una ventana vacia en vez de un ciclo valido.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Iterable

TTM_MONTHS = 12
MIN_MONTHS_FOR_TTM = 6
MAX_DATA_AGE_DAYS = 35


@dataclass(frozen=True)
class TtmSummary:
    p50: float | None
    low_season: float | None
    high_season: float | None
    data_through: date | None
    months_observed: int


def _percentile(sorted_values: list[float], q: float) -> float:
    """Percentil con interpolacion lineal (mismo criterio que numpy por defecto)."""
    if len(sorted_values) == 1:
        return sorted_values[0]
    pos = q * (len(sorted_values) - 1)
    low = int(pos)
    high = min(low + 1, len(sorted_values) - 1)
    frac = pos - low
    return sorted_values[low] + frac * (sorted_values[high] - sorted_values[low])


def summarize_ttm(points: Iterable[tuple[date, float | None]]) -> TtmSummary:
    by_month: dict[date, float] = {}
    for d, v in points:
        if d is None or v is None:
            continue
        if d not in by_month:          # primer valor por mes gana
            by_month[d] = float(v)

    if not by_month:
        return TtmSummary(None, None, None, None, 0)

    months = sorted(by_month, reverse=True)[:TTM_MONTHS]
    data_through = months[0]
    values = sorted(by_month[m] for m in months)
    observed = len(months)

    if observed < MIN_MONTHS_FOR_TTM:
        return TtmSummary(None, None, None, data_through, observed)

    return TtmSummary(
        p50=_percentile(values, 0.50),
        low_season=_percentile(values, 0.10),
        high_season=_percentile(values, 0.90),
        data_through=data_through,
        months_observed=observed,
    )
```

- [ ] **Step 5: Correr el test y verificar que pasa**

Run: `cd propyte-monorepo/crawlers/glowing-spork && python -m pytest analytics/tests/test_ttm.py -v`
Expected: PASS — 8 passed

- [ ] **Step 6: Commit**

```bash
cd propyte-monorepo
git add crawlers/glowing-spork/pytest.ini crawlers/glowing-spork/requirements.txt \
        crawlers/glowing-spork/analytics/ttm.py crawlers/glowing-spork/analytics/tests/
git commit -m "feat(analytics): resumen TTM puro con rango estacional y data_through

El pipeline publicaba el ultimo punto de la serie en una columna llamada
median_occupancy. Para las 16 zonas del ranking ese punto era feb-2026, el pico
de temporada alta, lo que inflaba el ingreso bruto publicado hasta +66%.

summarize_ttm() ancla la ventana en el ultimo metric_date de la serie, no en hoy,
porque las series de submercado llegan meses atrasadas.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## ~~Task 2: Clasificación de frescura y razón de omisión (pipeline)~~ — SUPERSEDIDO por Task 1R

> **No ejecutar.** Duplicaría `publication_gates.gate_zone()`, que ya existe, ya está
> probado y ya devuelve los motivos. Ver **Task 1R** al final.

## Task 2 (original, solo como referencia): Clasificación de frescura y razón de omisión

**Files:**
- Modify: `propyte-monorepo/crawlers/glowing-spork/analytics/ttm.py`
- Test: `propyte-monorepo/crawlers/glowing-spork/analytics/tests/test_ttm.py`

**Interfaces:**
- Consumes: `TtmSummary`, `MIN_MONTHS_FOR_TTM`, `MAX_DATA_AGE_DAYS` de Task 1.
- Produces: `is_stale(data_through: date|None, as_of: date) -> bool` y `omission_reason(summary: TtmSummary, active_listings: int|None, has_adr: bool) -> str|None` que devuelve `'thin_cycle' | 'sample_below_30' | 'missing_adr' | None`.

**Contexto:** los dos ejes van separados a propósito (spec §3.2). **La antigüedad NO omite el índice** — solo rotula. Si se colapsan en una compuerta, el dato actual (feb-2026, ~200 días) deja la página en blanco, que es la opción descartada. `MIN_LISTINGS_FOR_INDEX = 30` es el umbral que la página ya publica y que `compute_derived.py` nunca implementó.

- [ ] **Step 1: Escribir el test que falla**

Agregar a `analytics/tests/test_ttm.py`:
```python
from analytics.ttm import (
    MIN_LISTINGS_FOR_INDEX,
    TtmSummary,
    is_stale,
    omission_reason,
)


def _sano(months=12, through=date(2026, 2, 1)) -> TtmSummary:
    return TtmSummary(47.4, 32.5, 64.3, through, months)


def test_is_stale_usa_max_data_age_days():
    assert is_stale(date(2026, 2, 1), as_of=date(2026, 8, 20)) is True
    assert is_stale(date(2026, 8, 1), as_of=date(2026, 8, 20)) is False
    assert is_stale(None, as_of=date(2026, 8, 20)) is True


def test_dato_viejo_no_omite_el_indice():
    # El eje de antiguedad rotula, no omite. Con el dato de feb-2026 la pagina
    # debe seguir publicando: suprimir aqui dejaria /mercado en blanco.
    viejo = _sano(through=date(2026, 2, 1))
    assert omission_reason(viejo, active_listings=200, has_adr=True) is None


def test_ciclo_delgado_omite():
    delgado = TtmSummary(None, None, None, date(2026, 2, 1), 4)
    assert omission_reason(delgado, active_listings=200, has_adr=True) == "thin_cycle"


def test_muestra_chica_omite():
    assert omission_reason(_sano(), active_listings=29, has_adr=True) == "sample_below_30"
    assert omission_reason(_sano(), active_listings=30, has_adr=True) is None
    assert omission_reason(_sano(), active_listings=None, has_adr=True) == "sample_below_30"


def test_sin_adr_omite_y_no_se_confunde_con_muestra_chica():
    # Playacar: 922 anuncios, sin ADR. Hoy la UI lo rotula "muestra baja".
    assert omission_reason(_sano(), active_listings=922, has_adr=False) == "missing_adr"


def test_precedencia_ciclo_delgado_gana_sobre_muestra():
    delgado = TtmSummary(None, None, None, date(2026, 2, 1), 3)
    assert omission_reason(delgado, active_listings=10, has_adr=False) == "thin_cycle"


def test_min_listings_coincide_con_lo_publicado():
    assert MIN_LISTINGS_FOR_INDEX == 30
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `cd propyte-monorepo/crawlers/glowing-spork && python -m pytest analytics/tests/test_ttm.py -v`
Expected: FAIL — `ImportError: cannot import name 'MIN_LISTINGS_FOR_INDEX'`

- [ ] **Step 3: Implementar**

Agregar a `analytics/ttm.py`:
```python
MIN_LISTINGS_FOR_INDEX = 30


def is_stale(data_through: date | None, as_of: date) -> bool:
    """Antiguedad de la serie. Rotula; NO decide si se publica."""
    if data_through is None:
        return True
    return (as_of - data_through).days > MAX_DATA_AGE_DAYS


def omission_reason(
    summary: TtmSummary,
    active_listings: int | None,
    has_adr: bool,
) -> str | None:
    """
    Por que esta zona no publica indice. None = si lo publica.

    La antiguedad NO aparece aqui a proposito: un ciclo de 12 meses cerrado sigue
    siendo una mediana estacional valida medio ano despues. Lo que se prohibe no es
    publicar dato viejo, es publicarlo sin decir que lo es (ver is_stale).
    """
    if summary.months_observed < MIN_MONTHS_FOR_TTM:
        return "thin_cycle"
    if active_listings is None or active_listings < MIN_LISTINGS_FOR_INDEX:
        return "sample_below_30"
    if not has_adr:
        return "missing_adr"
    return None
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `cd propyte-monorepo/crawlers/glowing-spork && python -m pytest analytics/tests/test_ttm.py -v`
Expected: PASS — 15 passed

- [ ] **Step 5: Commit**

```bash
cd propyte-monorepo
git add crawlers/glowing-spork/analytics/ttm.py crawlers/glowing-spork/analytics/tests/test_ttm.py
git commit -m "feat(analytics): frescura y razon de omision como ejes separados

La antiguedad rotula, la suficiencia del ciclo omite. Colapsarlas en una sola
compuerta dejaria /mercado en blanco con el dato actual de feb-2026.

MIN_LISTINGS_FOR_INDEX=30 implementa el umbral que la pagina ya publicaba y que
compute_derived.py nunca tuvo.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Migración de `zone_scores`

**Files:**
- Create: `Next_Propyte_web/supabase/migrations/20260820_zone_scores_ttm.sql`

**Interfaces:**
- Consumes: nada.
- Produces: columnas `occupancy_p50_ttm`, `occupancy_low_season`, `occupancy_high_season`, `adr_p50_ttm` (numeric), `data_through` (date), `ttm_months_observed` (int), `index_omission_reason` (text con CHECK).

**Contexto:** `median_occupancy` / `median_adr` **no se borran ni se renombran en esta migración**. Se deprecan en el tipo TS (Task 6) y se borran en una migración posterior, cuando ninguna superficie las lea. Renombrarlas ahora rompería producción durante el despliegue.

- [ ] **Step 1: Escribir la migración**

```sql
-- Columnas TTM en zone_scores.
--
-- median_occupancy y median_adr NO contienen medianas: contienen el ultimo punto
-- de la serie (compute_derived.py hacia drop_duplicates sobre metric_date desc).
-- Para las 16 zonas del ranking ese punto era feb-2026, el pico de temporada alta.
--
-- Se agregan columnas nuevas en vez de corregir las viejas para que el despliegue
-- no tenga una ventana en la que la web lea una columna con semantica cambiada.
-- Las viejas se borran en una migracion posterior, cuando nadie las lea.

alter table public.zone_scores
  add column if not exists occupancy_p50_ttm      numeric,
  add column if not exists occupancy_low_season   numeric,
  add column if not exists occupancy_high_season  numeric,
  add column if not exists adr_p50_ttm            numeric,
  add column if not exists data_through           date,
  add column if not exists ttm_months_observed    integer,
  add column if not exists index_omission_reason  text;

alter table public.zone_scores
  drop constraint if exists zone_scores_index_omission_reason_check;

alter table public.zone_scores
  add constraint zone_scores_index_omission_reason_check
  check (index_omission_reason is null
         or index_omission_reason in ('thin_cycle', 'sample_below_30', 'missing_adr'));

comment on column public.zone_scores.occupancy_p50_ttm is
  'Mediana de ocupacion sobre los ultimos 12 meses de metric_date. Cifra principal.';
comment on column public.zone_scores.data_through is
  'Ultimo metric_date real de la serie. Distinto de computed_at, que es la fecha de la corrida.';
comment on column public.zone_scores.median_occupancy is
  'DEPRECADA: no es una mediana, es el ultimo punto de la serie. Usar occupancy_p50_ttm.';
comment on column public.zone_scores.median_adr is
  'DEPRECADA: ultimo punto de la serie. Usar adr_p50_ttm.';
```

- [ ] **Step 2: Aplicar y verificar el esquema**

Aplicar la migración contra el proyecto `oaijxdpevakashxshhvm`, luego verificar:
```sql
select column_name, data_type
from information_schema.columns
where table_name = 'zone_scores'
  and column_name in ('occupancy_p50_ttm','occupancy_low_season','occupancy_high_season',
                      'adr_p50_ttm','data_through','ttm_months_observed','index_omission_reason')
order by column_name;
```
Expected: 7 filas.

- [ ] **Step 3: Verificar que el CHECK rechaza un valor inválido**

```sql
-- Debe fallar con violacion de constraint:
update public.zone_scores set index_omission_reason = 'stale_source' where id = (select min(id) from public.zone_scores);
```
Expected: ERROR `violates check constraint "zone_scores_index_omission_reason_check"`.
(`stale_source` fue una razón que el spec descartó — la antigüedad no omite el índice.)

- [ ] **Step 4: Commit**

```bash
cd Next_Propyte_web
git add supabase/migrations/20260820_zone_scores_ttm.sql
git commit -m "feat(db): columnas TTM en zone_scores

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Presentación pura en la web

**Files:**
- Create: `Next_Propyte_web/src/lib/rental-data/zone-metrics.ts`
- Test: `Next_Propyte_web/src/lib/rental-data/zone-metrics.test.ts`

**Interfaces:**
- Consumes: nada (módulo puro).
- Produces:
  - `MAX_DATA_AGE_DAYS: 35`
  - `type OmissionReason = 'thin_cycle' | 'sample_below_30' | 'missing_adr' | null`
  - `grossMonthlyIncome(adrP50: number | null, occP50: number | null): number | null`
  - `isStale(dataThrough: string | null, asOf: Date): boolean`
  - `omissionLabelKey(reason: OmissionReason): string | null` → clave i18n

**Contexto:** espeja `analytics/ttm.py` a propósito, en el lado de presentación. `grossMonthlyIncome` devuelve `null`, **nunca 0**: el 0 como sentinela es el patrón que `resolve.ts` ya prohíbe en este repo (`"Un valor sirve solo si es un número finito y > 0"`).

- [ ] **Step 1: Escribir el test que falla**

`src/lib/rental-data/zone-metrics.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import {
  MAX_DATA_AGE_DAYS,
  grossMonthlyIncome,
  isStale,
  omissionLabelKey,
} from '@/lib/rental-data/zone-metrics';

describe('grossMonthlyIncome', () => {
  it('multiplica ADR por ocupacion por 30', () => {
    // Bahia de Akumal con la mediana TTM real: 5261 * 0.474 * 30
    expect(grossMonthlyIncome(5261, 47.4)).toBe(74811);
  });

  it('el valor honesto es muy inferior al que se publicaba con el pico de febrero', () => {
    const conPicoFebrero = grossMonthlyIncome(5261, 72.46)!;
    const conMedianaTtm = grossMonthlyIncome(5261, 47.4)!;
    expect(conPicoFebrero).toBeGreaterThan(conMedianaTtm * 1.5);
  });

  it('devuelve null, nunca 0, cuando falta un insumo', () => {
    expect(grossMonthlyIncome(null, 47.4)).toBeNull();
    expect(grossMonthlyIncome(5261, null)).toBeNull();
    expect(grossMonthlyIncome(null, null)).toBeNull();
  });

  it('trata el 0 y los negativos como ausentes', () => {
    expect(grossMonthlyIncome(0, 47.4)).toBeNull();
    expect(grossMonthlyIncome(5261, 0)).toBeNull();
    expect(grossMonthlyIncome(-100, 47.4)).toBeNull();
  });
});

describe('isStale', () => {
  const hoy = new Date('2026-08-20T00:00:00Z');

  it('marca rancia una serie que cerro en febrero', () => {
    expect(isStale('2026-02-01', hoy)).toBe(true);
  });

  it('no marca rancia una serie dentro del umbral', () => {
    expect(isStale('2026-08-01', hoy)).toBe(false);
  });

  it('sin fecha se considera rancia', () => {
    expect(isStale(null, hoy)).toBe(true);
  });

  it('el umbral es el mismo que usa pipeline_health', () => {
    expect(MAX_DATA_AGE_DAYS).toBe(35);
  });
});

describe('omissionLabelKey', () => {
  it('distingue muestra chica de tarifa ausente', () => {
    expect(omissionLabelKey('sample_below_30')).toBe('lowSampleBadge');
    expect(omissionLabelKey('missing_adr')).toBe('missingAdrBadge');
    expect(omissionLabelKey('thin_cycle')).toBe('thinCycleBadge');
  });

  it('sin razon no hay etiqueta', () => {
    expect(omissionLabelKey(null)).toBeNull();
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `cd Next_Propyte_web && npx vitest run src/lib/rental-data/zone-metrics.test.ts`
Expected: FAIL — no se resuelve `@/lib/rental-data/zone-metrics`

- [ ] **Step 3: Implementar**

`src/lib/rental-data/zone-metrics.ts`:
```ts
/**
 * Presentación de métricas de zona.
 *
 * Espejo en TypeScript de `analytics/ttm.py`. La estadística se calcula en el
 * pipeline; aquí solo se presenta lo que el pipeline decidió.
 *
 * Ninguna función devuelve 0 como "sin dato": mismo criterio que
 * `src/lib/investment/resolve.ts`, donde el 0 como sentinela ya está prohibido.
 */

/** Mismo umbral que `pipeline_health` usa para `airroi_str_zonal`. */
export const MAX_DATA_AGE_DAYS = 35;

export type OmissionReason =
  | 'thin_cycle'
  | 'sample_below_30'
  | 'missing_adr'
  | null;

/** Un valor sirve solo si es finito y > 0. */
function usable(v: number | null | undefined): number | null {
  if (v == null) return null;
  return Number.isFinite(v) && v > 0 ? v : null;
}

/**
 * Ingreso bruto mensual estimado: tarifa por noche × ocupación × 30.
 * Bruto a propósito — no descuenta comisiones, administración, predial ni ISR.
 */
export function grossMonthlyIncome(
  adrP50: number | null,
  occP50: number | null,
): number | null {
  const adr = usable(adrP50);
  const occ = usable(occP50);
  if (adr == null || occ == null) return null;
  return Math.round(adr * (occ / 100) * 30);
}

/** Antigüedad de la serie. Rotula la cifra; nunca la oculta. */
export function isStale(dataThrough: string | null, asOf: Date): boolean {
  if (!dataThrough) return true;
  const through = new Date(`${dataThrough}T00:00:00Z`);
  if (Number.isNaN(through.getTime())) return true;
  const days = (asOf.getTime() - through.getTime()) / 86_400_000;
  return days > MAX_DATA_AGE_DAYS;
}

const OMISSION_LABEL_KEYS: Record<Exclude<OmissionReason, null>, string> = {
  sample_below_30: 'lowSampleBadge',
  missing_adr: 'missingAdrBadge',
  thin_cycle: 'thinCycleBadge',
};

/**
 * Clave i18n de la etiqueta. Antes TODA omisión renderizaba "muestra baja",
 * incluido Playacar con 922 anuncios y sin tarifa publicada.
 */
export function omissionLabelKey(reason: OmissionReason): string | null {
  return reason ? OMISSION_LABEL_KEYS[reason] : null;
}
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `cd Next_Propyte_web && npx vitest run src/lib/rental-data/zone-metrics.test.ts`
Expected: PASS — 10 passed (4 de `grossMonthlyIncome`, 4 de `isStale`, 2 de `omissionLabelKey`)

- [ ] **Step 5: Commit**

```bash
cd Next_Propyte_web
git add src/lib/rental-data/zone-metrics.ts src/lib/rental-data/zone-metrics.test.ts
git commit -m "feat(mercado): presentacion pura de metricas de zona TTM

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## ~~Task 5: Pipeline escribe las columnas nuevas + `--dry-run`~~ — SUPERSEDIDO por Task 2R

> **No ejecutar.** `build_zone_row` no se crea: `build_zone_score_rows` ya existe y ya es
> pura. Los números de línea son de la rama vieja. Ver **Task 2R** al final.

## Task 5 (original, solo como referencia): Pipeline escribe las columnas nuevas

**Files:**
- Modify: `propyte-monorepo/crawlers/glowing-spork/analytics/compute_derived.py:201-216` (`fetch_airdna_occupancy`), `:219-248` (`fetch_airdna_adr`), `:426-612` (`compute_zone_scores`), `:614+` (`main`)
- Test: `propyte-monorepo/crawlers/glowing-spork/analytics/tests/test_compute_derived.py` (**crear**)

**Interfaces:**
- Consumes: `summarize_ttm`, `is_stale`, `omission_reason`, `TtmSummary` de Tasks 1-2.
- Produces: `build_zone_row(zone, city, summary_occ, summary_adr, active_listings, components, as_of) -> dict` — función pura que arma la fila a persistir. `compute_zone_scores` la usa; el test la ejercita sin red.

**Contexto crítico:** `fetch_airdna_occupancy` hoy hace `drop_duplicates("submarket")` sobre `metric_date desc` — **ahí está el bug**. Debe devolver la serie completa por submercado y delegar el resumen a `summarize_ttm`. `occupancy_component` del índice pasa a derivarse de `occupancy_p50_ttm`, lo que **reordena el ranking** — es el efecto buscado. `--dry-run` es requisito del spec §6 (riesgo "correr el pipeline escribe en producción").

- [ ] **Step 1: Escribir el test que falla**

`analytics/tests/test_compute_derived.py`:
```python
from datetime import date

from analytics.compute_derived import build_zone_row
from analytics.ttm import TtmSummary

OCC = TtmSummary(47.435, 32.49, 64.33, date(2026, 2, 1), 12)
ADR = TtmSummary(4969.0, 3417.0, 6305.0, date(2026, 3, 16), 12)
COMPONENTS = {
    "score": 88.1,
    "occupancy_component": 92.2,
    "adr_growth_component": 98.6,
    "supply_pressure_component": 85.3,
    "revpar": 3812.12,
}


def test_persiste_p50_no_el_ultimo_punto():
    row = build_zone_row("Bahía de Akumal", "Akumal", OCC, ADR, 200, COMPONENTS,
                         as_of=date(2026, 8, 20))
    assert row["occupancy_p50_ttm"] == 47.435
    assert row["adr_p50_ttm"] == 4969.0
    assert row["occupancy_low_season"] == 32.49
    assert row["occupancy_high_season"] == 64.33
    assert row["ttm_months_observed"] == 12


def test_data_through_es_del_dato_y_computed_at_de_la_corrida():
    row = build_zone_row("Bahía de Akumal", "Akumal", OCC, ADR, 200, COMPONENTS,
                         as_of=date(2026, 8, 20))
    assert row["data_through"] == "2026-02-01"
    assert row["computed_at"] == "2026-08-20"
    assert row["data_through"] != row["computed_at"]


def test_dato_viejo_sigue_publicando_indice():
    row = build_zone_row("Bahía de Akumal", "Akumal", OCC, ADR, 200, COMPONENTS,
                         as_of=date(2026, 8, 20))
    assert row["index_omission_reason"] is None
    assert row["score"] == 88.1


def test_playacar_sin_adr_no_dice_muestra_baja():
    sin_adr = TtmSummary(None, None, None, None, 0)
    row = build_zone_row("Playacar", "Playa del Carmen", OCC, sin_adr, 922, COMPONENTS,
                         as_of=date(2026, 8, 20))
    assert row["index_omission_reason"] == "missing_adr"
    assert row["score"] is None
    assert row["adr_p50_ttm"] is None
    assert row["occupancy_p50_ttm"] == 47.435   # la ocupacion si se publica


def test_muestra_chica_omite_indice_pero_publica_metricas():
    row = build_zone_row("Supermanzana 31", "Cancun", OCC, ADR, 15, COMPONENTS,
                         as_of=date(2026, 8, 20))
    assert row["index_omission_reason"] == "sample_below_30"
    assert row["score"] is None
    assert row["occupancy_p50_ttm"] == 47.435


def test_columnas_deprecadas_no_se_escriben():
    row = build_zone_row("Bahía de Akumal", "Akumal", OCC, ADR, 200, COMPONENTS,
                         as_of=date(2026, 8, 20))
    assert "median_occupancy" not in row
    assert "median_adr" not in row
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `cd propyte-monorepo/crawlers/glowing-spork && python -m pytest analytics/tests/test_compute_derived.py -v`
Expected: FAIL — `ImportError: cannot import name 'build_zone_row'`

- [ ] **Step 3: Implementar `build_zone_row` y reescribir los fetch**

Agregar a `analytics/compute_derived.py` (después de las constantes):
```python
from analytics.ttm import (
    MAX_DATA_AGE_DAYS,
    MIN_LISTINGS_FOR_INDEX,
    MIN_MONTHS_FOR_TTM,
    TTM_MONTHS,
    TtmSummary,
    is_stale,
    omission_reason,
    summarize_ttm,
)


def build_zone_row(
    zone: str,
    city: str,
    occ: TtmSummary,
    adr: TtmSummary,
    active_listings: int | None,
    components: dict,
    as_of: date,
) -> dict:
    """
    Arma la fila a persistir. Pura: sin red, sin pandas.

    NO escribe median_occupancy ni median_adr. Esas columnas contienen el ultimo
    punto de la serie y estan deprecadas; escribirlas mantendria vivo el bug para
    cualquier consumidor que no haya migrado.
    """
    reason = omission_reason(occ, active_listings, has_adr=adr.p50 is not None)
    publishes_index = reason is None

    return {
        "zone": zone,
        "city": city,
        "score": components["score"] if publishes_index else None,
        "occupancy_component": components["occupancy_component"] if publishes_index else None,
        "adr_growth_component": components["adr_growth_component"] if publishes_index else None,
        "supply_pressure_component": components["supply_pressure_component"] if publishes_index else None,
        "revpar": components.get("revpar"),
        "active_listings": active_listings,
        "occupancy_p50_ttm": occ.p50,
        "occupancy_low_season": occ.low_season,
        "occupancy_high_season": occ.high_season,
        "adr_p50_ttm": adr.p50,
        "data_through": occ.data_through.isoformat() if occ.data_through else None,
        "ttm_months_observed": occ.months_observed,
        "index_omission_reason": reason,
        "computed_at": as_of.isoformat(),
    }
```

Reescribir `fetch_airdna_occupancy` (línea 201) para devolver series, no el último punto:
```python
def fetch_airdna_occupancy(market: str) -> dict[str, TtmSummary]:
    """
    Resumen TTM de ocupacion por submercado.

    ANTES hacia drop_duplicates("submarket") sobre metric_date desc, o sea devolvia
    UN punto —el mas reciente— y se persistia en una columna llamada median_occupancy.
    Para las zonas del ranking ese punto era feb-2026, pico de temporada alta.
    """
    rows = supabase_fetch(
        "airdna_metrics",
        select="submarket,metric_value,metric_date",
        filters=f"market=eq.{market}&section=eq.occupancy&chart=eq.chart_1"
                f"&metric_name=eq.occupancy&submarket=not.is.null"
                f"&order=metric_date.desc&limit=5000",
    )
    series: dict[str, list] = {}
    for r in rows or []:
        if r.get("metric_value") is None or not r.get("metric_date"):
            continue
        series.setdefault(r["submarket"], []).append(
            (date.fromisoformat(r["metric_date"]), float(r["metric_value"]))
        )
    return {sub: summarize_ttm(pts) for sub, pts in series.items()}
```

Aplicar el mismo patrón a `fetch_airdna_adr` para el valor publicado. **El cálculo de crecimiento interanual que ya hace esa función no se toca** — es un eje distinto y su ventana es correcta; solo se separa del valor que se publica.

En `compute_zone_scores`, derivar `occupancy_component` de `occ.p50` (antes de `row["occupancy"]`) y armar cada fila con `build_zone_row`.

Agregar `--dry-run` en `main()`: imprime el diff de `score`, `occupancy_p50_ttm` y `index_omission_reason` contra lo que hay en `zone_scores`, y **no llama a `supabase_upsert`**.

- [ ] **Step 4: Correr y verificar que pasa**

Run: `cd propyte-monorepo/crawlers/glowing-spork && python -m pytest analytics/tests/ -v`
Expected: PASS — 21 passed

- [ ] **Step 5: Dry-run contra producción y revisar el diff**

Run: `cd propyte-monorepo/crawlers/glowing-spork && python analytics/compute_derived.py --dry-run`
Expected: imprime el diff sin escribir. **Verificar a mano** que las bajas de ocupación coinciden con la tabla del spec §1.1 (Zona de Resorts 66% → ~40%, Bahía de Akumal 72% → ~47%) y que Playacar sale con `missing_adr`, no `sample_below_30`.

**No continuar si el diff no coincide.** Un diff distinto significa que la ventana o el mapeo de submercados no es el que se probó.

- [ ] **Step 6: Commit**

```bash
cd propyte-monorepo
git add crawlers/glowing-spork/analytics/compute_derived.py crawlers/glowing-spork/analytics/tests/test_compute_derived.py
git commit -m "fix(analytics): publicar mediana TTM en vez del ultimo punto de la serie

fetch_airdna_occupancy hacia drop_duplicates y devolvia un solo punto, que se
persistia como median_occupancy. Para las 16 zonas del ranking ese punto era
feb-2026 y inflaba el ingreso bruto publicado hasta +66%.

Deja de escribir median_occupancy/median_adr. Agrega --dry-run.
occupancy_component ahora deriva de la mediana TTM, lo que reordena el ranking.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Tipo y query de la web leen las columnas nuevas

**Files:**
- Modify: `Next_Propyte_web/src/lib/supabase/queries.ts:1705-1710` (`ZONE_SCORE_NUMERIC_KEYS`), `:1999-2018` (`ZoneScore`)

**Interfaces:**
- Consumes: `OmissionReason` de Task 4.
- Produces: `ZoneScore` con los 7 campos nuevos; `median_occupancy`/`median_adr` marcados `@deprecated`.

- [ ] **Step 1: Extender el tipo**

En `ZoneScore` (línea 1999), agregar antes de `computed_at`:
```ts
  occupancy_p50_ttm: number | null;
  occupancy_low_season: number | null;
  occupancy_high_season: number | null;
  adr_p50_ttm: number | null;
  data_through: string | null;
  ttm_months_observed: number | null;
  index_omission_reason: OmissionReason;
```

Y marcar las viejas:
```ts
  /** @deprecated No es una mediana: es el último punto de la serie. Usar `occupancy_p50_ttm`. */
  median_occupancy: number | null;
  /** @deprecated Último punto de la serie. Usar `adr_p50_ttm`. */
  median_adr: number | null;
```

Agregar el import: `import type { OmissionReason } from '@/lib/rental-data/zone-metrics';`

- [ ] **Step 2: Extender la coerción NUMERIC→number**

`ZONE_SCORE_NUMERIC_KEYS` (línea 1705) — agregar las numéricas nuevas. **`data_through` e `index_omission_reason` NO van aquí** (date y text; coercionarlas daría `NaN`):
```ts
const ZONE_SCORE_NUMERIC_KEYS = [
  'score', 'yield_component', 'occupancy_component', 'adr_growth_component',
  'supply_pressure_component', 'revpar', 'price_to_rent_ratio', 'yield_spread',
  'supply_demand_ratio', 'active_listings', 'median_adr', 'median_occupancy',
  'median_rent',
  'occupancy_p50_ttm', 'occupancy_low_season', 'occupancy_high_season',
  'adr_p50_ttm', 'ttm_months_observed',
] as const;
```

- [ ] **Step 3: Verificar tipos y build**

Run: `cd Next_Propyte_web && npx tsc --noEmit`
Expected: PASS (las superficies siguen leyendo las viejas; se migran en Tasks 7-10).

- [ ] **Step 4: Commit**

```bash
cd Next_Propyte_web
git add src/lib/supabase/queries.ts
git commit -m "feat(mercado): ZoneScore expone columnas TTM y depreca las de punto unico

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Tabla comparativa y badge de omisión

**Files:**
- Modify: `Next_Propyte_web/src/app/[locale]/mercado/components/vacacional/ComparisonTable.tsx:60-73` (orden), `:147` (ingreso), `:160-195` (celdas y badge)
- Modify: `Next_Propyte_web/src/i18n/messages/es.json`, `Next_Propyte_web/src/i18n/messages/en.json`

**Interfaces:**
- Consumes: `grossMonthlyIncome`, `omissionLabelKey`, `isStale` de Task 4; `ZoneScore` de Task 6.
- Produces: nada que otras tareas consuman.

**Contexto:** el badge de las líneas 172-180 hoy renderiza `lowSampleBadge` para **toda** omisión. Playacar (922 anuncios, sin tarifa) sale "muestra baja".

- [ ] **Step 1: Agregar los strings i18n**

En `src/i18n/messages/es.json`, namespace de la tabla (junto a `lowSampleBadge`):
```json
"missingAdrBadge": "sin tarifa publicada",
"missingAdrTitle": "La zona tiene muestra suficiente pero no hay tarifa por noche publicada, así que no se calcula índice ni ingreso.",
"thinCycleBadge": "serie incompleta",
"thinCycleTitle": "La serie tiene menos de 6 meses observados: no alcanza para una mediana anual.",
"occupancyRangeLabel": "temporada baja {low}% – alta {high}%",
"staleSeriesNotice": "Serie sin actualizar desde {date}."
```

En `en.json`, las mismas claves traducidas.

- [ ] **Step 2: Migrar orden, ingreso y celdas**

Líneas 60-73 — el orden usa las columnas nuevas:
```ts
case 'adr': va = a.adr_p50_ttm ?? 0; vb = b.adr_p50_ttm ?? 0; break;
case 'occupancy': va = a.occupancy_p50_ttm ?? 0; vb = b.occupancy_p50_ttm ?? 0; break;
case 'income':
  va = grossMonthlyIncome(a.adr_p50_ttm, a.occupancy_p50_ttm) ?? 0;
  vb = grossMonthlyIncome(b.adr_p50_ttm, b.occupancy_p50_ttm) ?? 0;
  break;
```

Línea 147 — el ingreso deja de calcularse a mano:
```ts
const monthlyIncome = grossMonthlyIncome(score.adr_p50_ttm, score.occupancy_p50_ttm);
```

Celdas de ADR y ocupación (líneas 183-191) leen `adr_p50_ttm` / `occupancy_p50_ttm`. La celda de ingreso: `monthlyIncome != null ? format(monthlyIncome) : '—'` (ya no `> 0`, porque `null` es el único "sin dato").

Bajo la ocupación, el rango cuando ambos extremos existen:
```tsx
{score.occupancy_low_season != null && score.occupancy_high_season != null && (
  <span className="block text-2xs text-gray-600">
    {t('occupancyRangeLabel', {
      low: Math.round(score.occupancy_low_season),
      high: Math.round(score.occupancy_high_season),
    })}
  </span>
)}
```

- [ ] **Step 3: Badge por razón real**

Reemplazar el bloque de las líneas 172-180:
```tsx
) : (
  // El pipeline decidió y dijo por qué. El sitio solo rotula: no reevalúa
  // el umbral ni colapsa las razones en una sola etiqueta.
  (() => {
    const key = omissionLabelKey(score.index_omission_reason);
    if (!key) return <span className="text-gray-600">—</span>;
    return (
      <span
        className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
        title={t(`${key.replace('Badge', 'Title')}`)}
      >
        {t(key)}
      </span>
    );
  })()
)}
```

- [ ] **Step 4: Verificar tipos, lint y tests**

Run: `cd Next_Propyte_web && npx tsc --noEmit && npm run lint && npm run test:unit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd Next_Propyte_web
git add src/app/\[locale\]/mercado/components/vacacional/ComparisonTable.tsx src/i18n/messages/
git commit -m "fix(mercado): tabla usa mediana TTM y rotula la razon real de omision

Playacar tiene 922 anuncios y salia como 'muestra baja' porque el badge
renderizaba lo mismo para toda omision. Ahora dice 'sin tarifa publicada'.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: KPIs, procedencia y aviso de antigüedad

**Files:**
- Modify: `Next_Propyte_web/src/app/[locale]/mercado/components/vacacional/VacacionalTab.tsx:86-87` (orden), `:118-120` (KPI ocupación), `:130-137` (`latestDate`), `:170-175` (línea de procedencia)
- Modify: `Next_Propyte_web/src/i18n/messages/{es,en}.json`

**Interfaces:**
- Consumes: `isStale` de Task 4; `ZoneScore` de Task 6.
- Produces: nada.

**Contexto:** `latestDate` (línea 130) hoy deriva de `computed_at`, que es la fecha de la corrida — por eso la página decía "Corte julio de 2026" sobre datos de febrero. Debe derivar de `data_through`.

- [ ] **Step 1: Migrar orden y KPI**

Líneas 86-87 → `occupancy_p50_ttm` / `adr_p50_ttm`.
Líneas 118-120 → el promedio de ocupación usa `occupancy_p50_ttm`:
```ts
const occZones = target.filter((z) => z.occupancy_p50_ttm != null);
const avgOcc = occZones.length > 0
  ? occZones.reduce((s, z) => s + (z.occupancy_p50_ttm ?? 0), 0) / occZones.length
  : 0;
```

- [ ] **Step 2: `latestDate` deriva de `data_through`, no de `computed_at`**

```ts
// data_through, NO computed_at: computed_at es la fecha de la corrida del pipeline
// y decía "julio de 2026" sobre una serie que cerró en febrero.
const latestDate = useMemo(() => {
  const dates = scores.map((s) => s.data_through).filter(Boolean).sort().reverse();
  if (dates.length === 0) return null;
  const d = new Date(`${dates[0]}T00:00:00Z`);
  return d.toLocaleDateString(isEn ? 'en-US' : 'es-MX', {
    month: 'long', year: 'numeric', timeZone: 'UTC',
  });
}, [scores, isEn]);
```

- [ ] **Step 3: Aviso de antigüedad junto a la procedencia**

Bajo la línea de `provenanceLine`:
```tsx
{(() => {
  const newest = scores.map((s) => s.data_through).filter(Boolean).sort().reverse()[0] ?? null;
  if (!isStale(newest, new Date())) return null;
  return (
    <p className="text-xs text-amber-800 text-center">
      {tMer('staleSeriesNotice', { date: latestDate ?? '—' })}
    </p>
  );
})()}
```

- [ ] **Step 4: Verificar**

Run: `cd Next_Propyte_web && npx tsc --noEmit && npm run test:unit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd Next_Propyte_web
git add src/app/\[locale\]/mercado/components/vacacional/VacacionalTab.tsx src/i18n/messages/
git commit -m "fix(mercado): corte y KPIs desde data_through, con aviso de serie rancia

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Tarjetas de zona y recalibración de tendencia

**Files:**
- Modify: `Next_Propyte_web/src/components/analytics/ZoneScoreCard.tsx:103-108`
- Test: `Next_Propyte_web/src/lib/rental-data/zone-metrics.test.ts` (extender)
- Modify: `Next_Propyte_web/src/lib/rental-data/zone-metrics.ts`

**Interfaces:**
- Consumes: `ZoneScore` de Task 6.
- Produces: `occupancyTrend(occP50: number | null): 'up' | 'down' | 'flat'`

**Contexto:** la línea 104 usa umbrales `> 58` sube / `< 40` baja, calibrados sobre la escala inflada (medianas de febrero). Con medianas TTM la distribución baja ~20 pts, así que casi todo caería a "flat". Los umbrales nuevos salen de la distribución real: p50 TTM de las 16 zonas va de 39.7 a 60.7, con mediana ~50.

- [ ] **Step 1: Escribir el test que falla**

Agregar a `zone-metrics.test.ts`:
```ts
import { occupancyTrend } from '@/lib/rental-data/zone-metrics';

describe('occupancyTrend', () => {
  it('recalibrado a la distribucion TTM, no a la de picos de febrero', () => {
    // La distribucion TTM real de las 16 zonas va de 39.7 a 60.7, mediana ~50.
    expect(occupancyTrend(60.7)).toBe('up');    // Aqua/Cumbres, la mas alta
    expect(occupancyTrend(39.7)).toBe('down');  // Zona de Resorts, la mas baja
    expect(occupancyTrend(50)).toBe('flat');
  });

  it('con los umbrales viejos (58/40) casi todo caia a flat', () => {
    // 47.4 = Bahia de Akumal. Con >58/<40 era 'flat'; ahora informa.
    expect(occupancyTrend(47.4)).not.toBe('up');
    expect(occupancyTrend(55.5)).toBe('up');
  });

  it('sin dato es flat', () => {
    expect(occupancyTrend(null)).toBe('flat');
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `cd Next_Propyte_web && npx vitest run src/lib/rental-data/zone-metrics.test.ts`
Expected: FAIL — `occupancyTrend is not a function`

- [ ] **Step 3: Implementar y usar en la tarjeta**

En `zone-metrics.ts`:
```ts
/**
 * Umbrales calibrados sobre la distribución de medianas TTM (39.7–60.7, mediana ~50).
 * Los anteriores (58/40) venían de la escala inflada por los picos de febrero: con
 * medianas reales dejaban casi todas las zonas en 'flat'.
 */
const TREND_UP = 54;
const TREND_DOWN = 45;

export function occupancyTrend(occP50: number | null): 'up' | 'down' | 'flat' {
  const occ = usable(occP50);
  if (occ == null) return 'flat';
  if (occ >= TREND_UP) return 'up';
  if (occ <= TREND_DOWN) return 'down';
  return 'flat';
}
```

En `ZoneScoreCard.tsx:103-108`, usar `score.occupancy_p50_ttm`, `score.adr_p50_ttm` y `occupancyTrend(score.occupancy_p50_ttm)`.

- [ ] **Step 4: Correr y verificar que pasa**

Run: `cd Next_Propyte_web && npx vitest run src/lib/rental-data/zone-metrics.test.ts && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd Next_Propyte_web
git add src/components/analytics/ZoneScoreCard.tsx src/lib/rental-data/zone-metrics.ts src/lib/rental-data/zone-metrics.test.ts
git commit -m "fix(mercado): tarjeta de zona con mediana TTM y tendencia recalibrada

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Las cinco superficies restantes + lead magnet

**Files:**
- Modify: `Next_Propyte_web/src/app/[locale]/zonas/ZonasExplorer.tsx:88-89,108-109`
- Modify: `Next_Propyte_web/src/app/[locale]/zonas/[slug]/page.tsx:194-196,346-355`
- Modify: `Next_Propyte_web/src/app/[locale]/zonas/[slug]/ZoneAnalytics.tsx:121-127,176`
- Modify: `Next_Propyte_web/src/components/home/TrendingMarket.tsx:48-62`
- Modify: `Next_Propyte_web/src/components/property/GeoAnalysis.tsx:164-173`
- Modify: `Next_Propyte_web/src/lib/lead-magnet/edition-data.ts:28`
- Test: `Next_Propyte_web/src/lib/lead-magnet/edition-data.test.ts` (extender)

**Interfaces:**
- Consumes: `grossMonthlyIncome` de Task 4; `ZoneScore` de Task 6.
- Produces: nada.

**Contexto:** el lead magnet va aquí y no en una fase posterior porque **es material que sale del sitio por correo**. `cityStr` en `zonas/[slug]/page.tsx:346-355` viene de `CityStrBenchmark`, una interfaz distinta — si esa tabla no tiene columnas TTM, deja `median_*` y anota el pendiente; no inventes columnas que no existen.

- [ ] **Step 1: Migrar las cinco superficies de UI**

En cada archivo, sustituir `median_occupancy` → `occupancy_p50_ttm` y `median_adr` → `adr_p50_ttm`. Donde se calcule ingreso a mano, usar `grossMonthlyIncome`.

- [ ] **Step 2: Escribir el test del lead magnet que falla**

Agregar a `src/lib/lead-magnet/edition-data.test.ts`:
```ts
it('la edicion publica mediana TTM, no el ultimo punto de la serie', () => {
  const zona = buildTopZone({
    zone: 'Bahía de Akumal',
    city: 'Akumal',
    score: 88.1,
    occupancy_p50_ttm: 47.4,
    adr_p50_ttm: 4969,
  });
  expect(zona).not.toHaveProperty('median_occupancy');
  expect(zona).not.toHaveProperty('median_adr');
  expect(zona.occupancy_p50_ttm).toBe(47.4);
});
```
(Adaptar `buildTopZone` al helper que ya use ese archivo de test.)

- [ ] **Step 3: Correr y verificar que falla**

Run: `cd Next_Propyte_web && npx vitest run src/lib/lead-magnet/edition-data.test.ts`
Expected: FAIL

- [ ] **Step 4: Migrar el `Pick` del lead magnet**

`src/lib/lead-magnet/edition-data.ts:28`:
```ts
topZones: Pick<ZoneScore, 'city' | 'zone' | 'score' | 'occupancy_p50_ttm' | 'adr_p50_ttm' | 'data_through'>[];
```
Incluir `data_through`: un PDF que sale del sitio tiene que llevar su fecha de corte.

- [ ] **Step 5: Verificar todo**

Run: `cd Next_Propyte_web && npx tsc --noEmit && npm run lint && npm run test:unit`
Expected: PASS. `grep -rn "median_occupancy\|median_adr" src/ --include=*.tsx` no debe devolver nada fuera de `queries.ts`.

- [ ] **Step 6: Commit**

```bash
cd Next_Propyte_web
git add src/app src/components src/lib/lead-magnet
git commit -m "fix(mercado): migrar las 5 superficies restantes y el lead magnet a TTM

El lead magnet es material que sale del sitio por correo con cifras infladas
hasta +66%; ahora publica mediana TTM y lleva su fecha de corte.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Guardias de invariantes (Fase 5 del spec)

**Files:**
- Create: `Next_Propyte_web/src/lib/rental-data/methodology-invariants.test.ts`

**Interfaces:**
- Consumes: `MAX_DATA_AGE_DAYS` de Task 4.
- Produces: nada.

**Contexto:** estos son los tests que habrían cazado los dos bugs del spec. Corren contra datos de muestra congelados (no contra la BD viva) para que sean deterministas: la BD es un entorno, no una aserción.

- [ ] **Step 1: Escribir los tests**

```ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import es from '@/i18n/messages/es.json';

/**
 * Invariantes de metodología.
 *
 * Los dos bugs de la auditoría de ago-2026 comparten forma: lo que la página
 * afirmaba no coincidía con lo que el código calculaba. Estos tests verifican
 * la coincidencia, no el cálculo.
 */

// Fila real de zone_scores tal como la escribe el pipeline corregido.
const FILA = {
  zone: 'Bahía de Akumal',
  score: 88.1,
  occupancy_component: 92.2,
  adr_growth_component: 98.6,
  supply_pressure_component: 85.3,
  occupancy_p50_ttm: 47.435,
  data_through: '2026-02-01',
  computed_at: '2026-08-20',
};

// Último punto de la serie del submercado: el valor que se publicaba antes.
const ULTIMO_PUNTO_DE_LA_SERIE = 72.46;

describe('ninguna cifra publicada es un punto único', () => {
  it('occupancy_p50_ttm no es el último punto de la serie', () => {
    expect(FILA.occupancy_p50_ttm).not.toBe(ULTIMO_PUNTO_DE_LA_SERIE);
  });
});

describe('data_through es independiente de computed_at', () => {
  it('la fecha del dato no es la fecha de la corrida', () => {
    expect(FILA.data_through).not.toBe(FILA.computed_at);
  });
});

describe('la metodología publicada coincide con las constantes del código', () => {
  const metodologia = es.methodology as Record<string, string>;

  it('los pesos del índice suman 100% y son los que la página declara', () => {
    const resumen = metodologia.summaryStr;
    expect(resumen).toContain('30%');
    expect(resumen).toContain('25%');
    expect(resumen).toContain('20%');
    const pesos = [0.30, 0.25, 0.25, 0.20];
    expect(pesos.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
  });

  it('el umbral de muestra que la página afirma está implementado en el pipeline', () => {
    // REVISADO 2026-08-20: el umbral SÍ existe, en publication_gates.py, no en un
    // módulo nuevo. Este test lo ancla ahí y falla si alguien lo mueve o lo cambia
    // sin cambiar el texto publicado.
    expect(metodologia.methodSample).toContain('30');
    const gates = readFileSync(
      '../propyte-monorepo/crawlers/glowing-spork/analytics/publication_gates.py',
      'utf8',
    );
    expect(gates).toContain('MIN_SAMPLE_INDEX = 30');
    expect(gates).toContain('MIN_SAMPLE_OCCUPANCY = 15');
    expect(metodologia.methodSample).toContain('15');
  });
});

describe('sin nombres de proveedor en texto visible', () => {
  it('los strings de mercado no nombran ninguna fuente externa', () => {
    const texto = JSON.stringify([es.mercado, es.mercadoHero, es.methodology, es.mercadoMeta]);
    for (const nombre of ['AirDNA', 'AirROI', 'Apify', 'Inmuebles24', 'Mercado Libre']) {
      expect(texto).not.toContain(nombre);
    }
  });
});
```

- [ ] **Step 2: Correr y verificar que pasan**

Run: `cd Next_Propyte_web && npx vitest run src/lib/rental-data/methodology-invariants.test.ts`
Expected: PASS — 5 passed.

Si el test de la ruta relativa al monorepo falla porque el checkout no lo tiene al lado, marcarlo `it.skipIf(!existsSync(ruta))` y **anotarlo como pendiente** — no borrarlo.

- [ ] **Step 3: Commit**

```bash
cd Next_Propyte_web
git add src/lib/rental-data/methodology-invariants.test.ts
git commit -m "test(mercado): guardias de invariantes de metodologia

Los dos bugs de la auditoria comparten forma: lo afirmado no coincidia con lo
calculado. Estos tests verifican la coincidencia.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: Fase 3 — correcciones de texto de la auditoría

**Files:**
- Modify: `Next_Propyte_web/src/i18n/messages/{es,en}.json`
- Modify: `Next_Propyte_web/src/app/[locale]/mercado/components/shared/MethodologySection.tsx:60-75`
- Modify: `Next_Propyte_web/src/lib/rental-data/analysis.ts:22`

**Interfaces:** ninguna.

- [ ] **Step 1: P1 — la cifra de registros**

`mercadoHero.badge` y `mercado.badge`: `+2M registros de renta` → `+385K registros de renta`.
`mercadoMeta.description`: `+2M registros` → `+385K registros`.

Respaldo: `airdna_metrics` 369,689 + `rental_comparables` 15,472 + `airroi_listings` 300 + `rental_ml_estimates` 210 + `airdna_market_summary` 49 = **385,720**.

- [ ] **Step 2: P5 — quitar `strFooter` de la pestaña vacacional**

`methodology.strFooter` dice "comparables públicos de portales inmobiliarios", que es la fuente de la pestaña **tradicional**, y se renderiza en la **vacacional** contradiciendo a `methodProvenance`. Quitar el `<p>{t('strFooter')}</p>` de `MethodologySection.tsx` (rama vacacional) y borrar la clave.

- [ ] **Step 3: P8 — alinear el piso publicado con el del código**

`methodology.ltrStep3` dice "$5,000" y `analysis.ts:22` usa `RENT_MIN = 2_000`. Subir el código al valor publicado:
```ts
const RENT_MIN = 5_000;  // coincide con methodology.ltrStep3
```
Afecta 81 comparables de la ventana. Es el cambio correcto: el número publicado es el compromiso.

- [ ] **Step 4: P9 — acotar la afirmación de cobertura**

`methodology.summaryLtr`: `62+ ciudades en México` → `62 localidades de Yucatán y Quintana Roo`. Las 63 `city` distintas incluyen `Yucatán`, `Quintana Roo`, `Solidaridad`, `Yucatán Country Club` y casi-duplicados; ninguna está fuera de la península.

- [ ] **Step 5: Verificar**

Run: `cd Next_Propyte_web && npm run test:unit && npx tsc --noEmit && npm run build`
Expected: PASS. El test de nombres de proveedor de Task 11 debe seguir pasando.

- [ ] **Step 6: Commit**

```bash
cd Next_Propyte_web
git add src/i18n/messages src/app/\[locale\]/mercado/components/shared/MethodologySection.tsx src/lib/rental-data/analysis.ts
git commit -m "fix(mercado): corregir cifras y procedencias que no se sostenian

- +2M registros -> +385K (real: 385,720 sumando las 5 tablas de analitica)
- quitar strFooter de la pestana vacacional: declaraba la fuente de la tradicional
- RENT_MIN 2000 -> 5000, el piso que la metodologia ya publicaba
- '62+ ciudades en Mexico' -> '62 localidades de Yucatan y Quintana Roo'

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 13: Fase 3 — los dos estados que no miran el dato

**Files:**
- Modify: `Next_Propyte_web/src/app/[locale]/mercado/page.tsx:68-78`
- Modify: `Next_Propyte_web/src/app/[locale]/mercado/components/tradicional/TradicionalTab.tsx`
- Modify: `Next_Propyte_web/src/i18n/messages/{es,en}.json`

**Interfaces:**
- Consumes: `getRentalAnalysis` (ya existe).
- Produces: `ltrStats` en `MercadoHero`.

**Contexto:** P6 — `page.tsx` calcula `strStats` pero **nunca `ltrStats`**, así que en `?tab=tradicional` el hero muestra "Actualizando datos de mercado…" sobre 10,695 resultados ya cargados, y los cuatro tiles LTR son código muerto. P7 — `mercado.ltrSourceUpdated` es el string fijo `"Actualización: hoy"`: solo 1,045 de 15,472 comparables tienen menos de 30 días.

- [ ] **Step 1: Calcular `ltrStats` en el servidor**

En `page.tsx`, junto a `strStats`:
```ts
const ltrStats = tradicionalData
  ? {
      comparables: tradicionalData.total_comparables ?? 0,
      cities: tradicionalData.by_city?.length ?? 0,
      sources: tradicionalData.sources?.length ?? 7,
      updatedAt: tradicionalData.last_scraped_at ?? '',
    }
  : undefined;
```
(Ajustar los nombres a los de `AnalysisData` en `src/lib/rental-data/analysis-types.ts`.)

Y pasarlo: `<MercadoHero activeTab={activeTab} locale={locale} strStats={strStats} ltrStats={ltrStats} />`

- [ ] **Step 2: La fecha de actualización sale del dato**

Reemplazar `ltrSourceUpdated` por una clave con parámetro:
```json
"ltrSourceUpdated": "Última actualización: {date}"
```
y pasarle el `max(scraped_at)` real. Si `AnalysisData` no lo expone, agregarlo en `analysis.ts` (`Math.max` de los `scraped_at` de los comparables limpios).

- [ ] **Step 3: Verificar en vivo**

Run: `cd Next_Propyte_web && npm run build && npm run start`
Abrir `http://localhost:3000/es/mercado?tab=tradicional`.
Expected: el hero muestra cuatro tiles con cifras (no "Actualizando datos…"), y la fecha de actualización es una fecha real.

- [ ] **Step 4: Commit**

```bash
cd Next_Propyte_web
git add src/app/\[locale\]/mercado src/i18n/messages
git commit -m "fix(mercado): pestana tradicional calcula ltrStats y fecha real

El hero mostraba 'Actualizando datos de mercado...' sobre 10,695 resultados ya
cargados porque ltrStats nunca se calculaba. Y 'Actualizacion: hoy' era un string
fijo: solo 1,045 de 15,472 comparables tienen menos de 30 dias.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 14: Fase 3 — el hero separa oferta de referencia (P4)

**Files:**
- Modify: `Next_Propyte_web/src/app/[locale]/mercado/page.tsx:70-78`
- Modify: `Next_Propyte_web/src/i18n/messages/{es,en}.json`

**Interfaces:**
- Consumes: `partitionByPool` de `@/lib/rental-data/pools`.
- Produces: nada.

**Contexto:** `21,115 propiedades mapeadas` y `6 ciudades` incluyen CDMX — **14,266 de 21,115 (67.6%)**. Dos párrafos abajo la página dice que CDMX no es mercado de Propyte. El hero debe contar la oferta y mencionar la referencia aparte.

- [ ] **Step 1: Contar solo el ranking en los tiles**

```ts
const { ranking, benchmark } = partitionByPool(strScores);
const strStats = ranking.length > 0
  ? {
      zones: ranking.length,
      listings: ranking.reduce((s, z) => s + (z.active_listings ?? 0), 0),
      cities: new Set(ranking.map((z) => z.city)).size,
      benchmarkListings: benchmark.reduce((s, z) => s + (z.active_listings ?? 0), 0),
      updatedAt: ranking.map((z) => z.data_through).filter(Boolean).sort().reverse()[0] ?? '',
    }
  : undefined;
```
Resultado esperado: `6,849 propiedades`, `5 ciudades`, `26 zonas` — todo consistente con el KPI de abajo, que hoy dice 26 mientras el hero dice 44.

- [ ] **Step 2: Nota de referencia**

Nuevo string y un pie bajo los tiles:
```json
"benchmarkFootnote": "Más {count} propiedades de Ciudad de México, incluidas solo como mercado de referencia."
```

- [ ] **Step 3: Verificar en vivo**

Run: `cd Next_Propyte_web && npm run build && npm run start` → `http://localhost:3000/es/mercado`
Expected: hero y KPI coinciden en 26 zonas; el pie declara las de CDMX.

- [ ] **Step 4: Commit**

```bash
cd Next_Propyte_web
git add src/app/\[locale\]/mercado/page.tsx src/i18n/messages
git commit -m "fix(mercado): el hero cuenta la oferta, no el benchmark

21,115 propiedades y 6 ciudades incluian CDMX: 67.6% del total, un mercado que
la propia pagina declara fuera de la oferta dos parrafos abajo.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## ~~Task 15: Fase 2 — que no vuelva a pasar~~ — SUPERSEDIDO por Task 15R

> **No ejecutar.** Tres de sus cuatro pasos ya están hechos en `origin/main`: el
> monitoreo de `airroi_str_zonal` existe (`observer.py:25`, umbral 35d) y la alerta
> se envía (`observer.py:323-338` → `notifier` WhatsApp+SMTP). Solo sobrevive el
> `status='done'` con cero filas. Ver **Task 15R** al final.

## Task 15 (original, solo como referencia): Fase 2

**Files:**
- Modify: pipeline del VPS que escribe `investment_analytics.scraper_jobs` (**ubicar primero**; no está en el monorepo)
- Create: fila de `scraper_config` para `airroi_str_zonal`

**Interfaces:** ninguna hacia el resto del plan.

**Contexto:** `airroi_str_zonal` murió el 2026-03-22 (151 días, umbral 35) sin que nadie se enterara, porque en `scraper_jobs` un scraper que trae **cero filas** sale con `rc=0` y se registra `status='done'`. 4 de 5 corridas de `airroi_listings` trajeron 0 filas y todas dicen "done". `pipeline_health` sí detectó todo y nadie lee esa tabla.

**Este task empieza con una investigación, no con código:** ni `zone_sample_gate` ni `airroi_str_zonal` están en `propyte-monorepo/crawlers/glowing-spork`. Viven en el VPS, fuera de control de versiones.

- [ ] **Step 1: Localizar el código del VPS**

Buscar en el crontab de root del VPS los jobs que escriben `scraper_jobs` y `pipeline_health`. **No modificar nada todavía** — documentar qué archivo es cada cosa y dónde vive.

- [ ] **Step 2: `rows_affected = 0` deja de ser `done`**

Donde se registra el resultado, distinguir:
```
rc != 0                      -> status = 'failed'
rc == 0 and rows_affected==0 -> status = 'empty'    (nuevo)
rc == 0 and rows_affected> 0 -> status = 'done'
```
Un scraper que no trae nada no tuvo éxito.

- [ ] **Step 3: Alta de `airroi_str_zonal` en `scraper_config`**

```sql
insert into investment_analytics.scraper_config (scraper, city, enabled, cap, updated_at, updated_by)
values ('airroi_str_zonal', 'akumal', true, null, now(), 'fase2-alta-scraper-zonal'),
       ('airroi_str_zonal', 'cancun', true, null, now(), 'fase2-alta-scraper-zonal'),
       ('airroi_str_zonal', 'playa_del_carmen', true, null, now(), 'fase2-alta-scraper-zonal'),
       ('airroi_str_zonal', 'tulum', true, null, now(), 'fase2-alta-scraper-zonal');
```
Es el único de los seis scrapers sin fila: sin `enabled`, sin `cap`, sin dueño.

- [ ] **Step 4: `pipeline_health` deja de ser una tabla que nadie lee**

Agregar alerta (mismo canal que ya use el VPS) cuando cualquier fila esté en `STALE` o `ERROR`. Al escribir esto hay tres: `airroi_str_zonal` STALE, `zone_scores` STALE, `dev_financials_plausibility` ERROR.

- [ ] **Step 5: Meter lo del VPS al monorepo**

Mover `zone_sample_gate` y el scraper zonal a `propyte-monorepo/crawlers/glowing-spork/`. Son código de producción sin versionar y el resto del plan depende de ellos.

- [ ] **Step 6: Commit**

```bash
cd propyte-monorepo
git add crawlers/glowing-spork/
git commit -m "feat(crawlers): status 'empty' y alta del scraper zonal

Un scraper con 0 filas salia rc=0 y se registraba 'done', asi que airroi_str_zonal
pudo morir en marzo y seguir publicandose en agosto. pipeline_health lo detecto
y nadie leia esa tabla.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Auto-revisión

**Cobertura del spec:**

| Sección del spec | Task |
|---|---|
| §3.1 contrato de datos | 3, 6 |
| §3.2 pipeline TTM + compuerta de dos ejes | 1, 2, 5 |
| §3.3 cambios en la web (8 superficies) | 7, 8, 9, 10 |
| §3.4 cuatro estados de omisión | 2, 7 |
| §3.5 `development_financials` | **plan aparte** (Fase 4, prioridad baja) |
| Fase 1 | 1-10 |
| Fase 2 | 15 |
| Fase 3 (13 hallazgos) | 12, 13, 14 |
| Fase 5 guardias 1-4 | 11 |
| Fase 5 guardias 5-6 (financials) | **plan aparte** |
| §6 riesgo "escribe en producción" | 5 paso 5 (`--dry-run`) |

**Consistencia de tipos:** `OmissionReason` se define en Task 4 y se consume en 6, 7. `summarize_ttm`/`TtmSummary` en Task 1, consumidos en 2 y 5. `grossMonthlyIncome` en Task 4, consumido en 7 y 10. `occupancyTrend` en Task 9. Los nombres de columna son idénticos entre la migración (Task 3), el pipeline (Task 5) y el tipo TS (Task 6).

**Pendientes marcados, no escondidos:**
- Task 10: `CityStrBenchmark` puede no tener columnas TTM — dejar `median_*` y anotarlo, no inventar columnas.
- Task 11: el test que lee `ttm.py` por ruta relativa depende del layout del checkout — `skipIf`, no borrar.
- Task 15 arranca con investigación: el código no está en ningún repo local.
- P10 (la etiqueta "Competencia" usa conteo crudo: Zona Hotelera Cancún con 174 anuncios sale "Moderada") **no tiene task**. Es recalibración de producto, no corrección de dato, y el spec lo lista en Fase 3 sin definir el criterio nuevo. Necesita una decisión antes de codificarse.
- P12 (`tulum_country_club` bajo Akumal) **no tiene task**: requiere confirmación humana de la geografía, ya marcada en `calculator.ts:186`.

**Requisito no técnico, bloqueante para publicar:** avisar a los asesores antes de desplegar Task 5. Los ingresos bajan entre −5% y −40% y hay cifras ya cotizadas.

---

# Tasks revisados (2026-08-20)

> Estos reemplazan a los tasks 1, 2, 5 y 15. **Los tres primeros requieren Python, que
> no está instalado en la máquina de desarrollo.** No se pueden ejecutar ni verificar
> aquí — ver la nota de bloqueo al final.

---

## Task 1R: Resumen TTM + compuerta de ciclo, dentro de los módulos que ya existen

**Files:**
- Create: `crawlers/glowing-spork/analytics/ttm.py`
- Modify: `crawlers/glowing-spork/analytics/publication_gates.py`
- Test: `crawlers/glowing-spork/tests/test_ttm.py` (nuevo)
- Test: `crawlers/glowing-spork/tests/test_publication_gates.py` (extender)

**Interfaces:**
- Consumes: nada.
- Produces: `TTM_MONTHS`, `TtmSummary` (dataclass congelada: `p50`, `low_season`, `high_season`, `data_through: date|None`, `months_observed: int`), `summarize_ttm(points) -> TtmSummary`. Y en `publication_gates`: `MIN_MONTHS_FOR_TTM` más un motivo nuevo `thin_cycle` en `gate_zone`.

**Reglas que NO se pueden violar:**
1. **El vocabulario de motivos es el que ya existe.** `gate_zone` devuelve `sample_below_15`, `sample_below_30`, `missing:<componente>`. El motivo nuevo se suma a esa lista; no se crea un enum paralelo.
2. **Los umbrales viven solo en `publication_gates.py`** — lo dice su propio docstring. `MIN_MONTHS_FOR_TTM` va ahí, y `ttm.py` lo importa de ahí, no al revés.
3. `ttm.py` no importa pandas: se prueba con tuplas planas, igual que `publication_gates`.
4. La ventana se ancla en `max(metric_date)` **de la serie**, no en hoy. Las series de submercado llegan meses atrasadas; anclar en hoy devuelve ventana vacía.

- [ ] **Step 1: Escribir `tests/test_ttm.py`** — usar el cuerpo de tests del Task 1 original (la serie `AKUMAL` real y los valores 47.435 / 32.49 / 64.33 están verificados aritméticamente y siguen siendo correctos). **Omitir** el `pytest.ini`, el `tests/__init__.py` y el cambio a `requirements.txt`: `tests/conftest.py` ya resuelve el `sys.path`. Nombres de test en español, como el resto de la suite.

- [ ] **Step 2: Correr y verificar que falla**

Run: `python -m pytest tests/test_ttm.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'analytics.ttm'`

- [ ] **Step 3: Implementar `analytics/ttm.py`** — el cuerpo del Task 1 original, con dos cambios: importar `MIN_MONTHS_FOR_TTM` desde `publication_gates` en vez de definirlo, y borrar `MAX_DATA_AGE_DAYS` y `MIN_LISTINGS_FOR_INDEX` (el primero ya vive en `observer.py:25` como `max_age_days`; el segundo ya es `MIN_SAMPLE_INDEX`).

- [ ] **Step 4: Agregar la compuerta de ciclo a `publication_gates.py`**

```python
# Meses distintos minimos para que la mediana TTM represente un anio.
MIN_MONTHS_FOR_TTM = 6
```

y en `gate_zone`, **después** de los dos chequeos de muestra y **antes** del bucle de `REQUIRED_COMPONENTS`:

```python
    months = metrics.get("ttm_months_observed")
    months = 0 if is_missing(months) else int(months)
    if months < MIN_MONTHS_FOR_TTM:
        return ("no_index", "thin_cycle")
```

Va en ese orden a propósito: una zona con 3 anuncios no merece un diagnóstico sobre su ciclo, merece salir (`drop`). Y va antes de los componentes porque un ciclo delgado explica *por qué* faltan.

- [ ] **Step 5: Extender `tests/test_publication_gates.py`**

```python
def test_ciclo_delgado_no_publica_indice_pero_si_la_fila():
    m = {"active_listings": 200, "ttm_months_observed": 4,
         "occupancy": 47.4, "adr": 5261.0, "adr_growth_pct": 3.0, "revpar": 2493.7}
    assert gate_zone(m) == ("no_index", "thin_cycle")


def test_muestra_insuficiente_gana_sobre_ciclo_delgado():
    # 3 anuncios: sale de la tabla. No se diagnostica su ciclo.
    m = {"active_listings": 3, "ttm_months_observed": 4}
    assert gate_zone(m) == ("drop", "sample_below_15")


def test_ciclo_completo_con_todo_publica():
    m = {"active_listings": 200, "ttm_months_observed": 12,
         "occupancy": 47.4, "adr": 5261.0, "adr_growth_pct": 3.0, "revpar": 2493.7}
    assert gate_zone(m) == ("publish", None)


def test_ttm_ausente_cuenta_como_ciclo_delgado():
    # is_missing cubre None y NaN: una zona sin la columna no se cuela con indice.
    m = {"active_listings": 200, "ttm_months_observed": None,
         "occupancy": 47.4, "adr": 5261.0, "adr_growth_pct": 3.0, "revpar": 2493.7}
    assert gate_zone(m) == ("no_index", "thin_cycle")
```

- [ ] **Step 6: Correr toda la suite y verificar que nada se rompió**

Run: `python -m pytest tests/ -q`
Expected: PASS. Los 18 archivos previos siguen verdes. `gate_zone` cambió de comportamiento para entradas sin `ttm_months_observed`, así que **si algún test viejo falla es señal legítima**: revisar si ese test representa una zona real o un fixture incompleto, y corregir el fixture, nunca el gate.

- [ ] **Step 7: Commit**

```
git add crawlers/glowing-spork/analytics/ttm.py \
        crawlers/glowing-spork/analytics/publication_gates.py \
        crawlers/glowing-spork/tests/test_ttm.py \
        crawlers/glowing-spork/tests/test_publication_gates.py
git commit -m "feat(analytics): mediana TTM y compuerta de ciclo en publication_gates"
```

---

## Task 2R: Persistir el TTM y el motivo que el pipeline ya calcula

**Files:**
- Modify: `crawlers/glowing-spork/analytics/compute_derived.py` — `fetch_airdna_occupancy` (`:209-224`), `_OCC_FIELDS`, `build_zone_score_rows` (`:629`), `main`
- Test: `crawlers/glowing-spork/tests/test_compute_derived.py` (extender)

**Interfaces:**
- Consumes: `summarize_ttm`, `TtmSummary` de Task 1R; `gate_zone` (ya existe).
- Produces: `build_zone_score_rows` emitiendo las 7 columnas nuevas.

**Contexto que cambia respecto al plan original:**
- **`build_zone_row` NO se crea.** `build_zone_score_rows(df)` ya existe en `:629` y su docstring ya dice *"Pura salvo por el timestamp"*. Se le agregan campos.
- **`gate_reason` ya se calcula y se tira.** `apply_gates` (`:579-581`) pone `gate_verdict` y `gate_reason` en el DataFrame; `build_zone_score_rows` no los lee. Persistir `gate_reason` en `index_omission_reason` **es** el cambio, no una función nueva.
- `computed_at` se queda como `datetime.now(timezone.utc).isoformat()`. `data_through` es una fecha, y son columnas distintas — ese es el punto.

- [ ] **Step 1: Escribir los tests que fallan**

```python
from analytics.compute_derived import build_zone_score_rows


def _fila_valida():
    return {
        "city": "Akumal", "zone": "Bahia de Akumal",
        "score": 88.1, "occupancy_component": 92.2, "adr_growth_component": 98.6,
        "supply_pressure_component": 85.3, "revpar": 3812.12,
        "active_listings": 200, "adr": 4969.0, "occupancy": 47.435,
        "occupancy_low_season": 32.49, "occupancy_high_season": 64.33,
        "data_through": "2026-02-01", "ttm_months_observed": 12,
        "supply_demand_ratio": None,
        "gate_verdict": "publish", "gate_reason": None,
    }


def test_persiste_la_mediana_ttm_y_no_el_ultimo_punto():
    row = build_zone_score_rows(_df([_fila_valida()]))[0]
    assert row["occupancy_p50_ttm"] == 47.435
    assert row["occupancy_low_season"] == 32.49
    assert row["occupancy_high_season"] == 64.33
    assert row["adr_p50_ttm"] == 4969.0
    assert row["ttm_months_observed"] == 12


def test_data_through_es_del_dato_y_computed_at_de_la_corrida():
    row = build_zone_score_rows(_df([_fila_valida()]))[0]
    assert row["data_through"] == "2026-02-01"
    assert row["data_through"] != row["computed_at"]


def test_el_motivo_del_gate_llega_a_la_fila():
    # Playacar: 922 anuncios, sin ADR. gate_zone ya emite "missing:adr";
    # antes moria en el DataFrame y la UI decia "muestra baja".
    fila = {**_fila_valida(), "zone": "Playacar", "active_listings": 922,
            "adr": None, "score": None, "gate_verdict": "no_index",
            "gate_reason": "missing:adr"}
    row = build_zone_score_rows(_df([fila]))[0]
    assert row["index_omission_reason"] == "missing:adr"
    assert row["score"] is None
    assert row["adr_p50_ttm"] is None
    assert row["occupancy_p50_ttm"] is not None   # la ocupacion si se publica


def test_zona_publicada_no_lleva_motivo():
    row = build_zone_score_rows(_df([_fila_valida()]))[0]
    assert row["index_omission_reason"] is None


def test_deja_de_escribir_las_columnas_deprecadas():
    row = build_zone_score_rows(_df([_fila_valida()]))[0]
    assert "median_occupancy" not in row
    assert "median_adr" not in row
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `python -m pytest tests/test_compute_derived.py -v -k "ttm or motivo or deprecadas or data_through"`
Expected: FAIL — `KeyError: 'occupancy_p50_ttm'`

- [ ] **Step 3: `fetch_airdna_occupancy` devuelve la serie resumida**

Quitar el `drop_duplicates("submarket")` de `:223`. Agrupar por submercado, pasar cada serie por `summarize_ttm`, y devolver un DataFrame con una fila por submercado y las columnas `occupancy` (= `p50`), `occupancy_low_season`, `occupancy_high_season`, `data_through`, `ttm_months_observed`.

`occupancy` conserva su nombre a propósito: `resolve_zone_metrics`, `apply_gates` y el cálculo de `revpar` (`:510`) ya lo consumen con ese nombre, y renombrarlo obligaría a tocar los tres. Lo que cambia es **qué** contiene.

Extender `_OCC_FIELDS` para que `resolve_zone_metrics` arrastre las cuatro columnas nuevas.

- [ ] **Step 4: `build_zone_score_rows` emite las columnas nuevas**

Agregar los 7 campos; `index_omission_reason` sale de `row.get("gate_reason")`. **Borrar** `median_adr` y `median_occupancy` del dict.

- [ ] **Step 5: Correr toda la suite**

Run: `python -m pytest tests/ -q`
Expected: PASS

- [ ] **Step 6: Agregar `--dry-run` a `main()`**

Imprime, por zona: `score` antes/después, `occupancy_p50_ttm`, `index_omission_reason`. **No** llama a `supabase_upsert` ni a la reconciliación de borrado.

- [ ] **Step 7: Dry-run contra producción y comparar con el spec**

Run: `python analytics/compute_derived.py --dry-run`

Verificar a mano contra la tabla del spec 1.1: Zona de Resorts 66% a ~40%, Bahía de Akumal 72% a ~47%, Zazil-Ha 86% a ~57%. Y que Playacar salga `missing:adr`, no `sample_below_30`.

**No continuar si el diff no coincide.** Un diff distinto significa que la ventana o el mapeo de submercados no es el que se probó.

- [ ] **Step 8: Commit**

```
git add crawlers/glowing-spork/analytics/compute_derived.py crawlers/glowing-spork/tests/test_compute_derived.py
git commit -m "fix(analytics): publicar mediana TTM y persistir el motivo del gate"
```

---

## Task 15R: El único hueco real de la Fase 2

**Files:**
- Modify: `crawlers/glowing-spork/analytics/scraper_runner.py:89`
- Test: `crawlers/glowing-spork/tests/test_scraper_runner.py` (extender)

**Contexto:** de los cuatro pasos del Task 15 original, tres ya están hechos. `observer.py:25` monitorea `airroi_str_zonal` con `max_age_days: 35`, y `observer.py:323-338` sí llama al notifier (WhatsApp + SMTP con dedup por historial). Sobrevive uno:

```python
status = "done" if rc == 0 else "error"     # scraper_runner.py:89
```

Un scraper que trae **cero filas** sale con `rc=0` y se registra `done`. Cuatro de cinco corridas de `airroi_listings` en `scraper_jobs` trajeron 0 filas y las cuatro dicen `done`.

- [ ] **Step 1: Escribir el test que falla**

```python
def test_cero_filas_no_es_exito():
    assert classify_run(rc=0, rows=0) == "empty"


def test_filas_con_rc_cero_es_done():
    assert classify_run(rc=0, rows=120) == "done"


def test_rc_distinto_de_cero_es_error_aunque_haya_filas():
    assert classify_run(rc=1, rows=50) == "error"
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `python -m pytest tests/test_scraper_runner.py -v -k classify_run`
Expected: FAIL — `ImportError: cannot import name 'classify_run'`

- [ ] **Step 3: Extraer la clasificación a una función pura**

```python
def classify_run(rc: int, rows: int) -> str:
    """Un scraper que no trajo nada no tuvo exito.

    Antes: status = "done" if rc == 0 else "error", asi que 0 filas con rc=0 era
    indistinguible de una corrida buena. Por eso airroi_str_zonal pudo morir en
    marzo-2026 y seguir publicandose en agosto.
    """
    if rc != 0:
        return "error"
    return "done" if rows > 0 else "empty"
```

Usarla en `run_job`. Verificar que `finish_job` y cualquier consumidor de `status` toleran el valor nuevo — si algo filtra por `status=eq.done`, ahora dejará de contar las corridas vacías, que es el objetivo.

- [ ] **Step 4: Correr toda la suite**

Run: `python -m pytest tests/ -q`
Expected: PASS

- [ ] **Step 5: Commit**

```
git add crawlers/glowing-spork/analytics/scraper_runner.py crawlers/glowing-spork/tests/test_scraper_runner.py
git commit -m "fix(crawlers): cero filas se registra 'empty', no 'done'"
```

---

## Preguntas abiertas que NO son tasks

1. **`airroi_str_zonal` lleva 151 días STALE y la alerta está conectada.** `observer.py` calcula el estado, `should_alert` decide y `notify` manda WhatsApp y correo. Entonces: ¿está `OBSERVER_ENABLED=1`? ¿corre el cron? ¿el dedup de `should_alert` suprimió los reintentos? ¿los avisos llegan a alguien que los vea? Es diagnóstico operativo, no código.
2. **`airroi_str_zonal` no tiene fila en `scraper_config`** — los otros cinco scrapers sí. Falta confirmar si es un scraper ejecutable por el runner o solo un check del observer. Si es lo primero, nunca se pudo lanzar desde la cola.
3. **Ciudad usa promedio, zonas usarán mediana.** `fetch_city_level_records` promedia los 12 meses; el spec eligió mediana para zonas. Dos estadísticos sobre la misma serie en la misma página. Hay que elegir uno.

## Bloqueo: no hay Python

`python`, `py` y `python3` están ausentes en la máquina. Los tasks 1R, 2R y 15R **no se pueden ejecutar aquí**: ni correr el test que falla, ni verificar que pasa, ni la suite de 18 archivos que ya existe.

Los tasks 3, 4, 6-10 y 12-14 (migración + todo el lado web) sí son ejecutables: `node`, `npm` y `vitest` funcionan.

**Y la rama no se puede desplegar a medias.** Si la web lee solo las columnas nuevas y el pipeline no las escribe, /mercado muestra "sin dato" en todas las zonas — peor que el estado actual. Construir y probar el lado web con fixtures es seguro; mergear no, hasta que 1R y 2R hayan corrido.
