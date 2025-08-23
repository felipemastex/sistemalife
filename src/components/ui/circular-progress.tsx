
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CircularProgressProps extends React.SVGProps<SVGSVGElement> {
  value?: number;
  strokeWidth?: number;
}

const CircularProgress = React.forwardRef<SVGSVGElement, CircularProgressProps>(
  ({ className, value = 0, strokeWidth = 4, ...props }, ref) => {
    const radius = 50 - strokeWidth / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
      <svg
        ref={ref}
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("transform -rotate-90", className)}
        {...props}
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          strokeWidth={strokeWidth}
          className="stroke-secondary"
          fill="transparent"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          strokeWidth={strokeWidth}
          className="stroke-primary transition-all duration-500 ease-in-out"
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
    );
  }
);
CircularProgress.displayName = "CircularProgress";

export { CircularProgress };
