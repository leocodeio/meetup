# GitSprint Development Todo

## Vision & Goals
- [x] Define core concept (minimalistic sprint management)
- [x] Identify target users (teams, PMs, agile practitioners)
- [x] Clarify market positioning (Agile/PM tools)
- [x] Define differentiator (minimal UI, max productivity)

## Design Principles
- [x] One-click operations for common tasks
- [x] Intuitive navigation and hierarchy
- [x] Fast loading and response times
- [x] Progressive feature discovery
- [x] Mobile-responsive design

## Target Features
- [x] Lightweight sprint planning
- [x] Quick story management
- [x] Simple team collaboration
- [ ] Real-time updates
- [x] Multi-language support

## Database Structure
- [x] Prisma schema defined in `prisma/schema.prisma`
- [x] Core models (User, Organization, Project, Sprint, Story)
- [x] Supporting models (Comment, StoryHistory, Session)
- [x] Billing models (Subscription, Payment)
- [x] Required indexes defined

## Authentication
- [x] Better Auth configured
- [x] Email/password auth
- [x] Google OAuth
- [x] Session management
- [x] Auth routes (`/api/auth/[...all]`)
- [x] Auth services (`auth-client.ts`, `user.server.ts`)

## Organizations
- [x] Organization CRUD
- [x] Member invitations and roles
- [x] Member listing and removal
- [x] Organization search
- [x] API endpoints implemented
- [x] UI components implemented

## Projects
- [x] Project CRUD
- [x] Project member management
- [x] Role-based access
- [x] API endpoints implemented
- [x] UI components implemented

## Sprints
- [x] Sprint CRUD
- [x] Status transitions
- [x] Date validation
- [x] Sprint statistics
- [x] API endpoints implemented
- [x] UI components implemented

## Stories
- [x] Story CRUD
- [x] Story positioning
- [x] Sprint reassignment
- [x] Story properties (status, priority, points, labels)
- [x] Story collaboration (assignees, history)
- [x] Filters and search
- [x] API endpoints implemented
- [x] UI components implemented

## User Management
- [x] Profile management (name, avatar)
- [x] Pending invitation handling
- [x] Profile and auth pages

## UI Components & Design System
- [x] Base UI components (shadcn/Radix)
- [x] Theme system (dark/light + color)
- [x] Layout components (sidebar, header, footer)
- [x] UI utilities (toast, debounce, mobile hook)

## Internationalization
- [x] next-intl configuration
- [x] Locale routing and middleware
- [x] Locale switcher component
- [x] EN/ES/FR translations

## Error Handling
- [x] Error pages (401/403/404/500/503)
- [x] Standardized API error responses

## Middleware & Session
- [x] Locale detection
- [x] Protected route enforcement
- [x] Session tracking service

## Validation & Schemas
- [x] Zod schemas for org/project/sprint/story
- [x] Server-side validation
- [x] Client-side React Hook Form integration

## Routing & Pages
- [x] Auth routes
- [x] Dashboard routes
- [x] Public routes
- [x] Landing page sections

## Payment & Billing
- [x] Data models for payments/subscriptions
- [x] Service scaffolding
- [ ] Polar integration
- [ ] Checkout flow
- [ ] Webhook handling
- [ ] Subscription management UI

## RBAC
- [x] Organization roles enforced
- [x] Project roles enforced
- [x] Route-level checks

## Deployment Checklist
- [x] Run database migrations
- [x] Configure OAuth credentials
- [x] Set environment variables
- [x] Build and test production bundle
- [x] Configure CORS if needed
- [x] Set up SSL/TLS certificates

## Performance Optimizations
- [x] Indexed DB queries
- [x] Pagination on APIs
- [x] Debounced search
- [x] Image optimization via Next.js
- [x] Component code splitting

## Future Enhancements
- [ ] Email notifications
- [ ] Real-time collaboration (WebSocket)
- [ ] File attachments storage
- [ ] Story templates
- [ ] Bulk operations
- [ ] Advanced reporting/analytics
- [ ] Burndown charts
- [ ] Velocity tracking
- [ ] Calendar view
- [ ] Timeline/Gantt view
- [ ] Story dependencies
