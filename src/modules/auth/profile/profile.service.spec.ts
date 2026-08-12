import { NotFoundException } from '@nestjs/common'
import type { User } from '@prisma/client'
import { PrismaService } from 'src/core/prisma/prisma.service'
import { StorageService } from 'src/modules/libs/storage/storage.service'

import { ProfileService } from './profile.service'

describe('ProfileService authorization', () => {
	const user = { id: 'owner-id' } as User

	it('does not update a social link owned by another user', async () => {
		const updateMany = jest.fn().mockResolvedValue({ count: 0 })
		const prisma = {
			socialLink: { updateMany }
		} as unknown as PrismaService
		const service = new ProfileService(prisma, {} as StorageService)

		await expect(
			service.updateSocialLink(user, 'foreign-link', {
				title: 'Website',
				url: 'https://example.com'
			})
		).rejects.toBeInstanceOf(NotFoundException)

		expect(updateMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: 'foreign-link', userId: 'owner-id' }
			})
		)
	})

	it("rejects a reorder list containing another user's link", async () => {
		const count = jest.fn().mockResolvedValue(1)
		const transaction = jest.fn()
		const prisma = {
			socialLink: { count },
			$transaction: transaction
		} as unknown as PrismaService
		const service = new ProfileService(prisma, {} as StorageService)

		await expect(
			service.reorderSocialLinks(user, [
				{ id: 'owned', position: 1 },
				{ id: 'foreign', position: 2 }
			])
		).rejects.toBeInstanceOf(NotFoundException)

		expect(transaction).not.toHaveBeenCalled()
	})
})
