import type { PropsWithChildren } from "react";

export type PageCardProps = PropsWithChildren<{
  grow?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}>;
export const PageCard = ({
  children,
  grow,
  header,
  footer,
  className,
}: PageCardProps) => {
  return (
    <>
      {header && <div className="mb-4 mt-4 w-full">{header}</div>}
      <div
        className={`bg-white rounded-2xl shadow-md p-6 w-full mb-6 ${grow ? "flex flex-col gap-6 grow-1 lg:mt-10" : ""} ${className ?? ""}`}
      >
        {children}
      </div>
      {footer && <div className="py-4">{footer}</div>}
    </>
  );
};
