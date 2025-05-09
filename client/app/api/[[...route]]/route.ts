import { type NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://k1-0sxo.onrender.com";

// Helper to forward all relevant headers
function getForwardedHeaders(request: NextRequest) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Forward authorization header if present
  const authHeader = request.headers.get("Authorization");
  if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  // Forward MiniPay specific headers
  const miniPayHeaders = [
    "x-minipay-wallet",
    "x-minipay-version",
    "x-minipay-signature",
  ];
  miniPayHeaders.forEach((header) => {
    const value = request.headers.get(header);
    if (value) {
      headers[header] = value;
    }
  });

  return headers;
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, x-minipay-wallet, x-minipay-version, x-minipay-signature",
    },
  });
}

export async function GET(request: NextRequest) {
  const { pathname, searchParams } = new URL(request.url);

  // Handle auth endpoints differently - they don't have /api prefix
  const isAuthEndpoint = pathname.startsWith("/api/auth/");
  
  // Handle lending-pool endpoints according to client-apis.json format
  let apiPath;
  if (isAuthEndpoint) {
    apiPath = pathname.replace("/api/auth/", "/auth/");
  } else if (pathname.startsWith("/api/lending-pool")) {
    // This handles the lending-pool base URL format from client-apis.json
    apiPath = pathname.replace("/api", "");
  } else {
    apiPath = pathname.replace("/api", "");
  }

  try {
    // Construct full URL with query parameters
    const url = new URL(apiPath, BACKEND_URL);
    searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });

    console.log("Forwarding GET request to:", url.toString());
    const response = await fetch(url, {
      method: "GET",
      headers: getForwardedHeaders(request),
    });

    const data = await response.json();
    console.log("Received response:", data);

    return new NextResponse(JSON.stringify(data), {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("API route error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to connect to backend service" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}

export async function POST(request: NextRequest) {
  const { pathname } = new URL(request.url);

  // Handle auth endpoints differently - they don't have /api prefix
  const isAuthEndpoint = pathname.startsWith("/api/auth/");
  
  // Handle lending-pool endpoints according to client-apis.json format
  let apiPath;
  if (isAuthEndpoint) {
    apiPath = pathname.replace("/api/auth/", "/auth/");
  } else if (pathname.startsWith("/api/lending-pool")) {
    // This handles the lending-pool base URL format from client-apis.json
    apiPath = pathname.replace("/api", "");
  } else {
    apiPath = pathname.replace("/api", "");
  }

  try {
    const body = await request.json();
    const url = `${BACKEND_URL}${apiPath}`;
    console.log("Forwarding POST request to:", url);

    const response = await fetch(url, {
      method: "POST",
      headers: getForwardedHeaders(request),
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log("Received response:", data);

    return new NextResponse(JSON.stringify(data), {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("API route error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to connect to backend service" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
