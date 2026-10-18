import { NextRequest, NextResponse } from 'next/server';
import { extractAuthHeader, buildBackendHeaders, PublicOnlyProxyError, BACKEND_URL } from '@/lib/proxyHelper';

// Update member role
export async function PUT(
  request: NextRequest,
  { params }: { params: { organizationId: string; userId: string } }
) {
  try {
    const authHeader = extractAuthHeader(request);

    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated', message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { organizationId, userId } = params;

    const response = await fetch(
      `${BACKEND_URL}/api/organizations/${organizationId}/members/${userId}/role`,
      {
        method: 'PUT',
        headers: await buildBackendHeaders(request, authHeader),
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    if (error instanceof PublicOnlyProxyError)
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    console.error('Update member role API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Remove member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { organizationId: string; userId: string } }
) {
  try {
    const authHeader = extractAuthHeader(request);

    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated', message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { organizationId, userId } = params;

    const response = await fetch(
      `${BACKEND_URL}/api/organizations/${organizationId}/members/${userId}`,
      {
        method: 'DELETE',
        headers: await buildBackendHeaders(request, authHeader),
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    if (error instanceof PublicOnlyProxyError)
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    console.error('Remove member API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

