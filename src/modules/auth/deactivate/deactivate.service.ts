import {
	BadRequestException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TokenType, type User } from '@prisma/client'
import { verify } from 'argon2'
import type { Request } from 'express'
import { PrismaService } from 'src/core/prisma/prisma.service'
import { MailService } from 'src/modules/libs/mail/mail.service'
import { TelegramService } from 'src/modules/libs/telegram/telegram.service'
import { generateToken } from 'src/shared/utils/generate-token.util'
import { getSessionMetadata } from 'src/shared/utils/session-metadata.util'
import { destroySession } from 'src/shared/utils/session.util'

import { DeactiveAccountInput } from './inputs/deactivate-account.input'

@Injectable()
export class DeactivateService {
	public constructor(
		private readonly prismaService: PrismaService,
		private readonly mailService: MailService,
		private readonly configService: ConfigService,
		private readonly telegramService: TelegramService
	) {}

	public async deactive(
		req: Request,
		input: DeactiveAccountInput,
		user: User,
		userAgent: string
	) {
		const { email, password, pin } = input

		if (user.email !== email) {
			throw new BadRequestException('Email do not match')
		}

		const isPasswordValid = await verify(user.password, password)
		if (!isPasswordValid) {
			throw new BadRequestException('Invalid Credentials')
		}

		if (!pin) {
			await this.sendDeactivateToken(req, user, userAgent)
			return { message: 'Deactive token has been sent to your email' }
		}

		await this.validateDeactivateToken(req, pin)

		return { user }
	}

	private async validateDeactivateToken(req: Request, token: string) {
		const existingToken = await this.prismaService.token.findFirst({
			where: {
				token,

				type: TokenType.DEACTIVE_ACCOUNT
			}
		})

		if (!existingToken) {
			throw new NotFoundException('Invalid verification token')
		}

		const hasExpired = new Date(existingToken.expiresIn) < new Date()

		if (hasExpired) {
			await this.prismaService.token.delete({
				where: {
					id: existingToken.id
				}
			})

			throw new BadRequestException('Token has expired')
		}

		if (!existingToken.userId) {
			throw new BadRequestException('Token is not associated with a user')
		}

		await this.prismaService.user.update({
			where: {
				id: existingToken.userId
			},
			data: {
				isDeactivated: true,
				deactivateAt: new Date()
			}
		})

		await this.prismaService.token.delete({
			where: {
				id: existingToken.id
			}
		})

		return destroySession(req, this.configService)
	}

	public async sendDeactivateToken(
		req: Request,
		user: User,
		userAgent: string
	) {
		const deactivationToken = await generateToken(
			this.prismaService,
			user,
			TokenType.DEACTIVE_ACCOUNT
		)

		const metadata = getSessionMetadata(req, userAgent)

		await this.mailService.sendDeactivationToken(
			user.email,
			deactivationToken.token,
			metadata
		)

		if (
			deactivationToken &&
			deactivationToken.user &&
			deactivationToken.user.notificationSettings
				?.telegramNotifications &&
			deactivationToken.user.telegramId
		) {
			await this.telegramService.sendDeactivateToken(
				deactivationToken.user.telegramId,
				deactivationToken.token,
				metadata
			)
		}

		return true
	}
}
