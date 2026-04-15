import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Article   from "../../../../models/Article";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
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

export async function PATCH(request, { params }) {
  try {
    const { id }  = await params;
    const updates = await request.json();
    await connectDB();

    const allowed = ["isPublished", "title", "blocks", "diseaseTags", "generalTags"];
    const update  = {};
    for (const key of allowed) {
      if (key in updates) update[key] = updates[key];
    }

    const article = await Article.findByIdAndUpdate(id, update, { new: true });
    if (!article) return NextResponse.json({ success: false, message: "Article nahi mila" }, { status: 404 });

    return NextResponse.json({ success: true, article });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await connectDB();
    await Article.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Article delete ho gaya" });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
