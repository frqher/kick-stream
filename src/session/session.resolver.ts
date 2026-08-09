import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql'
import { AuthModel } from 'src/modules/auth/account/models/auth.model'
import { Authorization } from 'src/shared/decorators/auth.decorator'
import { UserAgent } from 'src/shared/decorators/user-agent.decorator'

import type { GqlContext } from './inputs/gql-context.types'
import { LoginInput } from './inputs/login.input'
import { SessionModel } from './models/session.model'
import { SessionService } from './session.service'

@Resolver('Session')
export class SessionResolver {
	constructor(private readonly sessionService: SessionService) {}

	@Authorization()
	@Query(() => [SessionModel], { name: 'findSessionsByUser' })
	public async findByUser(@Context() { req }: GqlContext) {
		return await this.sessionService.findByUser(req)
	}

	@Authorization()
	@Query(() => SessionModel, { name: 'findCurrentSession' })
	public async findCurrent(@Context() { req }: GqlContext) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return await this.sessionService.findCurrent(req)
	}

	@Mutation(() => AuthModel, { name: 'loginUser' })
	public async login(
		@Context() { req }: GqlContext,
		@Args('data') input: LoginInput,
		@UserAgent() userAgent: string
	) {
		return await this.sessionService.login(req, input, userAgent)
	}

	@Mutation(() => Boolean, { name: 'logoutUser' })
	public async logout(@Context() { req }: GqlContext) {
		return await this.sessionService.logout(req)
	}

	@Mutation(() => Boolean, { name: 'clearSessionCookie' })
	public clearSession(@Context() { req }: GqlContext) {
		return this.sessionService.clearSession(req)
	}

	@Authorization()
	@Mutation(() => Boolean, { name: 'removeSessionById' })
	public remove(@Args('id') id: string, @Context() { req }: GqlContext) {
		return this.sessionService.remove(req, id)
	}
}
