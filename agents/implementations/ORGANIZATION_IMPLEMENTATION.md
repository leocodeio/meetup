# Organization Management System - Implementation Guide

## Overview

This implementation provides a complete organization management system for GitSprint, allowing users to create, read, update, and delete organizations with a responsive grid/list view dashboard featuring search functionality.

## Components & Files

### 1. Database Layer (Prisma)

**File**: `prisma/schema.prisma`

Updated Organization model with:
- `id`: Unique identifier (CUID)
- `name`: Organization name (required)
- `slug`: URL-friendly unique identifier (required)
- `description`: Optional organization description
- `image`: Optional logo/image URL
- `ownerId`: References the user who owns the organization
- `members`: Relation to OrganizationMember (cascade delete on owner deletion)
- `projects`: Relation to Project
- Timestamps: `createdAt`, `updatedAt`
- Index on `ownerId` for faster queries

**Migration Required**: Run `npm run prisma:push` after updating schema

### 2. Type Definitions

**File**: `src/types/organization.ts`

Exports:
- `Organization`: Base organization type
- `OrganizationWithMemberCount`: Organization with member count
- `CreateOrganizationInput`: Input for creating organizations
- `UpdateOrganizationInput`: Input for updating organizations
- `OrganizationMember`: Member type
- `ApiResponse<T>`: Generic API response type

### 3. Validation Schemas

**File**: `src/lib/validations/organization.ts`

Zod schemas for:
- `createOrganizationSchema`: Validates name, slug, description, image
- `updateOrganizationSchema`: Allows partial updates
- `searchOrganizationsSchema`: Validates search parameters

**Rules**:
- Name: 1-100 characters
- Slug: 1-50 characters, URL-friendly (lowercase, hyphens, numbers only)
- Description: Max 500 characters
- Image: Valid URL format

### 4. API Routes

#### GET `/api/organizations`
Fetch all organizations for the authenticated user with search support.

**Query Parameters**:
- `query` (optional): Search by name or slug
- `limit` (optional): Results per page (default: 10, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response**:
```json
{
  "success": true,
  "data": {
    "organizations": [
      {
        "id": "org_id",
        "name": "Acme Corp",
        "slug": "acme-corp",
        "description": "...",
        "image": "...",
        "ownerId": "user_id",
        "memberCount": 5,
        "createdAt": "2025-01-04T00:00:00Z",
        "updatedAt": "2025-01-04T00:00:00Z"
      }
    ],
    "total": 10,
    "limit": 10,
    "offset": 0
  }
}
```

#### POST `/api/organizations`
Create a new organization.

**Request Body**:
```json
{
  "name": "Acme Corporation",
  "slug": "acme-corp",
  "description": "Our awesome company",
  "image": "https://example.com/logo.png"
}
```

#### GET `/api/organizations/[id]`
Fetch a specific organization by ID.

#### PUT `/api/organizations/[id]`
Update an organization (owner only).

**Request Body** (all fields optional):
```json
{
  "name": "Updated Name",
  "slug": "updated-slug",
  "description": "Updated description",
  "image": "https://example.com/new-logo.png"
}
```

#### DELETE `/api/organizations/[id]`
Delete an organization (owner only).

### 5. Server-Side Utilities

**File**: `src/server/services/organization.server.ts`

Functions:
- `getUserOrganizations(userId)`: Fetch all user organizations
- `getOrganizationById(id)`: Fetch single org with member count
- `getOrganizationWithMembers(id)`: Fetch org with full member details
- `searchOrganizations(userId, query, limit, offset)`: Search with pagination

### 6. Client Components

#### OrganizationList Component
**File**: `src/components/organizations/organization-list.tsx`

Features:
- Grid and list view toggle
- Real-time search functionality
- Member count display
- Creation date display
- Empty state handling
- Responsive design

**Props**:
```typescript
interface OrganizationListProps {
  initialOrganizations: (Organization & { memberCount: number })[];
  onCreateNew?: () => void;
}
```

#### CreateOrganizationDialog Component
**File**: `src/components/organizations/create-organization-dialog.tsx`

Features:
- Modal dialog for creating organizations
- Auto-slug generation from name
- Form validation with error messages
- Loading states
- Toast notifications
- Success callback

### 7. Dashboard Integration

**File**: `src/app/[locale]/dashboard/page.tsx`

Updated dashboard to:
- Display organizations list/grid
- Show organization creation dialog button
- Implement search functionality
- Handle loading states
- Display member counts and creation dates

### 8. Internationalization

**File**: `messages/en.json`

Added translations under `Dashboard.organizations`:
- `title`: "Organizations"
- `subtitle`: "Manage your organizations"
- `create`: "Create Organization"
- `search`: Search placeholder
- `empty`: Empty state message
- `noResults`: No search results message
- `gridView`: Grid view button label
- `listView`: List view button label
- `members`: Member count label
- `createdOn`: Creation date label

## Setup Instructions

### 1. Update Database Schema
```bash
npm run prisma:push
```

### 2. Regenerate Prisma Client
```bash
npm run prisma:generate
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Verify Installation
1. Navigate to `/dashboard`
2. Click "Create Organization" button
3. Fill in organization details
4. Organizations should appear in grid/list view
5. Use search to filter organizations
6. Toggle between grid and list views

## Usage Examples

### Creating an Organization
```typescript
const response = await fetch("/api/organizations", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "My Company",
    slug: "my-company",
    description: "Our awesome company",
    image: "https://example.com/logo.png"
  })
});
```

### Searching Organizations
```typescript
const response = await fetch("/api/organizations?query=acme&limit=10&offset=0");
const data = await response.json();
```

### Updating an Organization
```typescript
const response = await fetch("/api/organizations/org_id", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Updated Name"
  })
});
```

### Deleting an Organization
```typescript
const response = await fetch("/api/organizations/org_id", {
  method: "DELETE"
});
```

## Security Features

✅ **Authentication**: All endpoints require authenticated session  
✅ **Authorization**: Users can only manage their own organizations  
✅ **Input Validation**: Zod schemas validate all inputs  
✅ **Slug Uniqueness**: Prevents duplicate slugs  
✅ **Cascade Delete**: Organization deletion cascades to related records  

## Performance Optimizations

✅ **Pagination**: Limits results to prevent large payloads  
✅ **Search**: Indexed fields for faster queries  
✅ **Member Counting**: Efficient aggregation queries  
✅ **Lazy Loading**: Components load data on demand  

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "message": "Additional context (if applicable)"
}
```

**Common Error Codes**:
- `401`: Unauthorized (not authenticated)
- `403`: Forbidden (not owner)
- `404`: Not found
- `409`: Conflict (slug exists)
- `400`: Validation error
- `500`: Server error

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design
- Dark mode support via next-themes

## Next Steps (Future Enhancements)

1. **Members Management**: Add/remove organization members
2. **Roles & Permissions**: Admin, member, viewer roles
3. **Invitations**: Invite users to organizations
4. **Projects**: Manage projects within organizations
5. **Webhooks**: Organization events
6. **Audit Logs**: Track changes to organizations
7. **Export**: Export organization data
8. **Organization Settings**: Custom settings per org

## Troubleshooting

### Organizations not loading
- Check browser console for errors
- Verify authentication (should be logged in)
- Check API response in Network tab

### Slug validation failing
- Slugs must be lowercase
- Only letters, numbers, and hyphens allowed
- No spaces or special characters

### Create button not working
- Ensure JavaScript is enabled
- Check browser console for errors
- Verify form validation

## Support

For issues or questions, refer to:
- API Route files for endpoint documentation
- Component files for UI implementation details
- Type definitions for data structure reference
