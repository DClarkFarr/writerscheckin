import type { ReactNode } from "react";

type AlertLayoutProps = React.PropsWithChildren<{
  icon?: ReactNode;
}>;
export const AlertBody = ({ icon, children }: AlertLayoutProps) => {
  return (
    <div className="flex items-start gap-2">
      {icon && <div>{icon}</div>}
      <div>{children}</div>
    </div>
  );
};
