import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { userApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Logo from "@/components/Logo";
import RoleCard from "@/components/RoleCard";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  User, 
  Users, 
  Trophy, 
  Briefcase, 
  ArrowRight, 
  ArrowLeft,
  Check
} from "lucide-react";

type Role = "player" | "captain" | "organizer" | "staff";
type Step = "role" | "location" | "complete";

const Onboarding = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [step, setStep] = useState<Step>("role");
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [city, setCity] = useState("");
  const [latitude, setLatitude] = useState<string>();
  const [longitude, setLongitude] = useState<string>();
  const [radius, setRadius] = useState([25]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const roles = [
    { id: "player" as Role, icon: User, title: "Player", description: "Find teams and showcase your cricket skills", comingSoon: false },
    { id: "captain" as Role, icon: Users, title: "Team Captain", description: "Build and manage your cricket team", comingSoon: false },
    { id: "organizer" as Role, icon: Trophy, title: "Tournament Organizer", description: "Create and run cricket tournaments", comingSoon: true },
    { id: "staff" as Role, icon: Briefcase, title: "Support Staff", description: "Umpire, score, or commentate matches", comingSoon: true },
  ];

  const toggleRole = (role: Role) => {
    // Prevent selecting coming-soon roles
    const roleConfig = roles.find(r => r.id === role);
    if (roleConfig?.comingSoon) return;
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleNext = async () => {
    if (step === "role" && selectedRoles.length > 0) {
      setStep("location");
    } else if (step === "location" && city) {
      setLoading(true);
      setError("");
      
      try {
        // Save onboarding data to backend
        const updatedUser = await userApi.completeOnboarding({
          roles: selectedRoles,
          city,
          latitude,
          longitude,
          discovery_radius: radius[0],
        });
        
        // Update user in context
        updateUser(updatedUser);
        setStep("complete");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save onboarding data");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLocationChange = (value: string, lat?: string, lng?: string) => {
    setCity(value);
    if (lat && lng) {
      setLatitude(lat);
      setLongitude(lng);
    }
  };

  const handleComplete = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <Logo size="lg" className="justify-center" />
        </div>

        {/* Progress */}
        <div className="flex justify-center gap-2 mb-8">
          {["role", "location", "complete"].map((s, i) => (
            <div 
              key={s}
              className={`h-2 w-16 rounded-full transition-all duration-300 ${
                step === s 
                  ? "bg-primary" 
                  : i < ["role", "location", "complete"].indexOf(step)
                    ? "bg-primary"
                    : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-card rounded-3xl shadow-elevated border border-border/50 p-8">
          {step === "role" && (
            <div className="animate-scale-in">
              <div className="text-center mb-8">
                <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                  Step 1 of 3
                </Badge>
                <h1 className="text-3xl font-display font-bold mb-2">Choose Your Roles</h1>
                <p className="text-muted-foreground">
                  Select one or more roles that describe you best
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {roles.map(role => (
                  <RoleCard
                    key={role.id}
                    icon={role.icon}
                    title={role.title}
                    description={role.description}
                    selected={selectedRoles.includes(role.id)}
                    onClick={() => toggleRole(role.id)}
                    comingSoon={role.comingSoon}
                  />
                ))}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-between">
                <Button variant="ghost" asChild>
                  <Link to="/">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Link>
                </Button>
                <Button 
                  variant="hero" 
                  onClick={handleNext}
                  disabled={selectedRoles.length === 0}
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === "location" && (
            <div className="animate-scale-in">
              <div className="text-center mb-8">
                <Badge className="mb-4 bg-secondary/10 text-secondary border-secondary/20">
                  Step 2 of 3
                </Badge>
                <h1 className="text-3xl font-display font-bold mb-2">Set Your Location</h1>
                <p className="text-muted-foreground">
                  We'll show you cricket opportunities near you
                </p>
              </div>

              <div className="space-y-6 mb-8">
                <div>
                  <label className="text-sm font-medium mb-2 block">Your City (US Only)</label>
                  <LocationAutocomplete
                    value={city}
                    onChange={handleLocationChange}
                    placeholder="Search for your city..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Start typing to search for cities in the United States
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-4 block">
                    Discovery Radius: <span className="text-primary font-bold">{radius[0]} miles</span>
                  </label>
                  <Slider
                    value={radius}
                    onValueChange={setRadius}
                    max={100}
                    min={5}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>5 miles</span>
                    <span>100 miles</span>
                  </div>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep("role")} disabled={loading}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button 
                  variant="hero" 
                  onClick={handleNext}
                  disabled={!city || loading}
                >
                  {loading ? "Saving..." : "Continue"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === "complete" && (
            <div className="animate-scale-in text-center">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-primary-foreground" />
              </div>
              
              <Badge className="mb-4 bg-match-success/10 text-match-success border-match-success/20">
                All Set!
              </Badge>
              <h1 className="text-3xl font-display font-bold mb-2">You're Ready to Go!</h1>
              <p className="text-muted-foreground mb-8">
                Your profile is set up. Start discovering cricket opportunities around you.
              </p>

              <div className="bg-muted/50 rounded-2xl p-6 mb-8 text-left">
                <h3 className="font-semibold mb-3">Your Setup:</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span className="text-sm">
                      Roles: {selectedRoles.map(r => roles.find(role => role.id === r)?.title).join(", ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span className="text-sm">Location: {city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span className="text-sm">Discovery radius: {radius[0]} km</span>
                  </div>
                </div>
              </div>

              <Button variant="hero" size="lg" onClick={handleComplete} className="w-full">
                Go to Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
