import { Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { PrismaService } from 'src/core/prisma/prisma.service'

import { MailService } from '../libs/mail/mail.service'

@Injectable()
export class CronService {
	public constructor(
		private readonly prismaService: PrismaService,
		private readonly mailService: MailService
	) {}

	@Cron('0 0 * * *')
	public async deleteDeactivedAccounts() {
		const sevenDaysAgo = new Date()
		sevenDaysAgo.setDate(sevenDaysAgo.getDay() - 7)

		const deactivatedAccounts = await this.prismaService.user.findMany({
			where: {
				isDeactivated: true,
				deactivateAt: {
					lte: sevenDaysAgo
				}
			}
		})

		if (deactivatedAccounts.length === 0) return

		for (const user of deactivatedAccounts) {
			await this.mailService.sendAccountDeletion(
				user.email,
				user.username
			)
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
}
