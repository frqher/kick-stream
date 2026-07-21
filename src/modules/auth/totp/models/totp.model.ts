import { Field, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class TotpModel {
	@Field(() => String)
	public secret: string

	@Field(() => String)
	public qrcodeUrl: string
}
