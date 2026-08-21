const ALLOWED_ORIGIN = "https://replacedwithai.github.io";

export default {
  async fetch(request, env) {
    const corsHeaders = {
	  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
	  "Access-Control-Allow-Credentials": "true",
	  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
	  "Access-Control-Allow-Headers": "Content-Type, X-Turnstile-Token, Authorization",
	};

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    const url = new URL(request.url);
    const isApiRoute = url.pathname.startsWith("/auth/") || 
                       url.pathname === "/calculate" || url.pathname === "/me";

    if (!isApiRoute) {
      const githubUrl = `https://replacedwithai.github.io${url.pathname}${url.search}`;
      return fetch(githubUrl, {cf: {cacheTtl: 300, cacheEverything: true} });
    }

    const needsTurnstileToken = (url.pathname === "/calculate" && request.method === "POST");
    const needsTurnstileHeader = url.pathname === "auth/login";

    if (needsTurnstileToken || needsTurnstileHeader) {
      const token = needsTurnstileToken ? 
                    request.headers.get("X-Turnstile-Token") :
                    url.searchParams.get("cf_turnstile_token");
      if (!token) {
        return new Response(JSON.stringify({ error: "Missing Turnstile token" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const formData = new FormData();
      formData.append("secret", env.TURNSTILE_SECRET);
      formData.append("response", token);

      const ip = request.headers.get("CF-Connecting-IP");
      if (ip) formData.append("remoteip", ip);

      let outcome;
      try {
        const verifyResult = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",
          { method: "POST", body: formData });
        outcome = await verifyResult.json();
      } catch {
        return new Response(JSON.stringify({ error: "Verification unavailable" }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (!outcome.success) {
        return new Response(JSON.stringify({ error: "Invalid token" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (needsTurnstileQuery) url.searchParams.delete("cf_turnstile_token");
    }

    const targetUrl = `${env.AZURE_BACKEND_URL}${url.pathname}${url.search}`;
    const forwardHeaders = new Headers(request.headers);
    forwardHeaders.set("X-Backend-Secret", env.AZURE_SHARED_SECRET);
    forwardHeaders.set("X-Forwarded-For", request.headers.get("CF-Connecting-IP") ?? "");
    forwardHeaders.delete("X-Turnstile-Token");

  const azureResp = await fetch(targetUrl, {
    method: request.method,
    headers: forwardHeaders,
    body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
    redirect: "manual",
  });

  if (azureResp.status === 0 || (azureResp.status >= 300 && azureResp.status < 400)) {
    const redirectHeaders = new Headers();

    const location = azureResp.headers.get("location");
    if (location) redirectHeaders.set("Location", location);

    for (const cookie of azureResp.headers.getSetCookie()) {
      redirectHeaders.append("Set-Cookie", cookie);
    }

    Object.entries(corsHeaders).forEach(([k, v]) => redirectHeaders.set(k, v));

    return new Response(null, {
      status: 307,
      headers: redirectHeaders,
    });
  }

  const respHeaders = new Headers(azureResp.headers);
  Object.entries(corsHeaders).forEach(([k, v]) => respHeaders.set(k, v));
    return new Response(azureResp.body, {
      status: azureResp.status,
      statusText: azureResp.statusText,
      headers: respHeaders,
  });
  }
};