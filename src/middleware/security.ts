import helmet from 'helmet';
import crypto from 'crypto';

export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://cdn.jsdelivr.net'],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xFrameOptions: { action: 'deny' },
  xContentTypeOptions: true,
  xDnsPrefetchControl: { allow: false },
  xDownloadOptions: true,
  xPermittedCrossDomainPolicies: { permittedPolicies: 'none' }
});

export const previewFrameMiddleware = (_req: any, res: any, next: any) => {
  res.removeHeader('X-Frame-Options');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const cspHeader = res.getHeader('Content-Security-Policy');
  if (typeof cspHeader === 'string') {
    const newCsp = cspHeader
      .replace(/frame-src\s+[^;]+/, "frame-src 'self'")
      .replace(/frame-ancestors\s+[^;]+/, "frame-ancestors 'self'");
    res.setHeader('Content-Security-Policy', newCsp);
  }

  next();
};

export const cspNonceMiddleware = (req: any, res: any, next: any) => {
  const nonce = crypto.randomUUID().replace(/-/g, '');
  res.locals.cspNonce = nonce;
  
  // Update CSP header with nonce
  const cspHeader = res.getHeader('Content-Security-Policy');
  if (cspHeader && typeof cspHeader === 'string') {
    const newCsp = cspHeader
      .replace("script-src 'self'", `script-src 'self' 'nonce-${nonce}'`)
      .replace("style-src 'self'", `style-src 'self' 'nonce-${nonce}'`);
    res.setHeader('Content-Security-Policy', newCsp);
  }
  next();
};
