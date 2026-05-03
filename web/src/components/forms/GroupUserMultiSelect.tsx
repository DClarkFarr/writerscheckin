import { useState } from "react";
import Select, { type SingleValue, type StylesConfig } from "react-select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { deriveAvatarInitials } from "@/components/layout/AvatarInitials";
import { deriveAvatarColor } from "@/utils/avatarColor";
import { useMemberSearch } from "@/hooks/useMemberSearch";
import { GroupMemberListItem } from "./GroupMemberListItem";
import type { GroupFormMember, GroupMemberRole } from "@/api/types/groups";

export interface GroupUserOption {
  value: string;
  label: string;
  avatarUrl: string | null;
  isInviteOption?: boolean;
  email?: string;
}

export interface GroupUserMultiSelectProps {
  inputId: string;
  placeholder?: string;
  groupId?: string;
  selected: GroupFormMember[];
  onMemberAdd: (member: GroupFormMember) => void;
  onMemberRoleChange: (memberId: string, role: GroupMemberRole) => void;
  onMemberDelete: (memberId: string) => void;
  isLoading?: boolean;
}

const renderAvatar = (label: string, avatarUrl: string | null | undefined) => {
  const initials = deriveAvatarInitials(label);
  const backgroundColor = deriveAvatarColor(label);

  return (
    <Avatar className="size-7">
      {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
      <AvatarFallback style={{ backgroundColor, color: "white" }}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

const selectStyles: StylesConfig<GroupUserOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: 42,
    borderRadius: 8,
    borderColor: state.isFocused ? "hsl(var(--ring))" : "hsl(var(--border))",
    backgroundColor: "rgba(243,244,246,0.65)",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(59,130,246,0.15)" : "none",
    padding: "2px 4px",
  }),
  menu: (base) => ({
    ...base,
    zIndex: 20,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? "rgba(241,245,249,1)" : "white",
    color: "inherit",
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "0 6px",
  }),
};

export function GroupUserMultiSelect({
  inputId,
  placeholder = "Search by name or email",
  groupId,
  selected,
  onMemberAdd,
  onMemberRoleChange,
  onMemberDelete,
}: GroupUserMultiSelectProps) {
  const [searchInput, setSearchInput] = useState("");
  const { data, isLoading, hasQuery } = useMemberSearch(searchInput, {
    groupId,
  });

  const options: GroupUserOption[] = [
    ...(data?.results ?? []).map((result) => ({
      value: result._id,
      label: result.name,
      avatarUrl: result.avatar,
      email: result.email,
    })),
    ...(data?.inviteOption
      ? [
          {
            value: `invite:${data.inviteOption.email}`,
            label: `Invite "${data.inviteOption.email}"`,
            avatarUrl: null,
            isInviteOption: true,
            email: data.inviteOption.email,
          },
        ]
      : []),
  ];

  const noOptionsMessage = () => {
    if (!hasQuery) {
      return "Type 2+ characters to search users.";
    }
    if (isLoading) {
      return "Searching…";
    }
    return "No matching users found.";
  };

  const handleChange = (option: SingleValue<GroupUserOption>) => {
    if (!option) {
      return;
    }

    setSearchInput("");

    const alreadyAdded = selected.some(
      (member) =>
        member.identifier === option.value ||
        member.identifier === option.email,
    );

    if (alreadyAdded) {
      return;
    }

    onMemberAdd({
      identifier: option.isInviteOption
        ? (option.email ?? option.value)
        : option.value,
      userId: option.isInviteOption ? null : option.value,
      email: option.email ?? null,
      name: option.isInviteOption
        ? (option.email ?? option.value)
        : option.label,
      avatarUrl: option.avatarUrl,
      role: "member",
      status: option.isInviteOption ? "invited" : "accepted",
    });
  };

  return (
    <div className="space-y-3">
      <Select<GroupUserOption, false>
        inputId={inputId}
        isLoading={isLoading}
        options={options}
        value={null}
        inputValue={searchInput}
        placeholder={placeholder}
        controlShouldRenderValue={false}
        filterOption={null}
        noOptionsMessage={noOptionsMessage}
        onChange={handleChange}
        onInputChange={(nextValue, meta) => {
          if (meta.action === "input-change") {
            setSearchInput(nextValue);
          }
          return nextValue;
        }}
        formatOptionLabel={(option) => (
          <div className="flex items-center gap-2 py-0.5">
            {option.isInviteOption ? (
              <span className="text-xs rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">
                Invite
              </span>
            ) : (
              renderAvatar(option.label, option.avatarUrl)
            )}
            <span className="text-sm text-foreground">{option.label}</span>
          </div>
        )}
        styles={selectStyles}
      />

      {selected.length > 0 ? (
        <ul className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3">
          {selected.map(
            (member) =>
              member.role !== "owner" && (
                <GroupMemberListItem
                  key={member._id ?? member.identifier}
                  member={member}
                  onRoleChange={onMemberRoleChange}
                  onDelete={onMemberDelete}
                />
              ),
          )}
        </ul>
      ) : null}
    </div>
  );
}
