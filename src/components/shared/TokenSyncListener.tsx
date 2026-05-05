'use client';

/**
 * TokenSyncListener — recibe CSS vars y comandos del Design Playground.
 *
 * Mensajes recibidos:
 *   PROPYTE_TOKENS         → aplica CSS vars al :root
 *   PROPYTE_INSPECTOR_ON   → activa modo inspector (hover outline + click detect)
 *   PROPYTE_INSPECTOR_OFF  → desactiva inspector
 *
 * Mensajes enviados al parent:
 *   PROPYTE_ELEMENT_CLICK  → { category: string, label: string }
 *
 * En visita normal (no-iframe): sale inmediatamente. Costo = 0.
 */
import { useEffect } from 'react';

function detectCategory(el: Element): { category: string; label: string } {
  const tag = el.tagName.toLowerCase();
  const style = window.getComputedStyle(el);

  if (['img', 'video', 'picture', 'figure'].includes(tag))
    return { category: 'media', label: `<${tag}>` };

  const textTags = ['h1','h2','h3','h4','h5','h6','p','span','a','label','li','em','strong','blockquote','caption'];
  if (textTags.includes(tag) || (el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE))
    return { category: 'typography', label: `<${tag}>` };

  const shadow = style.boxShadow;
  if (shadow && shadow !== 'none')
    return { category: 'shadows', label: `<${tag}> box-shadow` };

  const br = style.borderRadius;
  if (br && br !== '0px' && parseFloat(br) > 0)
    return { category: 'radii', label: `<${tag}> border-radius: ${br}` };

  const bg = style.backgroundColor;
  if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent')
    return { category: 'colors', label: `<${tag}> background: ${bg}` };

  return { category: 'colors', label: `<${tag}>` };
}

const INSPECTOR_STYLE_ID = 'propyte-inspector-style';

function injectInspectorStyles() {
  if (document.getElementById(INSPECTOR_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = INSPECTOR_STYLE_ID;
  style.textContent = `
    body.propyte-inspector * { cursor: crosshair !important; }
    body.propyte-inspector *:hover {
      outline: 2px solid rgba(92,224,210,0.9) !important;
      outline-offset: 1px !important;
    }
  `;
  document.head.appendChild(style);
}

function removeInspectorStyles() {
  document.getElementById(INSPECTOR_STYLE_ID)?.remove();
  document.body.classList.remove('propyte-inspector');
}

export default function TokenSyncListener() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.self === window.top) return;

    let clickHandler: ((e: MouseEvent) => void) | null = null;

    const msgHandler = (e: MessageEvent) => {
      if (!e.data?.type) return;

      if (e.data.type === 'PROPYTE_TOKENS') {
        const vars = e.data.vars as Record<string, string>;
        for (const [k, v] of Object.entries(vars))
          document.documentElement.style.setProperty(k, v);
        return;
      }

      if (e.data.type === 'PROPYTE_INSPECTOR_ON') {
        injectInspectorStyles();
        document.body.classList.add('propyte-inspector');

        clickHandler = (evt: MouseEvent) => {
          evt.preventDefault();
          evt.stopPropagation();
          const result = detectCategory(evt.target as Element);
          window.parent.postMessage({ type: 'PROPYTE_ELEMENT_CLICK', ...result }, '*');
        };
        document.addEventListener('click', clickHandler, true);
        return;
      }

      if (e.data.type === 'PROPYTE_INSPECTOR_OFF') {
        removeInspectorStyles();
        if (clickHandler) {
          document.removeEventListener('click', clickHandler, true);
          clickHandler = null;
        }
      }
    };

    window.addEventListener('message', msgHandler);
    return () => {
      window.removeEventListener('message', msgHandler);
      removeInspectorStyles();
      if (clickHandler) document.removeEventListener('click', clickHandler, true);
    };
  }, []);

  return null;
}
