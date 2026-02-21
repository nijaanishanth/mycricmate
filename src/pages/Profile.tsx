import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import DashboardNav from "@/components/DashboardNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  User, 
  Users,
  Trophy,
  Briefcase,
  CheckCircle,
  Save
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

type Role = "player" | "captain" | "organizer" | "staff";

// API Response types
interface PlayerProfileResponse {
  playing_role?: string;
  batting_style?: string;
  bowling_style?: string;
  experience_years?: number;
  preferred_formats?: string[];
  city?: string;
}

interface TeamResponse {
  id: string;
  name: string;
  description?: string;
  captain_id: string;
  city?: string;
  home_ground?: string;
  established_date?: string;
  logo_url?: string;
  preferred_formats?: string[];
  max_players?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PlayerProfileData {
  playing_role?: string;
  batting_style?: string;
  bowling_style?: string;
  experience_years?: number;
  preferred_formats: string[];
}

interface TeamProfileData {
  team_name?: string;
  team_description?: string;
  home_ground?: string;
  preferred_formats: string[];
}

interface OrganizerProfileData {
  organization_name?: string;
  organization_description?: string;
  experience_years?: number;
}

interface StaffProfileData {
  staff_role?: string;
  qualifications?: string;
  experience_years?: number;
}

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [currentRole, setCurrentRole] = useState<Role>("player");
  const [loading, setLoading] = useState(false);
  
  // Common profile data
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  
  // Player profile
  const [playerData, setPlayerData] = useState<PlayerProfileData>({
    playing_role: "",
    batting_style: "",
    bowling_style: "",
    experience_years: 0,
    preferred_formats: []
  });
  
  // Captain/Team profile
  const [teamData, setTeamData] = useState<TeamProfileData>({
    team_name: "",
    team_description: "",
    home_ground: "",
    preferred_formats: []
  });
  
  // Organizer profile
  const [organizerData, setOrganizerData] = useState<OrganizerProfileData>({
    organization_name: "",
    organization_description: "",
    experience_years: 0
  });
  
  // Staff profile
  const [staffData, setStaffData] = useState<StaffProfileData>({
    staff_role: "",
    qualifications: "",
    experience_years: 0
  });

  const userRoles = useMemo(() => (user?.roles || []) as Role[], [user?.roles]);

  const loadProfileData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load common user data
      setFullName(user?.full_name || "");
      setEmail(user?.email || "");
      
      // Load role-specific data
      if (userRoles.includes("player")) {
        try {
          const playerProfile = await api.get<PlayerProfileResponse>("/players/me/profile");
          setPlayerData({
            playing_role: playerProfile.playing_role || "",
            batting_style: playerProfile.batting_style || "",
            bowling_style: playerProfile.bowling_style || "",
            experience_years: playerProfile.experience_years || 0,
            preferred_formats: playerProfile.preferred_formats || []
          });
          setCity(playerProfile.city || "");
        } catch (error) {
          console.log("No player profile yet");
        }
      }
      
      if (userRoles.includes("captain")) {
        try {
          const teams = await api.get<TeamResponse[]>("/teams/my-teams");
          if (teams && teams.length > 0) {
            const team = teams[0];
            setTeamData({
              team_name: team.name || "",
              team_description: team.description || "",
              home_ground: team.home_ground || "",
              preferred_formats: team.preferred_formats || []
            });
          }
        } catch (error) {
          console.log("No team profile yet");
        }
      }
      
