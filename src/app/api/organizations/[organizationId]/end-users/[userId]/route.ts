import { NextRequest, NextResponse } from 'next/server';
import { extractAuthHeader, buildBackendHeaders, BACKEND_URL } from '@/lib/proxyHelper';

type Params = { params: Promise<{ organizationId: string; userId: string }> };

export async function DELETE(
  request: NextRequest,
  { params }: Params
) {
  try {
    const authHeader = extractAuthHeader(request);

    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { organizationId, userId } = await params;

    const response = await fetch(
      `${BACKEND_URL}/api/organizations/${organizationId}/end-users/${userId}`,
      {
        method: 'DELETE',
        headers: buildBackendHeaders(authHeader),
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Delete end user API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
