import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: "default" | "warning" | "success" | "danger";
  className?: string;
}

export function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  variant = "default",
  className 
}: MetricCardProps) {
  const variantStyles = {
    default: "border-border",
    warning: "border-warning/20 bg-warning/5",
    success: "border-accent/20 bg-accent/5",
    danger: "border-destructive/20 bg-destructive/5"
  };

  const iconStyles = {
    default: "text-primary bg-primary/10",
    warning: "text-warning bg-warning/10",
    success: "text-accent bg-accent/10",
    danger: "text-destructive bg-destructive/10"
  };

  return (
    <div className={cn(
      "p-6 rounded-xl border bg-card shadow-soft transition-all hover:shadow-medium",
      variantStyles[variant],
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-foreground mb-2">
            {value}
          </p>
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium",
              trend.isPositive ? "text-accent" : "text-destructive"
            )}>
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        <div className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center",
          iconStyles[variant]
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}