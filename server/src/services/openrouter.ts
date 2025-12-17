/**
 * OpenRouter Service
 * Handles all LLM API calls to OpenRouter using the Llama 3.3 70B model
 */

import dotenv from 'dotenv';
dotenv.config();

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'meta-llama/llama-3.3-70b-instruct:free';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * Sends a chat completion request to OpenRouter
 * @param messages - Array of conversation messages
 * @param systemPrompt - Optional system prompt to prepend
 * @returns The AI's response text
 */
export async function callOpenRouter(
  messages: Message[],
  systemPrompt?: string
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set in environment variables');
  }

  // Prepare messages with optional system prompt
  const allMessages: Message[] = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://loan-assistant-mvp.vercel.app',
        'X-Title': 'AI Loan Sales Assistant',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: allMessages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    // Cast JSON response to the expected OpenRouterResponse shape
    const data = (await response.json()) as OpenRouterResponse;
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from OpenRouter');
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenRouter API call failed:', error);
    throw error;
  }
}

/**
 * Generates a conversational response for loan-related queries
 */
export async function generateLoanResponse(
  userMessage: string,
  context: string,
  conversationHistory: Message[]
): Promise<string> {
  const systemPrompt = `You are a friendly and professional AI loan sales assistant for TechBank Financial Services. 
Your role is to help customers understand and apply for loans.

Current Context:
${context}

Guidelines:
- Be warm, helpful, and professional
- Keep responses concise but informative
- Guide customers through the loan application process
- Ask one question at a time to collect information
- Never make up information about loan terms or rates
- If you don't have information, ask the customer to provide it`;

  const messages: Message[] = [
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];

  return callOpenRouter(messages, systemPrompt);
}

/**
 * Generates an explanation for loan decision
 */
export async function generateDecisionExplanation(
  decision: 'APPROVED' | 'REJECTED',
  reason: string,
  applicantName: string
): Promise<string> {
  const systemPrompt = `You are a professional loan officer explaining a loan decision.
Be empathetic and clear. If rejected, provide constructive feedback on how to improve eligibility.
Keep the response under 100 words.`;

  const message = decision === 'APPROVED'
    ? `Generate a congratulatory message for ${applicantName} whose loan has been approved. Reason: ${reason}`
    : `Generate a polite rejection message for ${applicantName} explaining why their loan was not approved. Reason: ${reason}. Provide tips to improve eligibility.`;

  return callOpenRouter([{ role: 'user', content: message }], systemPrompt);
}
