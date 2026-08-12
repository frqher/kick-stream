import { NotFoundException } from '@nestjs/common'
import type { User } from '@prisma/client'
import { PrismaService } from 'src/core/prisma/prisma.service'
import { StripeService } from 'src/modules/libs/stripe/stripe.service'

import { PlanService } from './plan.service'

describe('PlanService authorization', () => {
	it('only looks up plans owned by the authenticated channel', async () => {
		const findFirst = jest.fn().mockResolvedValue(null)
		const deleteStripePlan = jest.fn()
		const prisma = {
			sponsorshipPlan: { findFirst }
		} as unknown as PrismaService
		const stripe = {
			plans: { del: deleteStripePlan },
			products: { del: jest.fn() }
		} as unknown as StripeService
		const service = new PlanService(prisma, stripe)

		await expect(
			service.remove({ id: 'owner-id' } as User, 'foreign-plan')
		).rejects.toBeInstanceOf(NotFoundException)

		expect(findFirst).toHaveBeenCalledWith({
			where: { id: 'foreign-plan', channelId: 'owner-id' }
		})
		expect(deleteStripePlan).not.toHaveBeenCalled()
	})
})
