# Scrumptious Project Context 📋

*Complete project knowledge base for development continuation*

## 🏗️ Project Architecture

### Tech Stack
- **Framework**: Next.js 15 with React 19 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: MongoDB with Prisma ORM
- **Styling**: Tailwind CSS
- **Authentication**: JWT with httpOnly cookies
- **Deployment**: Vercel (configured for MongoDB)

### Project Structure
```
src/
├── app/
│   ├── components/           # Shared React components
│   ├── dashboard/           # Dashboard pages and layouts
│   │   ├── layout.tsx      # Dashboard wrapper with sidebar
│   │   ├── page.tsx        # Main dashboard (projects grid)
│   │   ├── project/[id]/   # Project detail pages
│   │   ├── standups/       # Standup timeline view
│   │   ├── standup-questionnaire/ # Dynamic questionnaire form
│   │   └── settings/       # Organization settings
│   └── (auth)/             # Authentication pages
├── lib/
│   ├── auth/               # Authentication utilities
│   ├── dashboard/          # Dashboard data actions
│   ├── project/            # Project management actions
│   ├── standup/            # Standup system actions
│   └── prisma.ts          # Database client
└── prisma/
    ├── schema.prisma       # Database schema
    └── generated/          # Prisma client
```

## 🎯 Core Concepts

### Hierarchical Structure
**Vision → Targets → Tasks**
- **Projects** contain a vision statement and multiple targets
- **Targets** are specific goals that support the project vision
- **Tasks** are actionable items that complete targets
- **Standups** track daily progress across all levels

### Organization-Based Multi-Tenancy
- Users belong to Organizations
- All data (projects, standups, etc.) are scoped to organizations
- Role-based access control (OWNER, ADMIN, MEMBER)
- Invitation system for adding team members

### Dynamic Questionnaire System
- Projects can have custom standup questionnaires
- Questions are stored as templates with flexible JSON structure
- **Question snapshots** are saved with each standup to preserve historical context
- Supports multiple question types: text, textarea, multiple_choice, task

## 🗄️ Database Schema Key Models

### Core Models
```prisma
Organization {
  id: String
  name: String
  users: User[]
  projects: Project[]
  invitations: Invitation[]
}

User {
  id: String
  email: String (unique)
  firstName: String
  lastName: String
  role: UserRole (OWNER/ADMIN/MEMBER)
  organizationId: String
}

Project {
  id: String
  name: String
  vision: String
  description?: String
  status: ProjectStatus (ACTIVE/COMPLETED/ARCHIVED)
  targets: Target[]
  standups: Standup[]
}

Target {
  id: String
  title: String
  description?: String
  status: TargetStatus
  tasks: Task[]
}

Task {
  id: String
  title: String
  description?: String
  priority: Priority
  assigneeId?: String
  completedAt?: DateTime
}
```

### Standup System
```prisma
StandupTemplate {
  id: String
  name: String
  questions: Json  // Flexible question structure
  projectId?: String  // null = org-wide template
}

Standup {
  id: String
  date: DateTime
  questionsSnapshot: Json  // Preserved questions from creation time
  responses: StandupResponse[]
}

StandupResponse {
  id: String
  responses: Json  // Array: [{ questionId, value, type }]
  userId: String
  submittedAt: DateTime
}
```

## 🚀 Current Implementation Status

### ✅ Completed Features
- User authentication with JWT cookies
- Organization-based multi-tenancy
- Project/Target/Task hierarchy
- Dynamic questionnaire templates
- Standup creation with question snapshots
- Standup response submission
- Timeline view for standup history
- Task linking in standup responses
- Responsive sidebar navigation
- Basic project management CRUD

### 🔧 Recent Fixes
- **Questionnaire Snapshot System**: Questions are now preserved with each standup
- **Dynamic Form Generation**: Questionnaires load from templates, not hardcoded
- **Response Data Structure**: Standardized dynamic response format
- **Task Linking**: Tasks can be selected and linked in standup responses
- **UI Improvements**: Compact sidebar with active state detection
- **Timeline Display**: Fixed object rendering issues, proper question text display

### 🏗️ Architecture Decisions
- **Server Actions**: All data mutations use Next.js server actions
- **Client Components**: Marked with 'use client' only when necessary
- **Type Safety**: Comprehensive TypeScript interfaces throughout
- **Error Handling**: Try/catch blocks with user-friendly error messages
- **Revalidation**: Strategic use of revalidatePath for cache invalidation

## 📁 Folder Structure Standards

### Component Organization
```
src/app/components/
├── ui/                    # Base UI components (buttons, inputs, modals)
├── forms/                 # Form components
├── layout/                # Layout components (header, sidebar, footer)
├── project/               # Project-specific components
├── standup/               # Standup-related components
└── shared/                # Shared business logic components
```

