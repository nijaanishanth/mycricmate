import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardNav from "@/components/DashboardNav";
import StatCard from "@/components/StatCard";
import SwipeCard from "@/components/SwipeCard";
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
  XCircle
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

type Role = "player" | "captain" | "organizer" | "staff";

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

interface Team {
  id: string;
  name: string;
  description?: string;
  city?: string;
  home_ground?: string;
  preferred_formats: string[];
  captain_id: string;
  looking_for_roles?: string[];
  rating?: number;
  distance?: string;
}

// Mock data for team swipe cards (for players)
const mockTeams = [
  {
    id: 1,
    type: "team" as const,
    name: "Mumbai Warriors",
    image: "https://api.dicebear.com/7.x/initials/svg?seed=MW",
    location: "Mumbai, India",
    distance: "3 km away",
    rating: 4.7,
    description: "Professional cricket team looking for skilled all-rounders",
    homeGround: "Wankhede Stadium",
    lookingFor: ["All-Rounder", "Bowler"],
    formats: ["T20", "ODI"],
    membersCount: 15,
  },
  {
    id: 2,
    type: "team" as const,
    name: "Pune Strikers",
    image: "https://api.dicebear.com/7.x/initials/svg?seed=PS",
    location: "Pune, India",
    distance: "8 km away",
    rating: 4.5,
    description: "Competitive team seeking wicket-keepers and opening batsmen",
    homeGround: "MCA Stadium",
    lookingFor: ["Wicket-Keeper", "Batsman"],
    formats: ["T20", "T10"],
    membersCount: 12,
  },
  {
    id: 3,
    type: "team" as const,
    name: "Delhi Dynamites",
    image: "https://api.dicebear.com/7.x/initials/svg?seed=DD",
    location: "Delhi, India",
    distance: "15 km away",
    rating: 4.9,
    description: "Premier league team looking for experienced players",
    homeGround: "Feroz Shah Kotla",
    lookingFor: ["Bowler", "All-Rounder"],
    formats: ["ODI", "Test"],
    membersCount: 18,
  },
];

// Mock data for player swipe cards (for captains)
const mockPlayers = [
  {
    id: 1,
    type: "player" as const,
    name: "Rahul Sharma",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul",
    location: "Mumbai, India",
    distance: "5 km away",
    rating: 4.8,
    role: "All-Rounder",
    battingStyle: "Right-handed batsman",
    bowlingStyle: "Right-arm medium",
    experience: "5 years experience",
    formats: ["T20", "T10", "ODI"],
  },
  {
    id: 2,
    type: "player" as const,
    name: "Vikram Patel",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram",
    location: "Pune, India",
    distance: "12 km away",
    rating: 4.5,
    role: "Bowler",
    battingStyle: "Left-handed batsman",
    bowlingStyle: "Left-arm spin",
    experience: "3 years experience",
    formats: ["T20", "T30"],
  },
  {
    id: 3,
    type: "player" as const,
    name: "Arjun Singh",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun",
    location: "Mumbai, India",
    distance: "8 km away",
    rating: 4.9,
    role: "Wicketkeeper-Batsman",
    battingStyle: "Right-handed batsman",
    experience: "7 years experience",
    formats: ["T20", "ODI", "Test"],
  },
];

