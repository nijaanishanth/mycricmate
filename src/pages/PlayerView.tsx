import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import DashboardNav from "@/components/DashboardNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, 
  Calendar,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  MessageSquare,
  MapPin,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/lib/api";

type Role = "player" | "captain" | "organizer" | "staff";

interface PlayerProfile {
  id: string;
  full_name: string;
  email: string;
  past_tournaments: Array<{
    id: string;
    name: string;
    format: string;
    placement?: number;
    date: string;
  }>;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  city?: string;
  home_ground?: string;
  preferred_formats: string[];
  captain_id: string;
}

interface Application {
  id: string;
  team_id: string;
  player_id: string;
  status: string;
  message?: string;
  created_at: string;
}

interface Invitation {
  id: string;
  team_id: string;
  player_id: string;
  invited_by: string;
  status: string;
  message?: string;
  expires_at: string;
  created_at: string;
}

interface Match {
  id: string;
  team_id: string;
  team_name: string;
  matched_at: string;
}

export default function PlayerView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState<Role>("player");
  
  const [teamSearchCity, setTeamSearchCity] = useState("");

  const loadPlayerData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load profile
      const profileRes = await api.get<PlayerProfile>("/players/me/profile");
      setProfile(profileRes);
      
      // Load applications
      const appsRes = await api.get<Application[]>("/players/me/applications");
      setApplications(appsRes);
      
      // Load invitations
      const invitesRes = await api.get<Invitation[]>("/players/me/invitations");
      setInvitations(invitesRes);
      
      // TODO: Load matches when API is ready
      
    } catch (error) {
      console.error("Failed to load player data:", error);
      toast.error("Failed to load player data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || !user.roles?.includes("player")) {
      navigate("/dashboard");
      return;
    }
    
    loadPlayerData();
  }, [user, navigate, loadPlayerData]);

  const searchTeams = async () => {
    try {
      const params = new URLSearchParams();
      if (teamSearchCity) params.append("city", teamSearchCity);
      
      const res = await api.get<Team[]>(`/players/teams/search?${params}`);
      setTeams(res);
    } catch (error) {
      toast.error("Failed to search teams");
    }
  };

  const applyToTeam = async (teamId: string) => {
    try {
      await api.post("/players/teams/apply", { team_id: teamId });
      toast.success("Application sent successfully");
      loadPlayerData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to apply to team";
      toast.error(errorMessage);
    }
  };

  const withdrawApplication = async (applicationId: string) => {
    try {
      await api.delete(`/players/applications/${applicationId}`);
      toast.success("Application withdrawn");
      loadPlayerData();
    } catch (error) {
      toast.error("Failed to withdraw application");
    }
  };

  const respondToInvitation = async (invitationId: string, accept: boolean) => {
    try {
      await api.post(`/players/invitations/${invitationId}/respond`, { accept });
      toast.success(accept ? "Invitation accepted!" : "Invitation declined");
      loadPlayerData();
    } catch (error) {
      toast.error("Failed to respond to invitation");
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <DashboardNav currentRole={currentRole} onRoleChange={setCurrentRole} availableRoles={["player"]} />
        <div className="flex items-center justify-center h-screen">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <DashboardNav currentRole={currentRole} onRoleChange={setCurrentRole} availableRoles={["player"]} />
      
      <div className="container mx-auto px-4 pt-24 pb-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Player Dashboard</h1>
          <p className="text-muted-foreground">Manage your teams, tournaments, and applications</p>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="matches" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="matches">
              Matches
              {matches.length > 0 && (
                <Badge variant="default" className="ml-2">{matches.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
            <TabsTrigger value="teams">Find Teams</TabsTrigger>
            <TabsTrigger value="applications">
              Applications
              {applications.length > 0 && (
                <Badge variant="secondary" className="ml-2">{applications.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="invitations">
              Invitations
              {invitations.length > 0 && (
                <Badge variant="destructive" className="ml-2">{invitations.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Matches Tab */}
          <TabsContent value="matches">
            <Card>
              <CardHeader>
                <CardTitle>Your Matches</CardTitle>
                <CardDescription>Teams you've matched with - start chatting!</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {matches.map((match) => (
                    <div key={match.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div>
                        <p className="font-medium">{match.team_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Matched on {new Date(match.matched_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Chat
                      </Button>
                    </div>
                  ))}
                  {matches.length === 0 && (
                    <p className="text-center text-muted-foreground py-12">
                      No matches yet. Keep swiping on teams to find your match!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tournaments Tab */}
          <TabsContent value="tournaments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Past Tournaments</CardTitle>
                <CardDescription>Your tournament history and achievements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profile.past_tournaments.map((tournament) => (
                    <div key={tournament.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div>
                        <p className="font-medium">{tournament.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {tournament.format} • {new Date(tournament.date).toLocaleDateString()}
                        </p>
                      </div>
                      {tournament.placement && (
                        <Badge variant="secondary" className="text-base px-3 py-1">
                          {tournament.placement === 1 ? "🥇 Winner" : 
                           tournament.placement === 2 ? "🥈 2nd Place" :
                           tournament.placement === 3 ? "🥉 3rd Place" :
                           `${tournament.placement}th Place`}
                        </Badge>
                      )}
                    </div>
                  ))}
                  {profile.past_tournaments.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No past tournaments yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams" className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Search Teams</CardTitle>
                <div className="flex gap-2 mt-4">
                  <Input
                    placeholder="Search by city..."
                    value={teamSearchCity}
                    onChange={(e) => setTeamSearchCity(e.target.value)}
                  />
                  <Button onClick={searchTeams}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teams.map((team) => (
                    <Card key={team.id} className="border-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{team.name}</CardTitle>
                        <CardDescription>{team.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="space-y-2 text-sm">
                            <p className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              {team.city} {team.home_ground && `• ${team.home_ground}`}
                            </p>
                            <div className="flex gap-2">
                              {team.preferred_formats.map((format) => (
                                <Badge key={format} variant="outline">{format}</Badge>
                              ))}
                            </div>
                          </div>
                          <Button onClick={() => applyToTeam(team.id)}>
                            <Send className="h-4 w-4 mr-2" />
                            Apply
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {teams.length === 0 && (
                    <p className="text-center text-muted-foreground py-12">
                      No teams found. Try searching by city.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle>My Applications</CardTitle>
                <CardDescription>Track your team applications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {applications.map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div>
                        <p className="font-medium">Application to Team</p>
                        <p className="text-sm text-muted-foreground">
                          Applied on {new Date(app.created_at).toLocaleDateString()}
                        </p>
                        {app.message && (
                          <p className="text-sm mt-2 text-muted-foreground">{app.message}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {app.status === "pending" && (
                          <>
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Pending
                            </Badge>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => withdrawApplication(app.id)}
                            >
                              Withdraw
                            </Button>
                          </>
                        )}
                        {app.status === "accepted" && (
                          <Badge variant="default" className="flex items-center gap-1 bg-green-600">
                            <CheckCircle className="h-3 w-3" />
                            Accepted
                          </Badge>
                        )}
                        {app.status === "rejected" && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <XCircle className="h-3 w-3" />
                            Rejected
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {applications.length === 0 && (
                    <p className="text-center text-muted-foreground py-12">
                      No applications yet. Search for teams and apply!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invitations Tab */}
          <TabsContent value="invitations">
            <Card>
              <CardHeader>
                <CardTitle>Team Invitations</CardTitle>
                <CardDescription>Respond to team invitations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invitations.map((invite) => (
                    <div key={invite.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">Team Invitation</p>
                          <p className="text-sm text-muted-foreground">
                            Received on {new Date(invite.created_at).toLocaleDateString()}
                          </p>
                          {invite.message && (
                            <p className="text-sm mt-2 p-3 bg-muted rounded-md">{invite.message}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Expires: {new Date(invite.expires_at).toLocaleDateString()}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => respondToInvitation(invite.id, true)}
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => respondToInvitation(invite.id, false)}
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                  {invitations.length === 0 && (
                    <p className="text-center text-muted-foreground py-12">
                      No pending invitations
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
