import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { Authorization } from 'src/shared/decorators/auth.decorator'
import { Authorized } from 'src/shared/decorators/authorized.decorator'

import { CreateUserInput } from '../input/create-user.input'

import { AccountService } from './account.service'
import { UserModel } from './models/user.mode'

@Resolver('Account')
export class AccountResolver {
	public constructor(private readonly accountService: AccountService) {}

	@Authorization()
	@Query(() => UserModel, { name: 'findProfile' })
	public async me(@Authorized('id') id: string) {
		return await this.accountService.me(id)
	}

	@Query(() => [UserModel], { name: 'findAllUsers' })
	public async findAll() {
		return await this.accountService.findAll()
	}

	@Mutation(() => Boolean, { name: 'createUser' })
	public async create(@Args('data') input: CreateUserInput) {
		return await this.accountService.create(input)
	}
}
