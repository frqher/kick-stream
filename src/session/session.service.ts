import {
	BadRequestException,
	ConflictException,
	HttpException,
	Injectable,
	NotFoundException,
	UnauthorizedException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { verify } from 'argon2'
import { createHash } from 'crypto'
import type { Request } from 'express'
import { TOTP } from 'otpauth'
import { PrismaService } from 'src/core/prisma/prisma.service'
import { RedisService } from 'src/core/redis/redis.service'
import { parseBoolean } from 'src/shared/utils/parse-boolean'
import { getSessionMetadata } from 'src/shared/utils/session-metadata.util'
import { destroySession, saveSession } from 'src/shared/utils/session.util'

import { LoginInput } from './inputs/login.input'

@Injectable()
export class SessionService {
	public constructor(
		private readonly prismaService: PrismaService,
		private readonly redisService: RedisService,
		private readonly configService: ConfigService
	) {}

	public async findByUser(req: Request) {
		const userId = req.session.userId

		if (!userId) {
			throw new NotFoundException('No active session found')
		}

		const userSessions: Record<string, any>[] = []
		const folder = this.configService.getOrThrow<string>('SESSION_FOLDER')
		const stream = this.redisService.scanStream({
			match: `${folder}*`,
			count: 100
		})

		for await (const batch of stream) {
			const keys = batch as string[]
			if (keys.length === 0) continue

			const values = await this.redisService.mget(keys)
			for (const [index, sessionData] of values.entries()) {
				if (!sessionData) continue

				try {
					const session = JSON.parse(sessionData) as {
						userId?: string
						createdAt?: number
					}

					if (session.userId === userId) {
						userSessions.push({
							...session,
							id: keys[index].slice(folder.length)
						})
					}
				} catch {
					continue
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
		const { login, password, pin } = input
		const rateLimitKey = this.getLoginRateLimitKey(req, login)
		const attempts = await this.redisService.incr(rateLimitKey)

		if (attempts === 1) {
			await this.redisService.expire(rateLimitKey, 15 * 60)
		}

		if (attempts > 10) {
			throw new HttpException(
				'Too many login attempts. Try again later',
				429
			)
		}

		const user = await this.prismaService.user.findFirst({
			where: {
				OR: [
					{ username: { equals: login } },
					{ email: { equals: login } }
				]
			}
		})

		if (!user) {
			throw new UnauthorizedException('Invalid credentials')
		}

		const isValidPassword = await verify(user.password, password)

		if (!isValidPassword) {
			throw new UnauthorizedException('Invalid credentials')
		}

		if (user.isDeactivated) {
			throw new UnauthorizedException('Invalid credentials')
		}

		if (!user.isEmailVerified) {
			throw new BadRequestException(
				'Your email is not verified. Please verify your email'
			)
		}

		if (user.isTotpEnabled) {
			if (!pin || !user.totpSecret) {
				return {
					message: 'PIN is required for 2FA'
				}
			}

			const totp = new TOTP({
				issuer: 'KickStream',
				label: `${user.email}`,
				algorithm: 'SHA1',
				digits: 6,

				secret: user.totpSecret
			})

			const delta = totp.validate({ token: pin })
			if (delta === null) {
				return {
					message: 'Invalid 6-digit code'
				}
			}
		}

		const metadata = getSessionMetadata(req, userAgent)
		await this.redisService.del(rateLimitKey)

		return {
			user: await saveSession(req, user, metadata)
		}
	}

	private getLoginRateLimitKey(req: Request, login: string) {
		const fingerprint = createHash('sha256')
			.update(`${req.ip ?? 'unknown'}:${login.trim().toLowerCase()}`)
			.digest('hex')

		return `rate-limit:login:${fingerprint}`
	}

	public async logout(req: Request) {
		return destroySession(req, this.configService)
	}

	public clearSession(req: Request) {
		req.res?.clearCookie(
			this.configService.getOrThrow<string>('SESSION_NAME'),
			{
				domain: this.configService.getOrThrow<string>('SESSION_DOMAIN'),
				httpOnly: parseBoolean(
					this.configService.getOrThrow<string>('SESSION_HTTP_ONLY')
				),
				sameSite: 'lax',
				secure: parseBoolean(
					this.configService.getOrThrow<string>('SESSION_SECURE')
				)
			}
		)

		return true
	}

	public async remove(req: Request, id: string) {
		if (req.session.id == id) {
			throw new ConflictException(
				'This is an active session. Log out instead'
			)
		}

		const key = `${this.configService.getOrThrow<string>('SESSION_FOLDER')}${id}`
		const sessionData = await this.redisService.get(key)

		if (!sessionData) {
			throw new NotFoundException('Session not found')
		}

		let session: { userId?: string }
		try {
			session = JSON.parse(sessionData) as { userId?: string }
		} catch {
			throw new NotFoundException('Session not found')
		}

		if (!req.session.userId || session.userId !== req.session.userId) {
			throw new UnauthorizedException('Session does not belong to user')
		}

		await this.redisService.del(key)

		return true
	}
}
