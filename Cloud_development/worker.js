const ALLOWED_ORIGIN = "https://replacedwithai.github.io";

export default {
  async fetch(request, env) {
    const corsHeaders = {
	  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
	  "Access-Control-Allow-Credentials": "true",
	  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Turnstile-Token",
    };

    const url = new URL(request.url);
    const hasBearerToken = request.headers.get("Authorization")?.startsWith("Bearer ") ?? false;
    console.log("Proxy request", {
      method: request.method,
      path: url.pathname,
      hasBearerToken,
    });

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    const needsTurnstile = url.pathname === "/calculate" && request.method === "POST";

    if (needsTurnstile) {
      const token = request.headers.get("X-Turnstile-Token");
      const ip = request.headers.get("CF-Connecting-IP");
      if (!token) {
        return new Response(JSON.stringify({ error: "Missing Turnstile token" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const formData = new FormData();
      formData.append("secret", env.TURNSTILE_SECRET);
      formData.append("response", token);
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

  // Handle redirects separately — Set-Cookie/Location don't survive
  // the normal Headers() passthrough on manual-redirect responses
  if (azureResp.status === 0 || (azureResp.status >= 300 && azureResp.status < 400)) {
    const redirectHeaders = new Headers();

    const location = azureResp.headers.get("location");
    if (location) redirectHeaders.set("Location", location);

    const setCookies = azureResp.headers.getSetCookie();
    for (const cookie of setCookies) {
      redirectHeaders.append("Set-Cookie", cookie);
    }

    console.log("Proxy redirect", {
      path: url.pathname,
      status: azureResp.status,
      hasLocation: Boolean(location),
      setCookieCount: setCookies.length,
    });

    Object.entries(corsHeaders).forEach(([k, v]) => redirectHeaders.set(k, v));

    return new Response(null, {
      status: 307,
      headers: redirectHeaders,
    });
  }

// existing pass-through path, unchanged — only reached for non-redirects
  const respHeaders = new Headers(azureResp.headers);
  Object.entries(corsHeaders).forEach(([k, v]) => respHeaders.set(k, v));
    console.log("Proxy response", { path: url.pathname, status: azureResp.status });
    return new Response(azureResp.body, {
      status: azureResp.status,
      statusText: azureResp.statusText,
      headers: respHeaders,
  });
  }
};
