import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  const body = await request.json();
  
  try {
    const response = await axios.post(
      'https://search-leads-prod-pzcqf2qfawyitxjcbx7ziypyhy.aos.eu-west-1.on.aws/product-74,product-75,product-81/_search',
      body,
      {
        auth: {
          username: 'TSLTom',
          password: 'Xh7%7{2qn<tyi'
        }
      }
    );
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error querying OpenSearch:', error);
    return NextResponse.json({ error: 'Failed to query OpenSearch' }, { status: 500 });
  }
}