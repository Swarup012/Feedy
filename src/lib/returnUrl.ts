/**
 * Return URL Management for Post-Auth Redirects
 * Handles saving and retrieving URLs to return users to after login/signup
 */

interface ReturnUrlContext {
  path: string;
  search: string; // Query parameters
  subdomain: string | null;
  timestamp: number;
}

const RETURN_URL_KEY = 'authReturnUrl';
const MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Extract subdomain from hostname
 */
function getSubdomain(): string | null {
  if (typeof window === 'undefined') return null;
  
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  // localhost with subdomain: notion.localhost
  if (hostname.includes('localhost') && parts.length > 1 && parts[0] !== 'localhost') {
    return parts[0];
  }
  
  // Production domain with subdomain: notion.example.com
  if (parts.length >= 3 && !['www', 'api', 'admin'].includes(parts[0])) {
    return parts[0];
  }
  
  return null;
}

/**
 * Check if a path is a public page that should be returned to
 */
function isPublicPage(path: string): boolean {
  return path.startsWith('/feedback') || 
         path.startsWith('/roadmap') || 
         path.startsWith('/changelog');
}

/**
 * Check if a path is an internal page that should be returned to
 */
function isInternalPage(path: string): boolean {
  return path.startsWith('/admin') || path.startsWith('/dashboard');
}

/**
 * Check if a path should be ignored (auth pages, homepage)
 */
function shouldIgnorePath(path: string): boolean {
  return path === '/' || 
         path.startsWith('/login') || 
         path.startsWith('/signup') || 
         path.startsWith('/onboarding');
}

/**
 * Save the current URL as return destination
 * Only saves if it's a meaningful page (public or internal)
 */
export function saveReturnUrl(): void {
  if (typeof window === 'undefined') return;
  
  const path = window.location.pathname;
  const search = window.location.search;
  
  console.log('🔍 saveReturnUrl called:', { path, search });
  
  // Don't save auth pages or homepage
  if (shouldIgnorePath(path)) {
    console.log('🚫 Not saving return URL - ignoring path:', path);
    return;
  }
  
  // Only save public or internal pages
  if (!isPublicPage(path) && !isInternalPage(path)) {
    console.log('🚫 Not saving return URL - not a public/internal page:', path);
    return;
  }
  
  const context: ReturnUrlContext = {
    path,
    search,
    subdomain: getSubdomain(),
    timestamp: Date.now(),
  };
  
  try {
    sessionStorage.setItem(RETURN_URL_KEY, JSON.stringify(context));
    console.log('💾 Saved return URL:', { 
      path, 
      search, 
      subdomain: context.subdomain,
      fullContext: context 
    });
  } catch (error) {
    console.error('Failed to save return URL:', error);
  }
}

/**
 * Get the saved return URL if it exists and is valid
 * Returns null if no valid return URL exists
 */
export function getReturnUrl(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = sessionStorage.getItem(RETURN_URL_KEY);
    console.log('🔍 getReturnUrl - checking sessionStorage:', { stored });
    
    if (!stored) {
      console.log('❌ No return URL found in sessionStorage');
      return null;
    }
    
    const context: ReturnUrlContext = JSON.parse(stored);
    console.log('📦 Parsed return URL context:', context);
    
    // Check if URL is stale (older than 30 minutes)
    if (Date.now() - context.timestamp > MAX_AGE_MS) {
      console.log('⏰ Return URL expired, clearing');
      clearReturnUrl();
      return null;
    }
    
    // Validate subdomain matches current subdomain
    const currentSubdomain = getSubdomain();
    console.log('🌐 Subdomain check:', { 
      saved: context.subdomain, 
      current: currentSubdomain 
    });
    
    if (context.subdomain !== currentSubdomain) {
      console.log('🌐 Return URL subdomain mismatch:', {
        saved: context.subdomain,
        current: currentSubdomain
      });
      // Still allow if moving from subdomain to main or vice versa
      // Just clear the context
      clearReturnUrl();
      return null;
    }
    
    const fullUrl = context.path + context.search;
    console.log('✅ Retrieved valid return URL:', fullUrl);
    return fullUrl;
    
  } catch (error) {
    console.error('Failed to retrieve return URL:', error);
    clearReturnUrl();
    return null;
  }
}

/**
 * Get return URL specifically for public pages
 * Returns the URL only if it's a public page
 */
export function getPublicReturnUrl(): string | null {
  const returnUrl = getReturnUrl();
  if (!returnUrl) return null;
  
  // Extract path (remove query params for check)
  const path = returnUrl.split('?')[0];
  
  if (isPublicPage(path)) {
    return returnUrl;
  }
  
  console.log('🚫 Return URL is not a public page:', path);
  return null;
}

/**
 * Get return URL specifically for internal pages
 * Returns the URL only if it's an internal page
 */
export function getInternalReturnUrl(): string | null {
  const returnUrl = getReturnUrl();
  if (!returnUrl) return null;
  
  // Extract path (remove query params for check)
  const path = returnUrl.split('?')[0];
  
  if (isInternalPage(path)) {
    return returnUrl;
  }
  
  console.log('🚫 Return URL is not an internal page:', path);
  return null;
}

/**
 * Clear the saved return URL
 */
export function clearReturnUrl(): void {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.removeItem(RETURN_URL_KEY);
    console.log('🗑️ Cleared return URL');
  } catch (error) {
    console.error('Failed to clear return URL:', error);
  }
}

/**
 * Check if there's a valid return URL saved
 */
export function hasReturnUrl(): boolean {
  return getReturnUrl() !== null;
}
