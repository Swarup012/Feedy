import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { verifySameOriginRequest } from './csrf';

function makeReq(headers: Record<string, string>): NextRequest {
  return new NextRequest('http://acme.faddy.site/api/public/posts/1/upvote', {
    method: 'POST',
    headers,
  });
}

describe('verifySameOriginRequest', () => {
  it('Sec-Fetch-Site: same-origin -> true', () => {
    expect(
      verifySameOriginRequest(
        makeReq({ 'sec-fetch-site': 'same-origin', host: 'acme.faddy.site' })
      )
    ).toBe(true);
  });

  it('Sec-Fetch-Site: none -> false (address bar / non-browser, not same-origin evidence)', () => {
    expect(
      verifySameOriginRequest(
        makeReq({ 'sec-fetch-site': 'none', host: 'acme.faddy.site' })
      )
    ).toBe(false);
  });

  it('Sec-Fetch-Site: same-site -> false (subdomain CSRF shape)', () => {
    expect(
      verifySameOriginRequest(
        makeReq({ 'sec-fetch-site': 'same-site', host: 'acme.faddy.site' })
      )
    ).toBe(false);
  });

  it('Sec-Fetch-Site: cross-site -> false', () => {
    expect(
      verifySameOriginRequest(
        makeReq({ 'sec-fetch-site': 'cross-site', host: 'acme.faddy.site' })
      )
    ).toBe(false);
  });

  it('no Sec-Fetch-Site, Origin exactly equals Host -> true', () => {
    expect(
      verifySameOriginRequest(
        makeReq({ origin: 'https://acme.faddy.site', host: 'acme.faddy.site' })
      )
    ).toBe(true);
  });

  it('no Sec-Fetch-Site, Origin host equal but with explicit :443, Host without -> false (exact string match, no URL normalization)', () => {
    expect(
      verifySameOriginRequest(
        makeReq({ origin: 'https://acme.faddy.site:443', host: 'acme.faddy.site' })
      )
    ).toBe(false);
  });

  it('no Sec-Fetch-Site, Origin host equal but with non-default port, Host without -> false', () => {
    expect(
      verifySameOriginRequest(
        makeReq({ origin: 'https://acme.faddy.site:8443', host: 'acme.faddy.site' })
      )
    ).toBe(false);
  });

  it('no Sec-Fetch-Site, Origin authority equals Host including port -> true', () => {
    expect(
      verifySameOriginRequest(
        makeReq({ origin: 'http://localhost:5173', host: 'localhost:5173' })
      )
    ).toBe(true);
  });

  it('no Sec-Fetch-Site, Origin host != Host -> false', () => {
    expect(
      verifySameOriginRequest(
        makeReq({ origin: 'https://evil.example', host: 'acme.faddy.site' })
      )
    ).toBe(false);
  });

  it('no Sec-Fetch-Site, no Origin -> false (fail closed)', () => {
    expect(verifySameOriginRequest(makeReq({ host: 'acme.faddy.site' }))).toBe(
      false
    );
  });

  it('no Sec-Fetch-Site, Origin: null -> false', () => {
    expect(
      verifySameOriginRequest(
        makeReq({ origin: 'null', host: 'acme.faddy.site' })
      )
    ).toBe(false);
  });

  it('no Sec-Fetch-Site, unparseable Origin -> false', () => {
    expect(
      verifySameOriginRequest(
        makeReq({ origin: 'not a url', host: 'acme.faddy.site' })
      )
    ).toBe(false);
  });
});
