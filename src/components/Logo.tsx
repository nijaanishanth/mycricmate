import { cn } from "@/lib/utils";

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
    <div className={cn("flex items-center gap-3", className)}>
      {/* Cricket Ball Logo */}
      <div className={cn("relative", sizes[size])}>
        <div className="absolute inset-0 bg-gradient-secondary rounded-full shadow-glow" />
        <div className="absolute inset-0 rounded-full overflow-hidden">
          {/* Seam lines */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-0.5 bg-primary-foreground/40 rotate-45 transform origin-center" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-0.5 bg-primary-foreground/40 -rotate-45 transform origin-center" />
          </div>
          {/* Shine effect */}
          <div className="absolute top-1 left-1 w-1/4 h-1/4 bg-white/30 rounded-full blur-sm" />
        </div>
      </div>
      
      {showText && (
        <span className={cn(
          "font-display font-bold tracking-tight",
          textSizes[size]
        )}>
          <span className="text-gradient-primary">Cric</span>
          <span className="text-gradient-secondary">Mate</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
