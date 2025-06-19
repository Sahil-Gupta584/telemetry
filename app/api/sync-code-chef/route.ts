import { syncStudentData } from "@/app/lib/actions";
import { connectDb, Users } from "@/app/lib/mongodb";
import { Student } from "@/app/lib/schema";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDb();
    const students: Student[] = await Users.find({});
    if (students) {
      for (const s of students) {
        await syncStudentData(s);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ ok: false, error: (error as Error).message });
  }
}
