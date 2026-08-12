import { PrismaService } from 'src/core/prisma/prisma.service'

import { ChannelService } from './channel.service'

describe('ChannelService', () => {
	describe('findRecommended', () => {
		it('returns at most seven active channels with a live stream', async () => {
			const findMany = jest.fn().mockResolvedValue([])
			const prismaService = {
				user: { findMany }
			} as unknown as PrismaService
			const service = new ChannelService(prismaService)

			await service.findRecommended()

			expect(findMany).toHaveBeenCalledWith({
				where: {
					isDeactivated: false,
					stream: {
						is: {
							isLive: true
						}
					}
				},
				orderBy: {
					followings: {
						_count: 'desc'
					}
				},
				include: {
					stream: {
						include: {
							category: true
						}
					}
				},
				take: 7
			})
		})
	})
})
