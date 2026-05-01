import { createPortal } from "react-dom";
import type { PortalWrapperId } from "../../types";

export type PortalProps = React.PropsWithChildren<{
  wrapperId: PortalWrapperId;
}>;
export function Portal({ children, wrapperId }: PortalProps) {
  const wrapperElement = document.getElementById(wrapperId);

  // You might want to handle cases where the wrapper element isn't found
  if (!wrapperElement) {
    console.error(`DOM element with ID "${wrapperId}" not found!`);
    return null;
  }

  return createPortal(children, wrapperElement);
}
