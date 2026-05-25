'use strict';
require('dotenv').config();
const { AnthropicBedrock } = require('@anthropic-ai/bedrock-sdk');

async function main() {
  console.log('\n🔍 Test conexiune Bedrock\n');
  console.log('  AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? '✅ setat' : '❌ lipsă');
  console.log('  AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '✅ setat' : '❌ lipsă');
  console.log('  AWS_REGION:', process.env.AWS_REGION || 'us-east-1');

  const client = new AnthropicBedrock({
    awsAccessKey: process.env.AWS_ACCESS_KEY_ID,
    awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY,
    awsRegion: process.env.AWS_REGION || 'us-east-1',
  });

  process.stdout.write('\n  Test Haiku... ');
  try {
    const response = await client.messages.create({
      model: 'us.anthropic.claude-haiku-4-5-20251001-v1:0',
      max_tokens: 50,
      messages: [{ role: 'user', content: 'Spune doar: Bedrock functional!' }],
    });
    console.log('✅', response.content[0].text);
  } catch (err) {
    console.log('❌', err.message);
  }
}

main();