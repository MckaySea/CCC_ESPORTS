import { NextResponse } from "next/server";

const BOT_WEBHOOK_URL =
  process.env.BOT_WEBHOOK_URL || "http://localhost:3001/webhook/application";

/**
 * Handles POST requests from the client-side modal.
 */
export async function POST(request) {
  let formData;
  try {
    formData = await request.json();
    console.log("[NEXT.JS ROUTE] ✅ Successfully parsed incoming JSON body.");
    console.log("[NEXT.JS ROUTE] Data received:", formData); // Log the received data
  } catch (error) {
    console.error("[NEXT.JS ROUTE] ❌ Invalid JSON body received:", error);
    return NextResponse.json(
      { success: false, message: "Invalid JSON body." },
      { status: 400 }
    );
  }

  // Next.js Validation
  if (!formData.name || !formData.discord || !formData.email) {
    console.warn(
      "[NEXT.JS ROUTE] ⚠️ Missing required fields in received data."
    );
    return NextResponse.json(
      { success: false, message: "Missing required form data." },
      { status: 400 }
    );
  }

  // Log the URL it's about to connect to
  console.log(
    `[NEXT.JS ROUTE] 📡 Attempting to forward data to: ${BOT_WEBHOOK_URL}`
  );

  try {
    const response = await fetch(BOT_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const botResponse = await response.json();

    // Log the full response from the bot server
    console.log(
      `[NEXT.JS ROUTE] ⬅️ Bot Server Response Status: ${response.status}`
    );
    console.log("[NEXT.JS ROUTE] ⬅️ Bot Server Body:", botResponse);

    if (response.ok) {
      // The bot successfully received and processed the request
      return NextResponse.json(
        {
          success: true,
          message: "Application forwarded and confirmed by bot.",
        },
        { status: 200 }
      );
    } else {
      // The bot's webhook returned an error (e.g., 400 or 503)
      console.error(
        `[NEXT.JS ROUTE] ❌ Bot webhook returned error (${response.status}):`,
        botResponse.message
      );
      return NextResponse.json(
        {
          success: false,
          message: `Bot server error: ${
            botResponse.message || "Could not post to Discord."
          }`,
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error(
      `[NEXT.JS ROUTE] 🛑 Fatal Error connecting to bot server (${BOT_WEBHOOK_URL}):`,
      error.message
    );
    return NextResponse.json(
      {
        success: false,
        message: "Failed to connect to the dedicated bot server.",
      },
      { status: 502 }
    );
  }
}

// Optionally, handle other methods (e.g., return 405 for GET)
export async function GET() {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}
