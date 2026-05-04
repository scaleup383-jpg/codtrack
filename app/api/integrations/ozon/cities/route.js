import { NextResponse } from "next/server";

export async function GET() {
    try {
        const res = await fetch("https://api.ozonexpress.ma/cities");
        const cities = await res.json();
        return NextResponse.json({ success: true, cities });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}