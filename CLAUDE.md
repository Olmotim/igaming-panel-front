# iGaming Panel — Frontend (CLAUDE.md)

Este archivo es contexto persistente para Claude Code. Léelo al empezar cualquier sesión en este repo.

## Qué es este proyecto

Interfaz web del backoffice de gestión para operadores de iGaming (casino online), proyecto de portfolio. Consume la API del repo hermano `igaming-panel` (NestJS + PostgreSQL). El diseño visual y de UX está pensado deliberadamente para parecer una herramienta interna real de soporte/KYC/riesgo, no una demo genérica.

Repo hermano (backend): `igaming-panel`, NestJS + Prisma + PostgreSQL, desplegado en Railway.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui + Radix UI
- lucide-react para iconos
- Sin librería de estado global aparte de React Context (`AuthContext`)
- Sin framework de tests todavía (a diferencia del backend, que sí tiene Jest) — si se propone añadir tests, usar Vitest + React Testing Library, y confirmarlo antes de instalar nada

## Comandos

```bash
npm run dev      # desarrollo, puerto 3001
npm run build    # build de producción (recuerda Vercel/Suspense, ver abajo)
npm run lint
```

Entorno local: Windows 11, PowerShell. Orden de arranque local completo: Docker Desktop → `docker start igaming-postgres` → backend (`npm run start:dev`, puerto 3000) → este frontend (`npm run dev`, puerto 3001).

## Despliegue

Vercel. **Regla crítica:** cualquier página que use `useSearchParams()` debe estar envuelta en `<Suspense>` o el build falla con un error de prerender. Ya se aplicó este patrón en `login/page.tsx` y `players/page.tsx` — síguelo en cualquier página nueva que necesite leer query params.

## Estructura

- `app/context/AuthContext.tsx` — estado de auth global (usuario, access token, login/logout). Protección de rutas es 100% client-side: cada página comprueba `useAuth()` en un `useEffect` y redirige a `/login` si no hay usuario. No existe `middleware.ts` (es una limitación conocida, no un descuido pendiente de "encontrar").
- `app/players/[id]/components/` — tabs del perfil de jugador (Account, KYC, Payments, Bonuses, RG, LoginHistory)
- `components/ui/` — componentes shadcn/ui
- `app/workspaces/[id]/page.tsx` — existe pero NO está enlazado desde el Navbar ni desde ningún otro sitio. El backend tiene el módulo `workspaces`/`tasks` marcado como no activo (scaffolding inicial conservado). No lo "termines" de integrar salvo que se pida explícitamente.

## Estado conocido tras auditoría (mantener actualizado)

Este proyecto se construyó en sesiones de chat separadas con distintas herramientas de IA, lo que generó inconsistencias reales entre archivos. Antes de "corregir" algo no pedido explícitamente, confirma si es intencional:

- El refresh token se guarda hoy con `document.cookie` en `AuthContext.tsx` — es un problema de seguridad conocido (no es HttpOnly), en proceso de migración coordinada con el backend. No lo toques salvo que la tarea sea explícitamente esa migración, porque requiere cambios simultáneos en el backend.
- Hay tipos (`interface Player`, `interface Ticket`, mapas de labels/colores) duplicados en varios archivos en vez de centralizados — puede estar en proceso de consolidación en `types/`. Si vas a tocar uno de estos componentes, comprueba primero si ya existe un tipo centralizado antes de duplicar uno nuevo.
- No todos los `fetch()` comprueban `res.ok` antes de actuar — inconsistencia conocida, en proceso de unificación.
- Roles/departamentos: hoy la UI no oculta ni restringe ninguna acción según rol o departamento del usuario (más allá de ocultar el link "Admin" en el Navbar). Esto depende de un diseño de permisos que se está definiendo primero en el backend — no implementes restricciones de UI por tu cuenta sin que se te dé la matriz de permisos aprobada.

## Convenciones de código

- Cero uso de `any` en todo el proyecto hasta ahora — mantenlo así.
- Sigue el patrón visual ya establecido: tema oscuro, Cards de shadcn/ui, badges de color por estado (ver los `Record<string, string>` de colores en las páginas existentes como referencia de paleta).
- Preferencia del autor: botones de permisos horizontales tipo toggle en vez de switches; simplicidad sobre abstracción cuando hay dudas de diseño.
- Las credenciales de la demo pública (`demo@igamingpanel.com`) son intencionales, con datos ficticios — no es un descuido.
