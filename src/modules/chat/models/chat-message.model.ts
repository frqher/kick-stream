import { Field, ID, ObjectType } from '@nestjs/graphql'
import type { ChatMessage } from '@prisma/client'
import { PublicUserModel } from 'src/modules/auth/account/models/public-user.model'
import { StreamModel } from 'src/modules/stream/models/stream.model'

@ObjectType()
export class ChatMessageModel implements ChatMessage {
	@Field(() => ID)
	public id: string

	@Field(() => String)
	public text: string

	@Field(() => PublicUserModel)
	public user: PublicUserModel

	@Field(() => String)
	public userId: string

	public stream: StreamModel

	@Field(() => String)
	public streamId: string

	@Field(() => Date)
	public createdAt: Date

	@Field(() => Date)
	public updatedAt: Date
}
