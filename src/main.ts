import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CustomSocketAdapter } from './custom-socket.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:8080',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useWebSocketAdapter(new CustomSocketAdapter(app));

  await app.listen(3000);
}
bootstrap();
