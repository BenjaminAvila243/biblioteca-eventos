import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3010);
  console.log('biblioteca-eventos escuchando en http://localhost:3010');
}
void bootstrap();