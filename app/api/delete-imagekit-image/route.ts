import ImageKit from "imagekit";

import { NextResponse } from "next/server";

const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "",

  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",

  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { fileId } = body;

    if (!fileId) {
      return NextResponse.json(
        {
          error: "Missing fileId",
        },
        { status: 400 },
      );
    }

    await imagekit.deleteFile(fileId);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Delete failed",
      },
      { status: 500 },
    );
  }
}
