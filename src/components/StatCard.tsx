import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  change?: string;
  positive?: boolean;
  className?: string;
}

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  change, 
  positive = true,
  className 
}: StatCardProps) => {
  return (
    <Card variant="glass" className={cn("p-5", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-2xl font-display font-bold">{value}</p>
          {change && (
            <p className={cn(
              "text-xs mt-1 font-medium",
              positive ? "text-match-success" : "text-destructive"
            )}>
              {positive ? "↑" : "↓"} {change}
            </p>
          )}
        </div>
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
    </Card>
  );
};

export default StatCard;
