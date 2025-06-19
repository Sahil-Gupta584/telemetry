import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    cf_handle: {
      type: String,
      unique: true,
    },
    mobileNumber: String,
    currentRating: Number,
    maxRating: Number,
    contests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "contests",
      },
    ],
    problems: [
      {
        ref: "problems",
        type: mongoose.Types.ObjectId,
      },
    ],
    reminderEmailCount: { type: Number, default: 0 },
    isReminderEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const problemsInfoSchema = new mongoose.Schema({
  contestId: Number,
  index: String,
  name: String,
  type: String,
  points: Number,
  rating: Number,
  tags: [String],
});

const problemAuthorSchema = new mongoose.Schema({
  members: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "users",
  },
});
const problemSchema = new mongoose.Schema({
  id: Number,
  contestId: Number,
  creationTimeSeconds: Number,
  problem: problemsInfoSchema,
  author: problemAuthorSchema,
  verdict: String,
});

const ContestSchema = new mongoose.Schema({
  contestId: {
    type: Number,
    required: true,
  },
  contestName: {
    type: String,
    required: true,
  },
  handle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },
  rank: {
    type: Number,
    required: true,
  },
  ratingUpdateTimeSeconds: {
    type: Number,
    required: true,
  },
  oldRating: {
    type: Number,
    required: true,
  },
  newRating: {
    type: Number,
    required: true,
  },
});

export const Contests =
  mongoose.models?.contests || mongoose.model<any>("contests", ContestSchema);

export const Users =
  mongoose.models.users ?? mongoose.model<any>("users", UserSchema);

export const Problems =
  mongoose.models?.problems || mongoose.model<any>("problems", problemSchema);

export async function connectDb() {
  await mongoose.connect(process.env.MONGODB_URL!);
}
