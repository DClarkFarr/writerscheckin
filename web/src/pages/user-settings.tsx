import { PageCard } from "@/components/layout/PageCard";
import { ChangePasswordForm } from "@/components/user/ChangePasswordForm";
import { ProfileSettingsForm } from "@/components/user/ProfileSettingsForm";
import { Field, FieldLabel } from "@/components/ui/field";
import { useChangePasswordForm } from "@/hooks/useChangePasswordForm";
import { useUpdateProfileForm } from "@/hooks/useUpdateProfileForm";
import { useMeQuery } from "@/queries/useMeQuery";
import { useAuthStore } from "@/store/authStore";
import { Input } from "@/components/ui/input";

export function UserSettingsPage() {
  const userFromStore = useAuthStore((state) => state.user);
  const { data: me } = useMeQuery();
  const user = userFromStore ?? me ?? null;
  const profileForm = useUpdateProfileForm({ user });
  const passwordForm = useChangePasswordForm();

  return (
    <PageCard className="mt-6" grow>
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-semibold">Profile Settings</h1>
          <p className="text-sm text-muted-foreground">
            Update your profile details and account security settings.
          </p>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Account
          </h2>
          <p className="text-xs text-muted-foreground">
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
          <h2 className="text-sm font-semibold text-muted-foreground">Name</h2>
          <p className="text-xs text-muted-foreground">
            Keep your account name up to date.
          </p>
          <ProfileSettingsForm {...profileForm} />
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Password
          </h2>
          <p className="text-xs text-muted-foreground">
            Use your current password to set a new one.
          </p>
          <ChangePasswordForm {...passwordForm} />
        </section>
      </div>
    </PageCard>
  );
}
