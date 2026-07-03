import { Module } from '@nestjs/common';
import { StreamingService } from './streaming.service';
import { STREAMING_GATEWAY } from './streaming.types';
import { StreamingGateway } from './streaming.gateway';

@Module({
  providers: [
    StreamingService,
    {
      provide: STREAMING_GATEWAY,
      useClass: StreamingGateway,
    },
  ],
  exports: [StreamingService],
})
export class StreamingModule {}
