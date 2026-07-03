import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import type { AppConfig } from './common/config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  const configService = app.get(ConfigService<AppConfig, true>);
  const port = configService.get('port', { infer: true });
  const nodeEnv = configService.get('nodeEnv', { infer: true });

  await app.listen(port);

  logger.log(`Application démarrée en mode "${nodeEnv}"`);
  logger.log(`Serveur à l'écoute sur ${await app.getUrl()}`);
}
void bootstrap();
