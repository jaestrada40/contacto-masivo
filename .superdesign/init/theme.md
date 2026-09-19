# Token summary

- CSS: Tailwind v4 via `src/index.css`.
- Existing font: Plus Jakarta Sans system fallback.
- Existing colors are navy/blue/slate; redesign target is institutional navy `#0F2747`, primary `#2563EB`, accent `#0F9F8F`, background `#F6F8FB`, surface `#FFFFFF`, text `#172033`, muted `#64748B`, border `#E2E8F0`.
- Layout: desktop sidebar plus sticky header; responsive mobile drawer.

## Raw source: `src/index.css`

```css
@import "tailwindcss";
@layer base { :root { --color-brand-dark: #0C2A5A; --color-brand-light: #EAF3FF; --color-brand-accent: #1E60BF; --color-brand-success: #10B981; } body { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; } }
```
