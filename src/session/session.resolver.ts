import { Args, Context, Mutation, Resolver } from '@nestjs/graphql'
import { UserModel } from 'src/modules/auth/account/models/user.mode'

import type { GqlContext } from './inputs/gql-context.types'
import { LoginInput } from './inputs/login.input'
import { SessionService } from './session.service'

@Resolver('Session')
export class SessionResolver {
	constructor(private readonly sessionService: SessionService) {}

	@Mutation(() => UserModel, { name: 'loginUser' })
	public async login(
		@Context() { req }: GqlContext,
		@Args('data') input: LoginInput
	) {
		return await this.sessionService.login(req, input)
	}

	@Mutation(() => Boolean, { name: 'logoutUser' })
	public async logout(@Context() { req }: GqlContext) {
		return await this.sessionService.logout(req)
	}
}
