import { NextRequest, NextResponse } from 'next/server';
import { extractAuthHeader, buildBackendHeaders, BACKEND_URL } from '@/lib/proxyHelper';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const authHeader = extractAuthHeader(request);
    const subdomain = request.headers.get('x-subdomain') || '';
    const search = request.nextUrl.search; // preserve query params (filters)

    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_URL}/api/boards/${slug}/posts${search}`, {
      method: 'GET',
      headers: buildBackendHeaders(authHeader, { 'x-subdomain': subdomain }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Board posts GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const authHeader = extractAuthHeader(request);
    const subdomain = request.headers.get('x-subdomain') || '';

    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const response = await fetch(`${BACKEND_URL}/api/boards/${slug}/posts`, {
      method: 'POST',
      headers: buildBackendHeaders(authHeader, { 'x-subdomain': subdomain }),
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Board posts POST error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
