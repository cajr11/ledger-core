import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Ledger Core')
    .setDescription(
      'Multi-currency payment ledger built with TigerBeetle, Temporal, and NestJS. Supports double-entry accounting, two-phase transfers, and multi-step workflow orchestration with compensation paths for failure recovery.',
    )
    .setVersion('1.0.0')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory);

  app.enableShutdownHooks();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips properties not in the DTO
      forbidNonWhitelisted: true, // throws if extra properties are sent
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
