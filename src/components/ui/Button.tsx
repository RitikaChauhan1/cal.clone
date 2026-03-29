import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", isLoading, children, ...props }, ref) => {
    
    // Base classes
    let classes = "btn";

    // Variants
    if (variant === "primary") classes += " btn-primary";
    else if (variant === "secondary") classes += " btn-secondary";
    else if (variant === "danger") classes += " btn-danger";
    else if (variant === "ghost") classes += " btn-ghost";
    else if (variant === "outline") classes += " outline"; // Custom class used for outline

    // Sizes
    if (size === "sm") classes += " btn-sm";
    else if (size === "lg") classes += " btn-lg";
    // If we want Tailwind sizing, we could add `px-3 py-1 text-sm` etc, but we stick strictly to existing CSS classes.

    classes += ` ${className}`;

    return (
      <button
        ref={ref}
        className={classes.replace(/\s+/g, ' ').trim()}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}>
            <span className="spin">⏳</span> {children}
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";
