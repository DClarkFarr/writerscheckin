import type { PropsWithChildren } from "react";

export type PageCardProps = PropsWithChildren<{
  grow?: boolean;
  footer?: React.ReactNode;
  className?: string;
}>;
export const PageCard = ({
  children,
  grow,
  footer,
  className,
}: PageCardProps) => {
  return (
    <>
      <div
        className={`bg-white rounded-lg shadow-md p-6 w-full ${grow ? "flex flex-col gap-6 grow-1 lg:mt-10" : ""} ${className ?? ""}`}
      >
        {children}
      </div>
      {footer && <div className="py-4">{footer}</div>}
    </>
  );
};
