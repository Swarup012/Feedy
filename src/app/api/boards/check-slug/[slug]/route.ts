import { NextRequest, NextResponse } from 'next/server';
import { extractAuthHeader, buildBackendHeaders, BACKEND_URL } from '@/lib/proxyHelper';

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const authHeader = extractAuthHeader(request);
    const subdomain = request.headers.get('x-subdomain') || '';
    const slug = params.slug;

    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/boards/check-slug/${slug}`, {
      method: 'GET',
      headers: buildBackendHeaders(authHeader, { 'x-subdomain': subdomain }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Check Slug API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}