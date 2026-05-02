import { createFileRoute } from "@tanstack/react-router";
import { GroupCreatePage } from "../../pages/group-create";

export const Route = createFileRoute("/groups/create")({
  component: GroupCreatePage,
});