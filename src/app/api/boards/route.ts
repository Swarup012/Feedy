import { NextRequest, NextResponse } from 'next/server';
import { extractAuthHeader, buildBackendHeaders, BACKEND_URL } from '@/lib/proxyHelper';

export async function GET(request: NextRequest) {
  try {
    const authHeader = extractAuthHeader(request);
    const subdomain = request.headers.get('x-subdomain') || '';

    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`${BACKEND_URL}/api/boards`, {
        method: 'GET',
        headers: buildBackendHeaders(authHeader, { 'x-subdomain': subdomain }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { success: false, error: 'Request timeout - backend took too long to respond' },
          { status: 504 }
        );
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Boards GET API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = extractAuthHeader(request);
    const subdomain = request.headers.get('x-subdomain') || '';

    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const response = await fetch(`${BACKEND_URL}/api/boards`, {
      method: 'POST',
      headers: buildBackendHeaders(authHeader, { 'x-subdomain': subdomain }),
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Boards POST API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}