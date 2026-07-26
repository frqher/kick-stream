import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql'
import type { User } from '@prisma/client'
import { PubSub } from 'graphql-subscriptions'
import { Authorization } from 'src/shared/decorators/auth.decorator'
import { Authorized } from 'src/shared/decorators/authorized.decorator'

import { ChatService } from './chat.service'
import { ChangeChatSettingsInput } from './input/change-chat-settings.input'
import { SendMessageInput } from './input/send-message.input'
import { ChatMessageModel } from './models/chat-message.model'

@Resolver('Chat')
export class ChatResolver {
	private readonly pubsub: PubSub
	constructor(private readonly chatService: ChatService) {
		this.pubsub = new PubSub()
	}

	@Query(() => [ChatMessageModel], { name: 'findChatMessagesByStream' })
	public async findByStream(@Args('streamId') streamId: string) {
		return await this.chatService.findByStream(streamId)
	}

	@Authorization()
	@Mutation(() => ChatMessageModel, { name: 'sendChatMessage' })
	public async sendMessage(
		@Authorized('id') userId: string,
		@Args('data') input: SendMessageInput
	) {
		const message = await this.chatService.sendMessage(userId, input)

		await this.pubsub.publish(`CHAT_MESSAGE_ADDED_${input.streamId}`, {
			chatMessageAdded: message
		})

		return message
	}

	@Subscription(() => ChatMessageModel, {
		name: 'chatMessageAdded',
		filter: (payload, variables) =>
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			payload.chatMessageAdded.streamId == variables.streamId
	})
	public chatMessageAdded(@Args('streamId') streamId: string) {
		return this.pubsub.asyncIterableIterator(
			`CHAT_MESSAGE_ADDED_${streamId}`
		)
	}

	@Authorization()
	@Mutation(() => Boolean, { name: 'changeChatSettings' })
	public async changeSettings(
		@Authorized() user: User,
		@Args('data') input: ChangeChatSettingsInput
	) {
		return await this.chatService.changeSettings(user, input)
	}
}
