import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from 'src/core/prisma/prisma.service'

@Injectable()
export class ChannelService {
	public constructor(private readonly prismaService: PrismaService) {}

	public async findRecommended() {
		const channels = await this.prismaService.user.findMany({
			where: {
				isDeactivated: false
			},
			orderBy: {
				followings: {
					_count: 'desc'
				}
			},
			include: {
				stream: true
			},
			take: 7
		})

		return channels
	}

	public async findByUsername(username: string) {
		const channel = await this.prismaService.user.findUnique({
			where: {
				username,
				isDeactivated: false
			},
			include: {
				socialLinks: {
					orderBy: {
						position: 'desc'
					}
				},
				stream: {
					include: {
						category: true
					}
				},
				followings: true,
				followers: true
			}
		})
		if (!channel) {
			throw new NotFoundException('Channel not found')
		}
		return channel
	}

	public async findFollowersCountByChannel(channelId: string) {
		const followersCount = await this.prismaService.user.count({
			where: {
				followings: {
					some: {
						id: channelId
					}
				}
			}
		})

		return followersCount
	}

	public async findSponsorsByChannel(channelId: string) {
		const channel = await this.prismaService.user.findUnique({
			where: {
				id: channelId
			}
		})

		if (!channel || channel.isDeactivated) {
			throw new NotFoundException('Channel not found')
		}

		const sponsors =
			await this.prismaService.sponsorshipSubscription.findMany({
				where: {
					channelId
				},
				orderBy: {
					createdAt: 'desc'
				},
				include: {
					plan: true,
					user: true,
					channel: true
				}
			})

		return sponsors
	}
}
