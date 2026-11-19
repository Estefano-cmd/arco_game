import 'reflect-metadata';
import { Controller, Get, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

@Controller('api')
class GameController {
  @Get('levels')
  levels() { return { levels: ['Bosque de los Susurros', 'Lago de las Estrellas', 'Jardín Eterno'], goals: [3, 4, 5], prize: 'Vale por una cita contigo y flores moradas' }; }
}
@Module({ controllers: [GameController] })
class AppModule {}
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(process.cwd(), 'dist'));
  await app.listen(process.env.PORT || 3000, '0.0.0.0');
}
bootstrap();
