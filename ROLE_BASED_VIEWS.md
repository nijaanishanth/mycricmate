# Role-Based Views

## Overview

MyCricMate implements role-based views where users can only access the views/dashboards for roles they selected during onboarding. This ensures a clean, focused experience tailored to each user's needs.

## How It Works

### 1. Role Selection During Onboarding

When users complete onboarding (`src/pages/Onboarding.tsx`), they select one or more roles:
- **Player** - Find teams and showcase cricket skills
- **Captain** - Build and manage cricket teams
- **Organizer** - Create and run cricket tournaments
- **Staff** - Umpire, score, or commentate matches

These roles are saved to the user's profile in the database (`roles` array field).

### 2. Dashboard Access Control

The Dashboard (`src/pages/Dashboard.tsx`) now:
- Retrieves the user's roles from the authentication context
- Only displays role views the user has access to
- Defaults to the first available role if switching to an unauthorized role
- Prevents viewing content for roles not selected

### 3. Role Switcher Behavior

The role switcher in DashboardNav (`src/components/DashboardNav.tsx`) has two modes:

**Multiple Roles:**
- Shows dropdown menu with all user's available roles
- User can switch between their roles
- Displays "Add More in Settings" option at bottom

**Single Role:**
- Shows a static badge (no dropdown)
- Indicates the current view
- Users can add more roles later in Settings

### 4. Adding Roles Later

Users can always add additional roles through the Settings page:
- Navigate to Settings from the dashboard
- Select additional roles to unlock new views
- Changes are saved to the database
- New role views become immediately available

## Technical Implementation

### Frontend Changes

**Dashboard.tsx:**
```typescript
const { user } = useAuth();
const userRoles = useMemo(() => (user?.roles || []) as Role[], [user?.roles]);

// Only show views for roles the user has
const [currentRole, setCurrentRole] = useState<Role>(
  userRoles.length > 0 ? userRoles[0] : "player"
);

// Pass available roles to navigation
<DashboardNav 
  currentRole={currentRole} 
  onRoleChange={setCurrentRole}
  availableRoles={userRoles}
/>
```

**DashboardNav.tsx:**
```typescript
interface DashboardNavProps {
  currentRole: "player" | "captain" | "organizer" | "staff";
  onRoleChange: (role: ...) => void;
  availableRoles?: ("player" | "captain" | "organizer" | "staff")[];
}

// Only show roles in dropdown that user has access to
const rolesToShow = availableRoles || Object.keys(roleConfig);
```

### Backend Schema

The User model stores roles as an array:
```python
class User(Base):
    # User roles - can have multiple
    roles = Column(ARRAY(SQLEnum(UserRole)), default=[])
```

Supported roles (from `backend/models.py`):
```python
class UserRole(str, enum.Enum):
    PLAYER = "player"
    CAPTAIN = "captain"
    ORGANIZER = "organizer"
    STAFF = "staff"
```

## Benefits

1. **Focused Experience** - Users only see relevant content
2. **Progressive Disclosure** - Add roles as needs grow
3. **Security** - Prevent access to unauthorized views
4. **Flexibility** - Support multiple roles per user
5. **Clean UI** - No clutter from irrelevant features

## Future Enhancements

- [ ] Settings page to manage roles
- [ ] Role-specific permissions and features
- [ ] Role-based notifications
- [ ] Analytics per role
- [ ] Custom role configurations
