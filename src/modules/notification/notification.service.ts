import { Injectable } from '@nestjs/common'
import {
	NotificationType,
	type SponsorshipPlan,
	TokenType,
	type User
} from '@prisma/client'
import { PrismaService } from 'src/core/prisma/prisma.service'
import { generateToken } from 'src/shared/utils/generate-token.util'

import { ChangeNotificationSettingsInput } from './input/change-notifitaction-settings.input'

@Injectable()
export class NotificationService {
	public constructor(private readonly prismaService: PrismaService) {}

	public async findUnreadCount(user: User) {
		const count = await this.prismaService.notification.count({
			where: {
				isRead: false,
				userId: user.id
			}
		})

		return count
	}

	public async findByUser(user: User) {
		await this.prismaService.notification.updateMany({
			where: {
				isRead: false,
				userId: user.id
			},
			data: {
				isRead: true
			}
		})

		const notifications = await this.prismaService.notification.findMany({
			where: {
				userId: user.id
			},
			orderBy: {
				createdAt: 'desc'
			}
		})

		return notifications
	}

	public async createStreamStart(userId: string, channel: User) {
		const notification = await this.prismaService.notification.create({
			data: {
				message: `
					<b className='font-medium'>${channel.displayName}</b> started streaming
					<a className='inline-block px-2 py-1 rounded' href="/${channel.username}">Watch now</a>
				`,
				type: NotificationType.STREAM_START,
				user: {
					connect: {
						id: userId
					}
				}
			}
		})

		return notification
	}

	public async createNewFollowing(userId: string, channel: User) {
		const notification = await this.prismaService.notification.create({
			data: {
				message: `
					<b className='font-medium'>${channel.displayName}</b> started following you
					<a className='inline-block px-2 py-1 rounded' href="/${channel.username}">Follow</a>
				`,
				type: NotificationType.NEW_FOLLOWER,
				user: {
					connect: {
						id: userId
					}
				}
			}
		})

		return notification
	}

	public async createNewSponsorship(
		userId: string,
		plan: SponsorshipPlan,
		sponsor: User
	) {
		const notification = await this.prismaService.notification.create({
			data: {
				message: `
					<b className='font-medium'>${sponsor.displayName}</b> started sponsoring you
					<a className='inline-block px-2 py-1 rounded' href="/${sponsor.username}">View subscription</a>
				`,
				type: NotificationType.NEW_SPONSORSHIP,
				user: {
					connect: {
						id: userId
					}
				}
			}
		})

		return notification
	}

	public async changeSettings(
		user: User,
		input: ChangeNotificationSettingsInput
	) {
		const { siteNotifications, telegramNotifications } = input

		const notificationSettings =
			await this.prismaService.notificationSettings.upsert({
				where: {
					userId: user.id
				},
				update: {
					siteNotifications,
					telegramNotifications
				},
				create: {
					siteNotifications,
					telegramNotifications,
					user: {
						connect: {
							id: user.id
						}
					}
				},
				include: {
					user: true
				}
			})
		if (
			notificationSettings.telegramNotifications &&
			!notificationSettings.user?.telegramId
		) {
			const telegramAuthToken = await generateToken(
				this.prismaService,
				user,

				TokenType.TELEGRAM_AUTH,
				true
			)
			return {
				notificationSettings,
				telegramAuthToken: telegramAuthToken.token
			}
		}

		if (
			!notificationSettings.telegramNotifications &&
			notificationSettings.user?.telegramId
		) {
			await this.prismaService.user.update({
				where: {
					id: user.id
				},
				data: {
					telegramId: null
				}
			})
		}

		return { notificationSettings }
	}
}
