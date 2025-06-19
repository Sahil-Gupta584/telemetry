"use server";
import axios from "axios";
import nodemailer from "nodemailer";
import { Contests, Problems, Users } from "./mongodb";
import { Contest, Problem, Student } from "./schema";

const CF_API_BASE_URL = "https://codeforces.com/api";

export async function syncStudentData(s: Student) {
  // update student rating info
  const infoRes = await axios.get(
    `${CF_API_BASE_URL}/user.info?handles=${s.cf_handle}`
  );
  const studentInfo = infoRes.data?.result?.[0];
  const user = await Users.findByIdAndUpdate(
    { _id: s._id },
    {
      maxRating: studentInfo.maxRating,
      currentRating: studentInfo.rating,
    },
    { new: true }
  );
  if (user.isReminderEnabled) {
    const res = await axios.get(
      `${CF_API_BASE_URL}/user.status?handle=${s.cf_handle}&count=1`
    );
    const latest = res.data?.result?.[0];

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const hasNoRecentSubmission =
      !latest || latest.creationTimeSeconds * 1000 < sevenDaysAgo;

    if (hasNoRecentSubmission) {
      await sendReminderEmail(s.email, s.name);

      // Increment reminderEmailCount by 1
      await Users.updateOne(
        { _id: s._id },
        { $inc: { reminderEmailCount: 1 } }
      );
    }
  }
  console.log("updated user info");

  const newContests: Contest[] = [];

  const res = await axios.get(
    `${CF_API_BASE_URL}/user.rating?handle=${s.cf_handle}`
  );
  const allContest: Contest[] = res.data.result;

  for (const c of allContest) {
    const exists = await Contests.findOne({
      contestId: c.contestId,
      handle: s._id,
    });
    console.log(allContest.indexOf(c));

    if (!exists) {
      newContests.push({ ...c, handle: s });
    }
  }

  if (newContests.length > 0) {
    const insertedContests = await Contests.insertMany(newContests);
    await Users.updateOne(
      { _id: s._id },
      { $push: { contests: { $each: insertedContests.map((c) => c._id) } } }
    );
  }
  console.log("updated user contests");

  // sync  problems
  const problemBatchSize = 10;
  let problemStart = 1;
  const fetchedProblems: Problem[] = [];

  while (true) {
    const res = await axios.get(
      `${CF_API_BASE_URL}/user.status?handle=${s.cf_handle}&from=${problemStart}&count=${problemBatchSize}`
    );
    const batch = res.data?.result as Problem[];

    if (!batch || batch.length === 0) break;

    let anyNew = false;

    for (const p of batch) {
      const existing = await Problems.findOne({ id: p.id });

      if (!existing) {
        fetchedProblems.push({
          id: p.id,
          contestId: p.contestId,
          creationTimeSeconds: p.creationTimeSeconds,
          problem: p.problem,
          verdict: p.verdict,
          author: { members: [s] },
        });
        anyNew = true;
      } else {
        const isMember = existing.author.members.some(
          (m: string) => m === s._id
        );

        if (!isMember) {
          await Problems.updateOne(
            { id: p.id },
            { $push: { "author.members": s._id } }
          );
        }
      }
    }

    if (!anyNew) break;
    problemStart += problemBatchSize;
  }

  if (fetchedProblems.length > 0) {
    const insertedProblems = await Problems.insertMany(fetchedProblems);
    await Users.updateOne(
      { _id: s._id },
      { $push: { problems: { $each: insertedProblems.map((p) => p._id) } } }
    );
  }
  console.log("updated user problems");
}

export async function sendReminderEmail(to: string, name: string) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: "⏰ Get back to solving problems!",
    html: `<p>Hi ${name},</p>
           <p>We noticed you haven’t submitted any Codeforces problems in a while. How about picking one today? 🚀</p>
           <p>Keep grinding! 💪</p>`,
  });
}
