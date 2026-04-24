import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export const dynamic = "force-dynamic";

// Config is set inside POST handler for serverless compatibility

// Supported: PDF, PNG, JPG, JPEG, WEBP
const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

export async function POST(request) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "de1yqlwub",
    api_key:    process.env.CLOUDINARY_API_KEY    || "938744481517128",
    api_secret: process.env.CLOUDINARY_API_SECRET || "igAsZ8Rh9-Q9MsL4CPrJeHcjXPE",
  });

  try {
    const formData = await request.formData();
    const file     = formData.get("file");

    if (!file) {
      return NextResponse.json({ success: false, message: "File nahi mili" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "Sirf PDF ya Image (JPG/PNG) upload karein" },
        { status: 400 }
      );
    }

    // Max 10 MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: "File size 10 MB se zyada nahi honi chahiye" },
        { status: 400 }
      );
    }

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const isPdf    = file.type === "application/pdf";
    const fileType = isPdf ? "pdf" : "image";

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder:        "brims-hospitals/reports",
          resource_type: isPdf ? "raw" : "image",
          format:        isPdf ? "pdf"  : undefined,
        },
        (error, res) => {
          if (error) reject(error);
          else resolve(res);
        }
      ).end(buffer);
    });

    return NextResponse.json({
      success:  true,
      url:      result.secure_url,
      publicId: result.public_id,
      fileType,
    });
  } catch (error) {
    console.error("Report upload error:", error);
    return NextResponse.json(
      { success: false, message: "Upload failed: " + error.message },
      { status: 500 }
    );
  }
}
