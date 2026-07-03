import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import type { AppConfig } from './common/config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.enableCors();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Damer Tracking API')
    .setDescription(
      'Suivi temps réel des dameuses : positions, analyses spatiales et simulation.',
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const configService = app.get(ConfigService<AppConfig, true>);
  const port = configService.get('port', { infer: true });
  const nodeEnv = configService.get('nodeEnv', { infer: true });

  await app.listen(port);

  logger.log(`Application démarrée en mode "${nodeEnv}"`);
  logger.log(`Serveur à l'écoute sur ${await app.getUrl()}`);
  logger.log(`Documentation Swagger sur ${await app.getUrl()}/docs`);
}
void bootstrap();
