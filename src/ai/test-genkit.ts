'use server';
import {config} from 'dotenv';
config();

import {ai} from './genkit';

async function testGenkit() {
  try {
    console.log('Testing Genkit with Gemini API...');
    
    const result = await ai.generate({
      prompt: 'Say "Hello, World!" in Portuguese',
      model: 'googleai/gemini-2.5-flash',
    });
    
    console.log('Success! Response from Gemini API:');
    console.log(result.text);
  } catch (error) {
    console.error('Error testing Genkit with Gemini API:', error);
  }
}

testGenkit();