"use client";

import {
  Boxes,
  Calculator,
  CircleDollarSign,
  LineChart,
  Plus,
  RefreshCcw,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";

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

type MonthlyRow = {
  month: number;
  startingCapital: number;
  units: number;
  revenue: number;
  variableCost: number;
  adSpend: number;
  requiredCapital: number;
  unusedCapital: number;
  fixedCost: number;
  netProfit: number;
  cashKept: number;
  reinvestedProfit: number;
  nextCapital: number;
  nextUnits: number;
  roas: number;
  mer: number;
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
  month12Units: number;
  month12Profit: number;
  cumulativeProfit: number;
  totalRevenue: number;
  totalAdSpend: number;
  risk: "healthy" | "caution" | "danger";
  roadmap: MonthlyRow[];
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
  { id: "sample-reserve", name: "Warranty / reserve", type: "perUnit", amount: 8 },
];

const defaultMarkups: ScenarioInput[] = [
  { label: "3x", value: 3 },
  { label: "4x", value: 4 },
  { label: "5x", value: 5 },
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
): ScenarioResult {
  const baseCost = basePerUnitCost(inputs, extraCosts);
  const fixedCost = monthlyFixedCost(inputs, extraCosts);
  const refundRate = clamp(inputs.refundRate) / 100;
  const cpaRate = clamp(cpaCase.value) / 100;
  const reinvestRate =
    reinvestCase.customReinvest && reinvestCase.customReinvest > 0
      ? clamp(reinvestCase.customReinvest) / 100
      : clamp(reinvestCase.value) / 100;
  const sellingPrice =
    markupCase.customPrice && markupCase.customPrice > 0
      ? markupCase.customPrice
      : baseCost * clamp(markupCase.value, 0.1);
  const trueCostBeforeAds = baseCost + sellingPrice * percentCostRate(inputs, extraCosts);
  const cpa = cpaCase.customCpa && cpaCase.customCpa > 0 ? cpaCase.customCpa : sellingPrice * cpaRate;
  const effectiveCpaRate = sellingPrice > 0 ? cpa / sellingPrice : 0;
  const netRevenuePerUnit = sellingPrice * (1 - refundRate);
  const grossProfitBeforeAds = netRevenuePerUnit - trueCostBeforeAds;
  const breakEvenCpa = grossProfitBeforeAds;
  const breakEvenRoas = grossProfitBeforeAds > 0 ? netRevenuePerUnit / grossProfitBeforeAds : 0;
  const perUnitOperatingCapital = trueCostBeforeAds + cpa;
  let operatingCapital = clamp(inputs.startingCapital);
  const roadmap: MonthlyRow[] = [];

  for (let month = 1; month <= 12; month += 1) {
    const startingCapital = operatingCapital;
    const units = Math.floor(startingCapital / Math.max(perUnitOperatingCapital, 1));
    const revenue = units * sellingPrice * (1 - refundRate);
    const variableCost = units * trueCostBeforeAds;
    const adSpend = units * cpa;
    const requiredCapital = variableCost + adSpend;
    const unusedCapital = Math.max(0, startingCapital - requiredCapital);
    const netProfit = revenue - variableCost - adSpend - fixedCost;
    const reinvestedProfit = Math.max(0, netProfit * reinvestRate);
    const cashKept = Math.max(0, netProfit - reinvestedProfit);
    const nextCapital = Math.max(0, startingCapital + (netProfit >= 0 ? reinvestedProfit : netProfit));
    const nextUnitsRaw = Math.floor(nextCapital / Math.max(perUnitOperatingCapital, 1));
    const nextUnits = Math.max(0, nextUnitsRaw);

    roadmap.push({
      month,
      startingCapital,
      units,
      revenue,
      variableCost,
      adSpend,
      requiredCapital,
      unusedCapital,
      fixedCost,
      netProfit,
      cashKept,
      reinvestedProfit,
      nextCapital,
      nextUnits,
      roas: adSpend > 0 ? revenue / adSpend : 0,
      mer: revenue > 0 ? adSpend / revenue : 0,
    });

    operatingCapital = nextCapital;
  }

  const cumulativeProfit = roadmap.reduce((sum, row) => sum + row.netProfit, 0);
  const totalRevenue = roadmap.reduce((sum, row) => sum + row.revenue, 0);
  const totalAdSpend = roadmap.reduce((sum, row) => sum + row.adSpend, 0);
  const month12 = roadmap[11];
  const netMargin = totalRevenue > 0 ? cumulativeProfit / totalRevenue : 0;
  const cpaPressure = breakEvenCpa > 0 ? cpa / breakEvenCpa : 99;
  const risk =
    breakEvenCpa <= 0 || cumulativeProfit <= 0 || month12.units === 0
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
    initialCapitalUsed: roadmap[0]?.requiredCapital ?? 0,
    initialStockBudget: roadmap[0]?.variableCost ?? 0,
    initialAdBudget: roadmap[0]?.adSpend ?? 0,
    initialUnusedCapital: roadmap[0]?.unusedCapital ?? 0,
    startingUnits: roadmap[0]?.units ?? 0,
    month12Units: month12?.units ?? 0,
    month12Profit: month12?.netProfit ?? 0,
    cumulativeProfit,
    totalRevenue,
    totalAdSpend,
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
) {
  return markups.flatMap((markup) =>
    cpaCases.flatMap((cpa) => reinvestCases.map((reinvest) => buildScenario(inputs, extraCosts, markup, cpa, reinvest))),
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
      return { month: row.month, value: runningCash, cashKept: row.cashKept };
    });

    return { scenario, values, totalCash: runningCash };
  });
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
          aria-label="Accumulated monthly cash kept by reinvest rate"
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const scaledX = ((event.clientX - rect.left) / rect.width) * width;
            const rawIndex = Math.round(((scaledX - padX) / chartWidth) * 11);
            const index = Math.max(0, Math.min(11, rawIndex));
            setHoveredPoint({ index, xPct: Math.max(12, Math.min(88, (xFor(index, 12) / width) * 100)) });
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
          {Array.from({ length: 12 }, (_, index) => {
            const x = xFor(index, 12);
            return (
              <g key={`m-${index + 1}`}>
                <line className="grid-line vertical" x1={x} x2={x} y1={padTop} y2={height - padBottom} />
                <text x={x} y={height - 8} textAnchor="middle">
                  M{index + 1}
                </text>
              </g>
            );
          })}
          {hoveredIndex !== null ? (
            <line
              className="hover-line"
              x1={xFor(hoveredIndex, 12)}
              x2={xFor(hoveredIndex, 12)}
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
                      key={`${scenario.id}-${point.month}`}
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
            <strong>เดือน M{hoveredPoint.index + 1}</strong>
            {series.map(({ scenario, values }, index) => {
              const point = values[hoveredPoint.index];
              return (
                <div key={`${scenario.id}-hover`} className="tooltip-row">
                  <span>
                    <i style={{ backgroundColor: colors[index % colors.length] }} />
                    {percent(scenario.reinvestRate * 100)}
                  </span>
                  <div>
                    <b>{currency(point.value)}</b>
                    <small>เดือนนี้ {currency(point.cashKept)}</small>
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
            <small>{percent(scenario.reinvestRate * 100)} reinvest · เงินเก็บสุทธิ 12 เดือน</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskPill({ risk }: { risk: ScenarioResult["risk"] }) {
  const label = risk === "healthy" ? "น่าเดินต่อ" : risk === "caution" ? "ต้องคุมตัวเลข" : "เสี่ยง";
  return <span className={`risk ${risk}`}>{label}</span>;
}

export default function Home() {
  const [inputs, setInputs] = useState<Inputs>(defaultInputs);
  const [extraCosts, setExtraCosts] = useState<ExtraCost[]>(defaultExtraCosts);
  const markups = defaultMarkups;
  const cpaCases = defaultCpaCases;
  const reinvestCases = defaultReinvestCases;
  const [customSellingPrice, setCustomSellingPrice] = useState<number | undefined>();
  const [customCpa, setCustomCpa] = useState<number | undefined>();
  const [customReinvest, setCustomReinvest] = useState<number | undefined>();
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
    () => buildAllScenarios(inputs, extraCosts, effectiveMarkups, effectiveCpaCases, effectiveReinvestCases),
    [inputs, extraCosts, effectiveMarkups, effectiveCpaCases, effectiveReinvestCases],
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
  const totalCashKept = selectedScenario?.roadmap.reduce((sum, row) => sum + row.cashKept, 0) ?? 0;
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
            เริ่มเดือนแรกโดยแบ่งทุนเป็นค่า stock และค่า ads ตาม CPA ของแต่ละเคส แล้วจำลองราคา 3x / 4x / 5x,
            custom price, CPA 3 ระดับ และ reinvest 12 เดือน
          </p>
        </div>
        <button className="primary-action" onClick={runAnalysis}>
          <Calculator size={20} />
          วิเคราะห์
        </button>
      </section>

      <section className="workspace">
        <aside className="input-panel">
          <div className="panel-heading">
            <h2>ต้นทุน (ต่อ 1 ชิ้น)</h2>
            <button
              className="ghost-button"
              onClick={() => {
                setInputs(defaultInputs);
                setExtraCosts(defaultExtraCosts);
                setCustomSellingPrice(undefined);
                setCustomCpa(undefined);
                setCustomReinvest(undefined);
                setHasAnalyzed(false);
                setSelectedId(null);
              }}
            >
              <RefreshCcw size={16} />
              รีเซ็ต
            </button>
          </div>

          <label className="field wide">
            <span>ชื่อสินค้า</span>
            <input value={inputs.productName} onChange={(event) => setInput("productName", event.target.value)} />
          </label>

          <div className="field-grid">
            <NumberField wide formatThousands label="ทุนเริ่มต้น" value={inputs.startingCapital} onChange={(value) => setInput("startingCapital", value)} />
            <NumberField wide label="ราคาสินค้า" value={inputs.productCost} onChange={(value) => setInput("productCost", value)} />
            <NumberField label="ขนส่ง/นำเข้า" value={inputs.inboundShippingCost} onChange={(value) => setInput("inboundShippingCost", value)} />
            <NumberField label="แพ็กเกจจิ้ง" value={inputs.packagingCost} onChange={(value) => setInput("packagingCost", value)} />
            <NumberField label="Fulfillment" value={inputs.fulfillmentCost} onChange={(value) => setInput("fulfillmentCost", value)} />
            <NumberField label="ส่งถึงลูกค้า" value={inputs.customerShippingCost} onChange={(value) => setInput("customerShippingCost", value)} />
            <NumberField label="ค่าธรรมเนียม %" value={inputs.paymentFeePercent} onChange={(value) => setInput("paymentFeePercent", value)} />
            <NumberField label="Fixed cost/เดือน" value={inputs.fixedMonthlyCost} onChange={(value) => setInput("fixedMonthlyCost", value)} />
            <NumberField label="คืนสินค้า %" value={inputs.refundRate} onChange={(value) => setInput("refundRate", value)} />
          </div>

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
                <input
                  type="number"
                  value={cost.amount}
                  onChange={(event) =>
                    setExtraCosts((current) =>
                      current.map((item) =>
                        item.id === cost.id ? { ...item, amount: clamp(Number(event.target.value)) } : item,
                      ),
                    )
                  }
                />
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

          <button className="analyze-wide" onClick={runAnalysis}>
            <Calculator size={18} />
            วิเคราะห์
          </button>
        </aside>

        <section className="result-panel">
          {!hasAnalyzed ? (
            <div className="empty-state">
              <Calculator size={42} />
              <h2>พร้อมคำนวณแผน 12 เดือน</h2>
              <p>กรอกต้นทุนและทุนเริ่มต้น แล้วกดวิเคราะห์เพื่อสร้าง roadmap</p>
            </div>
          ) : (
            <>
              <div className="selector-stack">
                <PriceControlCard
                  markups={effectiveMarkups}
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
                  cpaCases={effectiveCpaCases}
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
                  reinvestCases={effectiveReinvestCases}
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
                  detail="รายได้สุทธิ / Ad spend 12 เดือน"
                />
                <MetricCard
                  icon={<CircleDollarSign />}
                  label="รายได้สุทธิ"
                  value={currency(totalCashKept)}
                  detail="รวมเงินเก็บ 12 เดือน"
                />
              </div>

              <div className="table-card">
                <div className="card-title compact">
                  <h2>12-month roadmap</h2>
                  <span>{inputs.productName}</span>
                </div>
                <div className="table-wrap">
                  <table className="roadmap-table">
                    <thead>
                      <tr className="group-row">
                        <th className="plan-head" colSpan={2}>แผน</th>
                        <th className="cost-head" colSpan={3}>ต้นทุน</th>
                        <th className="quantity-head" colSpan={1}>จำนวนขาย</th>
                        <th className="sales-head" colSpan={1}>ยอดขาย</th>
                        <th className="profit-head" colSpan={3}>กำไร / เงินสด</th>
                      </tr>
                      <tr>
                        <th className="plan-head">เดือน</th>
                        <th className="plan-head">เงินต้น</th>
                        <th className="cost-head">ค่า stock/ops</th>
                        <th className="cost-head">Ad spend</th>
                        <th className="cost-head">เงินลงทุน</th>
                        <th className="quantity-head">ขายได้</th>
                        <th className="sales-head">รายได้สุทธิ</th>
                        <th className="profit-head">กำไรสุทธิ</th>
                        <th className="profit-head">เก็บเงิน</th>
                        <th className="profit-head">Reinvest</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedScenario.roadmap.map((row) => (
                        <tr key={row.month}>
                          <td className="plan-col">M{row.month}</td>
                          <td className="plan-col">{currency(row.startingCapital)}</td>
                          <td className="cost-col">{currency(row.variableCost)}</td>
                          <td className="cost-col">{currency(row.adSpend)}</td>
                          <td className="cost-col">{currency(row.requiredCapital)}</td>
                          <td className="quantity-col">{whole(row.units)} ชิ้น</td>
                          <td className="sales-col">{currency(row.revenue)}</td>
                          <td className={`profit-col ${row.netProfit >= 0 ? "positive" : "negative"}`}>{currency(row.netProfit)}</td>
                          <td className="profit-col">{currency(row.cashKept)}</td>
                          <td className="profit-col">{currency(row.reinvestedProfit)}</td>
                        </tr>
                      ))}
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
  onChange,
}: {
  label: string;
  value: number;
  wide?: boolean;
  formatThousands?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className={`field ${wide ? "wide" : ""}`}>
      <span>{label}</span>
      <input
        type={formatThousands ? "text" : "number"}
        inputMode={formatThousands ? "numeric" : undefined}
        value={formatThousands ? number.format(value) : value}
        onChange={(event) => {
          const rawValue = formatThousands ? event.target.value.replace(/[^\d.]/g, "") : event.target.value;
          onChange(clamp(Number(rawValue)));
        }}
      />
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
          <p>เลือก 3x / 4x / 5x หรือใช้ราคาขายที่กำหนดเอง</p>
        </div>
      </div>
      <div className="selector-insight">
        <span>ราคาขายขั้นต่ำ</span>
        <strong>{currency(minimumSellingPrice)}</strong>
        <small>ต่ำกว่านี้กำไรต่อออเดอร์เริ่มติดลบ</small>
      </div>
      <div className="selector-row">
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
                <small>{markup.customPrice ? "custom" : `ต้นทุน x ${markup.value}`}</small>
            </button>
          );
        })}
        </div>
        <div className="custom-input-card">
          <label>
            <span>ราคาขายเอง</span>
            <input
              type="number"
              value={customSellingPrice ?? ""}
              placeholder="เช่น 990"
              onChange={(event) =>
                onCustomSellingPriceChange(event.target.value === "" ? undefined : clamp(Number(event.target.value)))
              }
            />
          </label>
          <small>เพิ่มเป็นปุ่มราคาด้านซ้ายและคำนวณใน chart</small>
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
          <h2>เลือก CPA</h2>
          <p>แยก CPA ออกจากราคาขาย เพื่อดูผลของ Bad / Base / Good หรือใส่ CPA เอง</p>
        </div>
      </div>
      <div className="selector-insight">
        <span>CPA limit</span>
        <strong>{currency(cpaLimit)}</strong>
        <small>CPA สูงสุดก่อนกำไรต่อออเดอร์ติดลบ</small>
      </div>
      <div className="selector-row">
        <div className="choice-buttons">
          {cpaCases.map((cpaCase, index) => {
            const cpaValue =
              cpaCase.customCpa && cpaCase.customCpa > 0
                ? cpaCase.customCpa
                : selectedSellingPrice * (clamp(cpaCase.value) / 100);

            return (
              <button
                className={`choice-button ${selectedCpaLabel === cpaCase.label ? "active" : ""}`}
                key={`${cpaCase.label}-${index}`}
                onClick={() => onSelectCpa(cpaCase.label)}
              >
                <span>{cpaCase.label}</span>
                <strong>{currency(cpaValue)}</strong>
                <small>{cpaCase.customCpa ? "custom CPA" : `${percent(cpaCase.value)} ของราคาขาย`}</small>
              </button>
            );
          })}
        </div>
        <div className="custom-input-card">
          <label>
            <span>CPA เอง</span>
            <input
              type="number"
              value={customCpa ?? ""}
              placeholder="เช่น 280"
              onChange={(event) => onCustomCpaChange(event.target.value === "" ? undefined : clamp(Number(event.target.value)))}
            />
          </label>
          <small>ใส่เป็นบาทต่อ purchase</small>
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
          <h2>เลือก % reinvest</h2>
          <p>เลือกสัดส่วนกำไรที่นำกลับไปซื้อ stock และยิงแอดต่อในเดือนถัดไป</p>
        </div>
      </div>
      <div className="selector-row">
        <div className="choice-buttons">
          {reinvestCases.map((reinvestCase, index) => (
            <button
              className={`choice-button ${selectedReinvestLabel === reinvestCase.label ? "active" : ""}`}
              key={`${reinvestCase.label}-${index}`}
              onClick={() => onSelectReinvest(reinvestCase.label)}
            >
              <span>{reinvestCase.label}</span>
              <strong>{percent(reinvestCase.customReinvest ?? reinvestCase.value)}</strong>
              <small>{reinvestCase.customReinvest ? "custom reinvest" : "ของกำไรสุทธิ"}</small>
            </button>
          ))}
        </div>
        <div className="custom-input-card">
          <label>
            <span>Reinvest เอง</span>
            <input
              type="number"
              value={customReinvest ?? ""}
              placeholder="เช่น 65"
              onChange={(event) =>
                onCustomReinvestChange(event.target.value === "" ? undefined : clamp(Number(event.target.value)))
              }
            />
          </label>
          <small>ใส่เป็น % ของกำไรสุทธิที่เอาไป compound</small>
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
