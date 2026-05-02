import Select, { type MultiValue } from "react-select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { deriveAvatarInitials } from "@/components/layout/AvatarInitials";
import { deriveAvatarColor } from "@/utils/avatarColor";

export interface GroupUserOption {
  value: string;
  label: string;
  avatarUrl: string | null;
}

export interface GroupUserMultiSelectProps {
  inputId: string;
  placeholder: string;
  options: GroupUserOption[];
  selected: GroupUserOption[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSelectionChange: (value: GroupUserOption[]) => void;
  isLoading?: boolean;
}

const renderAvatar = (option: GroupUserOption) => {
  const initials = deriveAvatarInitials(option.label);
  const backgroundColor = deriveAvatarColor(option.label);

  return (
    <Avatar className="size-7">
      {option.avatarUrl ? <AvatarImage src={option.avatarUrl} alt="" /> : null}
      <AvatarFallback style={{ backgroundColor, color: "white" }}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

export function GroupUserMultiSelect({
  inputId,
  placeholder,
  options,
  selected,
  searchValue,
  onSearchChange,
  onSelectionChange,
  isLoading = false,
}: GroupUserMultiSelectProps) {
  return (
    <div className="space-y-3">
      <Select<GroupUserOption, true>
        inputId={inputId}
        isMulti
        isLoading={isLoading}
        options={options}
        value={selected}
        placeholder={placeholder}
        controlShouldRenderValue={false}
        hideSelectedOptions={false}
        noOptionsMessage={() =>
          searchValue.trim()
            ? "No matching users found."
            : "Start typing to search users."
        }
        onChange={(nextValue: MultiValue<GroupUserOption>) => {
          onSelectionChange([...nextValue]);
        }}
        onInputChange={(nextValue, meta) => {
          if (meta.action === "input-change") {
            onSearchChange(nextValue);
          }
          return nextValue;
        }}
        formatOptionLabel={(option) => (
          <div className="flex items-center gap-2 py-0.5">
            {renderAvatar(option)}
            <span className="text-sm text-foreground">{option.label}</span>
          </div>
        )}
        styles={{
          control: (base, state) => ({
            ...base,
            minHeight: 42,
            borderRadius: 8,
            borderColor: state.isFocused
              ? "hsl(var(--ring))"
              : "hsl(var(--border))",
            backgroundColor: "rgba(243,244,246,0.65)",
            boxShadow: state.isFocused
              ? "0 0 0 2px rgba(59,130,246,0.15)"
              : "none",
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
        }}
      />

      {selected.length > 0 ? (
        <ul className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3">
          {selected.map((option) => (
            <li
              key={option.value}
              className="flex items-center gap-2 text-sm text-foreground"
            >
              {renderAvatar(option)}
              <span>{option.label}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
