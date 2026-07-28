import { Markup } from 'telegraf'

export const TelegramButtons = {
	authSuccess: Markup.inlineKeyboard([
		[
			Markup.button.callback('My subscriptions', 'follows'),
			Markup.button.callback('My informations', 'me')
		],
		[Markup.button.url('Go to Kick', 'https://kick.com')]
	]),
	profile: Markup.inlineKeyboard([
		Markup.button.url(
			'Account Settings',
			'https://kick.com/dashboard/settings'
		)
	])
}
