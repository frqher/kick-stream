import { Query, Resolver } from '@nestjs/graphql'
import { type User } from '@prisma/client'
import { Authorization } from 'src/shared/decorators/auth.decorator'
import { Authorized } from 'src/shared/decorators/authorized.decorator'

import { SubscriptionModel } from './models/subscriptions.model'
import { SubscriptionService } from './subscription.service'

@Resolver('Subscription')
export class SubscriptionResolver {
	public constructor(
		private readonly subscriptionService: SubscriptionService
	) {}

	@Authorization()
	@Query(() => [SubscriptionModel], { name: 'findMySponsors' })
	public async findMySponsors(@Authorized() user: User) {
		return this.subscriptionService.findMySponsors(user)
	}
}
