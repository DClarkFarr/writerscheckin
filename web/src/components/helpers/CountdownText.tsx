import { calculateCountdownTimeSegments } from "@/lib/dateFormat";
import { cn } from "@/lib/utils";
import { useEffect, useState, type ReactNode } from "react";

export type CountdownTextProps = {
  targetTime: Date | string;
  className?: string;
  partClassName?: string;
  children?: ReactNode;
};
export const CountdownText = ({
  targetTime,
  className,
  partClassName,
  children,
}: CountdownTextProps) => {
  const [parts, setParts] = useState<string[]>([]);

  useEffect(() => {
    const futureTime =
      typeof targetTime === "string" ? new Date(targetTime) : targetTime;
    if (!futureTime) {
      return;
    }

    if (futureTime <= new Date()) {
      return;
    }

    const timer = window.setInterval(() => {
      const now = new Date();
      setParts(calculateCountdownTimeSegments(futureTime, now)?.parts ?? []);

      if (futureTime <= now) {
        window.clearInterval(timer);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [targetTime]);

  return (
    <span
      className={cn("countdown-text leading-1 flex flex-wrap gap-1", className)}
    >
      {children}
      {parts.map((part, index) => {
        return (
          <span
            key={index}
            className={cn(
              "countdown-text__part font-bold inline-block py-2 px-1 text-center min-w-[10px] bg-slate-100 rounded",
              partClassName,
            )}
          >
            {part}
          </span>
        );
      })}
    </span>
  );
};
