import { PageCard } from "@/components/layout/PageCard";
import { ProfileSettingsForm } from "@/components/user/ProfileSettingsForm";
import { Field, FieldLabel } from "@/components/ui/field";
import { useUpdateProfileForm } from "@/hooks/useUpdateProfileForm";
import { useMeQuery } from "@/queries/useMeQuery";
import { useAuthStore } from "@/store/authStore";
import { Input } from "@/components/ui/input";

export function UserSettingsPage() {
  const userFromStore = useAuthStore((state) => state.user);
  const { data: me } = useMeQuery();
  const user = userFromStore ?? me ?? null;
  const profileForm = useUpdateProfileForm({ user });

  return (
    <PageCard className="mt-6" grow>
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-semibold text-theme-50">
            Profile Settings
          </h1>
          <p className="text-sm text-theme-200">
            Update your profile details and account security settings.
          </p>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-theme-100">Account</h2>
          <p className="text-xs text-theme-300">
            Your email address is shown here for reference and cannot be edited.
          </p>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              value={user?.email ?? ""}
              autoComplete="email"
              disabled
              size="lg"
            />
          </Field>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-theme-100">Name</h2>
          <p className="text-xs text-theme-300">
            Keep your account name up to date.
          </p>
          <ProfileSettingsForm {...profileForm} />
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-theme-100">Password</h2>
          <p className="text-xs text-theme-300">
            Password change form will be added in the next phase.
          </p>
        </section>
      </div>
    </PageCard>
  );
}
