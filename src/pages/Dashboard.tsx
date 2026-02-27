import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardNav from "@/components/DashboardNav";
import StatCard from "@/components/StatCard";
import SwipeCard from "@/components/SwipeCard";
import ChatPanel from "@/components/ChatPanel";
import AvailabilityScheduleDialog from "@/components/AvailabilityScheduleDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Trophy, 
  MessageSquare, 
  Calendar,
  X,
  Heart,
  ArrowRight,
  Clock,
  Search,
  MapPin,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { api, playerApi, DiscoverPlayerCard, DiscoverTeamCard } from "@/lib/api";
import { toast } from "sonner";

type Role = "player" | "captain" | "organizer" | "staff";
const RESTRICTED_ROLES: Role[] = ["organizer", "staff"];

interface Tournament {
  id: string;
  name: string;
  description: string;
  format: string;
  city: string;
  venue: string;
  start_date: string;
  end_date: string;
  prize_pool: number;
  max_teams: number;
}

// ── helpers to map API data → SwipeCard props ────────────────────────────────

function playerToSwipeProps(p: DiscoverPlayerCard) {
  const expLabel = p.experience_years ? `${p.experience_years} yr exp` : null;
  const parts = [p.batting_style, p.bowling_style].filter(Boolean);
  return {
    id: p.id,
    type: "player" as const,
    name: p.full_name,
    image: p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(p.full_name)}`,
    location: p.city || "Location not set",
    distance: "",
    rating: 4.5,
    role: p.playing_role || "Player",
    battingStyle: p.batting_style || undefined,
    bowlingStyle: p.bowling_style || undefined,
    experience: expLabel || undefined,
    formats: p.preferred_formats,
    isAvailable: p.is_available,
  };
}

function teamToSwipeProps(t: DiscoverTeamCard) {
  return {
    id: t.id,
    type: "team" as const,
    name: t.name,
    image: t.logo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(t.name)}`,
    location: t.city || "Location not set",
    distance: "",
    rating: 4.5,
    description: t.description || undefined,
    homeGround: t.home_ground || undefined,
    lookingFor: [] as string[],
    formats: t.preferred_formats,
    membersCount: t.current_player_count,
    captainName: t.captain_name || undefined,
    captainId: t.captain_id || undefined,
  };
}

