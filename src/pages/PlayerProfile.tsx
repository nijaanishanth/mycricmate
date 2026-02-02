import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import DashboardNav from "@/components/DashboardNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  User, 
  MapPin, 
  Trophy, 
  Calendar,
  Search,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Edit
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

type Role = "player" | "captain" | "organizer" | "staff";

interface PlayerProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  city?: string;
  playing_role?: string;
  batting_style?: string;
  bowling_style?: string;
  experience_years?: number;
  preferred_formats: string[];
  is_available: boolean;
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

interface Tournament {
  id: string;
  name: string;
  description?: string;
  format: string;
  city?: string;
  venue?: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  max_teams: number;
  entry_fee: number;
  prize_pool: number;
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

export default function PlayerProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState<Role>("player");
  
  const [teamSearchCity, setTeamSearchCity] = useState("");
  
  // Edit profile state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    playing_role: "",
    batting_style: "",
    bowling_style: "",
    experience_years: 0,
    preferred_formats: [] as string[]
  });

  const loadPlayerData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load profile
      const profileRes = await api.get<PlayerProfile>("/players/me/profile");
      setProfile(profileRes);
      
      // Initialize edit form with current data
      setEditForm({
        full_name: profileRes.full_name || "",
        playing_role: profileRes.playing_role || "",
        batting_style: profileRes.batting_style || "",
        bowling_style: profileRes.bowling_style || "",
        experience_years: profileRes.experience_years || 0,
        preferred_formats: profileRes.preferred_formats || []
      });
      
      // Load applications
      const appsRes = await api.get<Application[]>("/players/me/applications");
      setApplications(appsRes);
      
      // Load invitations
      const invitesRes = await api.get<Invitation[]>("/players/me/invitations");
      setInvitations(invitesRes);
      
      // Load tournaments
      
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

  const toggleAvailability = async () => {
    if (!profile) return;
    
    try {
      const newStatus = !profile.is_available;
      await api.post("/players/me/availability", { is_available: newStatus });
      
      setProfile({ ...profile, is_available: newStatus });
      toast.success(`You are now ${newStatus ? 'available' : 'unavailable'}`);
    } catch (error) {
      toast.error("Failed to update availability");
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await api.put("/users/me", editForm);
      
      toast.success("Profile updated successfully");
      setIsEditDialogOpen(false);
      loadPlayerData();
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const toggleFormat = (format: string) => {
    setEditForm(prev => ({
      ...prev,
      preferred_formats: prev.preferred_formats.includes(format)
        ? prev.preferred_formats.filter(f => f !== format)
        : [...prev.preferred_formats, format]
    }));
  };

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
      await api.post(`/players/teams/${teamId}/apply`, {
        team_id: teamId,
        message: "I would like to join your team"
      });
      
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
      await api.put(`/players/invitations/${invitationId}`, {
        status: accept ? "accepted" : "declined"
      });
      
      toast.success(`Invitation ${accept ? 'accepted' : 'declined'}`);
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
        {/* Profile Header */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback>
                    <User className="h-10 w-10" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{profile.full_name || "Player"}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4" />
                    {profile.city || "Location not set"}
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="availability" className="text-sm">Available</Label>
                  <Switch
                    id="availability"
                    checked={profile.is_available}
                    onCheckedChange={toggleAvailability}
                  />
                </div>
                
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit Player Profile</DialogTitle>
                      <DialogDescription>
                        Update your cricket profile information
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                          id="full_name"
                          value={editForm.full_name}
                          onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                          placeholder="Enter your full name"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="playing_role">Playing Role</Label>
                          <Select
                            value={editForm.playing_role}
                            onValueChange={(value) => setEditForm({ ...editForm, playing_role: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Batsman">Batsman</SelectItem>
                              <SelectItem value="Bowler">Bowler</SelectItem>
                              <SelectItem value="All-Rounder">All-Rounder</SelectItem>
                              <SelectItem value="Wicketkeeper">Wicketkeeper</SelectItem>
                              <SelectItem value="Wicketkeeper-Batsman">Wicketkeeper-Batsman</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="experience_years">Experience (Years)</Label>
                          <Input
                            id="experience_years"
                            type="number"
                            min="0"
                            value={editForm.experience_years}
                            onChange={(e) => setEditForm({ ...editForm, experience_years: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="batting_style">Batting Style</Label>
                          <Select
                            value={editForm.batting_style}
                            onValueChange={(value) => setEditForm({ ...editForm, batting_style: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select style" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Right-handed">Right-handed</SelectItem>
                              <SelectItem value="Left-handed">Left-handed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="bowling_style">Bowling Style</Label>
                          <Select
                            value={editForm.bowling_style}
                            onValueChange={(value) => setEditForm({ ...editForm, bowling_style: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select style" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Right-arm fast">Right-arm fast</SelectItem>
                              <SelectItem value="Left-arm fast">Left-arm fast</SelectItem>
                              <SelectItem value="Right-arm medium">Right-arm medium</SelectItem>
                              <SelectItem value="Left-arm medium">Left-arm medium</SelectItem>
                              <SelectItem value="Right-arm spin">Right-arm spin</SelectItem>
                              <SelectItem value="Left-arm spin">Left-arm spin</SelectItem>
                              <SelectItem value="Leg-spin">Leg-spin</SelectItem>
                              <SelectItem value="Off-spin">Off-spin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Preferred Formats</Label>
                        <div className="flex flex-wrap gap-2">
                          {["T20", "T10", "ODI", "Test", "T30"].map((format) => (
                            <Badge
                              key={format}
                              variant={editForm.preferred_formats.includes(format) ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() => toggleFormat(format)}
                            >
                              {format}
                              {editForm.preferred_formats.includes(format) && (
                                <CheckCircle className="h-3 w-3 ml-1" />
                              )}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpdateProfile}>
                        Save Changes
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Playing Role</p>
                <p className="font-medium">{profile.playing_role || "Not specified"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Batting Style</p>
                <p className="font-medium">{profile.batting_style || "Not specified"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Bowling Style</p>
                <p className="font-medium">{profile.bowling_style || "Not specified"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Experience</p>
                <p className="font-medium">
                  {profile.experience_years ? `${profile.experience_years} years` : "Not specified"}
                </p>
              </div>
            </div>
            
            <div className="mt-6">
              <p className="text-sm text-muted-foreground mb-2">Preferred Formats</p>
              <div className="flex flex-wrap gap-2">
                {profile.preferred_formats.map((format) => (
                  <Badge key={format} variant="secondary">{format}</Badge>
                ))}
                {profile.preferred_formats.length === 0 && (
                  <p className="text-sm text-muted-foreground">No formats specified</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="tournaments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
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

          {/* Tournaments Tab */}
          <TabsContent value="tournaments" className="space-y-6">
            {/* Past Tournaments */}
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
