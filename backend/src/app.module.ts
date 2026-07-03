import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './common/config/configuration';
import { validate } from './common/config/env.validation';
import { TrackingModule } from './tracking/tracking.module';
import { StreamingModule } from './streaming/streaming.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
    }),
    TrackingModule,
    StreamingModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
