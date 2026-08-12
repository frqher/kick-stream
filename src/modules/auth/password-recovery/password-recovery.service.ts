import {
	BadRequestException,
	HttpException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TokenType } from '@prisma/client'
import { hash } from 'argon2'
import { createHash } from 'crypto'
import type { Request } from 'express'
import { PrismaService } from 'src/core/prisma/prisma.service'
import { RedisService } from 'src/core/redis/redis.service'
import { MailService } from 'src/modules/libs/mail/mail.service'
import { TelegramService } from 'src/modules/libs/telegram/telegram.service'
import { generateToken } from 'src/shared/utils/generate-token.util'
import { invalidateUserSessions } from 'src/shared/utils/invalidate-user-sessions.util'
import { getSessionMetadata } from 'src/shared/utils/session-metadata.util'

import { NewPasswordInput } from './inputs/new-password.input'
import { ResetPasswordInput } from './inputs/reset-password.input'

@Injectable()
export class PasswordRecoveryService {
	public constructor(
		private readonly prismaService: PrismaService,
		private readonly mailService: MailService,
		private readonly telegramService: TelegramService,
		private readonly redisService: RedisService,
		private readonly configService: ConfigService
	) {}

	public async resetPassword(
		req: Request,
		input: ResetPasswordInput,
		userAgent: string
	) {
		const { email } = input
		const fingerprint = createHash('sha256')
			.update(`${req.ip ?? 'unknown'}:${email.trim().toLowerCase()}`)
			.digest('hex')
		const rateLimitKey = `rate-limit:password-reset:${fingerprint}`
		const attempts = await this.redisService.incr(rateLimitKey)

		if (attempts === 1) {
			await this.redisService.expire(rateLimitKey, 60 * 60)
		}

		if (attempts > 5) {
			throw new HttpException(
				'Too many password reset attempts. Try again later',
				429
			)
		}

		const user = await this.prismaService.user.findUnique({
			where: {
				email
			}
		})

		// Always return the same response to prevent email enumeration.
		if (!user || !user.isEmailVerified || user.isDeactivated) {
			return true
		}

		const resetToken = await generateToken(
			this.prismaService,
			user,

			TokenType.PASSWORD_RESET,
			true
		)

		const metadata = getSessionMetadata(req, userAgent)
		await this.mailService.sendPasswordResetToken(
			user.email,
			resetToken.token,
			metadata
		)

		if (
			resetToken &&
			resetToken.user &&
			resetToken.user.notificationSettings?.telegramNotifications &&
			resetToken.user.telegramId
		) {
			await this.telegramService.sendPasswordResetToken(
				resetToken.user.telegramId,
				resetToken.token,
				metadata
			)
		}

		return true
	}

	public async newPassword(input: NewPasswordInput) {
		const { token, password } = input

		const existingToken = await this.prismaService.token.findFirst({
			where: {
				token,

				type: TokenType.PASSWORD_RESET
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
				password: await hash(password)
			}
		})

		await invalidateUserSessions(
			this.redisService,
			this.configService,
			existingToken.userId
		)

		await this.prismaService.token.delete({
			where: {
				id: existingToken.id
			}
		})

		return true
	}
}
