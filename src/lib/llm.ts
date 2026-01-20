import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from './config';
import { type Message, type Persona } from '../types';

interface ChatResponse {
    text: string;
    error?: string;
}

/**
 * Service to handle interactions with LLMs (Mock, Gemini, etc.)
 */
export const llmService = {
    /**
     * Send a message to the AI and get a response (multimodal support)
     */
    async sendMessage(
        history: Message[],
        newMessage: string,
        persona: Persona,
        imageUrl?: string
    ): Promise<ChatResponse> {

        // 1. If Mock Mode is enabled or no API key, return mock response
        if (config.enableMockMode || !config.geminiApiKey) {
            if (!config.enableMockMode) {
                console.warn("Gemini API Key missing, falling back to mock mode.");
            }
            return this.getMockResponse(newMessage, persona);
        }

        // 2. Real API Call
        try {
            const genAI = new GoogleGenerativeAI(config.geminiApiKey);
            // Use Gemini 1.5 Flash for speed and multimodal capabilities
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const systemPrompt = `
          You are acting as a persona named "${persona.name}".
          Description: ${persona.description}
          Tone: ${persona.tone}
          
          Context: You are an accountability partner for a student.
          Your goal is to be helpful, motivating, and keep them on track with their tasks.
          Keep responses concise (under 2-3 sentences usually) and conversational.
          Use emojis where appropriate for the persona.
          
          If the user sends an image, analyze it in the context of study/productivity.
          - If it's a schedule/timetable: Extract key tasks and suggest adding them.
          - If it's homework: Encourage them or offer a hint (do NOT solve it fully unless asked).
          - If it's random: React according to your persona.
        `;

            let parts: any[] = [{ text: `${systemPrompt}\n\nUser says: ${newMessage}` }];

            // Handle Image
            if (imageUrl) {
                try {
                    const base64Data = await this.urlToBase64(imageUrl);
                    const mimeType = this.getMimeType(imageUrl);

                    parts.push({
                        inlineData: {
                            data: base64Data,
                            mimeType: mimeType
                        }
                    });
                } catch (imgError) {
                    console.error("Failed to process image:", imgError);
                    // Fallback to text only
                    parts[0].text += "\n[System Note: User attached an image but it failed to load.]";
                }
            }

            // For this simpler implementation with images, we might skip full history in the API call object 
            // if we are doing a single 'generateContent' with an image (since multi-turn with images can be complex in some SDKs).
            // However, Gemini 2.5 supports chat history + images. 
            // For robustness, if there's an image, we'll treat it as a "fresh" prompt with context, 
            // or we try standard chat. Let's try standard chat but if it fails fall back to generateContent.

            // Actually, for simplicity and reliability with images, let's use generateContent for image messages.

            if (imageUrl) {
                const result = await model.generateContent(parts);
                const response = await result.response;
                return { text: response.text() };
            } else {
                // Text-only standard chat flow
                let formattedHistory = history
                    .filter(msg => msg.type === 'text')
                    .map(msg => ({
                        role: msg.sender === 'user' ? 'user' : 'model',
                        parts: [{ text: msg.text }],
                    }));

                if (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
                    formattedHistory.shift();
                }

                const chat = model.startChat({
                    history: formattedHistory,
                    generationConfig: { maxOutputTokens: 200 },
                });

                const result = await chat.sendMessage(parts[0].text);
                const response = await result.response;
                return { text: response.text() };
            }

        } catch (error) {
            console.error("LLM Error:", error);
            return {
                text: "Sorry, I'm having trouble connecting to my brain right now. 🧠💥",
                error: String(error)
            };
        }
    },

    async urlToBase64(url: string): Promise<string> {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                // Remove data:image/jpeg;base64, prefix
                resolve(base64String.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    },

    getMimeType(url: string): string {
        const ext = url.split('.').pop()?.toLowerCase();
        if (ext === 'png') return 'image/png';
        if (ext === 'webp') return 'image/webp';
        if (ext === 'heic') return 'image/heic';
        if (ext === 'heif') return 'image/heif';
        return 'image/jpeg';
    },

    /**
     * Deterministic mock responses for testing/dev
     */
    async getMockResponse(text: string, persona: Persona): Promise<ChatResponse> {
        await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 1000));

        const lowerText = text.toLowerCase();
        const isBigBro = persona.id === 'big-bro';

        if (lowerText.includes('task') || lowerText.includes('todo')) {
            return {
                text: isBigBro
                    ? "Got it. I'll add that to the list. 📝 Don't forget to actually DO it though!"
                    : "Task acknowledged. It has been recorded in your log."
            };
        }

        if (lowerText.includes('break')) {
            return {
                text: isBigBro
                    ? "Break? Already? 🤨 ...Fine, but 5 minutes max!"
                    : "Rest is allowed only after sufficient progress. Proceed with caution."
            };
        }

        if (lowerText.includes('hello') || lowerText.includes('hi')) {
            return {
                text: isBigBro
                    ? "Yo! What's the move today? 👊"
                    : "Greetings. Let us focus on what matters today."
            }
        }

        // Default fallback
        const defaults = isBigBro
            ? ["I hear you, bro.", "Let's lock in.", "Focus up!"]
            : ["I understand.", "This is relevant to your goals.", "Proceed."];

        return { text: defaults[Math.floor(Math.random() * defaults.length)] };
    }
};
