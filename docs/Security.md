# Security Implementation Details

Guardian Live Enterprise implements strict security policies to protect user privacy and dispatch reliability.

## 1. Authentication & Session Revocation
- **Access Tokens**: Short-lived JWT access tokens with strict expiration.
- **Refresh Tokens**: Saved in HTTP-only, secure, SameSite cookies to mitigate XSS vector token theft.
- **Session Revocation**: Storing token IDs in Redis allow immediate session revocation on logout or password change.

## 2. API Security
- **CORS Configuration**: Explicit white-listing of origins.
- **Rate Limiting**: IP-based rate limiting via Nginx and route decorators in FastAPI/Redis.
- **Input Validation**: Strictly enforced at entry points using Pydantic (Backend) and Zod (Frontend).
- **SQL Injection Prevention**: Forced database transactions using SQLAlchemy ORM parameterized queries.

## 3. User Privacy Controls
- **Permission Boundary**: Location sharing requires explicit, runtime OS permission prompt.
- **No Covert Tracking**: Geolocation streaming only triggers when the user is authenticated and is logged into the application.
