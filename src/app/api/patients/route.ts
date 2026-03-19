/**
 * @fileoverview API route for proxying patient requests.
 *
 * This server-side route:
 * - Hides the API key from client-side code
 * - Forwards requests to the external healthcare API
 * - Handles errors gracefully
 */

import { NextRequest, NextResponse } from 'next/server';

const EXTERNAL_API_BASE = 'https://assessment.ksensetech.com/api';
const API_KEY = process.env.ASSESSMENT_API_KEY;

/**
 * GET /api/patients
 *
 * Proxies patient list requests to the external API.
 * Supports pagination via query parameters.
 *
 * @param request - Next.js request object
 * @returns Patient data or error response
 */
export async function GET(request: NextRequest) {
  // Validate API key is configured
  if (!API_KEY) {
    console.error('ASSESSMENT_API_KEY environment variable is not set');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') ?? '1';
    const limit = searchParams.get('limit') ?? '10';

    // Build external API URL
    const externalUrl = `${EXTERNAL_API_BASE}/patients?page=${page}&limit=${limit}`;

    // Forward request to external API
    const response = await fetch(externalUrl, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
    });

    // Handle non-OK responses
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`External API error: ${response.status} - ${errorText}`);

      return NextResponse.json(
        { error: `External API error: ${response.status}` },
        { status: response.status }
      );
    }

    // Parse and return response
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch patients:', error);

    return NextResponse.json(
      { error: 'Failed to fetch patient data' },
      { status: 500 }
    );
  }
}
