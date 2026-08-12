import { ConfigService } from '@nestjs/config'
import { PrismaService } from 'src/core/prisma/prisma.service'
import { StorageService } from 'src/modules/libs/storage/storage.service'

import { StreamService } from './stream.service'

describe('StreamService', () => {
	it('returns only active live streams with stable pagination ordering', async () => {
		const findMany = jest.fn().mockResolvedValue([])
		const prisma = { stream: { findMany } } as unknown as PrismaService
		const service = new StreamService(
			prisma,
			{} as ConfigService,
			{} as StorageService
		)

		await service.findAll({ take: 20, skip: 20 })

		expect(findMany).toHaveBeenCalledWith({
			take: 20,
			skip: 20,
			where: {
				user: { isDeactivated: false },
				isLive: true
			},
			include: { user: true, category: true },
			orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
		})
	})

	it('searches title, channel and category independently', async () => {
		const findMany = jest.fn().mockResolvedValue([])
		const prisma = { stream: { findMany } } as unknown as PrismaService
		const service = new StreamService(
			prisma,
			{} as ConfigService,
			{} as StorageService
		)

		await service.findAll({ searchTerm: ' counter strike ' })

		expect(findMany).toHaveBeenCalledWith({
			take: 12,
			skip: 0,
			where: {
				user: { isDeactivated: false },
				isLive: true,
				OR: [
					{
						title: {
							contains: 'counter strike',
							mode: 'insensitive'
						}
					},
					{
						user: {
							username: {
								contains: 'counter strike',
								mode: 'insensitive'
							}
						}
					},
					{
						user: {
							displayName: {
								contains: 'counter strike',
								mode: 'insensitive'
							}
						}
					},
					{
						category: {
							title: {
								contains: 'counter strike',
								mode: 'insensitive'
							}
						}
					}
				]
			},
			include: { user: true, category: true },
			orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
		})
	})
})
