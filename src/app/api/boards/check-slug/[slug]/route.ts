import { NextRequest, NextResponse } from 'next/server';
import { extractAuthHeader, buildBackendHeaders, PublicOnlyProxyError, BACKEND_URL } from '@/lib/proxyHelper';

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const authHeader = extractAuthHeader(request);
    const slug = params.slug;

    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated', message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/boards/check-slug/${slug}`, {
      method: 'GET',
      headers: await buildBackendHeaders(request, authHeader),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    if (error instanceof PublicOnlyProxyError)
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    console.error('Check Slug API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}