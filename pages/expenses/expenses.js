import ExpenseForm from "@/components/ExpenseForm";
import Layout from "@/components/Layout";
import { useEffect, useState } from "react";
import { CalendarDays, CircleDollarSign, MapPin } from "lucide-react";

export default function ManageExpenses() {
  const [expenses, setExpenses] = useState([]);

  const fetchExpenses = async () => {
    const res = await fetch("/api/expenses");
    if (res.ok) {
      const data = await res.json();
      // Ensure it's an array
      setExpenses(Array.isArray(data) ? data : []);
    } else {
      console.error("Failed to fetch expenses");
      setExpenses([]);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Expense Management</h1>

        <div className="mb-10">
          <ExpenseForm onSaved={fetchExpenses} />
        </div>

        <h2 className="text-xl font-semibold mb-4 text-gray-700">Recent Expenses</h2>

        {expenses.length === 0 ? (
          <p className="text-gray-500">No expenses recorded yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2">
            {expenses.map((exp) => (
              <div
                key={exp._id}
                className="bg-white shadow-md p-5 rounded-xl border border-gray-100"
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <CircleDollarSign className="w-5 h-5 text-green-500" />
                    {exp.title}
                  </h3>
                  <span className="text-green-600 font-bold text-lg">
                    ₦{exp.amount?.toLocaleString()}
                  </span>
                </div>

                <div className="text-sm text-gray-500 flex flex-col gap-1 mb-2">
                  <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs uppercase w-fit">
                    {exp?.category?.name || "Uncategorized"}
                  </span>

                  {exp.location && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {exp.location}
                    </span>
                  )}
                </div>

                <div className="text-xs text-gray-400 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" />
                  {new Date(exp.createdAt).toLocaleDateString("en-NG", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </div>

                {exp.description && (
                  <p className="text-sm text-gray-600 mt-2">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
