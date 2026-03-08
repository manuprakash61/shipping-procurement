import Anthropic from '@anthropic-ai/sdk';
import {
  QUERY_INTERPRETATION_PROMPT,
  VENDOR_EXTRACTION_PROMPT,
  QUOTE_EXTRACTION_PROMPT,
  RFQ_DRAFT_PROMPT,
  TENDER_TEMPLATE_PROMPT,
  EMAIL_EXTRACTION_PROMPT,
} from './prompts';
import { ExtractedVendor, QuoteExtractionResult, SearchQueryInterpretation } from '../../types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6';

async function callClaude(systemPrompt: string, userContent: string): Promise<string> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }],
  });

  const block = message.content[0];
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude');
  return block.text;
}

function parseJson<T>(text: string): T {
  // Strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
  return JSON.parse(cleaned) as T;
}

export async function interpretSearchQuery(
  query: string,
  region?: string,
): Promise<SearchQueryInterpretation> {
  const userContent = `Query: "${query}"${region ? `\nRegion: ${region}` : ''}`;
  const response = await callClaude(QUERY_INTERPRETATION_PROMPT, userContent);
  return parseJson<SearchQueryInterpretation>(response);
}

export async function extractVendorsFromSearchResults(
  searchResults: string,
  query: string,
  region?: string,
): Promise<ExtractedVendor[]> {
  const systemPrompt = VENDOR_EXTRACTION_PROMPT.replace('{{query}}', query).replace(
    '{{region}}',
    region ?? 'worldwide',
  );

  // Use tool use to guarantee syntactically valid JSON output
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: 'user', content: searchResults }],
    tools: [
      {
        name: 'submit_vendors',
        description: 'Submit the list of extracted vendor companies',
        input_schema: {
          type: 'object' as const,
          properties: {
            vendors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  website: { type: 'string' },
                  description: { type: 'string' },
                  country: { type: 'string' },
                  region: { type: 'string' },
                  estimatedPrice: { type: 'string' },
                  aiScore: { type: 'number' },
                  aiTags: { type: 'array', items: { type: 'string' } },
                  emails: { type: 'array', items: { type: 'string' } },
                  phone: { type: 'string' },
                },
                required: ['name', 'website', 'description', 'country', 'region', 'aiScore', 'aiTags', 'emails'],
              },
            },
          },
          required: ['vendors'],
        },
      },
    ],
    tool_choice: { type: 'any' },
  });

  const toolUseBlock = message.content.find((b) => b.type === 'tool_use');
  if (!toolUseBlock || toolUseBlock.type !== 'tool_use') {
    return [];
  }
  return ((toolUseBlock.input as { vendors: ExtractedVendor[] }).vendors ?? []);
}

export async function extractEmailsFromText(text: string): Promise<string[]> {
  const systemPrompt = EMAIL_EXTRACTION_PROMPT.replace('{{text}}', text);
  const response = await callClaude(systemPrompt, 'Extract emails from the text above.');
  return parseJson<string[]>(response);
}

export async function extractQuoteData(emailText: string): Promise<QuoteExtractionResult> {
  const systemPrompt = QUOTE_EXTRACTION_PROMPT.replace('{{emailText}}', emailText);
  const response = await callClaude(systemPrompt, 'Extract quote data from this email.');
  return parseJson<QuoteExtractionResult>(response);
}

export async function draftRFQEmail(params: {
  companyName: string;
  query: string;
  region?: string;
}): Promise<string> {
  const systemPrompt = RFQ_DRAFT_PROMPT.replace('{{companyName}}', params.companyName)
    .replace('{{query}}', params.query)
    .replace('{{region}}', params.region ?? 'worldwide');
  return callClaude(systemPrompt, 'Draft the RFQ email now.');
}

export async function generateTenderDocument(params: {
  companyName: string;
  vendorName: string;
  productDescription: string;
  price: string;
  currency: string;
  deliveryDate: string;
  terms: string;
  tenderNumber: string;
}): Promise<string> {
  const systemPrompt = TENDER_TEMPLATE_PROMPT.replace('{{companyName}}', params.companyName)
    .replace('{{vendorName}}', params.vendorName)
    .replace('{{productDescription}}', params.productDescription)
    .replace('{{price}}', params.price)
    .replace('{{currency}}', params.currency)
    .replace('{{deliveryDate}}', params.deliveryDate)
    .replace('{{terms}}', params.terms)
    .replace('{{tenderNumber}}', params.tenderNumber);
  return callClaude(systemPrompt, 'Generate the tender document now.');
}
