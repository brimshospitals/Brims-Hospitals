import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export const dynamic = "force-dynamic";

export async function POST(request) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "de1yqlwub",
    api_key:    process.env.CLOUDINARY_API_KEY    || "938744481517128",
    api_secret: process.env.CLOUDINARY_API_SECRET || "igAsZ8Rh9-Q9MsL4CPrJeHcjXPE",
  });

  try {
    const formData = await request.formData();
    const file = formData.get("photo") || formData.get("file");

    if (!file) {
      return NextResponse.json(
        { success: false, message: "Photo nahi mili" },
        { status: 400 }
      );
    }

    // File ko buffer mein convert karo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Cloudinary pe upload karo
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: "brims-hospitals/members",
          transformation: [
            { width: 400, height: 400, crop: "fill", gravity: "face" },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error("Photo upload error:", error);
    return NextResponse.json(
      { success: false, message: "Upload failed: " + error.message },
      { status: 500 }
    );
  }
}