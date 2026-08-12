import { UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { Request } from 'express'
import { PrismaService } from 'src/core/prisma/prisma.service'
import { RedisService } from 'src/core/redis/redis.service'

import { SessionService } from './session.service'

describe('SessionService authorization', () => {
	it("does not delete another user's session", async () => {
		const deleteSession = jest.fn()
		const redis = {
			get: jest
				.fn()
				.mockResolvedValue(JSON.stringify({ userId: 'other' })),
			del: deleteSession
		} as unknown as RedisService
		const config = {
			getOrThrow: jest.fn().mockReturnValue('session:')
		} as unknown as ConfigService
		const service = new SessionService({} as PrismaService, redis, config)
		const req = {
			session: { id: 'current', userId: 'owner' }
		} as unknown as Request

		await expect(service.remove(req, 'foreign')).rejects.toBeInstanceOf(
			UnauthorizedException
		)
		expect(deleteSession).not.toHaveBeenCalled()
	})
})
