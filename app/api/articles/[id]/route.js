import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Article   from "../../../../models/Article";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    const { id } = params;
    await connectDB();

    const article = await Article.findById(id);
    if (!article) {
      return NextResponse.json({ success: false, message: "Article nahi mila" }, { status: 404 });
    }

    // Increment views
    article.views += 1;
    await article.save();

    return NextResponse.json({ success: true, article });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    await connectDB();
    await Article.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Article delete ho gaya" });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
