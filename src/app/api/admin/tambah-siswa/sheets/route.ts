import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sheetId = body?.sheetId;
    const range = body?.range || "B6:F";

    if (!sheetId || typeof sheetId !== "string") {
      return NextResponse.json({ error: "Invalid sheetId" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
    if (!apiKey) {
      console.error("Missing GOOGLE_SHEETS_API_KEY env var");
      return NextResponse.json(
        { error: "Server not configured" },
        { status: 500 }
      );
    }

    // basic validation for sheet id
    if (!/^[a-zA-Z0-9-_]+$/.test(sheetId)) {
      return NextResponse.json(
        { error: "Invalid sheetId format" },
        { status: 400 }
      );
    }

    const encodedRange = encodeURIComponent(range);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodedRange}?majorDimension=ROWS&key=${apiKey}`;

    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      console.error("Sheets API error:", res.status, text);
      return NextResponse.json(
        { error: "Failed to fetch sheet data" },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json({ values: data.values || [] });
  } catch (err) {
    console.error("Sheets proxy error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
