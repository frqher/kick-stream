import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql'
import { type Transaction, TransactionStatus } from '@prisma/client'

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

	public stripeSubscriptionId: string | null

	@Field(() => String, { nullable: true })
	public userId: string | null

	@Field(() => Date)
	public createdAt: Date

	@Field(() => Date)
	public updatedAt: Date
}
