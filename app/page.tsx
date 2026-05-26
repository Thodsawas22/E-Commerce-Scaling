"use client";

import {
  Boxes,
  Calculator,
  CircleDollarSign,
  LineChart,
  Moon,
  Plus,
  RefreshCcw,
  Sun,
  Trash2,
  TrendingUp,
  Percent,
  Coins,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type CostType = "perUnit" | "percentSale" | "monthly";

type ExtraCost = {
  id: string;
  name: string;
  type: CostType;
  amount: number;
};

type Inputs = {
  productName: string;
  startingCapital: number;
  productCost: number;
  inboundShippingCost: number;
  packagingCost: number;
  fulfillmentCost: number;
  customerShippingCost: number;
  paymentFeePercent: number;
  fixedMonthlyCost: number;
  refundRate: number;
};

type ScenarioInput = {
  label: string;
  value: number;
  customPrice?: number;
  customCpa?: number;
  customReinvest?: number;
};

type RoundRow = {
  round: number;
  startingCapital: number;
  adFloat: number;
  stockBudget: number;
  stockUnits: number;
  dailyOrders: number;
  roundDays: number;
  totalRevenue: number;
  totalStockCost: number;
  totalAdSpend: number;
  totalFees: number;
  totalFixedCost: number;
  totalCost: number;
  netProfit: number;
  profitMargin: number;
  reinvestedProfit: number;
  cashKept: number;
  nextCapital: number;
  cumulativeDays: number;
};

type ScenarioResult = {
  id: string;
  markupLabel: string;
  markup: number;
  sellingPrice: number;
  cpaLabel: string;
  cpaRate: number;
  cpa: number;
  reinvestLabel: string;
  reinvestRate: number;
  trueCostBeforeAds: number;
  grossProfitBeforeAds: number;
  breakEvenCpa: number;
  breakEvenRoas: number;
  initialCapitalUsed: number;
  initialStockBudget: number;
  initialAdBudget: number;
  initialUnusedCapital: number;
  startingUnits: number;
  finalRoundUnits: number;
  finalRoundProfit: number;
  cumulativeProfit: number;
  totalRevenue: number;
  totalAdSpend: number;
  totalDays: number;
  totalCashKept: number;
  adFloatNeeded: number;
  adBudgetSavedVsMonthly: number;
  risk: "healthy" | "caution" | "danger";
  roadmap: RoundRow[];
};

const defaultInputs: Inputs = {
  productName: "สินค้าใหม่จากจีน",
  startingCapital: 50000,
  productCost: 120,
  inboundShippingCost: 35,
  packagingCost: 12,
  fulfillmentCost: 25,
  customerShippingCost: 45,
  paymentFeePercent: 3,
  fixedMonthlyCost: 0,
  refundRate: 3,
};

const defaultExtraCosts: ExtraCost[] = [
  { id: "google-ai-pro", name: "Google AI Pro", type: "monthly", amount: 750 },
  { id: "sample-reserve", name: "Warranty / reserve", type: "perUnit", amount: 8 },
];

const defaultMarkups: ScenarioInput[] = [
  { label: "3x", value: 3 },
  { label: "5x", value: 5 },
  { label: "10x", value: 10 },
];

const defaultCpaCases: ScenarioInput[] = [
  { label: "แย่", value: 42 },
  { label: "กลาง", value: 32 },
  { label: "ดี", value: 22 },
];

const defaultReinvestCases: ScenarioInput[] = [
  { label: "จะรวยวันนี้", value: 30 },
  { label: "สมดุล", value: 50 },
  { label: "เป็นคนจนให้นานพอ", value: 70 },
];

const money = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat("th-TH", {
  maximumFractionDigits: 0,
});

const compactNumber = new Intl.NumberFormat("th-TH", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const percent = (value: number) => `${value.toFixed(1)}%`;

const clamp = (value: number, min = 0) => (Number.isFinite(value) ? Math.max(min, value) : min);

function currency(value: number) {
  return money.format(Number.isFinite(value) ? value : 0);
}

function compactCurrency(value: number) {
  return `฿${compactNumber.format(Math.max(0, Number.isFinite(value) ? value : 0))}`;
}

function whole(value: number) {
  return number.format(Math.floor(Number.isFinite(value) ? value : 0));
}

function basePerUnitCost(inputs: Inputs, extraCosts: ExtraCost[]) {
  const extraPerUnit = extraCosts
    .filter((cost) => cost.type === "perUnit")
    .reduce((sum, cost) => sum + clamp(cost.amount), 0);

  return (
    clamp(inputs.productCost) +
    clamp(inputs.inboundShippingCost) +
    clamp(inputs.packagingCost) +
    clamp(inputs.fulfillmentCost) +
    clamp(inputs.customerShippingCost) +
    extraPerUnit
  );
}

function monthlyFixedCost(inputs: Inputs, extraCosts: ExtraCost[]) {
  const extraMonthly = extraCosts
    .filter((cost) => cost.type === "monthly")
    .reduce((sum, cost) => sum + clamp(cost.amount), 0);
  return clamp(inputs.fixedMonthlyCost) + extraMonthly;
}

function percentCostRate(inputs: Inputs, extraCosts: ExtraCost[]) {
  const extraPercent = extraCosts
    .filter((cost) => cost.type === "percentSale")
    .reduce((sum, cost) => sum + clamp(cost.amount), 0);
  return (clamp(inputs.paymentFeePercent) + extraPercent) / 100;
}

function buildScenario(
  inputs: Inputs,
  extraCosts: ExtraCost[],
  markupCase: ScenarioInput,
  cpaCase: ScenarioInput,
  reinvestCase: ScenarioInput,
  adMode: "upfront" | "rolling",
  dailyAdSpend: number,
  payoutCycleDays: number,
  maxRounds: number,
): ScenarioResult {
  const costPerUnit = basePerUnitCost(inputs, extraCosts);
  const fixedCostPerMonth = monthlyFixedCost(inputs, extraCosts);
  const pctFeeRate = percentCostRate(inputs, extraCosts);
  const refundRate = clamp(inputs.refundRate) / 100;

  const cpaRate = clamp(cpaCase.value) / 100;
  const reinvestRate =
    reinvestCase.customReinvest && reinvestCase.customReinvest > 0
      ? clamp(reinvestCase.customReinvest) / 100
      : clamp(reinvestCase.value) / 100;
  
  const sellingPrice =
    markupCase.customPrice && markupCase.customPrice > 0
      ? markupCase.customPrice
      : costPerUnit * clamp(markupCase.value, 0.1);
  
  const trueCostBeforeAds = costPerUnit + sellingPrice * pctFeeRate;
  const cpa = cpaCase.customCpa && cpaCase.customCpa > 0 ? cpaCase.customCpa : sellingPrice * cpaRate;
  const effectiveCpaRate = sellingPrice > 0 ? cpa / sellingPrice : 0;
  
  const netRevenuePerUnit = sellingPrice * (1 - refundRate);
  const grossProfitBeforeAds = netRevenuePerUnit - trueCostBeforeAds;
  const breakEvenCpa = grossProfitBeforeAds;
  const breakEvenRoas = grossProfitBeforeAds > 0 ? netRevenuePerUnit / grossProfitBeforeAds : 0;

  const dailyOrders = cpa > 0 ? dailyAdSpend / cpa : 0;
  const adFloatNeeded = adMode === "rolling" ? dailyAdSpend * payoutCycleDays : 0;
  const monthlyAdBudget = dailyAdSpend * 30;
  const adBudgetSavedVsMonthly = adMode === "rolling" ? monthlyAdBudget - adFloatNeeded : 0;

  let operatingCapital = clamp(inputs.startingCapital);
  const roadmap: RoundRow[] = [];
  let cumulativeDays = 0;

  for (let round = 1; round <= maxRounds; round++) {
    const startingCapital = operatingCapital;
    let adFloat = 0;
    let stockBudget = 0;
    let stockUnits = 0;

    if (adMode === "rolling") {
      adFloat = adFloatNeeded;
      stockBudget = startingCapital - adFloat;
      if (stockBudget <= 0) break;
      stockUnits = Math.floor(stockBudget / Math.max(costPerUnit, 1));
    } else {
      // upfront mode
      stockUnits = Math.floor(startingCapital / Math.max(costPerUnit + cpa, 1));
      adFloat = stockUnits * cpa; // the budget locked for ads
      stockBudget = stockUnits * costPerUnit;
    }

    if (stockUnits <= 0) break;

    const roundDays = stockUnits / Math.max(dailyOrders, 0.01);
    cumulativeDays += roundDays;

    const totalRevenue = stockUnits * sellingPrice * (1 - refundRate);
    const totalStockCost = stockUnits * costPerUnit;
    const totalAdSpendRound = adMode === "rolling" ? dailyAdSpend * roundDays : stockUnits * cpa;
    const totalFees = stockUnits * sellingPrice * pctFeeRate;
    const totalFixedCost = fixedCostPerMonth * (roundDays / 30);
    const totalCost = totalStockCost + totalAdSpendRound + totalFees + totalFixedCost;
    
    const netProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? netProfit / totalRevenue : 0;
    const reinvestedProfit = Math.max(0, netProfit * reinvestRate);
    const cashKept = Math.max(0, netProfit - reinvestedProfit);
    const nextCapital = Math.max(0, startingCapital + (netProfit >= 0 ? reinvestedProfit : netProfit));

    roadmap.push({
      round, startingCapital, adFloat, stockBudget, stockUnits,
      dailyOrders, roundDays, totalRevenue, totalStockCost,
      totalAdSpend: totalAdSpendRound, totalFees, totalFixedCost, totalCost,
      netProfit, profitMargin, reinvestedProfit, cashKept,
      nextCapital, cumulativeDays,
    });

    operatingCapital = nextCapital;
  }

  const cumulativeProfit = roadmap.reduce((sum, row) => sum + row.netProfit, 0);
  const totalRevenue = roadmap.reduce((sum, row) => sum + row.totalRevenue, 0);
  const totalAdSpend = roadmap.reduce((sum, row) => sum + row.totalAdSpend, 0);
  const totalCashKept = roadmap.reduce((sum, row) => sum + row.cashKept, 0);
  const finalRound = roadmap[roadmap.length - 1];
  
  const netMargin = totalRevenue > 0 ? cumulativeProfit / totalRevenue : 0;
  const cpaPressure = breakEvenCpa > 0 ? cpa / breakEvenCpa : 99;
  const risk =
    breakEvenCpa <= 0 || cumulativeProfit <= 0 || (finalRound?.stockUnits ?? 0) === 0
      ? "danger"
      : cpaPressure > 0.8 || netMargin < 0.12
        ? "caution"
        : "healthy";

  return {
    id: `${markupCase.label}-${cpaCase.label}-${reinvestCase.label}`,
    markupLabel: markupCase.label,
    markup: markupCase.value,
    sellingPrice,
    cpaLabel: cpaCase.label,
    cpaRate: effectiveCpaRate,
    cpa,
    reinvestLabel: reinvestCase.label,
    reinvestRate,
    trueCostBeforeAds,
    grossProfitBeforeAds,
    breakEvenCpa,
    breakEvenRoas,
    initialCapitalUsed: roadmap[0] ? roadmap[0].totalCost : 0,
    initialStockBudget: roadmap[0] ? roadmap[0].stockBudget : 0,
    initialAdBudget: roadmap[0] ? roadmap[0].totalAdSpend : 0,
    initialUnusedCapital: roadmap[0] ? roadmap[0].startingCapital - roadmap[0].adFloat - roadmap[0].stockBudget : 0,
    startingUnits: roadmap[0]?.stockUnits ?? 0,
    finalRoundUnits: finalRound?.stockUnits ?? 0,
    finalRoundProfit: finalRound?.netProfit ?? 0,
    cumulativeProfit,
    totalRevenue,
    totalAdSpend,
    totalDays: cumulativeDays,
    totalCashKept,
    adFloatNeeded,
    adBudgetSavedVsMonthly,
    risk,
    roadmap,
  };
}

function buildAllScenarios(
  inputs: Inputs,
  extraCosts: ExtraCost[],
  markups: ScenarioInput[],
  cpaCases: ScenarioInput[],
  reinvestCases: ScenarioInput[],
  adMode: "upfront" | "rolling",
  dailyAdSpend: number,
  payoutCycleDays: number,
  maxRounds: number,
) {
  return markups.flatMap((markup) =>
    cpaCases.flatMap((cpa) => 
      reinvestCases.map((reinvest) => 
        buildScenario(inputs, extraCosts, markup, cpa, reinvest, adMode, dailyAdSpend, payoutCycleDays, maxRounds)
      )
    ),
  );
}



function MultiScenarioLineChart({ scenarios }: { scenarios: ScenarioResult[] }) {
  const [hoveredPoint, setHoveredPoint] = useState<{ index: number; xPct: number } | null>(null);
  const width = 780;
  const height = 300;
  const padX = 66;
  const padTop = 26;
  const padBottom = 36;
  const colors = ["#1F6F8B", "#E76F2E", "#177A32", "#7C3AED"];
  const series = scenarios.map((scenario) => {
    let runningCash = 0;
    const values = scenario.roadmap.map((row) => {
      runningCash += row.cashKept;
      return { round: row.round, value: runningCash, cashKept: row.cashKept };
    });

    return { scenario, values, totalCash: runningCash };
  });
  const maxRounds = scenarios[0]?.roadmap.length ?? 10;
  const values = series.flatMap((item) => item.values.map((point) => point.value));
  const maxCash = Math.max(...values, 1);
  const minCash = 0;
  const range = Math.max(maxCash - minCash, 1);
  const chartWidth = width - padX - 28;
  const chartHeight = height - padTop - padBottom;
  const yFor = (value: number) => height - padBottom - ((value - minCash) / range) * chartHeight;
  const xFor = (index: number, length: number) => padX + (index / Math.max(length - 1, 1)) * chartWidth;
  const zeroY = yFor(0);
  const gridValues = [0, 0.25, 0.5, 0.75, 1].map((ratio) => maxCash * ratio);
  const hoveredIndex = hoveredPoint?.index ?? null;

  if (scenarios.length === 0) {
    return <div className="empty-chart">ยังไม่มี scenario สำหรับ chart</div>;
  }

  return (
    <div className="multi-chart-wrap">
      <div className="chart-plot-wrap">
        <svg
          className="line-chart multi-line-chart"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Accumulated cash kept by reinvest rate"
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const scaledX = ((event.clientX - rect.left) / rect.width) * width;
            const rawIndex = Math.round(((scaledX - padX) / chartWidth) * (maxRounds - 1));
            const index = Math.max(0, Math.min(maxRounds - 1, rawIndex));
            setHoveredPoint({ index, xPct: Math.max(12, Math.min(88, (xFor(index, maxRounds) / width) * 100)) });
          }}
          onMouseLeave={() => setHoveredPoint(null)}
        >
          {gridValues.map((value) => {
            const y = yFor(value);
            return (
              <g key={`cash-${value}`}>
                <line className="grid-line horizontal" x1={padX} x2={width - 28} y1={y} y2={y} />
                <text className="axis-label" x={padX - 10} y={y + 4} textAnchor="end">
                  {compactCurrency(value)}
                </text>
              </g>
            );
          })}
          <line className="axis-line" x1={padX} x2={width - 28} y1={height - padBottom} y2={height - padBottom} />
          <line className="axis-line" x1={padX} x2={padX} y1={padTop} y2={height - padBottom} />
          <line className="zero-line" x1={padX} x2={width - 28} y1={zeroY} y2={zeroY} />
          {Array.from({ length: maxRounds }, (_, index) => {
            const x = xFor(index, maxRounds);
            return (
              <g key={`r-${index + 1}`}>
                <line className="grid-line vertical" x1={x} x2={x} y1={padTop} y2={height - padBottom} />
                <text x={x} y={height - 8} textAnchor="middle">
                  R{index + 1}
                </text>
              </g>
            );
          })}
          {hoveredIndex !== null ? (
            <line
              className="hover-line"
              x1={xFor(hoveredIndex, maxRounds)}
              x2={xFor(hoveredIndex, maxRounds)}
              y1={padTop}
              y2={height - padBottom}
            />
          ) : null}
          {series.map(({ scenario, values }, scenarioIndex) => {
            const color = colors[scenarioIndex % colors.length];
            const points = values
              .map((point, index) => {
                const x = xFor(index, values.length);
                const y = yFor(point.value);
                return `${x},${y}`;
              })
              .join(" ");

            return (
              <g key={scenario.id}>
                <polyline points={points} style={{ stroke: color }} />
                {values.map((point, index) => {
                  const x = xFor(index, values.length);
                  const y = yFor(point.value);
                  return (
                    <circle
                      key={`${scenario.id}-${point.round}`}
                      cx={x}
                      cy={y}
                      r={hoveredIndex === index ? 6 : 4}
                      style={{ stroke: color }}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>
        {hoveredPoint ? (
          <div className="chart-hover-tooltip" style={{ left: `${hoveredPoint.xPct}%` }}>
            <strong>รอบ R{hoveredPoint.index + 1}</strong>
            {series.map(({ scenario, values }, index) => {
              const point = values[hoveredPoint.index];
              return (
                <div key={`${scenario.id}-hover`} className="tooltip-row">
                  <span>
                    <i style={{ backgroundColor: colors[index % colors.length] }} />
                    {percent(scenario.reinvestRate * 100)}
                  </span>
                  <div>
                    <b>{currency(point?.value ?? 0)}</b>
                    <small>รอบนี้ {currency(point?.cashKept ?? 0)}</small>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
      <div className="chart-total-grid">
        {series.map(({ scenario, totalCash }, index) => (
          <div className="chart-total-card" key={scenario.id}>
            <span>
              <i style={{ backgroundColor: colors[index % colors.length] }} />
              {scenario.reinvestLabel}
            </span>
            <strong>{currency(totalCash)}</strong>
            <small>{percent(scenario.reinvestRate * 100)} reinvest · เงินเก็บสุทธิ {maxRounds} รอบ</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskPill({ risk }: { risk: ScenarioResult["risk"] }) {
  const label = risk === "healthy" ? "น่าเดินต่อ" : risk === "caution" ? "ต้องคุมตัวเลข" : "เสี่ยงสูง";
  return (
    <span className={`risk ${risk}`}>
      <span className="pulse-dot" />
      {label}
    </span>
  );
}

export default function Home() {
  const [inputs, setInputs] = useState<Inputs>(defaultInputs);
  const [extraCosts, setExtraCosts] = useState<ExtraCost[]>(defaultExtraCosts);
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (isLightMode) {
        document.body.classList.add("light-mode");
      } else {
        document.body.classList.remove("light-mode");
      }
    }
  }, [isLightMode]);
  const markups = defaultMarkups;
  const cpaCases = defaultCpaCases;
  const reinvestCases = defaultReinvestCases;
  const [customSellingPrice, setCustomSellingPrice] = useState<number | undefined>();
  const [customCpa, setCustomCpa] = useState<number | undefined>();
  const [customReinvest, setCustomReinvest] = useState<number | undefined>();
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adMode, setAdMode] = useState<"upfront" | "rolling">("upfront");
  const [dailyAdSpend, setDailyAdSpend] = useState(1000);
  const [payoutCycleDays, setPayoutCycleDays] = useState(5);
  const [maxRounds, setMaxRounds] = useState(10);

  const baseCost = basePerUnitCost(inputs, extraCosts);
  const effectiveMarkups = useMemo(() => {
    if (!customSellingPrice || customSellingPrice <= 0) {
      return markups;
    }

    return [
      ...markups,
      {
        label: "ตั้งราคาเอง",
        value: baseCost > 0 ? customSellingPrice / baseCost : 0,
        customPrice: customSellingPrice,
      },
    ];
  }, [baseCost, customSellingPrice, markups]);

  const effectiveCpaCases = useMemo(() => {
    if (!customCpa || customCpa <= 0) {
      return cpaCases;
    }

    return [
      ...cpaCases,
      {
        label: "CPA เอง",
        value: 0,
        customCpa,
      },
    ];
  }, [cpaCases, customCpa]);

  const effectiveReinvestCases = useMemo(() => {
    if (!customReinvest || customReinvest <= 0) {
      return reinvestCases;
    }

    return [
      ...reinvestCases,
      {
        label: "Reinvest เอง",
        value: customReinvest,
        customReinvest,
      },
    ];
  }, [customReinvest, reinvestCases]);

  const scenarios = useMemo(
    () => buildAllScenarios(inputs, extraCosts, effectiveMarkups, effectiveCpaCases, effectiveReinvestCases, adMode, dailyAdSpend, payoutCycleDays, maxRounds),
    [inputs, extraCosts, effectiveMarkups, effectiveCpaCases, effectiveReinvestCases, adMode, dailyAdSpend, payoutCycleDays, maxRounds],
  );

  const sortedScenarios = useMemo(
    () => [...scenarios].sort((a, b) => b.cumulativeProfit - a.cumulativeProfit),
    [scenarios],
  );

  const balancedScenario =
    scenarios.find(
      (scenario) =>
        scenario.markupLabel === markups[1]?.label &&
        scenario.cpaLabel === effectiveCpaCases[1]?.label &&
        scenario.reinvestLabel === effectiveReinvestCases[1]?.label,
    ) ?? scenarios[0];

  const bestScenario = sortedScenarios[0];
  const selectedScenario =
    scenarios.find((scenario) => scenario.id === selectedId) ?? balancedScenario ?? bestScenario;
  const chartScenarios = useMemo(() => {
    if (!selectedScenario) {
      return [];
    }

    const activeMarkup = selectedScenario.markupLabel;
    const activeCpa = selectedScenario.cpaLabel;

    return effectiveReinvestCases
      .map((reinvest) =>
        scenarios.find(
          (scenario) =>
            scenario.markupLabel === activeMarkup &&
            scenario.cpaLabel === activeCpa &&
            scenario.reinvestLabel === reinvest.label,
        ),
      )
      .filter((scenario): scenario is ScenarioResult => Boolean(scenario));
  }, [effectiveReinvestCases, scenarios, selectedScenario]);

  const totalMonthlyFixed = monthlyFixedCost(inputs, extraCosts);
  const scenarioCount = scenarios.length;
  const totalCostPerOrder = (selectedScenario?.trueCostBeforeAds ?? 0) + (selectedScenario?.cpa ?? 0);
  const totalCashKept = selectedScenario?.totalCashKept ?? 0;
  const selectedCpaCase = effectiveCpaCases.find((cpaCase) => cpaCase.label === selectedScenario?.cpaLabel);
  const saleKeepRate = Math.max(0.01, 1 - clamp(inputs.refundRate) / 100 - percentCostRate(inputs, extraCosts));
  const cpaIsFixedBaht = Boolean(selectedCpaCase?.customCpa && selectedCpaCase.customCpa > 0);
  const minimumSellingPrice = selectedScenario
    ? cpaIsFixedBaht
      ? (baseCost + selectedScenario.cpa) / saleKeepRate
      : baseCost / Math.max(0.01, saleKeepRate - selectedScenario.cpaRate)
    : 0;
  const actualRoas =
    selectedScenario && selectedScenario.totalAdSpend > 0
      ? selectedScenario.totalRevenue / selectedScenario.totalAdSpend
      : 0;

  const grossMarginPct = selectedScenario && selectedScenario.sellingPrice > 0 ? ((selectedScenario.sellingPrice - selectedScenario.trueCostBeforeAds) / selectedScenario.sellingPrice) * 100 : 0;
  const grossMarginProfit = selectedScenario ? selectedScenario.sellingPrice - selectedScenario.trueCostBeforeAds : 0;

  const finalRoadmapRow = selectedScenario?.roadmap[selectedScenario.roadmap.length - 1];
  const capitalMultiplier = selectedScenario && finalRoadmapRow && inputs.startingCapital > 0
    ? (finalRoadmapRow.nextCapital + totalCashKept) / inputs.startingCapital
    : 1;
  const totalBusinessValue = selectedScenario && finalRoadmapRow ? finalRoadmapRow.nextCapital + totalCashKept : 0;

  const cpaSafetyBufferPct = selectedScenario && selectedScenario.breakEvenCpa > 0
    ? ((selectedScenario.breakEvenCpa - selectedScenario.cpa) / selectedScenario.breakEvenCpa) * 100
    : 0;
  const cpaSafetyBufferVal = selectedScenario ? selectedScenario.breakEvenCpa - selectedScenario.cpa : 0;

  const startingUnits = selectedScenario?.startingUnits ?? 0;
  const finalRoundUnits = selectedScenario?.finalRoundUnits ?? 0;
  const scaleMultiplier = startingUnits > 0 ? finalRoundUnits / startingUnits : 0;

  function setInput<K extends keyof Inputs>(key: K, value: Inputs[K]) {
    setInputs((current) => ({ ...current, [key]: value }));
  }

  function addExtraCost() {
    setExtraCosts((current) => [
      ...current,
      { id: crypto.randomUUID(), name: "ต้นทุนอื่นๆ", type: "perUnit", amount: 0 },
    ]);
  }

  function removeExtraCost(id: string) {
    setExtraCosts((current) => current.filter((cost) => cost.id !== id));
  }

  function chooseScenario(next: { markupLabel?: string; cpaLabel?: string; reinvestLabel?: string }) {
    const targetMarkup = next.markupLabel ?? selectedScenario?.markupLabel ?? balancedScenario?.markupLabel;
    const targetCpa = next.cpaLabel ?? selectedScenario?.cpaLabel ?? balancedScenario?.cpaLabel;
    const targetReinvest = next.reinvestLabel ?? selectedScenario?.reinvestLabel ?? balancedScenario?.reinvestLabel;
    const match =
      scenarios.find(
        (scenario) =>
          scenario.markupLabel === targetMarkup &&
          scenario.cpaLabel === targetCpa &&
          scenario.reinvestLabel === targetReinvest,
      ) ??
      scenarios.find((scenario) => scenario.markupLabel === targetMarkup && scenario.cpaLabel === targetCpa) ??
      scenarios.find((scenario) => scenario.markupLabel === targetMarkup) ??
      balancedScenario;

    if (match) {
      setSelectedId(match.id);
    }
  }

  function runAnalysis() {
    setHasAnalyzed(true);
    setSelectedId(balancedScenario?.id ?? bestScenario?.id ?? null);
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <span className="eyebrow">Commerce Scale Planner</span>
          <h1>วางแผนสเกลสินค้า E-commerce จากทุนจริง</h1>
          <p>
            ระบบจำลองแผนการเติบโตรายรอบ ตามโครงสร้างราคาทุนจริง, CPA และอัตราทบทุนสะสม
          </p>
        </div>
        <button
          className="theme-toggle-btn"
          onClick={() => setIsLightMode(!isLightMode)}
          aria-label="Toggle theme"
          title={isLightMode ? "สลับเป็นโหมดกลางคืน" : "สลับเป็นโหมดกลางวัน"}
        >
          {isLightMode ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </section>

      <section className="workspace">
        <aside className="input-panel">
          <div className="panel-heading">
            <h2>แผงควบคุม</h2>
          </div>

          <div className="input-section">
            <h3 className="section-title">Product</h3>
            <div className="field-grid">
              <label className="field">
                <span>ชื่อสินค้า</span>
                <input value={inputs.productName} onChange={(event) => setInput("productName", event.target.value)} />
              </label>
            </div>
          </div>

          <div className="input-section">
            <h3 className="section-title">เงินทุนและระยะเวลา</h3>
            <div className="field-grid">
              <NumberField formatThousands unit="฿" label="ทุนเริ่มต้น" value={inputs.startingCapital} onChange={(value) => setInput("startingCapital", value)} />
              <NumberField unit="รอบ" label="จำลองล่วงหน้า" value={maxRounds} onChange={setMaxRounds} />
            </div>
          </div>

          <div className="input-section">
            <h3 className="section-title">ต้นทุนสินค้า (ต่อ 1 ชิ้น)</h3>
            <div className="field-grid">
              <NumberField unit="฿" label="ราคาสินค้า" value={inputs.productCost} onChange={(value) => setInput("productCost", value)} />
              <NumberField unit="฿" label="ขนส่ง/นำเข้า" value={inputs.inboundShippingCost} onChange={(value) => setInput("inboundShippingCost", value)} />
              <NumberField unit="฿" label="แพ็กเกจจิ้ง" value={inputs.packagingCost} onChange={(value) => setInput("packagingCost", value)} />
              <NumberField unit="฿" label="Fulfillment" value={inputs.fulfillmentCost} onChange={(value) => setInput("fulfillmentCost", value)} />
              <NumberField unit="฿" label="ส่งถึงลูกค้า" value={inputs.customerShippingCost} onChange={(value) => setInput("customerShippingCost", value)} />
              <NumberField unit="%" label="ค่าธรรมเนียม %" value={inputs.paymentFeePercent} onChange={(value) => setInput("paymentFeePercent", value)} />
              <NumberField unit="%" label="คืนสินค้า %" value={inputs.refundRate} onChange={(value) => setInput("refundRate", value)} />
            </div>
          </div>

          <div className="input-panel-bottom-row">
            <div className="cost-list">
              <div className="subhead">
                <h3>ต้นทุนอื่นๆ</h3>
                <button className="icon-button" onClick={addExtraCost} aria-label="เพิ่มต้นทุนอื่นๆ">
                  <Plus size={16} />
                </button>
              </div>
              {extraCosts.map((cost) => (
                <div className="cost-row" key={cost.id}>
                  <input
                    value={cost.name}
                    onChange={(event) =>
                      setExtraCosts((current) =>
                        current.map((item) => (item.id === cost.id ? { ...item, name: event.target.value } : item)),
                      )
                    }
                  />
                  <select
                    value={cost.type}
                    onChange={(event) =>
                      setExtraCosts((current) =>
                        current.map((item) =>
                          item.id === cost.id ? { ...item, type: event.target.value as CostType } : item,
                        ),
                      )
                    }
                  >
                    <option value="perUnit">รายชิ้น</option>
                    <option value="percentSale">% ยอดขาย</option>
                    <option value="monthly">ต่อเดือน</option>
                  </select>
                  <div className="field-input-wrapper">
                    {cost.type !== "percentSale" && <span className="field-unit-prefix">฿</span>}
                    <input
                      type={cost.type === "percentSale" ? "number" : "text"}
                      inputMode={cost.type !== "percentSale" ? "numeric" : undefined}
                      value={
                        cost.amount === 0
                          ? ""
                          : cost.type === "percentSale"
                            ? cost.amount
                            : number.format(cost.amount)
                      }
                      placeholder="0"
                      onChange={(event) => {
                        const rawValue = cost.type === "percentSale"
                          ? event.target.value
                          : event.target.value.replace(/[^\d.]/g, "");
                        setExtraCosts((current) =>
                          current.map((item) =>
                            item.id === cost.id ? { ...item, amount: clamp(Number(rawValue)) } : item,
                          ),
                        );
                      }}
                      style={{
                        paddingLeft: cost.type !== "percentSale" ? "24px" : "14px",
                        paddingRight: cost.type === "percentSale" ? "24px" : "14px",
                      }}
                    />
                    {cost.type === "percentSale" && <span className="field-unit-suffix">%</span>}
                  </div>
                  <button className="icon-button danger-button" onClick={() => removeExtraCost(cost.id)} aria-label="ลบต้นทุนอื่นๆ">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <LiveCostPreview
              inputs={inputs}
              extraCosts={extraCosts}
            />
          </div>



          <button className="analyze-wide" onClick={runAnalysis}>
            <Calculator size={18} />
            วิเคราะห์
          </button>
        </aside>

        <section className="result-panel">
          {!hasAnalyzed ? (
            <div className="empty-state">
              <Calculator size={42} />
              <h2>พร้อมจำลองแผนธุรกิจรายรอบ</h2>
              <p>กรอกต้นทุนและทุนเริ่มต้น แล้วกดวิเคราะห์เพื่อสร้าง roadmap</p>
            </div>
          ) : (
            <>


              <div className="selector-stack">
                <PriceControlCard
                  markups={markups}
                  baseCost={baseCost}
                  minimumSellingPrice={minimumSellingPrice}
                  selectedMarkupLabel={selectedScenario.markupLabel}
                  customSellingPrice={customSellingPrice}
                  onCustomSellingPriceChange={(value) => {
                    setCustomSellingPrice(value);
                    if (value && value > 0) {
                      setSelectedId(`ตั้งราคาเอง-${selectedScenario.cpaLabel}-${selectedScenario.reinvestLabel}`);
                    }
                  }}
                  onSelectMarkup={(label) => chooseScenario({ markupLabel: label })}
                />
                <CpaControlCard
                  cpaCases={cpaCases}
                  selectedCpaLabel={selectedScenario.cpaLabel}
                  selectedSellingPrice={selectedScenario.sellingPrice}
                  cpaLimit={selectedScenario.breakEvenCpa}
                  customCpa={customCpa}
                  onCustomCpaChange={(value) => {
                    setCustomCpa(value);
                    if (value && value > 0) {
                      setSelectedId(`${selectedScenario.markupLabel}-CPA เอง-${selectedScenario.reinvestLabel}`);
                    }
                  }}
                  onSelectCpa={(label) => chooseScenario({ cpaLabel: label })}
                />
                <ReinvestControlCard
                  reinvestCases={reinvestCases}
                  selectedReinvestLabel={selectedScenario.reinvestLabel}
                  customReinvest={customReinvest}
                  onCustomReinvestChange={(value) => {
                    setCustomReinvest(value);
                    if (value && value > 0) {
                      setSelectedId(`${selectedScenario.markupLabel}-${selectedScenario.cpaLabel}-Reinvest เอง`);
                    }
                  }}
                  onSelectReinvest={(label) => chooseScenario({ reinvestLabel: label })}
                />
              </div>

              <div className="simulation-settings-card">
                <div className="card-title compact">
                  <div>
                    <h2>รูปแบบการจัดการเงินแอด (Simulation Mode)</h2>
                    <p>จำลองการหักค่าแอดแบบล่วงหน้าเต็มรอบ หรือแบ่งจ่ายรายวันตามกระแสเงินสด</p>
                  </div>
                </div>

                <div className="mode-toggle-group">
                  <button
                    className={`mode-toggle-btn ${adMode === "upfront" ? "active" : ""}`}
                    onClick={() => setAdMode("upfront")}
                  >
                    <CircleDollarSign className="mode-toggle-icon" size={22} />
                    <div className="mode-toggle-label">
                      <span className="mode-title">แบบกันเงินแอดเต็มรอบ</span>
                      <span className="mode-subtitle">(Upfront Ad Budget)</span>
                    </div>
                  </button>
                  <button
                    className={`mode-toggle-btn ${adMode === "rolling" ? "active" : ""}`}
                    onClick={() => setAdMode("rolling")}
                  >
                    <RefreshCcw className="mode-toggle-icon" size={22} />
                    <div className="mode-toggle-label">
                      <span className="mode-title">แบบหมุนเวียนรายวัน</span>
                      <span className="mode-subtitle">(Rolling Ad Float)</span>
                    </div>
                  </button>
                </div>

                {adMode === "rolling" && (
                  <div className="rolling-settings-container">
                    <div className="rolling-settings-grid">
                      <div className="rolling-input-wrap">
                        <label>
                          <span>งบแอดต่อวัน (Daily Ad Spend)</span>
                          <div className="custom-input-wrapper">
                            <span className="input-prefix">฿</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={dailyAdSpend === 0 ? "" : number.format(dailyAdSpend)}
                              placeholder="1,000"
                              onChange={(e) => {
                                const raw = e.target.value.replace(/[^\d.]/g, "");
                                setDailyAdSpend(clamp(Number(raw)));
                              }}
                            />
                            <span className="input-suffix">/วัน</span>
                          </div>
                        </label>
                      </div>
                      <div className="rolling-input-wrap">
                        <label>
                          <span>ระยะเวลารอเงินเข้า (Payout Cycle)</span>
                          <div className="custom-input-wrapper">
                            <input
                              type="number"
                              value={payoutCycleDays === 0 ? "" : payoutCycleDays}
                              placeholder="5"
                              onChange={(e) => setPayoutCycleDays(clamp(Number(e.target.value)))}
                            />
                            <span className="input-suffix">วัน</span>
                          </div>
                        </label>
                      </div>
                    </div>
                    <div className="rolling-insight-bar">
                      <div className="daily-insight-icon">💡</div>
                      <div className="daily-insight-body">
                        <span>
                          เงินลอยตัว Ad Float = <strong>฿{number.format(dailyAdSpend * payoutCycleDays)}</strong> (กันไว้หมุน {payoutCycleDays} วัน)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="summary-grid">
                <MetricCard
                  icon={<Boxes />}
                  label="ต้นทุนรวม"
                  value={currency(totalCostPerOrder)}
                  detail={`Cost ${currency(selectedScenario.trueCostBeforeAds)} + CPA ${currency(selectedScenario.cpa)} ต่อ 1 ชิ้น`}
                />
                <MetricCard
                  icon={<LineChart />}
                  label="ค่า BE"
                  value={`${selectedScenario.breakEvenRoas.toFixed(2)}x`}
                  detail="ROAS ขั้นต่ำก่อนขาดทุน"
                />
                <MetricCard
                  icon={<TrendingUp />}
                  label="ROAS ที่ได้"
                  value={`${actualRoas.toFixed(2)}x`}
                  detail={`รายได้สุทธิ / Ad spend รวม ${maxRounds} รอบ`}
                />
                <MetricCard
                  icon={<CircleDollarSign />}
                  label="รายได้สุทธิ"
                  value={currency(totalCashKept)}
                  detail={`รวมเงินเก็บ ${maxRounds} รอบ`}
                />
                <MetricCard
                  icon={<Percent />}
                  label="อัตรากำไรสินค้า"
                  value={`${grossMarginPct.toFixed(1)}%`}
                  detail={`กำไร ${currency(grossMarginProfit)} / ราคาขาย ${currency(selectedScenario.sellingPrice)}`}
                />
                <MetricCard
                  icon={<Coins />}
                  label="ตัวคูณเงินทุน"
                  value={`${capitalMultiplier.toFixed(1)}x`}
                  detail={`ทุนโตจาก ${currency(inputs.startingCapital)} เป็น ${currency(totalBusinessValue)}`}
                />
                <MetricCard
                  icon={<ShieldCheck />}
                  label="ความปลอดภัยค่าแอด"
                  value={`${cpaSafetyBufferPct.toFixed(0)}%`}
                  detail={cpaSafetyBufferVal >= 0 ? `ทนแอดแพงขึ้นได้อีก ${currency(cpaSafetyBufferVal)} / ออเดอร์` : "ค่าแอดเกินเพดานจุดคุ้มทุน"}
                />
                <MetricCard
                  icon={<TrendingUp />}
                  label="ศักยภาพการสเกล"
                  value={`${scaleMultiplier.toFixed(1)}x`}
                  detail={`จากรอบแรก ${whole(startingUnits)} สู่รอบท้าย ${whole(finalRoundUnits)} ชิ้น`}
                />
              </div>

              <div className="table-card">
                <div className="card-title compact">
                  <h2>Round-by-Round Roadmap</h2>
                  <span>{inputs.productName} · {selectedScenario.roadmap.length} รอบ · {whole(selectedScenario.totalDays)} วันรวม</span>
                </div>
                <div className="table-wrap">
                  <table className="roadmap-table">
                    <thead>
                      <tr className="group-row">
                        <th className="plan-head" colSpan={1}>รอบ</th>
                        <th className="cost-head" colSpan={3}>การจัดสรรทุน</th>
                        <th className="quantity-head" colSpan={2}>Stock & ระยะเวลา</th>
                        <th className="sales-head" colSpan={1}>ยอดขาย</th>
                        <th className="profit-head" colSpan={2}>กำไร / เงินสด</th>
                      </tr>
                      <tr>
                        <th className="plan-head">รอบ</th>
                        <th className="cost-head">เงินทุน</th>
                        <th className="cost-head">Ad Float</th>
                        <th className="cost-head">งบ Stock</th>
                        <th className="quantity-head">Stock (ชิ้น)</th>
                        <th className="quantity-head">หมดใน (วัน)</th>
                        <th className="sales-head">รายได้สุทธิ</th>
                        <th className="profit-head">กำไรสุทธิ</th>
                        <th className="profit-head">การปันส่วน (เก็บ / ทบ)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedScenario.roadmap.map((row) => (
                        <tr key={row.round}>
                          <td className="month-col">
                            <div>R{row.round}</div>
                          </td>
                          <td className="capital-col">
                            <div>{currency(row.startingCapital)}</div>
                          </td>
                          <td className="cost-col">
                            <div>{currency(row.adFloat)}</div>
                          </td>
                          <td className="cost-col">
                            <div>{currency(row.stockBudget)}</div>
                            <div>รวมจ่าย {currency(row.totalCost)}</div>
                          </td>
                          <td className="quantity-col">
                            <div>{whole(row.stockUnits)} ชิ้น</div>
                          </td>
                          <td className="quantity-col">
                            <div>{whole(row.roundDays)} วัน</div>
                            <div>สะสม {whole(row.cumulativeDays)} วัน</div>
                          </td>
                          <td className="sales-col">
                            <div>{currency(row.totalRevenue)}</div>
                            <div>แอด {currency(row.totalAdSpend)}</div>
                          </td>
                          <td className="profit-col">
                            <span className={`profit-pill ${row.netProfit >= 0 ? "positive" : "negative"}`}>
                              {currency(row.netProfit)}
                            </span>
                            <div>{percent(row.profitMargin * 100)}</div>
                          </td>
                          <td className="profit-col">
                            <div>เก็บ {currency(row.cashKept)}</div>
                            <div>ทบ {currency(row.reinvestedProfit)}</div>
                          </td>
                        </tr>
                      ))}
                      <tr className="total-row">
                        <td className="month-col">
                          <div>รวม {selectedScenario.roadmap.length} รอบ</div>
                        </td>
                        <td className="capital-col">
                          <div>-</div>
                        </td>
                        <td className="cost-col">
                          <div>-</div>
                        </td>
                        <td className="cost-col">
                          <div>{currency(selectedScenario.roadmap.reduce((sum, row) => sum + row.stockBudget, 0))}</div>
                        </td>
                        <td className="quantity-col">
                          <div>{whole(selectedScenario.roadmap.reduce((sum, row) => sum + row.stockUnits, 0))} ชิ้น</div>
                        </td>
                        <td className="quantity-col">
                          <div>{whole(selectedScenario.totalDays)} วัน</div>
                        </td>
                        <td className="sales-col">
                          <div>{currency(selectedScenario.totalRevenue)}</div>
                          <div>แอด {currency(selectedScenario.totalAdSpend)}</div>
                        </td>
                        <td className="profit-col">
                          <span className={`profit-pill ${selectedScenario.cumulativeProfit >= 0 ? "positive" : "negative"}`}>
                            {currency(selectedScenario.cumulativeProfit)}
                          </span>
                        </td>
                        <td className="profit-col">
                          <div>เก็บ {currency(selectedScenario.totalCashKept)}</div>
                          <div>ทบ {currency(selectedScenario.roadmap.reduce((sum, row) => sum + row.reinvestedProfit, 0))}</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="chart-card">
                <div className="card-title">
                  <div>
                    <h2>รายได้เงินเก็บรายเดือนแบบสะสม</h2>
                    <p>
                      แยกตาม % reinvest ของราคา {selectedScenario.markupLabel} ({currency(selectedScenario.sellingPrice)}) และ CPA {selectedScenario.cpaLabel}
                    </p>
                  </div>
                  <RiskPill risk={selectedScenario.risk} />
                </div>
                <MultiScenarioLineChart scenarios={chartScenarios} />
              </div>

            </>
          )}
        </section>
      </section>
    </main>
  );
}



function NumberField({
  label,
  value,
  wide = false,
  formatThousands = false,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  wide?: boolean;
  formatThousands?: boolean;
  unit?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className={`field ${wide ? "wide" : ""}`}>
      <span>{label}</span>
      <div className="field-input-wrapper">
        {unit === "฿" && <span className="field-unit-prefix">฿</span>}
        <input
          type={formatThousands ? "text" : "number"}
          inputMode={formatThousands ? "numeric" : undefined}
          value={formatThousands ? (value === 0 ? "" : number.format(value)) : (value === 0 ? "" : value)}
          placeholder="0"
          onChange={(event) => {
            const rawValue = formatThousands ? event.target.value.replace(/[^\d.]/g, "") : event.target.value;
            onChange(clamp(Number(rawValue)));
          }}
          style={{
            paddingLeft: unit === "฿" ? "24px" : "14px",
            paddingRight: unit === "%" ? "24px" : "14px",
          }}
        />
        {unit === "%" && <span className="field-unit-suffix">%</span>}
      </div>
    </label>
  );
}

function LiveCostPreview({
  inputs,
  extraCosts,
}: {
  inputs: Inputs;
  extraCosts: ExtraCost[];
}) {
  const extraPerUnit = extraCosts
    .filter((cost) => cost.type === "perUnit")
    .reduce((sum, cost) => sum + clamp(cost.amount), 0);
  const extraPercent = extraCosts
    .filter((cost) => cost.type === "percentSale")
    .reduce((sum, cost) => sum + clamp(cost.amount), 0);
  const extraMonthly = extraCosts
    .filter((cost) => cost.type === "monthly")
    .reduce((sum, cost) => sum + clamp(cost.amount), 0);
  const stockCost = basePerUnitCost(inputs, extraCosts);
  const totalFeePercent = clamp(inputs.paymentFeePercent) + extraPercent;
  const fixedCost = monthlyFixedCost(inputs, extraCosts);
  return (
    <div className="live-cost-card">
      <div className="subhead">
        <h3>คำนวณต้นทุนตอนนี้</h3>
        <span>อัปเดตทันที</span>
      </div>

      <div className="cost-total">
        <span>ต้นทุน stock/ops ต่อชิ้น</span>
        <strong>{currency(stockCost)}</strong>
      </div>

      <div className="cost-breakdown">
        <span>สินค้า</span>
        <strong>{currency(inputs.productCost)}</strong>
        <span>ขนส่ง/นำเข้า</span>
        <strong>{currency(inputs.inboundShippingCost)}</strong>
        <span>แพ็กเกจจิ้ง</span>
        <strong>{currency(inputs.packagingCost)}</strong>
        <span>Fulfillment</span>
        <strong>{currency(inputs.fulfillmentCost)}</strong>
        <span>ส่งถึงลูกค้า</span>
        <strong>{currency(inputs.customerShippingCost)}</strong>
        <span>ต้นทุนอื่นๆ</span>
        <strong>{currency(extraPerUnit)}</strong>
      </div>

      <div className="cost-note-grid">
        <div>
          <span>Fee ตามยอดขาย</span>
          <strong>{percent(totalFeePercent)}</strong>
        </div>
        <div>
          <span>Fixed cost/เดือน</span>
          <strong>{currency(fixedCost)}</strong>
          {extraMonthly > 0 ? <small>รวมต้นทุนอื่นๆ {currency(extraMonthly)}</small> : null}
        </div>
      </div>
    </div>
  );
}

function PriceControlCard({
  markups,
  baseCost,
  minimumSellingPrice,
  selectedMarkupLabel,
  customSellingPrice,
  onCustomSellingPriceChange,
  onSelectMarkup,
}: {
  markups: ScenarioInput[];
  baseCost: number;
  minimumSellingPrice: number;
  selectedMarkupLabel: string;
  customSellingPrice?: number;
  onCustomSellingPriceChange: (value: number | undefined) => void;
  onSelectMarkup: (label: string) => void;
}) {
  return (
    <div className="selector-card">
      <div className="card-title compact">
        <div>
          <h2>เลือกราคาขาย</h2>
        </div>
      </div>
      <div className="selector-insight">
        <span>ราคาขายขั้นต่ำ (Break-Even)</span>
        <strong>{currency(minimumSellingPrice)}</strong>
        <small>ต่ำกว่านี้กำไรต่อออเดอร์เริ่มติดลบ</small>
      </div>
      <div className="choice-buttons">
        {markups.map((markup, index) => {
          const defaultPrice = markup.customPrice && markup.customPrice > 0 ? markup.customPrice : baseCost * clamp(markup.value, 0.1);

          return (
            <button
              className={`choice-button ${selectedMarkupLabel === markup.label ? "active" : ""}`}
              key={`${markup.label}-${index}`}
              onClick={() => onSelectMarkup(markup.label)}
            >
                <span>{markup.label}</span>
                <strong>{currency(defaultPrice)}</strong>
            </button>
          );
        })}
        <div 
          className={`choice-button custom-input-choice ${selectedMarkupLabel === "ตั้งราคาเอง" ? "active" : ""}`}
          onClick={() => onSelectMarkup("ตั้งราคาเอง")}
        >
          <span>ตั้งราคาเอง</span>
          <div className="custom-input-wrapper">
            <span className="input-prefix">฿</span>
            <input
              type="number"
              value={customSellingPrice ?? ""}
              placeholder="ระบุราคา"
              onChange={(event) =>
                onCustomSellingPriceChange(event.target.value === "" ? undefined : clamp(Number(event.target.value)))
              }
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function CpaControlCard({
  cpaCases,
  selectedCpaLabel,
  selectedSellingPrice,
  cpaLimit,
  customCpa,
  onCustomCpaChange,
  onSelectCpa,
}: {
  cpaCases: ScenarioInput[];
  selectedCpaLabel: string;
  selectedSellingPrice: number;
  cpaLimit: number;
  customCpa?: number;
  onCustomCpaChange: (value: number | undefined) => void;
  onSelectCpa: (label: string) => void;
}) {
  return (
    <div className="selector-card">
      <div className="card-title compact">
        <div>
          <h2>เลือก CPA (ค่าแอดเฉลี่ยต่อออเดอร์)</h2>
        </div>
      </div>
      <div className="selector-insight">
        <span>CPA Limit สูงสุด</span>
        <strong>{currency(cpaLimit)}</strong>
        <small>CPA ห้ามสูงเกินค่านี้เพื่อหลีกเลี่ยงการขาดทุนต่อออเดอร์</small>
      </div>
      <div className="choice-buttons">
        {cpaCases.map((cpaCase, index) => {
          const cpaValue =
            cpaCase.customCpa && cpaCase.customCpa > 0
              ? cpaCase.customCpa
              : selectedSellingPrice * (clamp(cpaCase.value) / 100);
          
          const riskPct = cpaLimit > 0 ? Math.min(100, Math.max(0, (cpaValue / cpaLimit) * 100)) : 100;
          const meterColor = riskPct > 85 ? "var(--red)" : riskPct > 60 ? "var(--amber)" : "var(--green)";

          return (
            <button
              className={`choice-button ${selectedCpaLabel === cpaCase.label ? "active" : ""}`}
              key={`${cpaCase.label}-${index}`}
              onClick={() => onSelectCpa(cpaCase.label)}
            >
              <span>{cpaCase.label}</span>
              <strong>{currency(cpaValue)}</strong>
              <div className="cpa-meter-wrapper">
                <div className="cpa-meter-bg">
                  <div className="cpa-meter-fill" style={{ width: `${riskPct}%`, backgroundColor: meterColor }} />
                </div>
                <small style={{ color: meterColor, fontWeight: 700 }}>{riskPct.toFixed(0)}% ของ Limit</small>
              </div>
            </button>
          );
        })}
        <div 
          className={`choice-button custom-input-choice ${selectedCpaLabel === "CPA เอง" ? "active" : ""}`}
          onClick={() => onSelectCpa("CPA เอง")}
        >
          <span>CPA เอง</span>
          <div className="custom-input-wrapper">
            <span className="input-prefix">฿</span>
            <input
              type="number"
              value={customCpa ?? ""}
              placeholder="ระบุ CPA"
              onChange={(event) => onCustomCpaChange(event.target.value === "" ? undefined : clamp(Number(event.target.value)))}
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ReinvestControlCard({
  reinvestCases,
  selectedReinvestLabel,
  customReinvest,
  onCustomReinvestChange,
  onSelectReinvest,
}: {
  reinvestCases: ScenarioInput[];
  selectedReinvestLabel: string;
  customReinvest?: number;
  onCustomReinvestChange: (value: number | undefined) => void;
  onSelectReinvest: (label: string) => void;
}) {
  return (
    <div className="selector-card">
      <div className="card-title compact">
        <div>
          <h2>เลือก % Reinvest (การทบทุนสะสม)</h2>
        </div>
      </div>
      <div className="choice-buttons">
        {reinvestCases.map((reinvestCase, index) => {
          const rateVal = reinvestCase.customReinvest ?? reinvestCase.value;
          const strategy = rateVal <= 35 ? "เน้นเก็บเงินสดเร็ว" : rateVal <= 55 ? "การเติบโตสมดุล" : "เน้นเร่งสเกลโตไว";
          
          return (
            <button
              className={`choice-button ${selectedReinvestLabel === reinvestCase.label ? "active" : ""}`}
              key={`${reinvestCase.label}-${index}`}
              onClick={() => onSelectReinvest(reinvestCase.label)}
            >
              <span>{reinvestCase.label}</span>
              <strong>{percent(rateVal)}</strong>
              <small style={{ marginTop: "2px", opacity: 0.85 }}>{strategy}</small>
            </button>
          );
        })}
        <div 
          className={`choice-button custom-input-choice ${selectedReinvestLabel === "Reinvest เอง" ? "active" : ""}`}
          onClick={() => onSelectReinvest("Reinvest เอง")}
        >
          <span>Reinvest เอง</span>
          <div className="custom-input-wrapper">
            <input
              type="number"
              value={customReinvest ?? ""}
              placeholder="ระบุ %"
              onChange={(event) =>
                onCustomReinvestChange(event.target.value === "" ? undefined : clamp(Number(event.target.value)))
              }
              onClick={(event) => event.stopPropagation()}
            />
            <span className="input-suffix">%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="metric-card">
      <div className="metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}
