import {
	EmailForm,
	PasswordForm,
	ProfileHeaderCard,
	SettingsCard,
	SettingsPage,
} from "@/components/settings"

export default function ProfilePage() {
	return (
		<SettingsPage
			title="Profile"
			description="Manage your account information, email, and password."
		>
			<SettingsCard
				title="Public profile"
				description="Your name and avatar. The avatar upload is a placeholder for V1."
			>
				<ProfileHeaderCard />
			</SettingsCard>

			<SettingsCard
				title="Email"
				description="Change the email associated with your account. A verification link will be sent."
			>
				<EmailForm />
			</SettingsCard>

			<SettingsCard
				title="Password"
				description="Change your account password. Use a strong one you don't use elsewhere."
			>
				<PasswordForm />
			</SettingsCard>
		</SettingsPage>
	)
}
