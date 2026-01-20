import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardNav from "@/components/DashboardNav";
import StatCard from "@/components/StatCard";
import SwipeCard from "@/components/SwipeCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Trophy, 
  MessageSquare, 
  Calendar,
  X,
  Heart,
  ArrowRight,
  Clock
} from "lucide-react";

type Role = "player" | "captain" | "organizer" | "staff";

// Mock data for swipe cards
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
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [matches, setMatches] = useState<typeof mockPlayers>([]);

  // Update currentRole if it's not in user's roles
  useEffect(() => {
    if (userRoles.length > 0 && !userRoles.includes(currentRole)) {
      setCurrentRole(userRoles[0]);
    }
  }, [userRoles, currentRole]);

  const currentPlayer = mockPlayers[currentPlayerIndex];

  const handleSwipeLeft = () => {
    if (currentPlayerIndex < mockPlayers.length - 1) {
      setCurrentPlayerIndex(prev => prev + 1);
    }
  };

  const handleSwipeRight = () => {
    // Simulate a match (50% chance)
    if (Math.random() > 0.5) {
      setMatches(prev => [...prev, currentPlayer]);
    }
    if (currentPlayerIndex < mockPlayers.length - 1) {
      setCurrentPlayerIndex(prev => prev + 1);
    }
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
                <StatCard icon={MessageSquare} label="New Matches" value={matches.length} change="Today" positive />
                <StatCard icon={Trophy} label="Active Tournaments" value="2" />
                <StatCard icon={Calendar} label="Next Match" value="Sat, 12 PM" />
              </>
            )}
            {currentRole === "player" && (
              <>
                <StatCard icon={Trophy} label="Profile Views" value="128" change="+12% this week" positive />
                <StatCard icon={MessageSquare} label="Team Invites" value="5" />
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
                        {currentRole === "captain" ? "Find Players" : "Find Teams"}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {currentRole === "captain" 
                          ? "Swipe right to show interest, left to pass"
                          : "Discover teams looking for players like you"
                        }
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {mockPlayers.length - currentPlayerIndex} left
                    </Badge>
                  </div>

                  {currentPlayerIndex < mockPlayers.length ? (
                    <div className="relative">
                      <SwipeCard
                        {...currentPlayer}
                        onSwipeLeft={handleSwipeLeft}
                        onSwipeRight={handleSwipeRight}
                      />
                      
                      {/* Action Buttons */}
                      <div className="flex justify-center gap-6 mt-6">
                        <Button 
                          variant="swipePass" 
                          size="iconXl"
                          onClick={handleSwipeLeft}
                        >
                          <X className="w-8 h-8" />
                        </Button>
                        <Button 
                          variant="swipeLike" 
                          size="iconXl"
                          onClick={handleSwipeRight}
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
                      <h3 className="text-lg font-semibold mb-2">No more profiles</h3>
                      <p className="text-muted-foreground mb-4">Check back later for new matches</p>
                      <Button onClick={() => setCurrentPlayerIndex(0)}>Start Over</Button>
                    </div>
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
                    {matches.length > 0 ? (
                      <div className="space-y-3">
                        {matches.map((match, i) => (
                          <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                            <img 
                              src={match.image} 
                              alt={match.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{match.name}</p>
                              <p className="text-xs text-primary">{match.role}</p>
                            </div>
                            <Button size="sm" variant="ghost">Chat</Button>
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
                      <Button variant="ghost" className="w-full justify-start">
                        <Trophy className="w-4 h-4 mr-2" />
                        Browse Tournaments
                      </Button>
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
