// Centralized tax policy configuration
// NOTE: 2025 values are placeholders — update to match the actual 2025 law.

export function getTaxPolicy(year = "2025") {
  const policies = {
    "2023": {
      lawName: "Nigeria Finance Act 2023",
      vatRate: 7.5,
      nhlRate: 0.5,
      citBands: [
        { maxRevenue: 25_000_000, rate: 0, label: "Small (≤ ₦25M)" },
        { maxRevenue: 100_000_000, rate: 20, label: "Medium (₦25M–₦100M)" },
        { maxRevenue: Infinity, rate: 30, label: "Large (> ₦100M)" },
      ],
    },
    "2025": {
      lawName: "Nigeria Finance Act 2025",
      // TODO: Update these with the official 2025 rates when confirmed
      vatRate: 7.5,
      nhlRate: 0.5,
      citBands: [
        { maxRevenue: 25_000_000, rate: 0, label: "Small (≤ ₦25M)" },
        { maxRevenue: 100_000_000, rate: 20, label: "Medium (₦25M–₦100M)" },
        { maxRevenue: Infinity, rate: 30, label: "Large (> ₦100M)" },
      ],
    },
  };

  return policies[year] || policies["2025"];
}

export function getCitRateForRevenue(policy, annualRevenue) {
  const band = policy.citBands.find((b) => annualRevenue <= b.maxRevenue) || policy.citBands.at(-1);
  return band?.rate ?? 0;
}

export function getPolicyFootnote(policy) {
  const bandsText = policy.citBands
    .map((b, idx) => {
      const label = b.label;
      const rate = `${b.rate}%`;
      return `${label}: ${rate}`;
    })
    .join(", ");

  return `Tax Calculation Basis: ${policy.lawName} — CIT bands (${bandsText}). VAT at ${policy.vatRate}%, NHL at ${policy.nhlRate}%.`;
}
