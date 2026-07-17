import { NextRequest, NextResponse } from 'next/server';
import { extractAuthHeader, buildBackendHeaders, BACKEND_URL } from '@/lib/proxyHelper';

// GET /api/boards/[slug]  — fetch a single board by slug
export async function GET(
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

    const response = await fetch(`${BACKEND_URL}/api/boards/${slug}`, {
      method: 'GET',
      headers: buildBackendHeaders(authHeader, { 'x-subdomain': subdomain }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
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
    const subdomain = request.headers.get('x-subdomain') || '';

    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const response = await fetch(`${BACKEND_URL}/api/boards/${slug}`, {
      method: 'PUT',
      headers: buildBackendHeaders(authHeader, { 'x-subdomain': subdomain }),
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
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
    const subdomain = request.headers.get('x-subdomain') || '';

    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_URL}/api/boards/${slug}`, {
      method: 'DELETE',
      headers: buildBackendHeaders(authHeader, { 'x-subdomain': subdomain }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Board DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
