import { cn } from "@/lib/utils";
import mycricmateLogo from "@/assets/mycricmate-logo.jpeg";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

const Logo = ({ className, size = "md", showText = true }: LogoProps) => {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-20 h-20",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-4xl",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img 
        src={mycricmateLogo} 
        alt="MyCricMate Logo" 
        className={cn("object-cover rounded-full", sizes[size])}
      />
      
      {showText && (
        <span className={cn(
          "font-display font-bold tracking-tight",
          textSizes[size]
        )}>
          <span className="text-primary">MyCric</span>
          <span className="text-foreground">Mate</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
