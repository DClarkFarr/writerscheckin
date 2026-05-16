import { Link } from "@tanstack/react-router";
import { PageCard } from "@/components/layout/PageCard";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useGroupQuery } from "@/queries/useGroupQuery";
import { useGroupNotificationSettingsQuery } from "@/queries/useGroupNotificationSettingsQuery";
import { useGroupNotificationSettingsMutation } from "@/queries/useGroupNotificationSettingsMutation";
import { useHomeStore } from "@/store/homeStore";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { Switch } from "@/components/ui/switch";
import type { GroupNotificationType } from "@/api/types/groups";

const NOTIFICATION_DEFINITIONS: Array<{
  type: GroupNotificationType;
  heading: string;
  description: string;
}> = [
  {
    type: "newMeetingPublication",
    heading: "New meeting publication",
    description:
      "Receive an email when a new upcoming meeting has been published.",
  },
  {
    type: "newMeetingCheckin",
    heading: "New meeting check-in",
    description:
      "Receive an email whenever a new meeting has become available for check-in.",
  },
  {
    type: "meetingAttendance",
    heading: "Meeting attendance",
    description:
      "Receive an email shortly before an upcoming meeting with members attending and reading.",
  },
  {
    type: "meetingAttendanceUpdates",
    heading: "Meeting attendance updates",
    description:
      "After check-in period has ended, receive updates if checked-in members cancel their RSVP.",
  },
];

export interface GroupNotificationSettingsPageProps {
  groupId: string;
}

export function GroupNotificationSettingsPage({
  groupId,
}: GroupNotificationSettingsPageProps) {
  const { data: group, isLoading, isError } = useGroupQuery({ groupId });
  const settingsQuery = useGroupNotificationSettingsQuery({ groupId });
  const updateSettings = useGroupNotificationSettingsMutation({ groupId });

  const header = (
    <Breadcrumb variant="light">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link
              to="/"
              onClick={() => useHomeStore.getState().setView("groups")}
            >
              My Groups
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/groups/$groupId/view" params={{ groupId }}>
              Group Details
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Notification Settings</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  return (
    <PageCard grow header={header}>
      {isLoading ? (
        <div className="py-6 text-sm text-muted-foreground">
          Loading group...
        </div>
      ) : isError || !group ? (
        <div className="py-6 text-sm text-destructive" role="alert">
          Unable to load this group's notification settings.
        </div>
      ) : (
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-foreground">
            Notification Settings
          </h1>
          <p className="text-sm text-muted-foreground">{group.name}</p>
          {settingsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading settings...</p>
          ) : settingsQuery.isError || !settingsQuery.data ? (
            <p className="text-sm text-destructive" role="alert">
              Unable to load notification settings.
            </p>
          ) : (
            <>
              {updateSettings.isError ? (
                <p className="text-sm text-destructive" role="alert">
                  Unable to update notification settings. Please try again.
                </p>
              ) : null}
              <ItemGroup>
                {NOTIFICATION_DEFINITIONS.map((setting) => {
                  const isUnsubscribed = Boolean(
                    settingsQuery.data?.unsubscribedNotifications?.[
                      setting.type
                    ],
                  );

                  return (
                    <Item key={setting.type} variant="outline">
                      <ItemContent>
                        <ItemTitle>{setting.heading}</ItemTitle>
                        <ItemDescription>{setting.description}</ItemDescription>
                      </ItemContent>
                      <ItemActions>
                        <Switch
                          checked={!isUnsubscribed}
                          disabled={updateSettings.isPending}
                          aria-label={setting.heading}
                          onCheckedChange={(checked) => {
                            updateSettings.mutate({
                              notificationType: setting.type,
                              unsubscribed: !checked,
                            });
                          }}
                        />
                      </ItemActions>
                    </Item>
                  );
                })}
              </ItemGroup>
            </>
          )}
        </div>
      )}
    </PageCard>
  );
}
