import { config } from 'dotenv';
config();

import '@/ai/flows/categorize-feedback.ts';
import '@/ai/flows/suggest-similar-feedback.ts';
import '@/ai/flows/summarize-feedback.ts';