const Dashboard = () => {
  const { user } = useAuth();
  const userRoles = useMemo(() => (user?.roles || []) as Role[], [user?.roles]);
  
  // Set initial role to the first available role the user has
  const [currentRole, setCurrentRole] = useState<Role>(
    userRoles.length > 0 ? userRoles[0] : "player"
  );
  
  // Separate indices for teams and players
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [teamMatches, setTeamMatches] = useState<typeof mockTeams>([]);
  const [playerMatches, setPlayerMatches] = useState<typeof mockPlayers>([]);
  
  // Track swiped IDs to prevent duplicate right swipes
  const [swipedRightTeamIds, setSwipedRightTeamIds] = useState<Set<number>>(new Set());
  const [swipedRightPlayerIds, setSwipedRightPlayerIds] = useState<Set<number>>(new Set());
  const [passedTeamIds, setPassedTeamIds] = useState<Set<number>>(new Set());
  const [passedPlayerIds, setPassedPlayerIds] = useState<Set<number>>(new Set());
  
  // Show passed items
  const [showingPassedTeams, setShowingPassedTeams] = useState(false);
  const [showingPassedPlayers, setShowingPassedPlayers] = useState(false);
  
  // Tournament search state
  const [isTournamentDialogOpen, setIsTournamentDialogOpen] = useState(false);
  const [tournamentSearchCity, setTournamentSearchCity] = useState("");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  // Update currentRole if it's not in user's roles
  useEffect(() => {
    if (userRoles.length > 0 && !userRoles.includes(currentRole)) {
      setCurrentRole(userRoles[0]);
    }
  }, [userRoles, currentRole]);

  // Get available teams/players based on current mode
  const availableTeams = useMemo(() => {
    if (showingPassedTeams) {
      return mockTeams.filter(team => passedTeamIds.has(team.id));
    }
    return mockTeams.filter(team => !swipedRightTeamIds.has(team.id) && !passedTeamIds.has(team.id));
  }, [showingPassedTeams, swipedRightTeamIds, passedTeamIds]);

  const availablePlayers = useMemo(() => {
    if (showingPassedPlayers) {
      return mockPlayers.filter(player => passedPlayerIds.has(player.id));
    }
    return mockPlayers.filter(player => !swipedRightPlayerIds.has(player.id) && !passedPlayerIds.has(player.id));
  }, [showingPassedPlayers, swipedRightPlayerIds, passedPlayerIds]);

  const currentTeam = availableTeams[currentTeamIndex];
  const currentPlayer = availablePlayers[currentPlayerIndex];
  
  // Check if there are passed teams/players available to review (excluding already liked ones)
  const hasPassedTeamsToReview = useMemo(() => {
    return mockTeams.filter(team => passedTeamIds.has(team.id) && !swipedRightTeamIds.has(team.id)).length > 0;
  }, [passedTeamIds, swipedRightTeamIds]);

  const hasPassedPlayersToReview = useMemo(() => {
    return mockPlayers.filter(player => passedPlayerIds.has(player.id) && !swipedRightPlayerIds.has(player.id)).length > 0;
  }, [passedPlayerIds, swipedRightPlayerIds]);
  
  const searchTournaments = useCallback(async () => {
    try {
      const response = await api.get(`/players/tournaments/search?city=${tournamentSearchCity}`) as Tournament[];
      setTournaments(response);
      toast.success(`Found ${response.length} tournaments`);
    } catch (error) {
      toast.error("Failed to search tournaments");
    }
  }, [tournamentSearchCity]);

  // Team swipe handlers (for players)
  const handleTeamSwipeLeft = () => {
    if (currentTeam && !showingPassedTeams) {
      setPassedTeamIds(prev => new Set(prev).add(currentTeam.id));
    }
    setCurrentTeamIndex(prev => prev + 1);
  };

  const handleTeamSwipeRight = () => {
    if (currentTeam) {
      if (swipedRightTeamIds.has(currentTeam.id)) {
        toast.error("You've already applied to this team!");
        return;
      }
      
      setSwipedRightTeamIds(prev => new Set(prev).add(currentTeam.id));
      
      // Swiping right = Application to team
      // Simulate a match (50% chance) - this represents team accepting the application
      if (Math.random() > 0.5) {
        setTeamMatches(prev => [...prev, currentTeam]);
        toast.success(`${currentTeam.name} accepted your application! You can now chat.`);
      } else {
        toast.info(`Application sent to ${currentTeam.name}! Waiting for their response.`);
      }
    }
    
    setCurrentTeamIndex(prev => prev + 1);
  };

  // Player swipe handlers (for captains)
  const handlePlayerSwipeLeft = () => {
    if (currentPlayer && !showingPassedPlayers) {
      setPassedPlayerIds(prev => new Set(prev).add(currentPlayer.id));
    }
    setCurrentPlayerIndex(prev => prev + 1);
  };

  const handlePlayerSwipeRight = () => {
    if (currentPlayer) {
      if (swipedRightPlayerIds.has(currentPlayer.id)) {
        toast.error("You've already liked this player!");
        return;
      }
      
      setSwipedRightPlayerIds(prev => new Set(prev).add(currentPlayer.id));
      
      // Simulate a match (50% chance)
      if (Math.random() > 0.5) {
        setPlayerMatches(prev => [...prev, currentPlayer]);
        toast.success(`It's a match with ${currentPlayer.name}! You can now chat.`);
      } else {
        toast.info(`Liked ${currentPlayer.name}! Waiting for them to like you back.`);
      }
    }
    
    setCurrentPlayerIndex(prev => prev + 1);
  };

  // Toggle showing passed teams
  const showPassedTeams = () => {
    setShowingPassedTeams(true);
    setCurrentTeamIndex(0);
  };

  const backToNewTeams = () => {
    setShowingPassedTeams(false);
    setCurrentTeamIndex(0);
  };

  const refreshNewTeams = () => {
    setCurrentTeamIndex(0);
    toast.info("Checking for new teams...");
    // In production, this would fetch new teams from the API
    // For now, it just resets the index to show any teams that might have appeared
  };

  // Toggle showing passed players
  const showPassedPlayers = () => {
    setShowingPassedPlayers(true);
    setCurrentPlayerIndex(0);
  };

  const backToNewPlayers = () => {
    setShowingPassedPlayers(false);
    setCurrentPlayerIndex(0);
  };

  const refreshNewPlayers = () => {
    setCurrentPlayerIndex(0);
    toast.info("Checking for new players...");
    // In production, this would fetch new players from the API
    // For now, it just resets the index to show any players that might have appeared
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav 
        currentRole={currentRole} 
        onRoleChange={setCurrentRole}
        availableRoles={userRoles}
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
                <StatCard icon={Trophy} label="Profile Views" value="128" change="+12% this week" positive />
                <StatCard icon={MessageSquare} label="Team Matches" value={teamMatches.length} />
                <StatCard icon={Users} label="Matches Made" value="12" />
                <StatCard icon={Calendar} label="Available Days" value="4" />
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
                        {swipedRightPlayerIds.has(currentPlayer.id) && (
                          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                            <Badge variant="default" className="bg-green-600 text-white">
                              Already Liked ❤️
                            </Badge>
                          </div>
                        )}
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
                            disabled={currentPlayer && swipedRightPlayerIds.has(currentPlayer.id)}
                          >
                            <Heart className="w-8 h-8" />
                          </Button>
                        </div>
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
                            : (passedPlayerIds.size > 0 
                                ? "You've reviewed all new players" 
                                : "Check back later for new players")
                          }
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
                        {swipedRightTeamIds.has(currentTeam.id) && (
                          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                            <Badge variant="default" className="bg-green-600 text-white">
                              Already Liked ❤️
                            </Badge>
                          </div>
                        )}
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
                            disabled={currentTeam && swipedRightTeamIds.has(currentTeam.id)}
                          >
                            <Heart className="w-8 h-8" />
                          </Button>
                        </div>
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
                            : (passedTeamIds.size > 0 
                                ? "You've reviewed all new teams" 
                                : "Check back later for new teams")
                          }
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
                                {currentRole === "captain" ? match.role : match.lookingFor?.join(", ")}
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
                      <Button variant="secondary" className="w-full justify-start">
                        <Calendar className="w-4 h-4 mr-2" />
                        Update Availability
                      </Button>
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
    </div>
  );
};

export default Dashboard;
