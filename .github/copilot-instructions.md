# KiwiPay New Onboarding Frontend AI Agent Instructions

## Project Overview
This is an Angular-based frontend application for KiwiPay's onboarding system. The application follows a modular architecture with standalone components and feature-based organization.

## Key Architecture Patterns

### Directory Structure
```
src/
  app/
    core/           # Core services, guards, and models
      guards/       # Authentication and role guards
      interceptors/ # HTTP interceptors
      models/       # Shared data models
      services/     # Core services (auth, navigation)
    features/       # Feature modules
      auth/         # Authentication feature
      bandeja/      # Main inbox/tray feature
      prospectos/   # Prospects management
    shared/         # Shared components and styles
      components/   # Reusable UI components
      styles/       # Global styles and variables
```

### Component Architecture
- Uses Angular's standalone components (no NgModules required)
- Components follow a feature-first organization
- Shared components are in `shared/components/`
- Example: `header.component.ts` demonstrates standard component structure

### State Management
- Uses RxJS BehaviorSubject for simple state management
- Services maintain state for their respective domains
- Example: `HeaderComponent` manages sidebar state via static `BehaviorSubject`

### Authentication & Authorization
- Handled by `AuthService` and auth guards
- User state maintained in `AuthService`
- Protected routes use `auth.guard.ts` and `role.guard.ts`

### Styling Conventions
- SCSS modules with shared variables in `shared/styles/`
- Colors defined in `colors.scss`
- Mixins available in `mixins.scss`
- Components use scoped styles via `styleUrls`

## Development Workflow

### Starting Development
```bash
ng serve
```
- Application runs at `http://localhost:4200`
- Auto-reloads on file changes

### Creating New Components
```bash
ng generate component features/[feature-name]/[component-name]
```
Use standalone: true in component decorators

### Best Practices
1. Keep components focused and single-responsibility
2. Use shared components for common UI elements
3. Implement proper type safety (strict mode enabled)
4. Follow responsive design patterns (see `header.component.scss`)

### Important Files to Reference
- `src/app/core/services/auth.service.ts` - Authentication patterns
- `src/app/shared/components/header/header.component.ts` - Component structure
- `src/app/shared/styles/colors.scss` - Design system colors
- `src/app/app.routes.ts` - Route configuration

## Common Patterns

### Component Communication
```typescript
// State sharing example (header.component.ts)
public static sidebarState = new BehaviorSubject<boolean>(false);
static get sidebarCollapsed$() {
  return this.sidebarState.asObservable();
}
```

### Styling Pattern
```scss
@use '../../../shared/styles/colors' as colors;
@use '../../../shared/styles/mixins' as mixins;

.component {
  @include mixins.transition(property);
  background-color: colors.$primary-900;
}
```

### Authentication Pattern
```typescript
// Protected route example
{
  path: 'dashboard',
  canActivate: [authGuard],
  children: [...]
}
```
