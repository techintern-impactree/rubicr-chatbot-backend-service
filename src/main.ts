import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS, equivalent to flask_cors.CORS(app)
  app.enableCors({
    origin: '*', // Adjust this to your specific frontend URL in production, e.g., ['http://localhost:3000']
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.PORT || 5000; // Use port from .env or default to 5000
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();