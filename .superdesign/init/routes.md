# Route map

The app uses `ActiveView` state in `src/App.tsx`, not URL routing.

- `dashboard` → `DashboardView`
- `contactos` → `ContactsView`
- `segmentos` → `SegmentsView`
- `campanas` / `nueva_campana` / `campana_detalle` → campaign views
- `historial`, `reportes`, `usuarios`, `configuracion`, `perfil` → corresponding views

All views share `Sidebar` and `Header` through `App.tsx`.
