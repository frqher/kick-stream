import {
	BadRequestException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { TokenType, User } from '@prisma/client'
import { Request } from 'express'
import { PrismaService } from 'src/core/prisma/prisma.service'
import { MailService } from 'src/modules/libs/mail/mail.service'
import { genereateToken } from 'src/shared/utils/generate-token.util'
import { getSessionMetadata } from 'src/shared/utils/session-metadata.util'
import { saveSession } from 'src/shared/utils/session.util'

import { VerificationInput } from './inputs/verification.input'

@Injectable()
export class VerificationService {
	public constructor(
		private readonly prismaService: PrismaService,
		private readonly mailService: MailService
	) {}

	public async verify(
		req: Request,
		input: VerificationInput,
		userAgent: string
	) {
		const { token } = input

		const existingToken = await this.prismaService.token.findFirst({
			where: {
				token,
				type: TokenType.EMAIL_VERIFY
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

		const user = await this.prismaService.user.update({
			where: {
				id: existingToken.userId
			},
			data: {
				isEmailVerified: true
			}
		})

		await this.prismaService.token.delete({
			where: {
				id: existingToken.id
			}
		})

		const metadata = getSessionMetadata(req, userAgent)

		return saveSession(req, user, metadata)
	}

	public async sendVerificationToken(user: User) {
		const verificationToken = await genereateToken(
			this.prismaService,
			user,
			TokenType.EMAIL_VERIFY,
			true
		)

		await this.mailService.sendVerificationToken(
			user.email,
			verificationToken.token
		)

		return true
	}
}
