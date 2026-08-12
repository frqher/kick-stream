import { PrismaService } from 'src/core/prisma/prisma.service'

import { CategoryService } from './category.service'

describe('CategoryService', () => {
	it('returns all categories with deterministic ordering and no relations', async () => {
		const findMany = jest.fn().mockResolvedValue([])
		const prisma = { category: { findMany } } as unknown as PrismaService
		const service = new CategoryService(prisma)

		await service.findAll()

		expect(findMany).toHaveBeenCalledWith({
			orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
		})
	})

	it('returns at most ten unique random categories using one query', async () => {
		const categories = Array.from({ length: 12 }, (_, index) => ({
			id: `category-${index}`
		}))
		const findMany = jest.fn().mockResolvedValue(categories)
		const prisma = { category: { findMany } } as unknown as PrismaService
		const service = new CategoryService(prisma)
		const random = jest.spyOn(Math, 'random').mockReturnValue(0.5)

		const result = await service.findRandom()

		expect(findMany).toHaveBeenCalledTimes(1)
		expect(result).toHaveLength(10)
		expect(new Set(result.map(category => category.id)).size).toBe(10)

		random.mockRestore()
	})
})
