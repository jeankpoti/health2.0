/**
 * @fileoverview API route for submitting assessment results.
 *
 * This server-side route:
 * - Hides the API key from client-side code
 * - Validates the submission payload
 * - Forwards the submission to the external API
 */

import { NextRequest, NextResponse } from 'next/server';

const EXTERNAL_API_BASE = 'https://assessment.ksensetech.com/api';
const API_KEY = process.env.ASSESSMENT_API_KEY;

/**
 * Validates the assessment payload structure.
 */
function isValidPayload(body: unknown): body is {
  high_risk_patients: string[];
  fever_patients: string[];
  data_quality_issues: string[];
} {
  if (typeof body !== 'object' || body === null) {
    return false;
  }

  const payload = body as Record<string, unknown>;

  return (
    Array.isArray(payload.high_risk_patients) &&
    Array.isArray(payload.fever_patients) &&
    Array.isArray(payload.data_quality_issues) &&
    payload.high_risk_patients.every((id) => typeof id === 'string') &&
    payload.fever_patients.every((id) => typeof id === 'string') &&
    payload.data_quality_issues.every((id) => typeof id === 'string')
  );
}

/**
 * POST /api/submit-assessment
 *
 * Submits assessment results to the external API.
 *
 * @param request - Next.js request object with assessment payload
 * @returns Submission result or error response
 */
export async function POST(request: NextRequest) {
  // Validate API key is configured
  if (!API_KEY) {
    console.error('ASSESSMENT_API_KEY environment variable is not set');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  try {
    // Parse request body
    const body = await request.json();

    // Validate payload structure
    if (!isValidPayload(body)) {
      return NextResponse.json(
        {
          error: 'Invalid payload. Expected high_risk_patients, fever_patients, and data_quality_issues arrays.',
        },
        { status: 400 }
      );
    }

    // Forward request to external API
    const response = await fetch(`${EXTERNAL_API_BASE}/submit-assessment`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Handle non-OK responses
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`External API error: ${response.status} - ${errorText}`);

      // Try to parse error as JSON
      try {
        const errorJson = JSON.parse(errorText);
        return NextResponse.json(errorJson, { status: response.status });
      } catch {
        return NextResponse.json(
          { error: `External API error: ${response.status}` },
          { status: response.status }
        );
      }
    }

    // Parse and return response
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to submit assessment:', error);

    return NextResponse.json(
      { error: 'Failed to submit assessment' },
      { status: 500 }
    );
  }
}
