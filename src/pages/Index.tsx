import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Logo from "@/components/Logo";
import Navigation from "@/components/Navigation";
import FeatureCard from "@/components/FeatureCard";
import heroCricket from "@/assets/hero-cricket.jpg";
import player1 from "@/assets/player-1.jpg";
import player2 from "@/assets/player-2.jpg";
import player3 from "@/assets/player-3.jpg";
import { 
  Users, 
  Trophy, 
  MessageSquare, 
  Star, 
  MapPin, 
  Calendar,
  ArrowRight,
  Zap,
  Shield,
  Globe
} from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Background */}
        <div className="absolute inset-0">
          <img 
            src={heroCricket} 
            alt="Cricket player in action" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl animate-slide-up">
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
              <Zap className="w-3 h-3 mr-1" />
              Now in Beta
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 leading-tight">
              Find Matches.
              <br />
              <span className="text-primary">Build Teams.</span>
              <br />
              Run Tournaments.
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-lg">
              The ultimate cricket ecosystem connecting players, teams, and organizers. 
              Swipe to match, chat to connect, play to win.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button variant="hero" size="lg" asChild>
                <Link to="/signup">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/tournaments">Explore Tournaments</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="flex gap-8 mt-12 pt-8 border-t border-border/50">
              <div>
                <p className="text-3xl font-display font-bold text-primary">10K+</p>
                <p className="text-sm text-muted-foreground">Active Players</p>
              </div>
              <div>
                <p className="text-3xl font-display font-bold text-secondary">500+</p>
                <p className="text-sm text-muted-foreground">Teams</p>
              </div>
              <div>
                <p className="text-3xl font-display font-bold text-accent">100+</p>
                <p className="text-sm text-muted-foreground">Tournaments</p>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Cards */}
        <div className="hidden lg:block absolute right-12 top-1/2 -translate-y-1/2">
          <div className="relative">
            <div className="absolute -top-20 -left-8 w-48 bg-card/90 backdrop-blur rounded-2xl p-4 shadow-elevated animate-float">
              <div className="flex items-center gap-3">
                <img src={player1} alt="Player" className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <p className="font-semibold text-sm">Rahul S.</p>
                  <p className="text-xs text-muted-foreground">All-Rounder</p>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <Star className="w-3 h-3 fill-secondary text-secondary" />
                <span className="text-xs font-medium">4.8</span>
              </div>
            </div>
            
            <div className="absolute top-20 left-12 w-56 bg-card/90 backdrop-blur rounded-2xl p-4 shadow-elevated animate-float-delayed">
              <div className="flex items-center gap-3">
                <img src={player3} alt="Player" className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <p className="font-semibold text-sm">Match Found!</p>
                  <p className="text-xs text-primary">Mumbai Warriors wants you</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge className="mb-4 bg-secondary/10 text-secondary border-secondary/20">
              Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Everything You Need to Play
            </h2>
            <p className="text-muted-foreground text-lg">
              From finding teammates to organizing tournaments, CricMate has you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={Users}
              title="Swipe to Match"
              description="Find players or teams with our Tinder-style matching. Mutual interest unlocks chat."
              delay={0}
            />
            <FeatureCard 
              icon={Trophy}
              title="Tournament Hub"
              description="Discover, register, and track tournaments in your area. Never miss a match."
              delay={100}
            />
            <FeatureCard 
              icon={MessageSquare}
              title="In-App Chat"
              description="Connect with teammates, opponents, and organizers. All communication in one place."
              delay={200}
            />
            <FeatureCard 
              icon={Star}
              title="Ratings & Reviews"
              description="Build your cricket reputation. Get rated by teammates and opponents."
              delay={300}
            />
            <FeatureCard 
              icon={MapPin}
              title="Local Discovery"
              description="Set your location and radius. Find cricket opportunities near you."
              delay={400}
            />
            <FeatureCard 
              icon={Calendar}
              title="Availability Calendar"
              description="Set your availability. Let teams know when you're free to play."
              delay={500}
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              How It Works
            </Badge>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Get Started in Minutes
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Create Profile", desc: "Sign up with Google and set up your cricket profile with skills and availability." },
              { step: "02", title: "Choose Your Role", desc: "Are you a player, captain, organizer, or staff? Pick your roles." },
              { step: "03", title: "Start Swiping", desc: "Discover players, teams, and tournaments. Match and start chatting!" },
            ].map((item, i) => (
              <div key={i} className="text-center animate-slide-up" style={{ animationDelay: `${i * 150}ms` }}>
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
                  <span className="text-2xl font-display font-bold text-primary-foreground">{item.step}</span>
                </div>
                <h3 className="text-xl font-display font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">
              For Everyone
            </Badge>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Built for All Cricket Enthusiasts
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, title: "Players", desc: "Find teams, showcase skills, track your cricket journey." },
              { icon: Shield, title: "Captains", desc: "Build squads, recruit talent, manage your team." },
              { icon: Trophy, title: "Organizers", desc: "Publish tournaments, manage registrations, grow your league." },
              { icon: Globe, title: "Support Staff", desc: "Umpires, scorers, and more. Get booked for matches." },
            ].map((role, i) => (
              <div 
                key={i} 
                className="bg-card border border-border/50 rounded-2xl p-6 hover:shadow-elevated transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center mb-4">
                  <role.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-display font-bold mb-2">{role.title}</h3>
                <p className="text-sm text-muted-foreground">{role.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="relative bg-gradient-to-br from-primary to-accent rounded-3xl p-12 md:p-16 overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-96 h-96 bg-primary-foreground rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary-foreground rounded-full translate-x-1/3 translate-y-1/3" />
            </div>
            
            <div className="relative z-10 text-center max-w-2xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-display font-bold text-primary-foreground mb-4">
                Ready to Play?
              </h2>
              <p className="text-primary-foreground/80 text-lg mb-8">
                Join thousands of cricket enthusiasts already on CricMate. 
                Your next match is just a swipe away.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button variant="secondary" size="lg" asChild>
                  <Link to="/signup">
                    Create Free Account
                    <ArrowRight className="w-5 h-5 ml-1" />
                  </Link>
                </Button>
                <Button variant="glass" size="lg" className="text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10" asChild>
                  <Link to="/tournaments">Browse Tournaments</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <Logo size="md" />
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 CricMate. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
