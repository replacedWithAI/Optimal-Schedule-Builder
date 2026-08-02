# authenticate.py

For the ones not listed (verify_oauth2_token, set_cookie, HTTPException),
you can inspect them with intellisense or Google it
Teehee

## GET /auth/login
No body. Browser is redirected to:
https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...

## GET /auth/callback?code=<one-time-code>
No body. Google appends the code as a query param.

## resp.json()
{
    "access_token":  "ya29.a0...",       # for calling Google APIs
    "expires_in":    3599,               # seconds until access_token expires
    "scope":         "openid email profile",
    "token_type":    "Bearer",
    "id_token":      "<signed JWT>"      # the one used for authentication
}

# The id_token
{
    "iss":            "https://accounts.google.com",  # issuer
    "aud":            "<your_client_id>",             # audience 
    "sub":            "1234567890",                   # Google's unique user ID
    "email":          "student@yorku.ca",
    "email_verified": true,
    "name":           "Jane Smith",
    "picture":        "https://...",
    "hd":             "yorku.ca",                     # hosted domain
    "iat":            1712000000,                     # issued at (unix timestamp)
    "exp":            1712003600                      # expires at
}

------------------------------------------------------------------------
# main.py

## GET /me — response if session cookie is valid
{
    "email": "student@yorku.ca",
    "name":  "Jane Smith"
}

## GET /me — response if no cookie or expired
HTTP 401
{
    "detail": "Not logged in"
}

## POST /calculate — same as before, but now requires the session cookie.
Cookie is sent automatically by the browser — no change to the request body.
HTTP 401 if missing, proceeds normally if valid.