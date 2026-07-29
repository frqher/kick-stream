import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService } from 'src/core/prisma/prisma.service'

import { MailService } from '../libs/mail/mail.service'
import { StorageService } from '../libs/storage/storage.service'
import { TelegramService } from '../libs/telegram/telegram.service'
import { NotificationService } from '../notification/notification.service'

@Injectable()
export class CronService {
	public constructor(
		private readonly prismaService: PrismaService,
		private readonly mailService: MailService,
		private readonly storageService: StorageService,
		private readonly telegramService: TelegramService,
		private readonly notificationService: NotificationService
	) {}

	@Cron(CronExpression.EVERY_DAY_AT_1AM)
	public async deleteDeactivedAccounts() {
		const sevenDaysAgo = new Date()
		sevenDaysAgo.setDate(sevenDaysAgo.getDay() - 7)

		const deactivatedAccounts = await this.prismaService.user.findMany({
			where: {
				isDeactivated: true,
				deactivateAt: {
					lte: sevenDaysAgo
				}
			},
			include: {
				notificationSettings: true,
				stream: true
			}
		})

		if (deactivatedAccounts.length === 0) return

		for (const user of deactivatedAccounts) {
			await this.mailService.sendAccountDeletion(
				user.email,
				user.username
			)

			if (user.avatar) {
				void this.storageService.remove(user.avatar)
			}
			if (user.stream?.thumbnailUrl) {
				void this.storageService.remove(user.stream.thumbnailUrl)
			}

			if (
				user.notificationSettings?.telegramNotifications &&
				user.telegramId
			) {
				await this.telegramService.sendAccountDeletedNotification(
					user.telegramId,
					user.username
				)
			}
		}

		await this.prismaService.user.deleteMany({
			where: {
				isDeactivated: true,
				deactivateAt: {
					lte: sevenDaysAgo
				}
			}
		})
	}

	@Cron(CronExpression.EVERY_WEEK)
	public async notifyUsersEnableTworFactor() {
		const users = await this.prismaService.user.findMany({
			where: {
				isDeactivated: false,
				isTotpEnabled: false
			},
			include: {
				notificationSettings: true
			}
		})

		for (const user of users) {
			await this.mailService.sendEnableTwoFactor(user.email)

			if (user.notificationSettings?.siteNotifications) {
				await this.notificationService.createEnableTwoFactor(user.id)
			}

			if (
				user.notificationSettings?.telegramNotifications &&
				user.telegramId
			) {
				await this.telegramService.sendEnableTwoFactor(user.telegramId)
			}
		}
	}
}
