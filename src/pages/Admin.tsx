import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, AdminStats, AdminUser, AdminTeam } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Users,
  Trophy,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Search,
  Loader2,
  Trash2,
  Ban,
  CheckCircle,
  Crown,
  Activity,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

// ── helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined) {
  if (!iso) return "Never";
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [teamSearch, setTeamSearch] = useState("");

  // Guard — should not be reachable without superuser, but double-check
  useEffect(() => {
    if (user && !user.is_superuser) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  // Fetch stats on mount
  useEffect(() => {
    const load = async () => {
      try {
        const s = await adminApi.getStats();
        setStats(s);
      } catch {
        toast.error("Failed to load stats");
      } finally {
        setLoadingStats(false);
      }
    };
    load();
  }, []);

  const fetchUsers = useCallback(async (search?: string) => {
    setLoadingUsers(true);
    try {
      const data = await adminApi.listUsers(search);
      setUsers(data);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const fetchTeams = useCallback(async (search?: string) => {
    setLoadingTeams(true);
    try {
      const data = await adminApi.listTeams(search);
      setTeams(data);
    } catch {
      toast.error("Failed to load teams");
    } finally {
      setLoadingTeams(false);
    }
  }, []);

  // Fetch users & teams when their tabs are first shown
  const handleTabChange = (tab: string) => {
    if (tab === "users" && users.length === 0) fetchUsers();
    if (tab === "teams" && teams.length === 0) fetchTeams();
  };

  // ── User actions ─────────────────────────────────────────────────────────

  const toggleUserBan = async (u: AdminUser) => {
    try {
      const updated = await adminApi.updateUser(u.id, { is_active: !u.is_active });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
      toast.success(updated.is_active ? `${u.email} unbanned` : `${u.email} banned`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update user");
    }
  };

  const toggleUserAdmin = async (u: AdminUser) => {
    try {
      const updated = await adminApi.updateUser(u.id, { is_superuser: !u.is_superuser });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
      toast.success(updated.is_superuser ? `${u.email} promoted to admin` : `${u.email} demoted`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update user");
    }
  };

  const deleteUser = async (u: AdminUser) => {
    try {
      await adminApi.deleteUser(u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      toast.success(`${u.email} deleted`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete user");
    }
  };

  // ── Team actions ──────────────────────────────────────────────────────────

  const toggleTeamActive = async (t: AdminTeam) => {
    try {
      const updated = await adminApi.updateTeam(t.id, { is_active: !t.is_active });
      setTeams((prev) => prev.map((x) => (x.id === t.id ? updated : x)));
      toast.success(updated.is_active ? `${t.name} activated` : `${t.name} deactivated`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update team");
    }
  };

  const deleteTeam = async (t: AdminTeam) => {
    try {
      await adminApi.deleteTeam(t.id);
      setTeams((prev) => prev.filter((x) => x.id !== t.id));
      toast.success(`${t.name} deleted`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete team");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">MyCricMate moderation &amp; management</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
            ← Back to Dashboard
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" onValueChange={handleTabChange}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
          </TabsList>

          {/* ── OVERVIEW TAB ─────────────────────────────────────────────── */}
          <TabsContent value="overview">
            {loadingStats ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : stats ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    icon={<Users className="w-5 h-5 text-blue-500" />}
                    label="Total Users"
                    value={stats.total_users}
                    bg="bg-blue-500/10"
                  />
                  <StatCard
                    icon={<CheckCircle className="w-5 h-5 text-green-500" />}
                    label="Active Users"
                    value={stats.active_users}
                    bg="bg-green-500/10"
                  />
                  <StatCard
                    icon={<Ban className="w-5 h-5 text-red-500" />}
                    label="Banned Users"
                    value={stats.banned_users}
                    bg="bg-red-500/10"
                  />
                  <StatCard
                    icon={<UserPlus className="w-5 h-5 text-purple-500" />}
                    label="New This Month"
                    value={stats.new_users_this_month}
                    bg="bg-purple-500/10"
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <StatCard
                    icon={<Activity className="w-5 h-5 text-orange-500" />}
                    label="Total Teams"
                    value={stats.total_teams}
                    bg="bg-orange-500/10"
                  />
                  <StatCard
                    icon={<TrendingUp className="w-5 h-5 text-teal-500" />}
                    label="Active Teams"
                    value={stats.active_teams}
                    bg="bg-teal-500/10"
                  />
                  <StatCard
                    icon={<Trophy className="w-5 h-5 text-yellow-500" />}
                    label="Tournaments"
                    value={stats.total_tournaments}
                    bg="bg-yellow-500/10"
                  />
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Failed to load statistics.</p>
            )}
          </TabsContent>

          {/* ── USERS TAB ────────────────────────────────────────────────── */}
          <TabsContent value="users">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="text-base">User Management</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                      <Input
                        className="pl-8 w-56 h-8 text-sm"
                        placeholder="Search email or name…"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && fetchUsers(userSearch)}
                      />
                    </div>
                    <Button size="sm" variant="outline" onClick={() => fetchUsers(userSearch)} disabled={loadingUsers}>
                      {loadingUsers ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loadingUsers ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Roles</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Last Login</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                              No users found. Press Search to load.
                            </TableCell>
                          </TableRow>
                        ) : (
                          users.map((u) => (
                            <TableRow key={u.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                                    {(u.full_name || u.email)[0].toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm leading-tight">
                                      {u.full_name || "—"}
                                      {u.is_superuser && (
                                        <Crown className="inline-block ml-1 w-3 h-3 text-yellow-500" />
                                      )}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{u.email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {u.roles.map((r) => (
                                    <Badge key={r} variant="secondary" className="text-xs capitalize">
                                      {r}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">{u.city || "—"}</TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <Badge
                                    variant={u.is_active ? "default" : "destructive"}
                                    className="text-xs w-fit"
                                  >
                                    {u.is_active ? "Active" : "Banned"}
                                  </Badge>
                                  {u.is_verified && (
                                    <Badge variant="outline" className="text-xs w-fit border-green-500 text-green-600">
                                      Verified
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {formatDate(u.created_at)}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {formatDate(u.last_login)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {/* Ban / Unban */}
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="w-7 h-7"
                                    title={u.is_active ? "Ban user" : "Unban user"}
                                    onClick={() => toggleUserBan(u)}
                                    disabled={u.id === user?.id}
                                  >
                                    {u.is_active ? (
                                      <Ban className="w-3.5 h-3.5 text-red-500" />
                                    ) : (
                                      <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                                    )}
                                  </Button>
                                  {/* Promote / Demote */}
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="w-7 h-7"
                                    title={u.is_superuser ? "Remove admin" : "Make admin"}
                                    onClick={() => toggleUserAdmin(u)}
                                    disabled={u.id === user?.id}
                                  >
                                    <Crown
                                      className={`w-3.5 h-3.5 ${u.is_superuser ? "text-yellow-500" : "text-muted-foreground"}`}
                                    />
                                  </Button>
                                  {/* Delete */}
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="w-7 h-7"
                                        disabled={u.id === user?.id}
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete user?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will permanently delete <strong>{u.email}</strong> and all their
                                          data. This cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          onClick={() => deleteUser(u)}
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── TEAMS TAB ────────────────────────────────────────────────── */}
          <TabsContent value="teams">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="text-base">Team Management</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                      <Input
                        className="pl-8 w-56 h-8 text-sm"
                        placeholder="Search team name…"
                        value={teamSearch}
                        onChange={(e) => setTeamSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && fetchTeams(teamSearch)}
                      />
                    </div>
                    <Button size="sm" variant="outline" onClick={() => fetchTeams(teamSearch)} disabled={loadingTeams}>
                      {loadingTeams ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loadingTeams ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Team</TableHead>
                          <TableHead>Captain</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Squad</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teams.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                              No teams found. Press Search to load.
                            </TableCell>
                          </TableRow>
                        ) : (
                          teams.map((t) => (
                            <TableRow key={t.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                                    {t.name[0].toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{t.name}</p>
                                    {t.home_ground && (
                                      <p className="text-xs text-muted-foreground">{t.home_ground}</p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="text-sm">{t.captain_name || "—"}</p>
                                  <p className="text-xs text-muted-foreground">{t.captain_email || ""}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">{t.city || "—"}</TableCell>
                              <TableCell className="text-sm">
                                {t.current_player_count}/{t.max_players}
                                {t.is_squad_full && (
                                  <Badge variant="secondary" className="ml-1 text-xs">Full</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={t.is_active ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {t.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {formatDate(t.created_at)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {/* Activate / Deactivate */}
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="w-7 h-7"
                                    title={t.is_active ? "Deactivate team" : "Activate team"}
                                    onClick={() => toggleTeamActive(t)}
                                  >
                                    {t.is_active ? (
                                      <Ban className="w-3.5 h-3.5 text-orange-500" />
                                    ) : (
                                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                    )}
                                  </Button>
                                  {/* Delete */}
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="icon" variant="ghost" className="w-7 h-7">
                                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete team?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will permanently delete <strong>{t.name}</strong>.
                                          This cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          onClick={() => deleteTeam(t)}
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ── Stat card sub-component ───────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  bg: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>{icon}</div>
          <div>
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
