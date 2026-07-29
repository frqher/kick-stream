import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { type SponsorshipPlan, TokenType, type User } from '@prisma/client'
import { Action, Command, Ctx, Start, Update } from 'nestjs-telegraf'
import { PrismaService } from 'src/core/prisma/prisma.service'
import { type SessionMetadata } from 'src/shared/types/session-metadata.types'
import { Context, Telegraf } from 'telegraf'

import { TelegramButtons } from './telegram.buttons'
import { TelegramMessagess } from './telegram.messages'

@Update()
@Injectable()
export class TelegramService extends Telegraf {
	private readonly _token: string

	public constructor(
		private readonly prismaService: PrismaService,
		private readonly configService: ConfigService
	) {
		super(configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN'))
		this._token = configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN')
	}

	@Start()
	public async onStart(@Ctx() ctx: any) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		const chatId = ctx.chat.id.toString()
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		const token = ctx.message.text.split(' ')[1] as string

		if (token) {
			const authToken = await this.prismaService.token.findUnique({
				where: {
					token,
					type: TokenType.TELEGRAM_AUTH
				}
			})
			if (
				!authToken ||
				!authToken?.userId ||
				typeof authToken.userId !== 'string'
			) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
				return ctx.replyWithHTML(TelegramMessagess.invalidToken)
			}

			const hasExpired = new Date(authToken?.expiresIn) < new Date()
			if (hasExpired) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
				return ctx.replyWithHTML(TelegramMessagess.invalidToken)
			}

			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			await this.connectTelegram(authToken.userId, chatId)

			await this.prismaService.token.delete({
				where: {
					id: authToken.id
				}
			})

			// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
			await ctx.replyWithHTML(
				TelegramMessagess.authSuccess,
				TelegramButtons.authSuccess
			)
		} else {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			const user = await this.findUserByChatId(chatId)
			if (user) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				return await this.onMe(ctx)
			} else {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
				await ctx.replyWithHTML(
					TelegramMessagess.welcome,
					TelegramButtons.profile
				)
			}
		}
	}

	@Command('me')
	@Action('me')
	public async onMe(@Ctx() ctx: Context) {
		const chatId = ctx.chat?.id.toString()

		if (!chatId) return

		const user = await this.findUserByChatId(chatId)

		if (!user) {
			return ctx.replyWithHTML(TelegramMessagess.userNotFound)
		}
		await ctx.replyWithHTML(
			TelegramMessagess.profile(
				user,

				user._count.followers,

				user._count.followings
			),
			TelegramButtons.profile
		)
	}

	@Command('follows')
	@Action('follows')
	public async onFollows(@Ctx() ctx: Context) {
		const chatId = ctx.chat?.id.toString()

		if (!chatId) return

		const user = await this.findUserByChatId(chatId)

		if (!user) {
			return ctx.replyWithHTML(TelegramMessagess.userNotFound)
		}

		const follows = await this.prismaService.follow.findMany({
			where: {
				followerId: user.id
			},
			include: {
				following: true
			}
		})

		if (follows.length) {
			const followList = follows
				.map(follow => TelegramMessagess.follows(follow.following))
				.join('\n')

			const message = `<b>🌟 Your Followings:</b>\n\n${followList}`

			await ctx.replyWithHTML(message, TelegramButtons.profile)
		} else {
			await ctx.replyWithHTML(
				'<b>🚫 You have no followings</b>\n\nPlease follow some channels to receive notifications',
				TelegramButtons.profile
			)
		}
	}

	public async sendPasswordResetToken(
		chatId: string,
		token: string,
		metadata: SessionMetadata
	) {
		await this.telegram.sendMessage(
			chatId,
			TelegramMessagess.resetPassword(token, metadata),
			{ parse_mode: 'HTML' }
		)
	}

	public async sendDeactivateToken(
		chatId: string,
		token: string,
		metadata: SessionMetadata
	) {
		await this.telegram.sendMessage(
			chatId,
			TelegramMessagess.deactive(token, metadata),
			{ parse_mode: 'HTML' }
		)
	}

	public async sendAccountDeletedNotification(
		chatId: string,
		username: string
	) {
		await this.telegram.sendMessage(
			chatId,
			TelegramMessagess.accountDeleted(username),
			{ parse_mode: 'HTML' }
		)
	}

	public async sendStreamStart(chatId: string, channel: User) {
		await this.telegram.sendMessage(
			chatId,
			TelegramMessagess.streamStart(channel),
			{ parse_mode: 'HTML' }
		)
	}

	public async sendNewFollowing(chatId: string, follower: User) {
		const user = await this.findUserByChatId(chatId)
		if (!user) {
			return
		}
		await this.telegram.sendMessage(
			chatId,

			TelegramMessagess.newFollowing(follower, user._count.followers),
			{ parse_mode: 'HTML' }
		)
	}

	public async sendNewSponsorship(
		chatId: string,
		plan: SponsorshipPlan,
		sponsor: User
	) {
		const user = await this.findUserByChatId(chatId)
		if (!user) return

		await this.telegram.sendMessage(
			chatId,
			TelegramMessagess.newSponsorship(plan, sponsor),
			{ parse_mode: 'HTML' }
		)
	}

	public async sendEnableTwoFactor(chatId: string) {
		await this.telegram.sendMessage(
			chatId,
			TelegramMessagess.enableTwoFactor,
			{ parse_mode: 'HTML' }
		)
	}

	public async sendVerifyChannel(chatId: string) {
		await this.telegram.sendMessage(
			chatId,
			TelegramMessagess.verifyChannel,
			{ parse_mode: 'HTML' }
		)
	}

	private async connectTelegram(userId: string, chatId: string) {
		await this.prismaService.user.update({
			where: {
				id: userId
			},
			data: {
				telegramId: chatId
			}
		})
	}

	private async findUserByChatId(chatId: string) {
		const user = await this.prismaService.user.findUnique({
			where: {
				telegramId: chatId
			},
			include: {
				followers: true,
				followings: true,
				_count: {
					select: {
						followers: true,
						followings: true
					}
				}
			}
		})

		return user
	}
}
