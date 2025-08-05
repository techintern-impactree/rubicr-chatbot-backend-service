import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // Import ConfigModule
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes environment variables accessible throughout the app
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}