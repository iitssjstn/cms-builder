import csrf from 'csurf';

export const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: false, // Wordt overschreven door session config
    sameSite: 'lax'
  }
});

export const csrfErrorHandler = (err: any, req: any, res: any, next: any) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ error: 'Ongeldig CSRF token, herlaad de pagina' });
  }
  next(err);
};
