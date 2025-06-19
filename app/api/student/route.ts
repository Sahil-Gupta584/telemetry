import { connectDb, Users } from "@/app/lib/mongodb";
import console from "console";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams;

    const studentId = search.get("studentId");
    if (!studentId) throw new Error("studentId not found");

    await connectDb();

    let student = await Users.findById({
      _id: new ObjectId(studentId),
    })
      .populate("contests")
      .populate("problems");

    if (!student) throw new Error("Student Not Found");

    return NextResponse.json({ ok: true, student });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ ok: false, error: (error as Error).message });
  }
}