      // Add organizer and staff data loading when backend is ready
      
    } catch (error) {
      console.error("Failed to load profile data:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  }, [user, userRoles]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    // Load existing profile data
    loadProfileData();
  }, [user, navigate, loadProfileData]);

  const handleSaveCommon = async () => {
    try {
      await api.put("/users/me", {
        full_name: fullName,
        city: city
      });
      
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const handleSavePlayer = async () => {
    try {
      await api.put("/players/me/profile", playerData);
      toast.success("Player profile updated successfully");
    } catch (error) {
      toast.error("Failed to update player profile");
    }
  };

  const handleSaveTeam = async () => {
    try {
      // Map frontend fields to backend fields
      const teamPayload = {
        name: teamData.team_name,
        description: teamData.team_description,
        home_ground: teamData.home_ground,
        preferred_formats: teamData.preferred_formats
      };
      
      await api.put("/teams/me", teamPayload);
      toast.success("Team profile updated successfully");
    } catch (error) {
      toast.error("Failed to update team profile");
    }
  };

  const handleSaveOrganizer = async () => {
    try {
      await api.put("/organizers/me", organizerData);
      toast.success("Organizer profile updated successfully");
    } catch (error) {
      toast.error("Failed to update organizer profile");
    }
  };

  const handleSaveStaff = async () => {
    try {
      await api.put("/staff/me", staffData);
      toast.success("Staff profile updated successfully");
    } catch (error) {
      toast.error("Failed to update staff profile");
    }
  };

  const togglePlayerFormat = (format: string) => {
    setPlayerData(prev => ({
      ...prev,
      preferred_formats: prev.preferred_formats.includes(format)
        ? prev.preferred_formats.filter(f => f !== format)
        : [...prev.preferred_formats, format]
    }));
  };

  const toggleTeamFormat = (format: string) => {
    setTeamData(prev => ({
      ...prev,
      preferred_formats: prev.preferred_formats.includes(format)
        ? prev.preferred_formats.filter(f => f !== format)
        : [...prev.preferred_formats, format]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <DashboardNav currentRole={currentRole} onRoleChange={setCurrentRole} availableRoles={userRoles} />
        <div className="flex items-center justify-center h-screen">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <DashboardNav currentRole={currentRole} onRoleChange={setCurrentRole} availableRoles={userRoles} />
      
      <div className="container mx-auto px-4 pt-24 pb-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Edit Profile</h1>
          <p className="text-muted-foreground mt-2">Manage your profile information for all your roles</p>
        </div>

        <Tabs defaultValue="common" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="common">
              <User className="h-4 w-4 mr-2" />
              Common
            </TabsTrigger>
            {userRoles.includes("player") && (
              <TabsTrigger value="player">
                <User className="h-4 w-4 mr-2" />
                Player
              </TabsTrigger>
            )}
            {userRoles.includes("captain") && (
              <TabsTrigger value="captain">
                <Users className="h-4 w-4 mr-2" />
                Captain
              </TabsTrigger>
            )}
            {userRoles.includes("organizer") && (
              <TabsTrigger value="organizer">
                <Trophy className="h-4 w-4 mr-2" />
                Organizer
              </TabsTrigger>
            )}
            {userRoles.includes("staff") && (
              <TabsTrigger value="staff">
                <Briefcase className="h-4 w-4 mr-2" />
                Staff
              </TabsTrigger>
            )}
          </TabsList>

          {/* Common Profile */}
          <TabsContent value="common">
            <Card>
              <CardHeader>
                <CardTitle>Common Information</CardTitle>
                <CardDescription>Information shared across all your roles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Enter your city"
                  />
                </div>
                
                <Button onClick={handleSaveCommon} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Save Common Profile
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Player Profile */}
          {userRoles.includes("player") && (
            <TabsContent value="player">
              <Card>
                <CardHeader>
                  <CardTitle>Player Profile</CardTitle>
                  <CardDescription>Your cricket player information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="playing_role">Playing Role</Label>
                      <Select
                        value={playerData.playing_role}
                        onValueChange={(value) => setPlayerData({ ...playerData, playing_role: value })}
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
                        value={playerData.experience_years}
                        onChange={(e) => setPlayerData({ ...playerData, experience_years: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="batting_style">Batting Style</Label>
                      <Select
                        value={playerData.batting_style}
                        onValueChange={(value) => setPlayerData({ ...playerData, batting_style: value })}
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
                        value={playerData.bowling_style}
                        onValueChange={(value) => setPlayerData({ ...playerData, bowling_style: value })}
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
                          variant={playerData.preferred_formats.includes(format) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => togglePlayerFormat(format)}
                        >
                          {format}
                          {playerData.preferred_formats.includes(format) && (
                            <CheckCircle className="h-3 w-3 ml-1" />
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <Button onClick={handleSavePlayer} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Save Player Profile
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Captain/Team Profile */}
          {userRoles.includes("captain") && (
            <TabsContent value="captain">
              <Card>
                <CardHeader>
                  <CardTitle>Team Profile</CardTitle>
                  <CardDescription>Your team information as a captain</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="team_name">Team Name</Label>
                    <Input
                      id="team_name"
                      value={teamData.team_name}
                      onChange={(e) => setTeamData({ ...teamData, team_name: e.target.value })}
                      placeholder="Enter team name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="team_description">Team Description</Label>
                    <Textarea
                      id="team_description"
                      value={teamData.team_description}
                      onChange={(e) => setTeamData({ ...teamData, team_description: e.target.value })}
                      placeholder="Describe your team..."
                      rows={4}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="home_ground">Home Ground</Label>
                    <Input
                      id="home_ground"
                      value={teamData.home_ground}
                      onChange={(e) => setTeamData({ ...teamData, home_ground: e.target.value })}
                      placeholder="Enter home ground location"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Preferred Formats</Label>
                    <div className="flex flex-wrap gap-2">
                      {["T20", "T10", "ODI", "Test", "T30"].map((format) => (
                        <Badge
                          key={format}
                          variant={teamData.preferred_formats.includes(format) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleTeamFormat(format)}
                        >
                          {format}
                          {teamData.preferred_formats.includes(format) && (
                            <CheckCircle className="h-3 w-3 ml-1" />
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <Button onClick={handleSaveTeam} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Save Team Profile
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Organizer Profile */}
          {userRoles.includes("organizer") && (
            <TabsContent value="organizer">
              <Card>
                <CardHeader>
                  <CardTitle>Organizer Profile</CardTitle>
                  <CardDescription>Your tournament organizer information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="organization_name">Organization Name</Label>
                    <Input
                      id="organization_name"
                      value={organizerData.organization_name}
                      onChange={(e) => setOrganizerData({ ...organizerData, organization_name: e.target.value })}
                      placeholder="Enter organization name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="organization_description">Organization Description</Label>
                    <Textarea
                      id="organization_description"
                      value={organizerData.organization_description}
                      onChange={(e) => setOrganizerData({ ...organizerData, organization_description: e.target.value })}
                      placeholder="Describe your organization..."
                      rows={4}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="org_experience">Experience (Years)</Label>
                    <Input
                      id="org_experience"
                      type="number"
                      min="0"
                      value={organizerData.experience_years}
                      onChange={(e) => setOrganizerData({ ...organizerData, experience_years: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  
                  <Button onClick={handleSaveOrganizer} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Save Organizer Profile
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Staff Profile */}
          {userRoles.includes("staff") && (
            <TabsContent value="staff">
              <Card>
                <CardHeader>
                  <CardTitle>Staff Profile</CardTitle>
                  <CardDescription>Your staff member information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="staff_role">Staff Role</Label>
                    <Select
                      value={staffData.staff_role}
                      onValueChange={(value) => setStaffData({ ...staffData, staff_role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Umpire">Umpire</SelectItem>
                        <SelectItem value="Scorer">Scorer</SelectItem>
                        <SelectItem value="Groundskeeper">Groundskeeper</SelectItem>
                        <SelectItem value="Coach">Coach</SelectItem>
                        <SelectItem value="Analyst">Analyst</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="qualifications">Qualifications</Label>
                    <Textarea
                      id="qualifications"
                      value={staffData.qualifications}
                      onChange={(e) => setStaffData({ ...staffData, qualifications: e.target.value })}
                      placeholder="List your qualifications..."
                      rows={4}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="staff_experience">Experience (Years)</Label>
                    <Input
                      id="staff_experience"
                      type="number"
                      min="0"
                      value={staffData.experience_years}
                      onChange={(e) => setStaffData({ ...staffData, experience_years: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  
                  <Button onClick={handleSaveStaff} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Save Staff Profile
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
