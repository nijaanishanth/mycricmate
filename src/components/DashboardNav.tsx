import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  User, 
  Users, 
  Trophy, 
  Briefcase, 
  ChevronDown, 
  LogOut,
  Settings,
  Bell,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardNavProps {
  currentRole: "player" | "captain" | "organizer" | "staff";
  onRoleChange: (role: "player" | "captain" | "organizer" | "staff") => void;
  availableRoles?: ("player" | "captain" | "organizer" | "staff")[];
  onOpenChat?: () => void;
}

const roleConfig = {
  player: { icon: User, label: "Player", color: "text-primary" },
  captain: { icon: Users, label: "Captain", color: "text-secondary" },
  organizer: { icon: Trophy, label: "Organizer", color: "text-accent" },
  staff: { icon: Briefcase, label: "Staff", color: "text-muted-foreground" },
};

const DashboardNav = ({ currentRole, onRoleChange, availableRoles, onOpenChat }: DashboardNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const CurrentRoleIcon = roleConfig[currentRole].icon;
  
  // Use all roles if availableRoles is not provided (backwards compatibility)
  const rolesToShow = availableRoles || Object.keys(roleConfig) as ("player" | "captain" | "organizer" | "staff")[];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-secondary border-b border-secondary-foreground/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center">
            <Logo size="sm" />
          </Link>

          {/* Role Switcher */}
          {rolesToShow.length > 1 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="glass" className="gap-2">
                  <CurrentRoleIcon className={cn("w-4 h-4", roleConfig[currentRole].color)} />
                  <span className="hidden sm:inline">{roleConfig[currentRole].label} View</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48">
                {rolesToShow.map((role) => {
                  const config = roleConfig[role];
                  const Icon = config.icon;
                  return (
                    <DropdownMenuItem
                      key={role}
                      onClick={() => onRoleChange(role)}
                      className={cn(
                        "gap-2 cursor-pointer",
                        currentRole === role && "bg-primary/10"
                      )}
                    >
                      <Icon className={cn("w-4 h-4", config.color)} />
                      {config.label}
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="gap-2 cursor-pointer text-muted-foreground"
                  onClick={() => navigate('/settings')}
                >
                  <Settings className="w-4 h-4" />
                  Add More in Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-secondary/50">
              <CurrentRoleIcon className={cn("w-4 h-4", roleConfig[currentRole].color)} />
              <span className="hidden sm:inline text-sm font-medium">{roleConfig[currentRole].label} View</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-secondary text-secondary-foreground text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </Button>
            <Button variant="ghost" size="icon" className="relative" onClick={onOpenChat}>
              <MessageSquare className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                2
              </span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem 
                  className="gap-2 cursor-pointer"
                  onClick={() => navigate('/dashboard')}
                >
                  <User className="w-4 h-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="gap-2 cursor-pointer"
                  onClick={() => navigate('/settings')}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </DropdownMenuItem>
                {user?.is_superuser && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="gap-2 cursor-pointer text-destructive"
                      onClick={() => navigate('/admin')}
                    >
                      <ShieldAlert className="w-4 h-4" />
                      Admin Panel
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="gap-2 cursor-pointer text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DashboardNav;
