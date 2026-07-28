import { Field, ID, ObjectType } from '@nestjs/graphql'
import { type SponsorshipSubscription } from '@prisma/client'
import { UserModel } from 'src/modules/auth/account/models/user.model'

import { PlanModel } from '../../plan/models/plan.model'

@ObjectType()
export class SubscriptionModel implements SponsorshipSubscription {
	@Field(() => ID)
	public id: string

	@Field(() => String)
	public userId: string

	@Field(() => String)
	public planId: string

	@Field(() => PlanModel)
	public plan: PlanModel

	@Field(() => String)
	public channelId: string

	@Field(() => UserModel)
	public channel: UserModel

	@Field(() => Date)
	public expiresAt: Date

	@Field(() => UserModel)
	public user: UserModel

	@Field(() => Date)
	public createdAt: Date

	@Field(() => Date)
	public updatedAt: Date
}
