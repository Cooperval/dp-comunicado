import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
  {
    variants: {
      variant: {
        pending: "bg-warning/10 text-warning border border-warning/20",
        approved: "bg-accent/10 text-accent border border-accent/20",
        rejected: "bg-destructive/10 text-destructive border border-destructive/20",
        draft: "bg-muted text-muted-foreground border border-border",
        urgent: "bg-destructive text-destructive-foreground border border-destructive",
      },
    },
    defaultVariants: {
      variant: "draft",
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  children: React.ReactNode;
  showDot?: boolean;
}

export function StatusBadge({ 
  className, 
  variant, 
  children, 
  showDot = true,
  ...props 
}: StatusBadgeProps) {
  return (
    <div className={cn(statusBadgeVariants({ variant }), className)} {...props}>
      {showDot && <div className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </div>
  );
}