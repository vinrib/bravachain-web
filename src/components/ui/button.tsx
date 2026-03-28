import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:opacity-90 active:opacity-80 shadow-sm",
        secondary:
          "bg-card border border-border text-foreground hover:bg-muted active:bg-muted shadow-sm",
        ghost:
          "text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted",
        destructive:
          "bg-destructive text-white hover:opacity-90 active:opacity-80 shadow-sm",
        outline:
          "border border-primary text-primary hover:bg-primary/5 active:bg-primary/10",
      },
      size: {
        // min-h-[44px] ensures touch-friendly target on all interactive sizes
        sm: "min-h-[44px] px-4 text-sm rounded-xl",
        md: "min-h-[44px] px-5 text-sm rounded-xl",
        lg: "min-h-[48px] px-8 text-base rounded-xl",
        xl: "min-h-[56px] px-10 text-base rounded-2xl",
        icon: "h-11 w-11 rounded-xl",
        "icon-sm": "h-11 w-11 rounded-xl",
        "icon-lg": "h-12 w-12 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
