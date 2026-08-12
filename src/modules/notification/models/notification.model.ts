import { Field, ObjectType, registerEnumType } from '@nestjs/graphql'
import { type Notification, NotificationType } from '@prisma/client'

registerEnumType(NotificationType, {
	name: 'NotificationType'
})

@ObjectType()
export class NotificationModel implements Notification {
	@Field(() => String)
	public id: string

	@Field(() => String)
	public message: string

	@Field(() => NotificationType)
	public type: NotificationType

	@Field(() => Boolean)
	public isRead: boolean

	@Field(() => String, { nullable: true })
	public userId: string | null

	@Field(() => Date)
	public createdAt: Date

	@Field(() => Date)
	public updatedAt: Date
}
