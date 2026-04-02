import connectDB from "@/lib/mongodb";
import FamilyMember from "@/models/FamilyCard";

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    const member = await FamilyMember.create(body);

    return Response.json({
      success: true,
      message: "Family member added",
      data: member,
    });
  } catch (error) {
    return Response.json({
      success: false,
      message: error.message,
    });
  }
}