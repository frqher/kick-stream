import { Field, ID, ObjectType } from '@nestjs/graphql'
import type { Stream } from '@prisma/client'
import { PublicUserModel } from 'src/modules/auth/account/models/public-user.model'
import { CategoryModel } from 'src/modules/category/models/category.model'
import { ChatMessageModel } from 'src/modules/chat/models/chat-message.model'

@ObjectType()
export class StreamModel implements Stream {
	@Field(() => ID)
	public id: string

	@Field(() => String)
	public title: string

	@Field(() => String, { nullable: true })
	public thumbnailUrl: string

	public ingressId: string

	public serverUrl: string

	public streamKey: string

	@Field(() => Boolean)
	public isLive: boolean

	@Field(() => Boolean)
	public isChatEnabled: boolean

	@Field(() => Boolean)
	public isChatFollowersOnly: boolean

	@Field(() => Boolean)
	public isChatSubscribersOnly: boolean

	@Field(() => PublicUserModel)
	public user: PublicUserModel

	@Field(() => String)
	public userId: string

	@Field(() => CategoryModel, { nullable: true })
	public category: CategoryModel

	public chatMessages: ChatMessageModel[]

	@Field(() => String, { nullable: true })
	public categoryId: string | null

	@Field(() => Date)
	public createdAt: Date

	@Field(() => Date)
	public updatedAt: Date
}
