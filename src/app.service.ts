import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { marked } from 'marked';

@Injectable()
export class AppService {
    private readonly logger = new Logger(AppService.name);
    private currentWebpageContext: string = '';
    private genAI: GoogleGenerativeAI;
    private geminiModelName = "gemini-2.5-flash"; 

    private readonly systemInstruction: string = `You are an expert AI named THAMBI. Your primary roles are to rephrase text and provide insights based on given content.  Always format your responses clearly using Markdown.  Start with a main heading (e.g., # Rephrased Content or # Key Insights).  Use sub-headings (e.g., ## Option 1, ## Main Points) to organize different sections of your answer.  Present your main content as readable paragraphs under the appropriate headings but never try to generate a tabular format. just present the information in text.  Never use '*' to mark important points.  When rephrasing, offer multiple options (not more than 3) and present them clearly, either using numbered lists or distinct sub-headings for each option.  When asked for insights or summaries, especially if the user's query implicitly or explicitly relates to  a previously provided webpage context, use that context to formulate your answer, but only when it is asked. NOT EVERYTIME.  Be clear, accurate, concise, and helpful.  Keep rephrased text simple, like: 'the books are found to be in library'.`;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('GOOGLE_GEMINI_API');
        if (!apiKey) {
            this.logger.error('GOOGLE_GEMINI_API environment variable is not set!');
            throw new Error('GOOGLE_GEMINI_API is not configured.');
        }

        this.genAI = new GoogleGenerativeAI(apiKey);
    }
    private async convertMarkdownToHtml(mdText: string): Promise<string> {
        if (!mdText) {
            return "";
        }
        return await marked.parse(mdText);
    }

    private ensureBasicMarkdownStructure(textContent: string): string {
        if (!textContent) {
            return "# No Content Provided";
        }

        const normalizedText = textContent.trim();
        if (/^#{1,6}\s/m.test(normalizedText)) {
            return normalizedText;
        } else {
            return `# Response: \n\n${normalizedText}`;
        }
    }

    async handleAiRequest(data: any): Promise<{ text: string | 'Webpage context received and stored successfully!' }> {
        if (data.type === 'webpage_context') {
            const webpageContent = (data.content || '').trim();
            this.currentWebpageContext = webpageContent;
            this.logger.log(`Webpage context received and stored. Length: ${webpageContent.length} characters.`);
            return { text: 'Webpage context received and stored successfully!' };
        }

        const userPrompt = (data.text || '').trim();

        if (!userPrompt) {
            throw new Error('No user prompt provided.');
        }

        try {
            const model = this.genAI.getGenerativeModel({ model: this.geminiModelName });

            let combinedQuery = `User's request: '${userPrompt}'`;

            if (this.currentWebpageContext) {
                combinedQuery += `\n\n--- Webpage Context ---\n${this.currentWebpageContext}\n--- End Webpage Context ---`;
                combinedQuery += "\n\nGiven the user's request and the additional webpage context, please provide rephrasing or insights as requested. ";
                combinedQuery += "Ensure your response is well-formatted using Markdown (headings, sub-headings, and paragraphs).";
            }

            const chat = model.startChat({
                history: [],
                systemInstruction: { role: "system", parts: [{ text: this.systemInstruction }] },
            });

            this.logger.log(`Sending to Gemini:\n${combinedQuery.substring(0, 500)}...`);

            const result = await chat.sendMessage(combinedQuery);
            const responseText = result.response.text();

            const markdownOutput = this.ensureBasicMarkdownStructure(responseText);
            const htmlResponseText = await this.convertMarkdownToHtml(markdownOutput);

            return { text: htmlResponseText };
        } catch (e) {
            this.logger.error(`Error during AI interaction: ${e.message}`, e.stack);
            throw new InternalServerErrorException(`Error processing your request: ${e.message}`);
        }
    }
}