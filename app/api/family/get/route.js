import connectDB from "@/lib/mongodb";
import FamilyMember from "@/models/FamilyCard";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    const members = await FamilyMember.find({ userId });

    return Response.json({
      success: true,
      data: members,
    });
  } catch (error) {
    return Response.json({
      success: false,
      message: error.message,
    });
  }
}