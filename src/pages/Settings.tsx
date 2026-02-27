import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { userApi } from "@/lib/api";
import DashboardNav from "@/components/DashboardNav";
import AvailabilityScheduleDialog from "@/components/AvailabilityScheduleDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Users, Trophy, Briefcase, EyeOff, Eye, Trash2, AlertTriangle, Calendar } from "lucide-react";

type Role = "player" | "captain" | "organizer" | "staff";

const roleConfig = {
  player: { icon: User, label: "Player", color: "text-primary" },
  captain: { icon: Users, label: "Captain", color: "text-secondary" },
  organizer: { icon: Trophy, label: "Organizer", color: "text-accent" },
  staff: { icon: Briefcase, label: "Staff", color: "text-muted-foreground" },
};

const Settings = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const [currentRole, setCurrentRole] = useState<Role>((user?.roles[0] as Role) || "player");
  const [profileVisible, setProfileVisible] = useState(user?.profile_visible ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleVisibilityToggle = async (checked: boolean) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const updatedUser = await userApi.toggleVisibility(checked);
      setProfileVisible(checked);
      updateUser(updatedUser);
      setSuccess(
        checked
          ? "Your profile is now visible in feeds"
          : "Your profile is now hidden from feeds"
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update visibility");
      setProfileVisible(!checked); // Revert on error
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    setError("");

    try {
      await userApi.deleteAccount();
      await logout();
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
      setLoading(false);
    }
  };

  const userRoles = (user?.roles || []) as Role[];

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        availableRoles={userRoles}
      />

      <main className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold mb-2">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account preferences and privacy settings
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 border-primary/50 text-primary">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            {/* Quick link: Edit Profile (moved into Settings) */}
            <Card>
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
                <CardDescription>
                  Update your player/captain/organizer/staff profiles from a single place
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">Manage your public profiles</p>
                      <p className="text-sm text-muted-foreground">Edit player, team, organizer or staff profiles</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => navigate('/profile')}>
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Availability Schedule */}
            {(user?.roles ?? []).includes("player") && (
              <Card>
                <CardHeader>
                  <CardTitle>Availability Schedule</CardTitle>
                  <CardDescription>
                    Set the days and time slots when you are available to play each week
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">Weekly schedule</p>
                        <p className="text-sm text-muted-foreground">
                          {user?.weekly_availability &&
                          Object.values(user.weekly_availability).some(s => s.length > 0)
                            ? `${Object.values(user.weekly_availability).reduce((n, s) => n + s.length, 0)} active slots across the week`
                            : "No schedule set — you appear as unavailable"}
                        </p>
                      </div>
                    </div>
                    <AvailabilityScheduleDialog
                      initialSchedule={user?.weekly_availability}
                      trigger={
                        <Button variant="outline">
                          Edit Schedule
                        </Button>
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Current Roles */}
            <Card>
              <CardHeader>
                <CardTitle>Your Roles</CardTitle>
                <CardDescription>
                  These roles determine which dashboard views you can access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {userRoles.map((role) => {
                    const config = roleConfig[role];
                    const Icon = config.icon;
                    return (
                      <Badge
                        key={role}
                        variant="secondary"
                        className="px-3 py-1.5 text-sm"
                      >
                        <Icon className="w-4 h-4 mr-1.5" />
                        {config.label}
                      </Badge>
                    );
                  })}
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Want to add more roles? Contact support or complete additional onboarding steps.
                </p>
              </CardContent>
            </Card>

            {/* Profile Visibility */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Visibility</CardTitle>
                <CardDescription>
                  Control whether other users can see your profile in search results and feeds
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {profileVisible ? (
                      <Eye className="w-5 h-5 text-primary" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div>
                      <Label htmlFor="visibility-toggle" className="text-base cursor-pointer">
                        {profileVisible ? "Profile Visible" : "Profile Hidden"}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {profileVisible
                          ? "Your profile appears in player feeds and search results"
                          : "Your profile is hidden from player feeds and search results"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="visibility-toggle"
                    checked={profileVisible}
                    onCheckedChange={handleVisibilityToggle}
                    disabled={loading}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible actions that will permanently affect your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <Trash2 className="w-4 h-4" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        account and remove all your data from our servers, including:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Your profile and personal information</li>
                          <li>All your matches and connections</li>
                          <li>Your team memberships and tournament registrations</li>
                          <li>All messages and notifications</li>
                        </ul>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={loading}
                      >
                        {loading ? "Deleting..." : "Yes, delete my account"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
