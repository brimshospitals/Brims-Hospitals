import { NextResponse } from "next/server";
import connectDB     from "../../../lib/mongodb";
import Article       from "../../../models/Article";
import User         from "../../../models/User";
import Notification  from "../../../models/Notification";

export const dynamic = "force-dynamic";

/* ── GET — list published articles ── */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search      = searchParams.get("search")      || "";
    const diseaseTag  = searchParams.get("diseaseTag")  || "";
    const generalTag  = searchParams.get("generalTag")  || "";
    const page        = parseInt(searchParams.get("page") || "1");
    const limit       = parseInt(searchParams.get("limit") || "12");
    const all         = searchParams.get("all") === "true"; // admin: get drafts too

    await connectDB();

    const query = {};
    if (!all) query.isPublished = true;
    if (diseaseTag) query.diseaseTags = diseaseTag;
    if (generalTag) query.generalTags = generalTag;
    if (search) {
      query.$or = [
        { title:       { $regex: search, $options: "i" } },
        { authorName:  { $regex: search, $options: "i" } },
        { generalTags: { $regex: search, $options: "i" } },
      ];
    }

    const total    = await Article.countDocuments(query);
    const articles = await Article.find(query)
      .select("title coverImage authorName authorRole diseaseTags generalTags isPublished views createdAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({ success: true, articles, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

/* ── POST — create article ── */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      title, coverImage, blocks,
      authorName, authorId, authorRole,
      source, diseaseTags, generalTags,
      isPublished,
    } = body;

    if (!title || !authorName) {
      return NextResponse.json(
        { success: false, message: "Title aur Author naam zaruri hai" },
        { status: 400 }
      );
    }

    await connectDB();

    const article = await Article.create({
      title,
      coverImage:  coverImage  || "",
      blocks:      blocks      || [],
      authorName,
      authorId:    authorId    || null,
      authorRole:  authorRole  || "admin",
      source:      source      || "",
      diseaseTags: diseaseTags || [],
      generalTags: generalTags || [],
      isPublished: !!isPublished,
    });

    /* ── Trigger notifications for matching users ── */
    if (isPublished && diseaseTags && diseaseTags.length > 0) {
      const orConds = [];

      const nonPregnancyTags = diseaseTags.filter((t) => t !== "Pregnancy");
      if (nonPregnancyTags.length > 0) {
        orConds.push({ preExistingDiseases: { $in: nonPregnancyTags } });
      }
      if (diseaseTags.includes("Pregnancy")) {
        orConds.push({ isPregnant: true });
        orConds.push({ preExistingDiseases: "Pregnancy" });
      }

      if (orConds.length > 0) {
        const matchingUsers = await User.find(
          { $or: orConds, isActive: true },
          "_id"
        );

        if (matchingUsers.length > 0) {
          const notifications = matchingUsers.map((u) => ({
            userId:    u._id,
            type:      "article",
            title:     `Naya Health Article: ${title}`,
            message:   `${authorName} ne ek naya article publish kiya — aapki health ke liye important.`,
            articleId: article._id,
            isRead:    false,
          }));
          await Notification.insertMany(notifications, { ordered: false });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: isPublished ? "Article publish ho gaya!" : "Draft save ho gaya!",
      articleId: article._id.toString(),
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

/* ── PATCH — update/publish existing article ── */
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { articleId, ...updates } = body;

    if (!articleId) {
      return NextResponse.json({ success: false, message: "articleId zaruri hai" }, { status: 400 });
    }

    await connectDB();

    const existing = await Article.findById(articleId);
    if (!existing) {
      return NextResponse.json({ success: false, message: "Article nahi mila" }, { status: 404 });
    }

    const wasPublished = existing.isPublished;
    Object.assign(existing, updates);
    await existing.save();

    // Trigger notifications only when first publishing
    if (!wasPublished && updates.isPublished && existing.diseaseTags.length > 0) {
      const orConds = [];
      const nonPreg = existing.diseaseTags.filter((t) => t !== "Pregnancy");
      if (nonPreg.length > 0) orConds.push({ preExistingDiseases: { $in: nonPreg } });
      if (existing.diseaseTags.includes("Pregnancy")) {
        orConds.push({ isPregnant: true });
        orConds.push({ preExistingDiseases: "Pregnancy" });
      }
      if (orConds.length > 0) {
        const users = await User.find({ $or: orConds, isActive: true }, "_id");
        if (users.length > 0) {
          await Notification.insertMany(
            users.map((u) => ({
              userId:    u._id,
              type:      "article",
              title:     `Naya Health Article: ${existing.title}`,
              message:   `${existing.authorName} ne ek naya article publish kiya.`,
              articleId: existing._id,
              isRead:    false,
            })),
            { ordered: false }
          );
        }
      }
    }

    return NextResponse.json({ success: true, message: "Article update ho gaya!" });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
