import {
	BadRequestException,
	Injectable,
	NotAcceptableException,
	NotFoundException
} from '@nestjs/common'
import { TokenType } from '@prisma/client'
import { hash } from 'argon2'
import type { Request } from 'express'
import { PrismaService } from 'src/core/prisma/prisma.service'
import { MailService } from 'src/modules/libs/mail/mail.service'
import { genereateToken } from 'src/shared/utils/generate-token.util'
import { getSessionMetadata } from 'src/shared/utils/session-metadata.util'

import { NewPasswordInput } from './inputs/new-password.input'
import { ResetPasswordInput } from './inputs/reset-password.input'

@Injectable()
export class PasswordRecoveryService {
	public constructor(
		private readonly prismaService: PrismaService,
		private readonly mailService: MailService
	) {}

	public async resetPassword(
		req: Request,
		input: ResetPasswordInput,
		userAgent: string
	) {
		const { email } = input

		const user = await this.prismaService.user.findUnique({
			where: {
				email
			}
		})

		if (!user) {
			throw new NotAcceptableException('User with this email not found')
		}

		if (!user.isEmailVerified) {
			throw new NotAcceptableException(
				'User with this email not verified'
			)
		}

		const resetToken = await genereateToken(
			this.prismaService,
			user,
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			TokenType.PASSWORD_RESET,
			true
		)

		const metadata = getSessionMetadata(req, userAgent)
		await this.mailService.sendPasswordResetToken(
			user.email,
			resetToken.token,
			metadata
		)

		return true
	}

	public async newPassword(input: NewPasswordInput) {
		const { token, password } = input

		const existingToken = await this.prismaService.token.findFirst({
			where: {
				token,
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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

		await this.prismaService.token.delete({
			where: {
				id: existingToken.id
			}
		})

		return true
	}
}
