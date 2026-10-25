import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  });

  // (2) Bật kiểm tra dữ liệu theo DTO.
  // whitelist: bỏ các trường thừa FE gửi lên.
  // transform: để @Transform trong DTO có tác dụng.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('BrewLite API')
    .setDescription('API documentation for BrewLite')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  const port = Number(process.env.PORT ?? 3001);

  await app.listen(port);

  console.log(`BrewLite API is running at http://localhost:${port}`);
  console.log(`Swagger UI: http://localhost:${port}/swagger`);
}

bootstrap();
