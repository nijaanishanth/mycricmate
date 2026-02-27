import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RoleCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  comingSoon?: boolean;
}

const RoleCard = ({ icon: Icon, title, description, selected, onClick, comingSoon }: RoleCardProps) => {
  return (
    <Card
      variant={comingSoon ? "default" : selected ? "elevated" : "default"}
      className={cn(
        "relative p-6 transition-all duration-300",
        comingSoon
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer hover:scale-[1.02]",
        !comingSoon && selected && "ring-2 ring-primary shadow-elevated"
      )}
      onClick={comingSoon ? undefined : onClick}
    >
      {/* Coming Soon badge */}
      {comingSoon && (
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
        </div>
      )}

      {/* Selected checkmark */}
      {!comingSoon && selected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-primary-foreground" />
        </div>
      )}
      
      <div className={cn(
        "w-14 h-14 rounded-lg flex items-center justify-center mb-4 transition-all duration-300",
        !comingSoon && selected ? "bg-primary" : "bg-muted"
      )}>
        <Icon className={cn(
          "w-7 h-7 transition-colors duration-300",
          !comingSoon && selected ? "text-primary-foreground" : "text-muted-foreground"
        )} />
      </div>
      
      <h3 className="font-display font-bold text-lg mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Card>
  );
};

export default RoleCard;
