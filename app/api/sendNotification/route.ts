import { NextRequest, NextResponse } from "next/server";
import { adminMessaging } from "../../../lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { token, title, body, link } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: "Missing token" },
        { status: 400 }
      );
    }

    await adminMessaging.send({
      token,

      notification: {
        title,
        body,
      },

      webpush: {
        notification: {
          icon: "/icon.png",
          badge: "/icon.png",
          requireInteraction: true,
        },

        fcmOptions: {
          link: link || "/orders",
        },
      },
    });
console.log("FCM API HIT");
    return NextResponse.json({
      success: true,
      
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}