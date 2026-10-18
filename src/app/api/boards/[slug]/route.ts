import { NextRequest, NextResponse } from 'next/server';
import { extractAuthHeader, buildBackendHeaders, PublicOnlyProxyError, BACKEND_URL } from '@/lib/proxyHelper';

// GET /api/boards/[slug]  — fetch a single board by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const authHeader = extractAuthHeader(request);

    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Not authenticated', message: 'Not authenticated' }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_URL}/api/boards/${slug}`, {
      method: 'GET',
      headers: await buildBackendHeaders(request, authHeader),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    if (error instanceof PublicOnlyProxyError)
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    console.error('Board GET by slug error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/boards/[slug]  — update a board (id passed as slug param)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const authHeader = extractAuthHeader(request);

    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Not authenticated', message: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const response = await fetch(`${BACKEND_URL}/api/boards/${slug}`, {
      method: 'PUT',
      headers: await buildBackendHeaders(request, authHeader),
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    if (error instanceof PublicOnlyProxyError)
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    console.error('Board PUT error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/boards/[slug]  — delete a board (id passed as slug param)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const authHeader = extractAuthHeader(request);

    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Not authenticated', message: 'Not authenticated' }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_URL}/api/boards/${slug}`, {
      method: 'DELETE',
      headers: await buildBackendHeaders(request, authHeader),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    if (error instanceof PublicOnlyProxyError)
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    console.error('Board DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
