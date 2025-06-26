import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { CoreService } from './service/CoreService';
import { CoreController } from './controller/CoreController';

@Module({
  imports: [TerminusModule],
  controllers: [CoreController],
  providers: [CoreService],
})
export class CoreModule {}
