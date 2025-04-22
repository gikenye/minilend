import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url)
  const apiPath = pathname.replace("/api", "")

  try {
    // Forward the request to our backend
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3000"
    const response = await fetch(`${backendUrl}${apiPath}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Forward authorization header if present
        ...(request.headers.get("Authorization")
          ? { Authorization: request.headers.get("Authorization") as string }
          : {}),
      },
    })

    const data = await response.json()

    return NextResponse.json(data, {
      status: response.status,
    })
  } catch (error) {
    console.error("API route error:", error)
    return NextResponse.json({ error: "Failed to connect to backend service" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { pathname } = new URL(request.url)
  const apiPath = pathname.replace("/api", "")

  try {
    const body = await request.json()

    // Forward the request to our backend
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3000"
    const response = await fetch(`${backendUrl}${apiPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Forward authorization header if present
        ...(request.headers.get("Authorization")
          ? { Authorization: request.headers.get("Authorization") as string }
          : {}),
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    return NextResponse.json(data, {
      status: response.status,
    })
  } catch (error) {
    console.error("API route error:", error)
    return NextResponse.json({ error: "Failed to connect to backend service" }, { status: 500 })
  }
}
