'use server';
import {config} from 'dotenv';
config();

console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Loaded' : 'Not found');
console.log('API Key length:', process.env.GEMINI_API_KEY?.length || 0);

export {};