# Full-Stack Implementation Requirements

## Tech Stack Context

- **Framework**: Next.js 15.5.3 (App Router)
- **Runtime**: React 19.1.0
- **Database**: Prisma ORM with Accelerate extension
- **Auth**: Better Auth v1.3.9
- **UI**: Radix UI components + Tailwind CSS v4
- **Forms**: React Hook Form + Zod validation
- **Internationalization**: next-intl
- **Theming**: next-themes

## Implementation Checklist

When implementing this feature, please ensure you cover ALL of the following areas:

### 1. **Database Layer** (Prisma)

- [ ] Define or modify Prisma schema models in `schema.prisma`
- [ ] Add necessary relations, indexes, and constraints
- [ ] Consider data migration strategy if modifying existing tables
- [ ] Use `@prisma/extension-accelerate` for caching where appropriate
- [ ] Provide migration commands if needed

### 2. **Backend/API Layer**

- [ ] Create or update API routes in `app/api/` directory
- [ ] Implement proper error handling and validation
- [ ] Add Zod schemas for request/response validation
- [ ] Implement authentication/authorization checks using Better Auth
- [ ] Consider rate limiting and security implications
- [ ] Follow RESTful or tRPC patterns consistently

### 3. **Server Components & Actions**

- [ ] Create Server Components where data fetching is needed
- [ ] Implement Server Actions for mutations (if applicable)
- [ ] Optimize data fetching with proper caching strategies
- [ ] Handle loading and error states

### 4. **Client Components & UI**

- [ ] Build React components using Radix UI primitives
- [ ] Style with Tailwind CSS v4 utility classes
- [ ] Implement proper TypeScript types for all props
- [ ] Add form handling with React Hook Form + Zod
- [ ] Include loading states, error boundaries, and empty states
- [ ] Ensure responsive design (mobile, tablet, desktop)
- [ ] Add proper accessibility attributes (ARIA labels, keyboard navigation)
- [ ] Implement dark mode support via next-themes

### 5. **State Management**

- [ ] Use React hooks (useState, useEffect, etc.) appropriately
- [ ] Consider React Context for shared state if needed
- [ ] Implement optimistic updates where applicable

### 6. **Internationalization**

- [ ] Add translation keys to locale files (if feature has user-facing text)
- [ ] Use `next-intl` for all user-facing strings
- [ ] Consider date/time formatting with `date-fns`

### 7. **User Experience**

- [ ] Add toast notifications using Sonner for feedback
- [ ] Implement proper loading indicators
- [ ] Add confirmation dialogs for destructive actions (using Radix Alert Dialog)
- [ ] Consider animations with `tailwindcss-animate` or `tw-animate-css`

### 8. **Testing & Validation**

- [ ] Provide example usage or test scenarios
- [ ] Ensure all Zod schemas are comprehensive
- [ ] Validate edge cases and error scenarios

### 9. **File Organization**

- [ ] Follow Next.js App Router conventions
- [ ] Place components in appropriate directories
- [ ] Keep server and client code properly separated
- [ ] Use proper TypeScript imports and exports

### 10. **Security & Performance**

- [ ] Validate all user inputs
- [ ] Sanitize data before database operations
- [ ] Use environment variables for sensitive data
- [ ] Implement proper CORS and security headers if needed
- [ ] Consider query optimization and N+1 problem prevention

## Expected Deliverables

Please provide:

1. **Database schema changes** (Prisma models)
2. **API routes** with full implementation
3. **Server Components** for data fetching
4. **Client Components** with full UI implementation
5. **Type definitions** (TypeScript interfaces/types)
6. **Validation schemas** (Zod)
7. **Any utility functions** needed
8. **Usage instructions** including any setup steps

## Code Quality Standards

- Use TypeScript strictly (no `any` types unless absolutely necessary)
- Follow consistent naming conventions
- Add JSDoc comments for complex functions
- Keep components small and focused
- Extract reusable logic into custom hooks or utilities
- Use proper error handling patterns

---

**Please implement this feature touching ALL relevant layers of the application (UI, API, database) and ensure everything is production-ready.**
