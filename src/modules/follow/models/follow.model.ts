import { Field, ID, ObjectType } from '@nestjs/graphql'
import type { Follow } from '@prisma/client'
import { PublicUserModel } from 'src/modules/auth/account/models/public-user.model'

@ObjectType()
export class FollowModel implements Follow {
	@Field(() => ID)
	public id: string

	@Field(() => PublicUserModel)
	public follower: PublicUserModel

	@Field(() => String)
	public followerId: string

	@Field(() => PublicUserModel)
	public following: PublicUserModel

	@Field(() => String)
	public followingId: string

	@Field(() => Date)
	public createdAt: Date

	@Field(() => Date)
	public updatedAt: Date
}
