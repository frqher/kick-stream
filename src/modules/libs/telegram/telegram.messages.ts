import type { SponsorshipPlan, User } from '@prisma/client'
import { type SessionMetadata } from 'src/shared/types/session-metadata.types'

export const TelegramMessagess = {
	welcome:
		`<b>👋 Welcome to Kick Bot</b>\n\n` +
		`Connect your Telegram account to KickStream to receive notifications and enhance your platform experience.\n\n` +
		`Click the button below and navigate to the <b>Notifications</b> section to complete the setup.`,
	authSuccess:
		`<b>Telegram Successfully Connected</b>\n\n` +
		`You will now receive real-time notifications for activities on the KickStream platform.`,
	invalidToken:
		`<b>Invalid Token</b>\n\n` +
		`This token is either invalid or has expired. Please request a new one and try again.`,
	userNotFound: `👀 <b>User not found</b>`,
	profile: (user: User, followersCount: number, followingsCount: number) =>
		`<b>Your Informations:</b>\n\n` +
		`🔑 Id: ${user?.id}\n` +
		`🔐 Username: @${user?.username}\n` +
		`👤 Display name: ${user?.displayName}\n` +
		`📧 Email: ${user?.email}\n` +
		`📝 Bio: ${user?.bio ? user.bio : 'No bio'}\n` +
		`💛 Followers: ${followersCount}\n` +
		`❤️ Followings: ${followingsCount}`,
	follows: (user: User) =>
		`📺 <a href="https://kick.com/${user.username}">${user.username}</a>`,
	resetPassword: (token: string, metadata: SessionMetadata) =>
		`🔑 <b>Password Reset</b>\n\n` +
		`A password reset request has been made for your account. You can use the token below to reset your password:\n\n` +
		`<b><a href="https://kick.com/account/recovery/${token}">Reset Password</a></b>\n\n` +
		`<b>Request Details:</b>\n` +
		`🌎 Country: ${metadata.location.country}\n` +
		`💻 Device: ${metadata.device.os}\n` +
		`🔗 Browser: ${metadata.device.browser}\n` +
		`📍 Ip Address: ${metadata.ip}`,
	deactive: (token: string, metadata: SessionMetadata) =>
		`🔐 <b>Deactivate Your Account</b>\n\n` +
		`We received a request to deactivate your Kick account. Use the verification code below to confirm.\n\n` +
		`<b>Your verification code:</b>\n` +
		`<code>${token}</code>\n\n` +
		`⏳ <i>This code will expire in 5 minutes. If it expires, you will need to submit a new deactivation request.</i>\n\n` +
		`<b>🛡 Security Details:</b>\n` +
		`🌎 Country: ${metadata.location.country}\n` +
		`💻 Device: ${metadata.device.os}\n` +
		`🔗 Browser: ${metadata.device.browser}\n` +
		`📍 IP Address: ${metadata.ip}\n\n` +
		`<i>If you did not request this, please ignore this message. Your account will remain active.</i>`,

	accountDeleted: (username: string) =>
		`🗑 <b>Account Deleted</b>\n\n` +
		`Hi <b>@${username}</b>, your Kick account has been permanently deleted following the 7-day deactivation period.\n\n` +
		`⚠️ <b>This action is irreversible.</b>\n` +
		`<i>All your data, including your profile, streams, and settings, has been permanently removed from our servers.</i>\n\n` +
		`<b>What This Means:</b>\n` +
		`• Your username is no longer reserved and may become available to others.\n` +
		`• You will no longer receive notifications from Kick.\n` +
		`• Any active subscriptions have been cancelled.\n` +
		`• This email address can be used to create a new account.\n\n` +
		`<i>We are sorry to see you go. If you ever want to come back, you are always welcome to create a new account.</i>\n\n` +
		`— The Kick Team`,
	streamStart: (channel: User) =>
		`🟢 <b>${channel.displayName} is now live!</b>\n\n` +
		`<a href="https://kick.com/${channel.username}">▶️ Watch the stream</a>`,

	newFollowing: (follower: User, followersCount: number) =>
		`🔔 <b>New Follower!</b>\n\n` +
		`<a href="https://kick.com/${follower.username}">${follower.displayName}</a> started following you.\n\n` +
		`👥 Total Followers: <b>${followersCount}</b>`,
	newSponsorship: (plan: SponsorshipPlan, sponsor: User) => {
		const now = new Date()
		const date = now.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		})
		const time = now.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		})

		return (
			`💛 <b>New Sponsorship!</b>\n\n` +
			`<a href="https://kick.com/${sponsor.username}">${sponsor.displayName}</a> just subscribed to your channel.\n\n` +
			`<b>📦 Plan:</b> ${plan.title}\n` +
			`<b>💵 Price:</b> $${plan.price}/month\n\n` +
			`🕐 ${date} at ${time}`
		)
	}
}
