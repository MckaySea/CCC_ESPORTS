import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    const formData = await request.json();
    console.log("[JOIN ROUTE] ✅ Received data:", formData);

    const { firstName, lastName, discord, phone, email, over18 } = formData;

    if (!firstName || !lastName || !discord || !phone || !email || !over18) {
      return NextResponse.json(
        { success: false, message: "Missing required form fields." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.from("applicants").insert([
      {
        first_name: firstName,
        last_name: lastName,
        email,
        discord_handle: discord,
        phone_number: phone,
        is_over_18: over18 === "yes",
      },
    ]);

    if (error) {
      console.error("[JOIN ROUTE] ❌ Supabase insert failed:", error.message);
      return NextResponse.json(
        {
          success: false,
          message: "Database insert failed.",
          error: error.message,
        },
        { status: 500 }
      );
    }

    console.log("[JOIN ROUTE] ✅ Data saved successfully:", data);
    return NextResponse.json(
      { success: true, message: "Application saved successfully.", data },
      { status: 200 }
    );
  } catch (error) {
    console.error("[JOIN ROUTE] 🛑 Error:", error.message);
    return NextResponse.json(
      { success: false, message: "Internal Server Error." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}
