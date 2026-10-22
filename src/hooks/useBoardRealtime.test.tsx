import { renderHook, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { ReactNode } from 'react';

// Stage 3b-2 step 4: realtime hooks must never touch the socket on a custom
// host (read-only by design — no session exists on a customer origin).

const sock = vi.hoisted(() => ({
  getSocket: vi.fn(),
  joinBoardRoom: vi.fn(),
  leaveBoardRoom: vi.fn(),
  joinPostRoom: vi.fn(),
  leavePostRoom: vi.fn(),
}));

vi.mock('@/lib/socket', () => ({
  getSocket: sock.getSocket,
  joinBoardRoom: sock.joinBoardRoom,
  leaveBoardRoom: sock.leaveBoardRoom,
  joinPostRoom: sock.joinPostRoom,
  leavePostRoom: sock.leavePostRoom,
}));

import { useBoardRealtime } from './useBoardRealtime';
import { usePostRealtime } from './usePostRealtime';
import { CustomHostProvider } from '@/context/CustomHostContext';

const fakeSocket = { on: vi.fn(), off: vi.fn(), once: vi.fn(), connected: true };

function wrapperFor(value: boolean) {
  return ({ children }: { children: ReactNode }) => (
    <CustomHostProvider value={value}>{children}</CustomHostProvider>
  );
}

beforeEach(() => {
  sock.getSocket.mockReset().mockReturnValue(fakeSocket);
  sock.joinBoardRoom.mockReset();
  sock.joinPostRoom.mockReset();
  fakeSocket.on.mockReset();
  fakeSocket.off.mockReset();
  fakeSocket.once.mockReset();
});

afterEach(() => cleanup());

describe('useBoardRealtime', () => {
  it('custom host: never touches the socket', () => {
    renderHook(() => useBoardRealtime({ boardSlug: 'ideas' }), {
      wrapper: wrapperFor(true),
    });
    expect(sock.getSocket).not.toHaveBeenCalled();
    expect(sock.joinBoardRoom).not.toHaveBeenCalled();
  });

  it('first-party: joins the board room', () => {
    renderHook(() => useBoardRealtime({ boardSlug: 'ideas' }), {
      wrapper: wrapperFor(false),
    });
    expect(sock.getSocket).toHaveBeenCalled();
    expect(sock.joinBoardRoom).toHaveBeenCalledWith('ideas');
  });
});

describe('usePostRealtime', () => {
  it('custom host: never touches the socket', () => {
    renderHook(() => usePostRealtime({ postId: 'post-1' }), {
      wrapper: wrapperFor(true),
    });
    expect(sock.getSocket).not.toHaveBeenCalled();
    expect(sock.joinPostRoom).not.toHaveBeenCalled();
  });

  it('first-party: joins the post room', () => {
    renderHook(() => usePostRealtime({ postId: 'post-1' }), {
      wrapper: wrapperFor(false),
    });
    expect(sock.joinPostRoom).toHaveBeenCalledWith('post-1');
  });
});
