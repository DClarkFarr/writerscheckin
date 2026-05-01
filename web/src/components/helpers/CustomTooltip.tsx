export type CustomTooltipProps = React.PropsWithChildren<{
  content: React.ReactNode;
  placement?: "top" | "bottom" | "left" | "right";
  className?: string;
}>;

const placementClasses: Record<
  NonNullable<CustomTooltipProps["placement"]>,
  string
> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-1.5",
  left: "right-full top-1/2 -translate-y-1/2 mr-1.5",
  right: "left-full top-1/2 -translate-y-1/2 ml-1.5",
};

export function CustomTooltip({
  children,
  content,
  placement = "top",
  className,
}: CustomTooltipProps) {
  return (
    <span className="group/tooltip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={[
          "pointer-events-none absolute z-50 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white",
          "opacity-0 transition-opacity duration-150 group-hover/tooltip:opacity-100",
          placementClasses[placement],
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {content}
      </span>
    </span>
  );
}
