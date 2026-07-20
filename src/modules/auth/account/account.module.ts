import { Module } from '@nestjs/common'
import { PrismaModule } from 'src/core/prisma/prisma.module'

import { AccountResolver } from './account.resolver'
import { AccountService } from './account.service'

@Module({
	imports: [PrismaModule],
	providers: [AccountResolver, AccountService]
})
export class AccountModule {}
