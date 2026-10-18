import { NextRequest, NextResponse } from 'next/server';
import { extractAuthHeader, buildBackendHeaders, PublicOnlyProxyError, BACKEND_URL } from '@/lib/proxyHelper';

export async function POST(request: NextRequest) {
  try {
    const authHeader = extractAuthHeader(request);
    const body = await request.json();

    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/users/onboarding/complete`, {
      method: 'POST',
      headers: await buildBackendHeaders(request, authHeader),
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    if (error instanceof PublicOnlyProxyError)
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
