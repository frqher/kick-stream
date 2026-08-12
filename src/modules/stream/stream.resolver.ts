import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql'
import { type User } from '@prisma/client'
import { type FileUpload } from 'graphql-upload/processRequest.mjs'
import { type GqlContext } from 'src/session/inputs/gql-context.types'
import { Authorization } from 'src/shared/decorators/auth.decorator'
import { Authorized } from 'src/shared/decorators/authorized.decorator'
import { GraphQLUpload } from 'src/shared/graphql/upload.scalar'
import { FileValidationPipe } from 'src/shared/pipes/file-validation.pipe'

import { ChangeStreamInfoInput } from './inputs/change-stream.info.input'
import { FiltersInput } from './inputs/filters.input'
import { GenerateStreamTokenInput } from './inputs/generate-stream.-token.input'
import { GenerateStreamTokenModel } from './models/generate-token.model'
import { StreamModel } from './models/stream.model'
import { StreamService } from './stream.service'

@Resolver('Stream')
export class StreamResolver {
	public constructor(private readonly streamService: StreamService) {}

	@Query(() => [StreamModel], { name: 'findAllStreams' })
	public async findAll(@Args('filters') input: FiltersInput) {
		return this.streamService.findAll(input)
	}

	@Query(() => [StreamModel], { name: 'findRandomStreams' })
	public async findRandom() {
		return this.streamService.findRandom()
	}

	@Authorization()
	@Mutation(() => Boolean, { name: 'changeStreamInfo' })
	public async changeInfo(
		@Authorized() user: User,
		@Args('data') input: ChangeStreamInfoInput
	) {
		return this.streamService.changeInfo(user, input)
	}

	@Authorization()
	@Mutation(() => Boolean, { name: 'changeStreamThumbnail' })
	public async changeThumbnail(
		@Authorized() user: User,

		@Args('thumbnail', { type: () => GraphQLUpload }, FileValidationPipe)
		thumbnail: Promise<FileUpload>
	) {
		return this.streamService.changeThumbnail(user, thumbnail)
	}

	@Authorization()
	@Mutation(() => Boolean, { name: 'removeStreamThumbnail' })
	public async removeThumbnail(@Authorized() user: User) {
		return this.streamService.removeThumbnail(user)
	}

	@Mutation(() => GenerateStreamTokenModel, { name: 'generateStreamToken' })
	public async generateToken(
		@Context() { req }: GqlContext,
		@Args('data') input: GenerateStreamTokenInput
	) {
		return this.streamService.generateToken(req.session.userId, input)
	}
}
