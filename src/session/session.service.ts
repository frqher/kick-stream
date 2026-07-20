import {
	BadRequestException,
	ConflictException,
	Injectable,
	NotFoundException,
	UnauthorizedException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { verify } from 'argon2'
import type { Request } from 'express'
import { PrismaService } from 'src/core/prisma/prisma.service'
import { RedisService } from 'src/core/redis/redis.service'
import { VerificationService } from 'src/modules/auth/verification/verification.service'
import { getSessionMetadata } from 'src/shared/utils/session-metadata.util'
import { destroySession, saveSession } from 'src/shared/utils/session.util'

import { LoginInput } from './inputs/login.input'

@Injectable()
export class SessionService {
	public constructor(
		private readonly prismaService: PrismaService,
		private readonly redisService: RedisService,
		private readonly configService: ConfigService,
		private readonly verificationService: VerificationService
	) {}

	public async findByUser(req: Request) {
		const userId = req.session.userId

		if (!userId) {
			throw new NotFoundException('No active session found')
		}

		const keys = await this.redisService.keys('*')

		const userSessions: Record<string, any>[] = []

		if (!keys) {
			return userSessions
		}

		for (const key of keys) {
			const sessionData = await this.redisService.get(key)
			if (sessionData) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const session = JSON.parse(sessionData)

				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				if (session && session.userId === userId) {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
					userSessions.push({
						...session,
						id: key.split(':')[1]
					})
				}
			}
		}

		userSessions.sort((a, b) => b.createdAt - a.createdAt)

		return userSessions.filter(session => session.id !== req.session.id)
	}

	public async findCurrent(req: Request) {
		const sessionId = req.session.id

		const sessionData = await this.redisService.get(
			`${this.configService.getOrThrow<string>('SESSION_FOLDER')}${sessionId}`
		)

		if (!sessionData) {
			throw new NotFoundException('No active session found')
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const session = JSON.parse(sessionData)

		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return {
			...session,
			id: sessionId
		}
	}

	public async login(req: Request, input: LoginInput, userAgent: string) {
		const { login, password } = input

		const user = await this.prismaService.user.findFirst({
			where: {
				OR: [
					{ username: { equals: login } },
					{ email: { equals: login } }
				]
			}
		})

		if (!user) throw new NotFoundException('User not found')

		const isValidPassword = await verify(user.password, password)

		if (!isValidPassword)
			throw new UnauthorizedException('Incorrect password')

		if (!user.isEmailVerified) {
			await this.verificationService.sendVerificationToken(user)
			throw new BadRequestException(
				'Your email is not verified. Please verify your email'
			)
		}

		const metadata = getSessionMetadata(req, userAgent)

		return saveSession(req, user, metadata)
	}

	public async logout(req: Request) {
		return destroySession(req, this.configService)
	}

	public clearSession(req: Request) {
		req.res?.clearCookie(
			this.configService.getOrThrow<string>('SESSION_NAME')
		)

		return true
	}

	public async remove(req: Request, id: string) {
		if (req.session.id == id) {
			throw new ConflictException(
				'This is an active session. Log out instead'
			)
		}

		await this.redisService.del(
			`${this.configService.getOrThrow<string>('SESSION_FOLDER')}:${id}`
		)

		return true
	}
}
