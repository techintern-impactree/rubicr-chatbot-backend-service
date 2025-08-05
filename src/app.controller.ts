import { Controller, Post, Body, Res, HttpStatus, Logger, BadRequestException } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express'; // Import Response from express for explicit status control

interface RephraseRequest {
  type?: 'webpage_context' | 'rephrase';
  content?: string; // For webpage_context
  text?: string;    // For rephrase prompt
}

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  @Post('/rephrase')
  async handleAiRequest(@Body() data: RephraseRequest, @Res() res: Response) {
    if (data === null || typeof data !== 'object') {
      // Return 400 Bad Request if no data or invalid data format
      throw new BadRequestException('No input provided.');
    }

    if (data.type === 'webpage_context') {
      if (data.content === undefined || data.content === null) {
        throw new BadRequestException('No content provided for webpage context.');
      }
      const result = await this.appService.handleAiRequest(data);
      // Flask returned `{'message': '...'}` for context, so match that
      return res.status(HttpStatus.OK).json({ message: result.text });
    }

    // Default case for 'rephrase' or if 'type' is not 'webpage_context'
    if (!data.text) {
      throw new BadRequestException('No user prompt provided.');
    }

    try {
      const result = await this.appService.handleAiRequest(data);
      // NestJS automatically sends JSON for returned objects
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      this.logger.error(`Controller error: ${error.message}`, error.stack);
      // The service throws exceptions which NestJS's HTTP layer can catch
      // For more specific error handling, you'd use NestJS's Exception Filters
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        text: `Error processing your request: ${error.message}`
      });
    }
  }
}