const Dashboard = () => {
  const { user } = useAuth();
  const userRoles = useMemo(() => (user?.roles || []) as Role[], [user?.roles]);

  // Only superusers can access staff / organizer views
  const visibleRoles = useMemo<Role[]>(() => {
    if (user?.is_superuser) return userRoles;
    return userRoles.filter(r => !RESTRICTED_ROLES.includes(r));
  }, [userRoles, user?.is_superuser]);

  const [currentRole, setCurrentRole] = useState<Role>(
    visibleRoles.length > 0 ? visibleRoles[0] : "player"
  );

  // ── Real data from API ─────────────────────────────────────────────────────
  type PlayerCard = ReturnType<typeof playerToSwipeProps>;
  type TeamCard   = ReturnType<typeof teamToSwipeProps>;

  const [players, setPlayers]         = useState<PlayerCard[]>([]);
  const [teams, setTeams]             = useState<TeamCard[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [loadingTeams, setLoadingTeams]     = useState(false);

  // ── Swipe state (string IDs) ───────────────────────────────────────────────
  const [currentTeamIndex, setCurrentTeamIndex]   = useState(0);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);

  const [likedTeamIds,   setLikedTeamIds]   = useState<Set<string>>(new Set());
  const [likedPlayerIds, setLikedPlayerIds] = useState<Set<string>>(new Set());
  const [passedTeamIds,   setPassedTeamIds]   = useState<Set<string>>(new Set());
  const [passedPlayerIds, setPassedPlayerIds] = useState<Set<string>>(new Set());

  const [showingPassedTeams,   setShowingPassedTeams]   = useState(false);
  const [showingPassedPlayers, setShowingPassedPlayers] = useState(false);

  // Match lists for sidebar
  const [teamMatches,   setTeamMatches]   = useState<TeamCard[]>([]);
  const [playerMatches, setPlayerMatches] = useState<PlayerCard[]>([]);

  // ── Chat state ─────────────────────────────────────────────────────────────
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInitialUserId, setChatInitialUserId] = useState<string | null>(null);

  // Build the contacts list for ChatPanel from confirmed matches
  const chatMatches = useMemo(() => {
    const contacts = [];
    // Captain view: playerMatches have .id = player's user UUID
    for (const p of playerMatches) {
      contacts.push({
        userId: p.id,
        name: p.name,
        image: p.image,
        subtitle: p.role,
      });
    }
    // Player view: teamMatches need captainId (user UUID of the captain)
    for (const t of teamMatches) {
      const tid = (t as ReturnType<typeof teamToSwipeProps>).captainId;
      if (tid) {
        contacts.push({
          userId: tid,
          name: t.name,
          image: t.image,
          subtitle: "Team Captain",
        });
      }
    }
    return contacts;
  }, [playerMatches, teamMatches]);

  // ── Tournament search ──────────────────────────────────────────────────────
  const [isTournamentDialogOpen, setIsTournamentDialogOpen] = useState(false);
  const [tournamentSearchCity, setTournamentSearchCity]     = useState("");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  // ── Fetch data ─────────────────────────────────────────────────────────────
  const fetchPlayers = useCallback(async () => {
    setLoadingPlayers(true);
    try {
      const data = await playerApi.discoverPlayers(0, 50);
      setPlayers(data.map(playerToSwipeProps));
      setCurrentPlayerIndex(0);
    } catch {
      toast.error("Failed to load players");
    } finally {
      setLoadingPlayers(false);
    }
  }, []);

  const fetchTeams = useCallback(async () => {
    setLoadingTeams(true);
    try {
      const data = await playerApi.discoverTeams(0, 50);
      setTeams(data.map(teamToSwipeProps));
      setCurrentTeamIndex(0);
    } catch {
      toast.error("Failed to load teams");
    } finally {
      setLoadingTeams(false);
    }
  }, []);

  useEffect(() => {
    fetchPlayers();
    fetchTeams();
  }, [fetchPlayers, fetchTeams]);

  // Keep currentRole in sync if visible roles change
  useEffect(() => {
    if (visibleRoles.length > 0 && !visibleRoles.includes(currentRole)) {
      setCurrentRole(visibleRoles[0]);
    }
  }, [visibleRoles, currentRole]);

  // ── Derived lists ──────────────────────────────────────────────────────────
  const availableTeams = useMemo(() => {
    if (showingPassedTeams)
      return teams.filter(t => passedTeamIds.has(t.id) && !likedTeamIds.has(t.id));
    return teams.filter(t => !likedTeamIds.has(t.id) && !passedTeamIds.has(t.id));
  }, [teams, showingPassedTeams, likedTeamIds, passedTeamIds]);

  const availablePlayers = useMemo(() => {
    if (showingPassedPlayers)
      return players.filter(p => passedPlayerIds.has(p.id) && !likedPlayerIds.has(p.id));
    return players.filter(p => !likedPlayerIds.has(p.id) && !passedPlayerIds.has(p.id));
  }, [players, showingPassedPlayers, likedPlayerIds, passedPlayerIds]);

  const currentTeam   = availableTeams[currentTeamIndex];
  const currentPlayer = availablePlayers[currentPlayerIndex];

  const hasPassedTeamsToReview   = useMemo(
    () => teams.filter(t  => passedTeamIds.has(t.id)   && !likedTeamIds.has(t.id)).length > 0,
    [teams, passedTeamIds, likedTeamIds]
  );
  const hasPassedPlayersToReview = useMemo(
    () => players.filter(p => passedPlayerIds.has(p.id) && !likedPlayerIds.has(p.id)).length > 0,
    [players, passedPlayerIds, likedPlayerIds]
  );

  // ── Handlers ───────────────────────────────────────────────────────────────
  const searchTournaments = useCallback(async () => {
    try {
      const response = await api.get(`/players/tournaments/search?city=${tournamentSearchCity}`) as Tournament[];
      setTournaments(response);
      toast.success(`Found ${response.length} tournaments`);
    } catch {
      toast.error("Failed to search tournaments");
    }
  }, [tournamentSearchCity]);

  const handleTeamSwipeLeft = () => {
    if (currentTeam && !showingPassedTeams)
      setPassedTeamIds(prev => new Set(prev).add(currentTeam.id));
    setCurrentTeamIndex(prev => prev + 1);
  };

  const handleTeamSwipeRight = async () => {
    if (!currentTeam) return;
    if (likedTeamIds.has(currentTeam.id)) {
      toast.error("You've already applied to this team!");
      return;
    }
    setLikedTeamIds(prev => new Set(prev).add(currentTeam.id));
    setCurrentTeamIndex(prev => prev + 1);
    try {
      const result = await playerApi.swipeRightOnTeam(currentTeam.id);
      if (result.matched) {
        setTeamMatches(prev => [...prev, currentTeam]);
        toast.success(`🎉 It's a match with ${currentTeam.name}!`);
      } else {
        toast.info(`Application sent to ${currentTeam.name}! Waiting for their response.`);
      }
    } catch {
      toast.error(`Failed to send application to ${currentTeam.name}`);
    }
  };

  const handlePlayerSwipeLeft = () => {
    if (currentPlayer && !showingPassedPlayers)
      setPassedPlayerIds(prev => new Set(prev).add(currentPlayer.id));
    setCurrentPlayerIndex(prev => prev + 1);
  };

  const handlePlayerSwipeRight = async () => {
    if (!currentPlayer) return;
    if (likedPlayerIds.has(currentPlayer.id)) {
      toast.error("You've already liked this player!");
      return;
    }
    setLikedPlayerIds(prev => new Set(prev).add(currentPlayer.id));
    setCurrentPlayerIndex(prev => prev + 1);
    try {
      const result = await playerApi.swipeRightOnPlayer(currentPlayer.id);
      if (result.matched) {
        setPlayerMatches(prev => [...prev, currentPlayer]);
        toast.success(`🎉 It's a match with ${currentPlayer.name}!`);
      } else {
        toast.info(`Liked ${currentPlayer.name}! Waiting for them to like you back.`);
      }
    } catch {
      toast.error(`Failed to record interest in ${currentPlayer.name}`);
    }
  };

  const showPassedTeams  = () => { setShowingPassedTeams(true);  setCurrentTeamIndex(0); };
  const backToNewTeams   = () => { setShowingPassedTeams(false); setCurrentTeamIndex(0); };
  const refreshNewTeams  = () => { setLikedTeamIds(new Set()); setPassedTeamIds(new Set()); fetchTeams(); };

  const showPassedPlayers  = () => { setShowingPassedPlayers(true);  setCurrentPlayerIndex(0); };
  const backToNewPlayers   = () => { setShowingPassedPlayers(false); setCurrentPlayerIndex(0); };
  const refreshNewPlayers  = () => { setLikedPlayerIds(new Set()); setPassedPlayerIds(new Set()); fetchPlayers(); };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav 
        currentRole={currentRole} 
        onRoleChange={setCurrentRole}
        availableRoles={visibleRoles}
        onOpenChat={() => { setChatInitialUserId(null); setChatOpen(true); }}
      />
      
      <main className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold mb-2">
              {currentRole === "captain" && "Team Dashboard"}
              {currentRole === "player" && "Player Dashboard"}
              {currentRole === "organizer" && "Organizer Dashboard"}
              {currentRole === "staff" && "Staff Dashboard"}
            </h1>
            <p className="text-muted-foreground">
              {currentRole === "captain" && "Find and recruit talented players for your team"}
              {currentRole === "player" && "Discover teams and tournament opportunities"}
              {currentRole === "organizer" && "Manage your tournaments and inquiries"}
              {currentRole === "staff" && "View booking requests and manage availability"}
            </p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {currentRole === "captain" && (
              <>
                <StatCard icon={Users} label="Squad Size" value="8/11" />
                <StatCard icon={MessageSquare} label="New Matches" value={playerMatches.length} change="Today" positive />
                <StatCard icon={Trophy} label="Active Tournaments" value="2" />
                <StatCard icon={Calendar} label="Next Match" value="Sat, 12 PM" />
              </>
            )}
            {currentRole === "player" && (
              <>
              </>
            )}
            {currentRole === "organizer" && (
              <>
                <StatCard icon={Trophy} label="Active Tournaments" value="3" />
                <StatCard icon={Users} label="Total Registrations" value="156" change="+24 this week" positive />
                <StatCard icon={MessageSquare} label="Inquiries" value="8" />
                <StatCard icon={Calendar} label="Upcoming Events" value="2" />
              </>
            )}
            {currentRole === "staff" && (
              <>
                <StatCard icon={Trophy} label="Assignments" value="12" change="This month" positive />
                <StatCard icon={MessageSquare} label="Pending Requests" value="3" />
                <StatCard icon={Users} label="Rating" value="4.9" />
                <StatCard icon={Calendar} label="Available Slots" value="8" />
              </>
            )}
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Swipe Section (Captain/Player) */}
            {(currentRole === "captain" || currentRole === "player") && (
              <div className="lg:col-span-2">
                <Card variant="glass" className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-display font-bold">
                        {currentRole === "captain" 
                          ? (showingPassedPlayers ? "Passed Players" : "Find Players")
                          : (showingPassedTeams ? "Passed Teams" : "Find Teams")
                        }
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {currentRole === "captain" 
                          ? (showingPassedPlayers ? "Review players you previously passed" : "Swipe right to show interest, left to pass")
                          : (showingPassedTeams ? "Review teams you previously passed" : "Swipe right to join teams that match your skills")
                        }
                      </p>
                    </div>
                  </div>

                  {currentRole === "captain" ? (
                    // Captain view - swipe players
                    currentPlayerIndex < availablePlayers.length && currentPlayer ? (
                      <div className="relative">
                        <SwipeCard
                          {...currentPlayer}
                          onSwipeLeft={handlePlayerSwipeLeft}
                          onSwipeRight={handlePlayerSwipeRight}
                        />
                        
                        {/* Action Buttons */}
                        <div className="flex justify-center gap-6 mt-6">
                          <Button 
                            variant="swipePass" 
                            size="iconXl"
                            onClick={handlePlayerSwipeLeft}
                          >
                            <X className="w-8 h-8" />
                          </Button>
                          <Button 
                            variant="swipeLike" 
                            size="iconXl"
                            onClick={handlePlayerSwipeRight}
                          >
                            <Heart className="w-8 h-8" />
                          </Button>
                        </div>
                      </div>
                    ) : loadingPlayers ? (
                      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                        <Loader2 className="w-10 h-10 animate-spin" />
                        <p>Loading players…</p>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                          {showingPassedPlayers ? "No more passed players" : "No more players"}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          {showingPassedPlayers 
                            ? "You've reviewed all passed players" 
                            : "You've reviewed everyone — refresh to reload"}
                        </p>
                        <div className="flex gap-2 justify-center">
                          {showingPassedPlayers ? (
                            <>
                              <Button onClick={backToNewPlayers}>Back to New Players</Button>
                              {hasPassedPlayersToReview && (
                                <Button variant="outline" onClick={showPassedPlayers}>
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  See Passed Players Again
                                </Button>
                              )}
                            </>
                          ) : (
                            <>
                              <Button variant="outline" onClick={refreshNewPlayers}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Refresh
                              </Button>
                              {hasPassedPlayersToReview && (
                                <Button variant="outline" onClick={showPassedPlayers}>
                                  See Passed Players
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )
                  ) : (
                    // Player view - swipe teams
                    currentTeamIndex < availableTeams.length && currentTeam ? (
                      <div className="relative">
                        <SwipeCard
                          {...currentTeam}
                          onSwipeLeft={handleTeamSwipeLeft}
                          onSwipeRight={handleTeamSwipeRight}
                        />
                        
                        {/* Action Buttons */}
                        <div className="flex justify-center gap-6 mt-6">
                          <Button 
                            variant="swipePass"
                            size="iconXl"
                            onClick={handleTeamSwipeLeft}
                          >
                            <X className="w-8 h-8" />
                          </Button>
                          <Button 
                            variant="swipeLike" 
                            size="iconXl"
                            onClick={handleTeamSwipeRight}
                          >
                            <Heart className="w-8 h-8" />
                          </Button>
                        </div>
                      </div>
                    ) : loadingTeams ? (
                      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                        <Loader2 className="w-10 h-10 animate-spin" />
                        <p>Loading teams…</p>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                          {showingPassedTeams ? "No more passed teams" : "No more teams"}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          {showingPassedTeams 
                            ? "You've reviewed all passed teams" 
                            : "You've reviewed everyone — refresh to reload"}
                        </p>
                        <div className="flex gap-2 justify-center">
                          {showingPassedTeams ? (
                            <>
                              <Button onClick={backToNewTeams}>Back to New Teams</Button>
                              {hasPassedTeamsToReview && (
                                <Button variant="outline" onClick={showPassedTeams}>
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  See Passed Teams Again
                                </Button>
                              )}
                            </>
                          ) : (
                            <>
                              <Button variant="outline" onClick={refreshNewTeams}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Refresh
                              </Button>
                              {hasPassedTeamsToReview && (
                                <Button variant="outline" onClick={showPassedTeams}>
                                  See Passed Teams
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </Card>
              </div>
            )}

            {/* Organizer Content */}
            {currentRole === "organizer" && (
              <div className="lg:col-span-2">
                <Card variant="glass" className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-display font-bold">Your Tournaments</h2>
                    <Button variant="hero">
                      Create Tournament
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {[
                      { name: "Mumbai Premier League T20", teams: 12, date: "Jan 15-20, 2025", status: "Active" },
                      { name: "Weekend Warriors Cup", teams: 8, date: "Jan 25, 2025", status: "Registrations Open" },
                      { name: "Corporate Cricket Championship", teams: 16, date: "Feb 1-5, 2025", status: "Upcoming" },
                    ].map((tournament, i) => (
                      <div 
                        key={i}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
                      >
                        <div>
                          <h3 className="font-semibold">{tournament.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {tournament.teams} teams
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {tournament.date}
                            </span>
                          </div>
                        </div>
                        <Badge variant={tournament.status === "Active" ? "default" : "secondary"}>
                          {tournament.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* Staff Content */}
            {currentRole === "staff" && (
              <div className="lg:col-span-2">
                <Card variant="glass" className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-display font-bold">Booking Requests</h2>
                    <Badge variant="secondary">3 pending</Badge>
                  </div>

                  <div className="space-y-4">
                    {[
                      { event: "MPL T20 Finals", role: "Umpire", date: "Jan 20, 2025", time: "2:00 PM", pay: "₹2,500" },
                      { event: "Corporate Cup Match", role: "Scorer", date: "Jan 22, 2025", time: "10:00 AM", pay: "₹1,500" },
                      { event: "Weekend League", role: "Umpire", date: "Jan 25, 2025", time: "9:00 AM", pay: "₹2,000" },
                    ].map((booking, i) => (
                      <div 
                        key={i}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                      >
                        <div>
                          <h3 className="font-semibold">{booking.event}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span>{booking.role}</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {booking.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {booking.time}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-primary">{booking.pay}</span>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">Decline</Button>
                            <Button size="sm">Accept</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Recent Matches */}
              {(currentRole === "captain" || currentRole === "player") && (
                <Card variant="glass">
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Matches</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(currentRole === "captain" ? playerMatches : teamMatches).length > 0 ? (
                      <div className="space-y-3">
                        {(currentRole === "captain" ? playerMatches : teamMatches).map((match, i) => (
                          <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                            <img 
                              src={match.image} 
                              alt={match.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{match.name}</p>
                              <p className="text-xs text-primary">
                                {currentRole === "captain"
                                  ? (match as ReturnType<typeof playerToSwipeProps>).role
                                  : (match as ReturnType<typeof teamToSwipeProps>).formats?.join(", ")}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {currentRole === "captain" && (
                                <>
                                  <Button 
                                    size="icon" 
                                    variant="ghost"
                                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                                    onClick={() => toast.success(`Approved ${match.name}`)}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="icon" 
                                    variant="ghost"
                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                                    onClick={() => toast.error(`Rejected ${match.name}`)}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button 
                                size="icon" 
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => {
                                  const userId = currentRole === "captain"
                                    ? match.id
                                    : (match as ReturnType<typeof teamToSwipeProps>).captainId;
                                  if (userId) {
                                    setChatInitialUserId(userId);
                                    setChatOpen(true);
                                  }
                                }}
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-sm text-muted-foreground py-4">
                        No matches yet. Keep swiping!
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {currentRole === "captain" && (
                    <>
                      <Button variant="secondary" className="w-full justify-start">
                        <Users className="w-4 h-4 mr-2" />
                        View Squad
                      </Button>
                      <Button variant="ghost" className="w-full justify-start">
                        <Trophy className="w-4 h-4 mr-2" />
                        Join Tournament
                      </Button>
                    </>
                  )}
                  {currentRole === "player" && (
                    <>
                      <AvailabilityScheduleDialog
                        initialSchedule={user?.weekly_availability}
                      />
                      <Dialog open={isTournamentDialogOpen} onOpenChange={setIsTournamentDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" className="w-full justify-start">
                            <Trophy className="w-4 h-4 mr-2" />
                            Browse Tournaments
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Browse Tournaments</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-6">
                            {/* Search Bar */}
                            <div className="flex gap-2">
                              <Input
                                placeholder="Search by city..."
                                value={tournamentSearchCity}
                                onChange={(e) => setTournamentSearchCity(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && searchTournaments()}
                              />
                              <Button onClick={searchTournaments}>
                                <Search className="h-4 w-4 mr-2" />
                                Search
                              </Button>
                            </div>

                            {/* Tournament Results */}
                            <div className="space-y-4">
                              {tournaments.map((tournament) => (
                                <Card key={tournament.id} className="border-2">
                                  <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center justify-between text-lg">
                                      <span>{tournament.name}</span>
                                      <Badge>{tournament.format}</Badge>
                                    </CardTitle>
                                    <CardDescription>{tournament.description}</CardDescription>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <span>{tournament.city} - {tournament.venue}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span>{new Date(tournament.start_date).toLocaleDateString()}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Trophy className="h-4 w-4 text-muted-foreground" />
                                        <span>Prize Pool: ₹{tournament.prize_pool.toLocaleString()}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        <span>Max Teams: {tournament.max_teams}</span>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                              {tournaments.length === 0 && tournamentSearchCity && (
                                <p className="text-center text-muted-foreground py-12">
                                  No tournaments found. Try searching by city.
                                </p>
                              )}
                              {tournaments.length === 0 && !tournamentSearchCity && (
                                <p className="text-center text-muted-foreground py-12">
                                  Enter a city name to search for tournaments
                                </p>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}
                  {currentRole === "organizer" && (
                    <>
                      <Button variant="secondary" className="w-full justify-start">
                        <Trophy className="w-4 h-4 mr-2" />
                        Create Tournament
                      </Button>
                      <Button variant="ghost" className="w-full justify-start">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        View Inquiries
                      </Button>
                    </>
                  )}
                  {currentRole === "staff" && (
                    <>
                      <Button variant="secondary" className="w-full justify-start">
                        <Calendar className="w-4 h-4 mr-2" />
                        Manage Calendar
                      </Button>
                      <Button variant="ghost" className="w-full justify-start">
                        <Users className="w-4 h-4 mr-2" />
                        Update Profile
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming */}
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="text-lg">Upcoming</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-primary/5">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">MPL T20 Match</p>
                        <p className="text-xs text-muted-foreground">Saturday, 2:00 PM</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-lg">
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Team Practice</p>
                        <p className="text-xs text-muted-foreground">Sunday, 8:00 AM</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Chat Panel */}
      <ChatPanel
        matches={chatMatches}
        open={chatOpen}
        onClose={() => { setChatOpen(false); setChatInitialUserId(null); }}
        initialUserId={chatInitialUserId}
      />
    </div>
  );
};

export default Dashboard;
