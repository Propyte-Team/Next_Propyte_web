# Tablero de Mejoras IA — este repo

`proyecto` de este repo: **`web`**

**Pide `mejoras_get_protocol` antes de tomar una tarjeta.** Las reglas del tablero —cómo se
toma una tarea, qué se escribe al cerrarla, qué está prohibido— las sirve el Hub, no este
archivo. Aquí solo vive lo que el Hub no puede saber.

Vivían solo en el repo del Hub, invisibles desde aquí. Este repo es el que más tarjetas tiene
en el tablero, y era el que no podía leer el protocolo.

## Lo que solo sabe este repo

- **Puerta del tablero:** las tools `mejoras_*`. Si no las tienes, el tablero no se toca a
  mano por SQL.
- **Rama:** `mejora/<id>-<slug>`, desde `origin/main` y no desde el `main` local.
- **En un `git worktree` propio.** El árbol principal lo comparten varias sesiones y su rama
  cambia sin avisar.
- **`gh` no está en el PATH:** `"/c/Program Files/GitHub CLI/gh.exe"`.
- Panel del tablero: https://hub.propyte.com/mejoras
- Lo demás de este repo está en `CLAUDE.md`, que manda sobre este archivo si se contradicen.

## Nunca

- **Mergear ni desplegar.** La puerta humana está en el merge, y aquí pesa más que en los
  otros repos: **el deploy no pasa por GitHub Actions** —`ci.yml` y `playwright.yml` solo
  prueban— sino que Hostinger compila en el servidor al recibir `main`. Mergear ES desplegar,
  en producción, para el sitio público.
- **Dar por verificado lo que solo probaste en local.** Este sitio recibe tráfico pagado: un
  arreglo sin medir en producción es una tarjeta que no puede pasar a `desplegada`.
