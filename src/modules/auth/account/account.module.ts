import { Module } from '@nestjs/common'
import { PrismaModule } from 'src/core/prisma/prisma.module'

import { VerificationService } from '../verification/verification.service'

import { AccountResolver } from './account.resolver'
import { AccountService } from './account.service'

@Module({
	imports: [PrismaModule],
	providers: [AccountResolver, AccountService, VerificationService]
})
export class AccountModule {}
