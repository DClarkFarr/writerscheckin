import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "w-full min-w-0 border border-input bg-gray-100 transition-colors outline-none file:inline-flex file:border-0 file:bg-transparent file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-gray-300 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
  {
    variants: {
      size: {
        default:
          "min-h-7 file:h-7 rounded px-2 py-1 text-base file:text-base/relaxed",
        xs: "min-h-5 file:h-5 rounded-sm px-1 py-0.5 text-xs file:text-xs/relaxed",
        sm: "min-h-6 file:h-6 rounded-sm px-1.5 py-0.75 text-sm file:text-sm/relaxed",
        lg: "min-h-8 file:h-8 rounded px-4 py-2 text-base file:text-base/relaxed",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> & {
  size?: VariantProps<typeof inputVariants>["size"];
};

function Input({ className, type, size, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-size={size}
      data-slot="input"
      className={cn(inputVariants({ size, className }))}
      {...props}
    />
  );
}

export { Input, inputVariants };
