import { type NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5001";

// Helper to forward all relevant headers
function getForwardedHeaders(request: NextRequest) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Forward Authorization header if present
  const authHeader = request.headers.get("Authorization");
  if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  // Forward MiniPay specific headers if present
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

export async function GET(request: NextRequest) {
  const { pathname, searchParams } = new URL(request.url);
  const apiPath = pathname.replace("/api", "");

  try {
    // Construct full URL with query parameters
    const url = new URL(apiPath, BACKEND_URL);
    searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url, {
      method: "GET",
      headers: getForwardedHeaders(request),
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        "Cache-Control": response.headers.get("Cache-Control") || "no-cache",
      },
    });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "Failed to connect to backend service" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const apiPath = pathname.replace("/api", "");

  try {
    const body = await request.json();
    const response = await fetch(`${BACKEND_URL}${apiPath}`, {
      method: "POST",
      headers: getForwardedHeaders(request),
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "Failed to connect to backend service" },
      { status: 500 }
    );
  }
}
