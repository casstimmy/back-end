import { mongooseConnect } from "@/lib/mongoose";
import { Transaction } from "@/models/Transactions";
import Expense from "@/models/Expense";

// Helper to determine tax band based on revenue
const getTaxBand = (revenue) => {
  if (revenue <= 25_000_000) return { band: "Small", citRate: 0 };
  if (revenue <= 100_000_000) return { band: "Medium", citRate: 20 };
  return { band: "Large", citRate: 30 };
};

// Helper to get date range based on period
const getDateRange = (period) => {
  const now = new Date();
  let startDate, endDate = now;

  switch (period) {
    case "last-month":
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    case "last-quarter":
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    case "last-year":
      startDate = new Date(now.getFullYear() - 1, 0, 1);
      endDate = new Date(now.getFullYear() - 1, 11, 31);
      break;
    case "this-month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = now;
      break;
    case "this-quarter":
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      endDate = now;
      break;
    case "this-year":
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = now;
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = now;
  }

  return { startDate, endDate };
};

// Helper to calculate monthly breakdown
const getMonthlyBreakdown = async (startDate, endDate, transactions, expenses) => {
  const breakdown = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const monthTransactions = transactions.filter(
      (t) => new Date(t.createdAt) >= monthStart && new Date(t.createdAt) <= monthEnd
    );

    const monthExpenses = expenses.filter(
      (e) => new Date(e.createdAt) >= monthStart && new Date(e.createdAt) <= monthEnd
    );

    const income = monthTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
    const expenseAmount = monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    const vat = (income * 7.5) / 100;
    const nhl = (income * 0.5) / 100;

    const monthName = monthStart.toLocaleString("default", { month: "long", year: "numeric" });

    breakdown.push({
      month: monthName,
      income,
      expenses: expenseAmount,
      vat,
      cit: 0, // Will be calculated based on tax band
      nhl,
    });

    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  }

  return breakdown;
};

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    await mongooseConnect();

    const { period = "last-month" } = req.query;
    const { startDate, endDate } = getDateRange(period);


    // Fetch transactions and expenses for the period
    const transactions = await Transaction.find({
      createdAt: { $gte: startDate, $lte: endDate },
    }).lean();

    const expenses = await Expense.find({
      createdAt: { $gte: startDate, $lte: endDate },
    }).lean();

    // Calculate totals
    const totalRevenue = transactions.reduce((sum, t) => sum + (t.total || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;


    // Get tax band info
    const { band, citRate } = getTaxBand(totalRevenue);

    // Calculate taxes
    const companyIncomeTax = (netProfit * citRate) / 100;
    const vatAmount = (totalRevenue * 7.5) / 100;
    const nhlAmount = (totalRevenue * 0.5) / 100;
    const totalTaxLiability = companyIncomeTax + vatAmount + nhlAmount;

    // Get monthly breakdown
    const breakdown = await getMonthlyBreakdown(startDate, endDate, transactions, expenses);

    // Calculate CIT for each month
    breakdown.forEach((item) => {
      const monthProfit = item.income - item.expenses;
      item.cit = (monthProfit * citRate) / 100;
    });

    const response = {
      success: true,
      period,
      band,
      citRate,
      vatRate: 7.5,
      nhlRate: 0.5,
      totalRevenue,
      totalExpenses,
      netProfit,
      companyIncomeTax,
      vatAmount,
      nhlAmount,
      totalTaxLiability,
      breakdown,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    };


    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to calculate tax analysis",
      details: error.message,
    });
  }
}
