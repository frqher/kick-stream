import {
	BadRequestException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import type { User } from '@prisma/client'
import { PrismaService } from 'src/core/prisma/prisma.service'

import { ChangeChatSettingsInput } from './input/change-chat-settings.input'
import { SendMessageInput } from './input/send-message.input'

@Injectable()
export class ChatService {
	public constructor(private readonly prismaService: PrismaService) {}

	public async findByStream(streamId: string) {
		const messages = await this.prismaService.chatMessage.findMany({
			where: {
				streamId
			},
			orderBy: { createdAt: 'desc' },
			take: 100,
			include: {
				user: true
			}
		})
		return messages.reverse()
	}

	public async sendMessage(userId: string, input: SendMessageInput) {
		const { text, streamId } = input

		const stream = await this.prismaService.stream.findUnique({
			where: {
				id: streamId
			}
		})

		if (!stream) {
			throw new NotFoundException('Stream not found')
		}

		if (!stream.isLive) {
			throw new BadRequestException(
				'You can only send messages in a live stream'
			)
		}

		if (!stream.isChatEnabled) {
			throw new BadRequestException('Chat is disabled')
		}

		if (stream.isChatFollowersOnly) {
			const followsChannel = await this.prismaService.follow.findUnique({
				where: {
					followerId_followingId: {
						followerId: userId,
						followingId: stream.userId
					}
				}
			})

			if (!followsChannel && userId !== stream.userId) {
				throw new BadRequestException('Chat is for followers only')
			}
		}

		if (stream.isChatSubscribersOnly) {
			const subscription =
				await this.prismaService.sponsorshipSubscription.findFirst({
					where: {
						userId,
						channelId: stream.userId,
						expiresAt: { gt: new Date() }
					}
				})

			if (!subscription && userId !== stream.userId) {
				throw new BadRequestException('Chat is for subscribers only')
			}
		}

		const message = await this.prismaService.chatMessage.create({
			data: {
				text,
				user: {
					connect: {
						id: userId
					}
				},
				stream: {
					connect: {
						id: streamId
					}
				}
			},
			include: {
				stream: true
			}
		})

		return message
	}

	public async changeSettings(user: User, input: ChangeChatSettingsInput) {
		const { isChatEnabled, isChatFollowersOnly, isChatSubscribersOnly } =
			input

		await this.prismaService.stream.update({
			where: {
				userId: user.id
			},
			data: {
				isChatEnabled,
				isChatFollowersOnly,
				isChatSubscribersOnly
			}
		})

		return true
	}
}
