import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DatabaseManager } from './components/DatabaseManager';
import { BulkInputSection } from './components/BulkInputSection';
import { CanvasEngine } from './components/CanvasEngine';
import { ExportModal } from './components/ExportModal';
import { CanvasItem, DesignPreset, LayoutSettings, OrderItem, RollMetrics } from './types';
import { generateAutoNestingLayout, parseBulkInput } from './utils/nestingEngine';
import { getLocalPresets, saveLocalPresets, fetchPresetsFromD1, saveOrdersToD1 } from './utils/d1Api';

export default function App() {
  // Load Presets from Local Storage or default preset database
  const [presets, setPresets] = useState<DesignPreset[]>(() => {
    return getLocalPresets();
  });

  // Fetch updated presets from Cloudflare D1 on initial mount
  useEffect(() => {
    let isMounted = true;
    fetchPresetsFromD1().then((d1Presets) => {
      if (isMounted && d1Presets && d1Presets.length > 0) {
        setPresets(d1Presets);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Save Presets to Local Storage whenever updated
  useEffect(() => {
    saveLocalPresets(presets);
  }, [presets]);

  const [activeTab, setActiveTab] = useState<'bulk' | 'canvas' | 'database' | 'export'>('bulk');

  // Bulk Input State
  const [rawText, setRawText] = useState<string>(
    `SJ-Y5EMT, KAKA, 22
SJ-S6NGQ, MESSI, 10
BARCELONA 2016-17, NEYMAR, 11
REAL MADRID 2023-24, RONALDO, 7
ARGENTINA 2022, MESSI, 10
MAN UNITED 2008, RONALDO, 7, Adult
INTER MIAMI 2023, MESSI, 10, Youth
PSG 2021-22, MBAPPE, 7, Adult
ARSENAL 2003-04, HENRY, 14, Adult
BRAZIL 2002, RONALDINHO, 11, Adult`
  );

  const [parsedOrders, setParsedOrders] = useState<OrderItem[]>([]);
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);

  const [layoutSettings, setLayoutSettings] = useState<LayoutSettings>({
    rollWidthInches: 39.0,
    marginInches: 0.10, // Minimal, safe 1-2mm cut spacing
    nestingStrategy: 'compact',
    packingMode: 'row_by_row_structured',
    showCutLines: true,
    cutLineColor: '#38bdf8',
    dpi: 300,
    zoomLevel: 1.0,
    autoRotateLongNames: false,
    groupDistanceInches: 0.2,
  });

  const [metrics, setMetrics] = useState<RollMetrics>({
    totalRollLengthInches: 24.0,
    totalRollLengthMeters: 0.61,
    usedAreaSquareInches: 500,
    totalCapacitySquareInches: 936,
    wastePercentage: 20,
    efficiencyPercentage: 80,
    totalNamesCount: 10,
    totalNumbersCount: 10,
    totalOrdersCount: 10,
    estimatedPrintTimeMinutes: 2,
    estimatedFilmCostUSD: 4.32,
  });

  // Initial parse on mount
  useEffect(() => {
    const presetsMap = new Map<string, DesignPreset>(presets.map((p) => [p.code.toUpperCase(), p]));
    const initialOrders = parseBulkInput(rawText, presetsMap);
    setParsedOrders(initialOrders);

    // Initial Layout Generation
    if (initialOrders.length > 0) {
      const result = generateAutoNestingLayout(initialOrders, layoutSettings);
      setCanvasItems(result.items);
      setMetrics(result.metrics);
    }
  }, []);

  // Process & Generate 39" Roll Layout
  const handleGenerateLayout = (ordersToProcess: OrderItem[]) => {
    const presetsMap = new Map<string, DesignPreset>(presets.map((p) => [p.code.toUpperCase(), p]));
    const result = generateAutoNestingLayout(ordersToProcess, layoutSettings);
    setCanvasItems(result.items);
    setMetrics(result.metrics);
    setActiveTab('canvas');

    // Async sync orders with Cloudflare D1
    saveOrdersToD1(ordersToProcess);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        metrics={metrics}
        ordersCount={parsedOrders.length}
        presetsCount={presets.length}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'bulk' && (
          <BulkInputSection
            presets={presets}
            rawText={rawText}
            setRawText={setRawText}
            parsedOrders={parsedOrders}
            setParsedOrders={setParsedOrders}
            onGenerateLayout={handleGenerateLayout}
          />
        )}

        {activeTab === 'canvas' && (
          <CanvasEngine
            canvasItems={canvasItems}
            setCanvasItems={setCanvasItems}
            layoutSettings={layoutSettings}
            setLayoutSettings={setLayoutSettings}
            metrics={metrics}
            setMetrics={setMetrics}
            orders={parsedOrders}
          />
        )}

        {activeTab === 'database' && (
          <DatabaseManager
            presets={presets}
            setPresets={setPresets}
            onSelectPresetForTesting={(code) => {
              setRawText((prev) => `${code}, MESSI, 10\n` + prev);
              setActiveTab('bulk');
            }}
          />
        )}

        {activeTab === 'export' && (
          <ExportModal
            canvasItems={canvasItems}
            layoutSettings={layoutSettings}
            metrics={metrics}
            orders={parsedOrders}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-zinc-900/80 py-4 px-6 text-center text-xs text-zinc-500 font-mono">
        <span>SPIDEY JERSEY DTF Print Automation System • 39 Inch Roll Engine • Cloudflare D1 (spd-dtf) • 300 DPI High Resolution Export</span>
      </footer>
    </div>
  );
}