### Action Organization
```
src/lib/
├── auth/
│   ├── actions.ts         # Authentication server actions
│   ├── server-utils.ts    # Server-side auth utilities
│   └── types.ts          # Auth-related types
├── dashboard/
│   ├── actions.ts         # Dashboard data actions
│   └── types.ts          # Dashboard types
└── [feature]/
    ├── actions.ts         # Feature-specific actions
    ├── types.ts          # Feature types
    └── utils.ts          # Feature utilities
```

### Naming Conventions
- **Components**: PascalCase (`ProjectCard.tsx`)
- **Actions**: camelCase ending in 'Action' (`getUserProjectsAction`)
- **Types**: PascalCase (`ProjectSummary`, `StandupData`)
- **Files**: kebab-case for pages (`standup-questionnaire/page.tsx`)
- **Database**: snake_case mapping (`@@map("standup_responses")`)

## 🔑 Key Integration Points

### Authentication Flow
1. Login sets httpOnly JWT cookie
2. `getSessionUser()` validates and returns user data
3. All server actions check authentication first
4. Organization scoping applied automatically

### Data Flow Pattern
```typescript
// Server Action Pattern
export async function actionName(formData: FormData): Promise<ActionResponse> {
  try {
    const user = await getSessionUser()
    if (!user) return { success: false, error: 'Auth required' }
    
    // Validate input
    // Check permissions
    // Perform database operation
    // Revalidate cache if needed
    
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'User-friendly message' }
  }
}
```

### Component Patterns
- **Server Components**: Default for data fetching
- **Client Components**: Only for interactivity (forms, navigation)
- **Error Boundaries**: Graceful error handling
- **Loading States**: Consistent loading UI patterns

## 🎨 Design System Standards

### Color Palette
- **Primary**: Slate (slate-800 for dark elements)
- **Secondary**: Gray for backgrounds and borders
- **Accent**: Blue for links and actions
- **Status Colors**: Green (success), Red (error), Yellow (warning)

### Typography Scale
- **Headings**: font-medium to font-semibold
- **Body**: font-normal, leading-relaxed for readability
- **Small text**: text-sm, text-xs for metadata

### Spacing System
- **Compact spacing**: p-2, p-3, gap-2 (mobile-first)
- **Standard spacing**: p-4, p-6, gap-4 (desktop)
- **Large spacing**: p-8, gap-8 (section dividers)

### Component Standards
- **Buttons**: rounded-lg, shadow-sm, transition-all
- **Cards**: rounded-2xl, border-gray-200, hover states
- **Forms**: Proper focus states, error handling, validation

## 🔄 Development Workflow

### Code Quality Standards
- **TypeScript**: Strict mode, no implicit any
- **Error Handling**: Always wrap server actions in try/catch
- **Type Safety**: Interfaces for all data structures
- **Accessibility**: Proper ARIA labels, keyboard navigation
- **Performance**: Lazy loading, code splitting where appropriate

### Git Workflow
- **Commits**: Use conventional commits (feat:, fix:, chore:)
- **Branches**: Feature branches from main
- **PRs**: Include description of changes and testing notes

### Testing Strategy
- **Unit Tests**: Critical business logic
- **Integration Tests**: Server actions and database operations
- **E2E Tests**: Key user workflows
- **Manual Testing**: UI/UX validation

## 🚨 Common Pitfalls & Solutions

### Database Relations
- Always include necessary relations in Prisma queries
- Use select to limit data transfer
- Handle optional relations (user.assignee?)

### Authentication
- Check user session in all server actions
- Verify organization access before data queries
- Handle expired tokens gracefully

### Client/Server Boundaries
- Don't pass functions through props
- Serialize dates when crossing boundaries
- Use proper 'use client' directives

### Performance
- Implement pagination for large lists
- Use loading states for better UX
- Optimize images with Next.js Image component

## 🔮 Future Architecture Considerations

### Scalability
- Database indexing for common queries
- Caching strategy for frequently accessed data
- CDN implementation for static assets

### Real-time Features
- WebSocket integration for live updates
- Optimistic updates for better UX
- Conflict resolution for concurrent edits

### Mobile Strategy
- PWA implementation roadmap
- Offline-first data strategies
- Native app considerations

---

## 📞 Quick Reference

### Key Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run postinstall  # Regenerate Prisma client
npm run db:push      # Push schema to database
```

### Important Environment Variables
```env
DATABASE_URL         # MongoDB connection string
JWT_SECRET          # JWT signing secret
NEXT_PUBLIC_APP_URL # App URL for redirects
```

### Critical Files to Check First
- `prisma/schema.prisma` - Database structure
- `src/lib/auth/server-utils.ts` - Authentication utilities  
- `src/app/dashboard/layout.tsx` - Main app layout
- `src/lib/prisma.ts` - Database client configuration

This context file serves as the complete knowledge base for continuing development on Scrumptious. Update it whenever significant architectural decisions are made.