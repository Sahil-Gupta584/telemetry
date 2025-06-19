"use client";
import { Student } from "@/app/lib/schema";
import { addToast } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { ArrowLeft, Calendar, Target, TrendingUp, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Header from "../../components/header";
import { SubmissionHeatmap } from "../../components/submissionHeatmap";
import { errorHandler, getRatingColor } from "../../utils";

export interface FilterOptions {
  contestDays: 30 | 90 | 365;
  problemDays: 7 | 30 | 90;
}

type StudentProfileProps = {
  params: Promise<{
    studentId: string;
  }>;
};
export default function StudentProfile({ params }: StudentProfileProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    contestDays: 90,
    problemDays: 30,
  });
  const router = useRouter();
  const { data: student } = useQuery({
    queryKey: ["getStudent"],
    queryFn: async () => {
      try {
        const { studentId } = await params;

        const res = await axios.get(`/api/student?studentId=${studentId}`);
        if (!res.data.ok) {
          addToast({
            color: "danger",
            title: res.data.error,
          });
          return;
        }
        return res.data.student as Student;
      } catch (error) {
        errorHandler(error);
        return null;
      }
    },
  });
  console.log({ student });

  const contestData = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - filters.contestDays);

    return student && student.contests
      ? student.contests
          .filter(
            (contest) =>
              new Date(contest.ratingUpdateTimeSeconds * 1000) >= cutoffDate
          )
          .sort(
            (a, b) =>
              new Date(a.ratingUpdateTimeSeconds * 1000).getTime() -
              new Date(b.ratingUpdateTimeSeconds * 1000).getTime()
          )
          .map((contest) => ({
            ...contest,
            dateFormatted: new Date(
              contest.ratingUpdateTimeSeconds * 1000
            ).toLocaleDateString(),
          }))
      : [];
  }, [student, filters.contestDays]);

  const problemData = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - filters.problemDays);

    const recentProblems =
      student && student.problems
        ? student.problems.filter(
            (problem) =>
              new Date(problem.creationTimeSeconds * 1000) >= cutoffDate &&
              problem.verdict === "OK"
          )
        : [];

    const ratingBuckets = [800, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2400];
    const bucketCounts = ratingBuckets.map((rating) => ({
      rating: `${rating}+`,
      count: recentProblems.filter(
        (p) => p.problem.rating >= rating && p.problem.rating < rating + 200
      ).length,
    }));

    const ratedProblems = recentProblems.filter(
      (p) => typeof p.problem.rating === "number"
    );

    return {
      problems: recentProblems,
      bucketCounts,
      totalSolved: recentProblems.length,

      avgRating:
        ratedProblems.length > 0
          ? Math.round(
              ratedProblems.reduce((sum, p) => sum + p.problem.rating, 0) /
                ratedProblems.length
            )
          : 0,
      hardestProblem:
        recentProblems.length > 0
          ? recentProblems.reduce((prev, curr) =>
              (curr.problem.rating || 0) > (prev.problem.rating || 0)
                ? curr
                : prev
            )
          : null,
      avgPerDay: Math.round(recentProblems.length / filters.problemDays),
    };
  }, [student, filters.problemDays]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <Header
        leftElement={
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            {student && (
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                  {student.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {student.name}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-mono bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                      {student.cf_handle}
                    </span>
                    <span>
                      Current Rating:{" "}
                      <span
                        className={`font-semibold ${getRatingColor(
                          student.currentRating
                        )}`}
                      >
                        {student.currentRating}
                      </span>
                    </span>
                    <span>
                      Max Rating:{" "}
                      <span
                        className={`font-semibold ${getRatingColor(
                          student.maxRating
                        )}`}
                      >
                        {student.maxRating}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Contest History Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-300">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Contest History
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Rating progression and contest performance
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {[30, 90, 365].map((days) => (
                  <button
                    key={days}
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        contestDays: days as FilterOptions["contestDays"],
                      }))
                    }
                    className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                      filters.contestDays === days
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {days} days
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6">
            {contestData.length > 0 ? (
              <>
                <div className="h-80 mb-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={contestData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="opacity-30"
                      />
                      <XAxis
                        dataKey="dateFormatted"
                        className="text-gray-600 dark:text-gray-400"
                      />
                      <YAxis
                        dataKey="newRating"
                        className="text-gray-600 dark:text-gray-400"
                      />
                      <Tooltip
                        labelFormatter={(value) => `Date: ${value}`}
                        formatter={(value, name) => [
                          value,
                          name === "newRating" ? "Rating" : name,
                        ]}
                        contentStyle={{
                          backgroundColor: "var(--tooltip-bg)",
                          border: "1px solid var(--tooltip-border)",
                          borderRadius: "8px",
                          color: "var(--tooltip-text)",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="newRating"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        {["Contest", "Date", "Rating", "Change", "Rank"].map(
                          (key) => (
                            <th
                              key={key}
                              className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase"
                            >
                              {key}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {contestData
                        .slice(-10)
                        .reverse()
                        .map((contest) => {
                          const ratingChange =
                            contest.oldRating - contest.newRating;
                          return (
                            <tr
                              key={contest.contestId}
                              className="hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                {contest.contestName}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                {contest.dateFormatted}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span
                                  className={`font-semibold ${getRatingColor(
                                    ratingChange
                                  )}`}
                                >
                                  {ratingChange}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span
                                  className={`font-semibold ${
                                    ratingChange > 0
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {ratingChange > 0 ? "+" : ""}
                                  {ratingChange}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
                                {contest.rank}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  No contests found in the selected time period
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Problem Solving Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-300">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <Target className="w-6 h-6 text-green-500" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Problem Solving Data
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Detailed problem-solving statistics and patterns
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {[7, 30, 90].map((days) => (
                  <button
                    key={days}
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        problemDays: days as FilterOptions["problemDays"],
                      }))
                    }
                    className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                      filters.problemDays === days
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {days} days
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">
                      Total Solved
                    </p>
                    <p className="text-2xl font-bold text-blue-900">
                      {problemData.totalSolved}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">
                      Average Rating
                    </p>
                    <p className="text-2xl font-bold text-green-900">
                      {problemData.avgRating}
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 text-sm font-medium">
                      Hardest Problem
                    </p>
                    <p className="text-sm font-bold text-purple-900">
                      {problemData.hardestProblem
                        ? `${problemData.hardestProblem.problem.name} ${problemData.hardestProblem.problem.rating}`
                        : "-"}
                    </p>
                  </div>
                  <Trophy className="w-8 h-8 text-purple-600" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-600 text-sm font-medium">
                      Problems/Day
                    </p>
                    <p className="text-2xl font-bold text-orange-900">
                      {problemData.avgPerDay}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Problems by Rating
                </h3>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={problemData.bucketCounts}>
                      {/* <CartesianGrid strokeDasharray="3 3" /> */}
                      <XAxis
                        dataKey="rating"
                        className="text-gray-600 dark:text-gray-400"
                      />
                      <YAxis className="text-gray-600 dark:text-gray-400" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--tooltip-bg)",
                          border: "1px solid var(--tooltip-border)",
                          borderRadius: "8px",
                          color: "var(--tooltip-text)",
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Submission Heatmap
                </h3>

                <SubmissionHeatmap
                  problems={problemData.problems}
                  problemFilterDay={filters.problemDays}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
