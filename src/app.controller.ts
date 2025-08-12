import { Controller, Post, Body, HttpStatus, Logger, BadRequestException, HttpException } from '@nestjs/common';
import { AppService } from './app.service';
// No longer need to import Response from 'express' because we're not manually controlling response object.

interface RephraseRequest {
  text: string;           
  webpageContent?: string; 
}

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  @Post('/rephrase')
  async handleAiRequest(@Body() data: RephraseRequest) { 
    if (data === null || typeof data !== 'object') {
      throw new BadRequestException('No input provided or invalid data format.');
    }


    if (!data.text || data.text.trim() === '') {
      throw new BadRequestException('No user prompt provided.');
    }

    try {
      const result = await this.appService.handleAiRequest(data);

      return result;
    } catch (error) {
      this.logger.error(`Controller error: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to process AI request: An unexpected error occurred.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}