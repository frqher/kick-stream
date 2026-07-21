import { Args, Context, Mutation, Resolver } from '@nestjs/graphql'
import { type GqlContext } from 'src/session/inputs/gql-context.types'
import { UserAgent } from 'src/shared/decorators/user-agent.decorator'

import { UserModel } from '../account/models/user.model'

import { VerificationInput } from './inputs/verification.input'
import { VerificationService } from './verification.service'

@Resolver('Verification')
export class VerificationResolver {
	public constructor(
		private readonly verificationService: VerificationService
	) {}

	@Mutation(() => UserModel, { name: 'verifyAccount' })
	public async verify(
		@Context() { req }: GqlContext,
		@Args('data') input: VerificationInput,
		@UserAgent() userAgent: string
	) {
		return this.verificationService.verify(req, input, userAgent)
	}
}
