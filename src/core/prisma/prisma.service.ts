import { Injectable } from '@nestjs/common'
import { PrismaPostgresAdapter } from '@prisma/adapter-ppg'
import { PrismaClient } from '@prisma/client/extension'

@Injectable()
export class PrismaService extends PrismaClient {
	constructor() {
		const adapter = new PrismaPostgresAdapter({
			connectionString: process.env.DATABASE_URL!
		})
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		super({ adapter })
	}
}
