import { Field, ID, ObjectType } from '@nestjs/graphql'
import { SponsorshipPlan } from '@prisma/client'
import { PublicUserModel } from 'src/modules/auth/account/models/public-user.model'

@ObjectType()
export class PlanModel implements SponsorshipPlan {
	@Field(() => ID)
	public id: string

	@Field(() => String)
	public title: string

	@Field(() => String, { nullable: true })
	public description: string

	@Field(() => Number)
	public price: number

	public stripeProductId: string

	public stripePlanId: string

	@Field(() => PublicUserModel)
	public channel: PublicUserModel

	@Field(() => String)
	public channelId: string

	@Field(() => Date)
	public createdAt: Date

	@Field(() => Date)
	public updatedAt: Date
}
