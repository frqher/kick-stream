import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql'
import { type Transaction, TransactionStatus } from '@prisma/client'
import { UserModel } from 'src/modules/auth/account/models/user.model'

registerEnumType(TransactionStatus, {
	name: 'TransactionStatus'
})

@ObjectType()
export class TransactionModel implements Transaction {
	@Field(() => ID)
	public id: string

	@Field(() => Number)
	public amount: number

	@Field(() => String)
	public currency: string

	@Field(() => String)
	public status: TransactionStatus

	@Field(() => String)
	public stripeSubscriptionId: string

	@Field(() => String)
	public userId: string

	@Field(() => UserModel)
	public user: UserModel

	@Field(() => Date)
	public createdAt: Date

	@Field(() => Date)
	public updatedAt: Date
}
