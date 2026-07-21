import { Args, Context, Mutation, Resolver } from '@nestjs/graphql'
import { type User } from '@prisma/client'
import { type GqlContext } from 'src/session/inputs/gql-context.types'
import { Authorization } from 'src/shared/decorators/auth.decorator'
import { Authorized } from 'src/shared/decorators/authorized.decorator'
import { UserAgent } from 'src/shared/decorators/user-agent.decorator'

import { AuthModel } from '../account/models/auth.model'

import { DeactivateService } from './deactivate.service'
import { DeactiveAccountInput } from './inputs/deactivate-account.input'

@Resolver('Deactivate')
export class DeactivateResolver {
	public constructor(private readonly deactivateService: DeactivateService) {}

	@Authorization()
	@Mutation(() => AuthModel, { name: 'deactivateAccount' })
	public async deactive(
		@Context() { req }: GqlContext,
		@Args('data') input: DeactiveAccountInput,
		@Authorized() user: User,
		@UserAgent() userAgent: string
	) {
		return await this.deactivateService.deactive(
			req,
			input,
			user,
			userAgent
		)
	}
}
