"use client";
import { Student, studentSchema } from "@/app/lib/schema";
import { addToast, Button } from "@heroui/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Download, Eye, Search, SortAsc, SortDesc } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { errorHandler, getRatingColor } from "../utils";
import { DeleteStudentModel } from "./modals/deleteStudent";
import { EmailReminderModel } from "./modals/emailReminder";
import { StudentFormModel } from "./modals/studentForm";

export const StudentTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Student>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const { data: students, refetch } = useQuery({
    queryKey: ["getAllStudents"],
    queryFn: async () => {
      try {
        const res = await axios.get(`/api/student/getAll`);
        if (!res.data.ok) {
          addToast({
            color: "danger",
            title: res.data.error,
          });
          return;
        }
        return res.data.students as Student[];
      } catch (error) {
        errorHandler(error);
        return null;
      }
    },
  });
  const filteredStudents =
    (students &&
      students.filter(
        (student) =>
          student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.cf_handle.toLowerCase().includes(searchTerm.toLowerCase())
      )) ||
    [];

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];

    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortDirection === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    }

    return 0;
  });

  const handleSort = (field: keyof Student) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleCreateStudent = async (
    formDataRaw: Student,
    onClose: () => void
  ) => {
    try {
      const formData = await studentSchema.parseAsync(formDataRaw);

      const res = await axios.post("/api/student/create", {
        ...formData,
        reminderEmailCount: 0,
        isReminderEnabled: true,
      });
      if (!res.data.ok) {
        addToast({
          color: "danger",
          title: res.data.error,
        });
      }
      addToast({
        color: "success",
        title: "User Created",
      });

      refetch();
      if (onClose) onClose();
    } catch (error) {
      errorHandler(error);
    }
  };

  const handleUpdateStudent = async (
    formDataRaw: Student,
    onClose: () => void
  ) => {
    try {
      const res = await axios.post("/api/student/update", formDataRaw);
      if (!res.data.ok) {
        addToast({
          color: "danger",
          title: res.data.error,
        });
      }
      addToast({
        color: "success",
        title: "User Updated",
      });
      if (onClose) onClose();

      refetch();
    } catch (error) {
      errorHandler(error);
    }
  };
  const downloadCsv = useMutation({
    mutationKey: ["downloadCsv"],
    mutationFn: async () => {
      try {
        const headers = [
          "Name",
          "Email",
          "Phone",
          "Codeforces",
          "Current Rating",
          "Max Rating",
        ];
        const rows =
          students &&
          students.map((s) => [
            s.name,
            s.email,
            s.mobileNumber,
            s.cf_handle,
            s.currentRating,
            s.maxRating,
          ]);
        const csv =
          headers.join(",") +
          "\n" +
          (rows ? rows.map((r) => r.join(",")).join("\n") : []);
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "students.csv";
        a.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        errorHandler(error);
      }
    },
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-300">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Student Registry
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {filteredStudents.length} students enrolled
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onPress={() => downloadCsv.mutate()}
                isLoading={downloadCsv.isPending}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
              <StudentFormModel onSubmit={handleCreateStudent} />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {[
                { key: "name", label: "Student" },
                { key: "email", label: "Contact" },
                { key: "codeforcesHandle", label: "Codeforces" },
                { key: "currentRating", label: "Current Rating" },
                { key: "maxRating", label: "Max Rating" },
              ].map(({ key, label }) => (
                <th
                  key={key}
                  className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  onClick={() => handleSort(key as keyof Student)}
                >
                  <div className="flex items-center gap-2 cursor-pointer">
                    {label}
                    <div className="flex flex-col">
                      <SortAsc
                        className={`w-3 h-3 ${
                          sortField === key && sortDirection === "asc"
                            ? "text-blue-600"
                            : "text-slate-400 group-hover:text-slate-600"
                        }`}
                      />
                      <SortDesc
                        className={`w-3 h-3 -mt-1 ${
                          sortField === key && sortDirection === "desc"
                            ? "text-blue-600"
                            : "text-slate-400 group-hover:text-slate-600"
                        }`}
                      />
                    </div>
                  </div>
                </th>
              ))}
              <th className="px-8 py-5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedStudents.map((student) => (
              <tr
                key={student._id}
                className="hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors duration-150"
              >
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm shadow-soft">
                      {student.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {student.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {student.email}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {student.mobileNumber}
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="text-sm font-mono dark:text-blue-400 text-blue-600 bg-[#285beb4d] px-2 py-1 rounded">
                    {student.cf_handle}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`text-lg font-semibold ${getRatingColor(
                      student.currentRating
                    )}`}
                  >
                    {student.currentRating}
                  </span>
                </td>

                <td className="px-6 py-4 text-center">
                  <span
                    className={`text-lg font-semibold ${getRatingColor(
                      student.maxRating
                    )}`}
                  >
                    {student.maxRating}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2 ">
                    <Link href={`/student/${student._id}`}>
                      <button
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </Link>
                    <StudentFormModel
                      student={student}
                      onSubmit={handleUpdateStudent}
                    />
                    <DeleteStudentModel
                      email={student.email}
                      name={student.name}
                      userId={student._id}
                      refetch={refetch}
                    />
                    <EmailReminderModel
                      email={student.email}
                      name={student.name}
                      refetch={refetch}
                      handle={student.cf_handle}
                      isEnabled={student.isReminderEnabled}
                      reminderEmailCount={student.reminderEmailCount}
                      onSubmit={handleUpdateStudent}
                      userId={student._id}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedStudents.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-slate-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-50 mb-2">
            No students found
          </h3>
          <p className="text-slate-600 dark:text-gray-400">
            Try adjusting your search criteria or add a new student.
          </p>
        </div>
      )}
    </div>
  );
};
