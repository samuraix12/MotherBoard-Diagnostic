import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Zap, 
  Thermometer, 
  Cpu, 
  ShieldCheck, 
  AlertTriangle, 
  Terminal,
  Layers,
  Search,
  Settings,
  Info
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { TelemetryData, HardwareComponent, DiagnosticReport } from './types';
import { generateMockTelemetry, MOCK_COMPONENTS } from './services/telemetryService';
import { analyzeStability } from './services/geminiService';

export default function App() {
  const [telemetry, setTelemetry] = useState<TelemetryData[]>([]);
  const [currentData, setCurrentData] = useState<TelemetryData | null>(null);
  const [components] = useState<HardwareComponent[]>(MOCK_COMPONENTS);
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'forensics' | 'analysis'>('dashboard');

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(prev => {
        const newData = generateMockTelemetry(prev[prev.length - 1]);
        setCurrentData(newData);
        const updated = [...prev, newData].slice(-50);
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const runAIAnalysis = async () => {
    if (telemetry.length < 5) return;
    setIsAnalyzing(true);
    const result = await analyzeStability(telemetry);
    setReport(result);
    setIsAnalyzing(false);
    setActiveTab('analysis');
  };

  if (!currentData) return <div className="flex items-center justify-center h-screen bg-board-bg text-board-accent font-mono">INITIALIZING TELEMETRY BUS...</div>;

  return (
    <div className="min-h-screen bg-board-bg text-zinc-300 font-sans selection:bg-board-accent/30 overflow-hidden flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-board-border bg-board-card/50 backdrop-blur-md flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-board-accent/10 rounded-lg flex items-center justify-center border border-board-accent/20">
            <ShieldCheck className="w-6 h-6 text-board-accent" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              BOARDSENTINEL <span className="text-[10px] font-mono bg-board-accent/20 text-board-accent px-1.5 py-0.5 rounded border border-board-accent/30">v2.4.0-PRO</span>
            </h1>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Forensic Hardware Stability Analyzer</p>
          </div>
        </div>

        <nav className="flex items-center gap-1 bg-board-bg/50 p-1 rounded-xl border border-board-border">
          {[
            { id: 'dashboard', icon: Activity, label: 'Real-time' },
            { id: 'forensics', icon: Layers, label: 'Forensics' },
            { id: 'analysis', icon: Search, label: 'AI Insights' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                activeTab === tab.id 
                  ? "bg-board-card text-white shadow-lg border border-board-border" 
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">System Status</span>
            <span className="text-xs font-bold text-board-emerald flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-board-emerald animate-pulse" />
              NOMINAL
            </span>
          </div>
          <button className="p-2 hover:bg-board-card rounded-lg border border-transparent hover:border-board-border transition-all">
            <Settings className="w-5 h-5 text-zinc-500" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative grid-bg">
        <div className="scanline" />
        
        <div className="h-full p-6 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Top Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard 
                    label="Stability Score" 
                    value={`${currentData.stabilityScore}%`} 
                    icon={ShieldCheck}
                    trend={currentData.stabilityScore > 95 ? 'stable' : 'variance'}
                    color="accent"
                  />
                  <StatCard 
                    label="VCore Ripple" 
                    value={`${currentData.vcoreRipple} mV`} 
                    icon={Zap}
                    trend={currentData.vcoreRipple < 20 ? 'low' : 'high'}
                    color="amber"
                  />
                  <StatCard 
                    label="VRM Thermal" 
                    value={`${currentData.vrmTemp}°C`} 
                    icon={Thermometer}
                    trend={currentData.vrmTemp < 70 ? 'cool' : 'warm'}
                    color="rose"
                  />
                  <StatCard 
                    label="System Load" 
                    value={`${currentData.load}%`} 
                    icon={Cpu}
                    trend="active"
                    color="emerald"
                  />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-board-card border border-board-border rounded-2xl p-6 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Activity className="w-4 h-4 text-board-accent" />
                          VOLTAGE STABILITY ANALYSIS
                        </h3>
                        <p className="text-[10px] font-mono text-zinc-500 uppercase mt-1">VCore Rail Variance (1000ms polling)</p>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-mono">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-board-accent" /> VCORE</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-board-amber" /> RIPPLE</span>
                      </div>
                    </div>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={telemetry}>
                          <defs>
                            <linearGradient id="colorVcore" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                          <XAxis dataKey="timestamp" hide />
                          <YAxis domain={['dataMin - 0.1', 'dataMax + 0.1']} hide />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#141417', border: '1px solid #27272A', borderRadius: '8px', fontSize: '10px', fontFamily: 'monospace' }}
                            itemStyle={{ color: '#fff' }}
                          />
                          <Area type="monotone" dataKey="vcore" stroke="#3B82F6" fillOpacity={1} fill="url(#colorVcore)" strokeWidth={2} isAnimationActive={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-board-card border border-board-border rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-6">
                      <Thermometer className="w-4 h-4 text-board-rose" />
                      THERMAL PROFILE
                    </h3>
                    <div className="space-y-6">
                      <ThermalBar label="VRM Phase Array" value={currentData.vrmTemp} max={110} color="rose" />
                      <ThermalBar label="CPU Package" value={currentData.cpuTemp} max={100} color="amber" />
                      <ThermalBar label="PCH Chipset" value={currentData.chipsetTemp} max={90} color="emerald" />
                      
                      <div className="pt-4 border-t border-board-border">
                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-2">
                          <span>THROTTLING RISK</span>
                          <span>{currentData.vrmTemp > 90 ? 'HIGH' : 'LOW'}</span>
                        </div>
                        <div className="h-1.5 bg-board-bg rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all duration-500",
                              currentData.vrmTemp > 90 ? "bg-board-rose" : "bg-board-emerald"
                            )}
                            style={{ width: `${Math.min(100, (currentData.vrmTemp / 110) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Section */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-3 bg-board-card border border-board-border rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-zinc-500" />
                        TELEMETRY BUS LOG
                      </h3>
                      <span className="text-[10px] font-mono text-zinc-500">POLLING ACTIVE</span>
                    </div>
                    <div className="space-y-2 font-mono text-[11px]">
                      {telemetry.slice(-6).reverse().map((d, i) => (
                        <div key={i} className="flex items-center gap-4 py-1 border-b border-board-border/50 last:border-0 opacity-80 hover:opacity-100 transition-opacity">
                          <span className="text-zinc-600">[{new Date(d.timestamp).toLocaleTimeString()}]</span>
                          <span className="text-board-accent">BUS_READ:</span>
                          <span className="text-zinc-400">VCORE={d.vcore}V</span>
                          <span className="text-zinc-400">RIPPLE={d.vcoreRipple}mV</span>
                          <span className="text-zinc-400">TEMP={d.vrmTemp}C</span>
                          <span className={cn("ml-auto", d.stabilityScore > 90 ? "text-board-emerald" : "text-board-amber")}>
                            STATUS_OK_{d.stabilityScore}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-board-accent/5 border border-board-accent/20 rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-board-accent flex items-center gap-2 mb-2">
                        <Search className="w-4 h-4" />
                        AI DIAGNOSTICS
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Run a forensic analysis of the current telemetry stream using Gemini AI to identify hidden stability risks.
                      </p>
                    </div>
                    <button 
                      onClick={runAIAnalysis}
                      disabled={isAnalyzing}
                      className="w-full mt-6 py-3 bg-board-accent hover:bg-board-accent/90 disabled:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-board-accent/20"
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ANALYZING...
                        </>
                      ) : (
                        <>
                          <Activity className="w-4 h-4" />
                          RUN FORENSIC SCAN
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'forensics' && (
              <motion.div 
                key="forensics"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {components.map((comp) => (
                  <div key={comp.id} className="bg-board-card border border-board-border rounded-2xl p-6 hover:border-board-accent/50 transition-all group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 bg-board-bg rounded-lg flex items-center justify-center border border-board-border group-hover:border-board-accent/30 transition-colors">
                        <Layers className="w-5 h-5 text-zinc-500 group-hover:text-board-accent transition-colors" />
                      </div>
                      <span className={cn(
                        "text-[10px] font-mono px-2 py-0.5 rounded border uppercase",
                        comp.status === 'optimal' ? "bg-board-emerald/10 text-board-emerald border-board-emerald/20" :
                        comp.status === 'warning' ? "bg-board-amber/10 text-board-amber border-board-amber/20" :
                        "bg-board-rose/10 text-board-rose border-board-rose/20"
                      )}>
                        {comp.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">{comp.name}</h4>
                    <p className="text-xs text-zinc-500 mb-4">{comp.details}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-board-border">
                      <span className="text-[10px] font-mono text-zinc-600">ADDR: {comp.address}</span>
                      <button className="text-[10px] font-bold text-board-accent hover:underline uppercase tracking-wider">Inspect Node</button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'analysis' && (
              <motion.div 
                key="analysis"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-4xl mx-auto"
              >
                {!report ? (
                  <div className="bg-board-card border border-board-border rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 bg-board-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Search className="w-8 h-8 text-board-accent" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">No Analysis Data</h2>
                    <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                      Run a forensic scan from the dashboard to generate an AI-powered diagnostic report of your motherboard's health.
                    </p>
                    <button 
                      onClick={runAIAnalysis}
                      className="px-8 py-3 bg-board-accent hover:bg-board-accent/90 text-white rounded-xl text-sm font-bold transition-all"
                    >
                      Start Analysis
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className={cn(
                      "p-8 rounded-2xl border flex items-start gap-6",
                      report.riskLevel === 'low' ? "bg-board-emerald/5 border-board-emerald/20" :
                      report.riskLevel === 'medium' ? "bg-board-amber/5 border-board-amber/20" :
                      "bg-board-rose/5 border-board-rose/20"
                    )}>
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                        report.riskLevel === 'low' ? "bg-board-emerald/20 text-board-emerald" :
                        report.riskLevel === 'medium' ? "bg-board-amber/20 text-board-amber" :
                        "bg-board-rose/20 text-board-rose"
                      )}>
                        {report.riskLevel === 'low' ? <ShieldCheck className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-xl font-bold text-white">Forensic Diagnostic Report</h2>
                          <span className={cn(
                            "text-[10px] font-mono px-2 py-0.5 rounded border uppercase",
                            report.riskLevel === 'low' ? "bg-board-emerald/10 text-board-emerald border-board-emerald/20" :
                            report.riskLevel === 'medium' ? "bg-board-amber/10 text-board-amber border-board-amber/20" :
                            "bg-board-rose/10 text-board-rose border-board-rose/20"
                          )}>
                            RISK: {report.riskLevel}
                          </span>
                        </div>
                        <p className="text-zinc-300 leading-relaxed italic font-serif">
                          "{report.summary}"
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-board-card border border-board-border rounded-2xl p-6">
                        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                          <Info className="w-4 h-4 text-board-accent" />
                          TECHNICAL RECOMMENDATIONS
                        </h3>
                        <ul className="space-y-4">
                          {report.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-3 group">
                              <span className="w-5 h-5 rounded bg-board-bg border border-board-border flex items-center justify-center text-[10px] font-mono text-zinc-500 group-hover:border-board-accent group-hover:text-board-accent transition-colors">
                                0{i + 1}
                              </span>
                              <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="bg-board-card border border-board-border rounded-2xl p-6">
                        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-board-amber" />
                          STABILITY PROJECTION
                        </h3>
                        <div className="space-y-4">
                          <div className="p-4 bg-board-bg rounded-xl border border-board-border">
                            <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-2">
                              <span>MTBF ESTIMATE</span>
                              <span>42,000 HRS</span>
                            </div>
                            <div className="h-1 bg-board-emerald/30 rounded-full overflow-hidden">
                              <div className="h-full bg-board-emerald w-[85%]" />
                            </div>
                          </div>
                          <p className="text-[11px] text-zinc-500 leading-relaxed">
                            Based on current voltage ripple patterns and thermal dissipation efficiency, the motherboard is operating within 85% of its peak design lifecycle.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer / Status Bar */}
      <footer className="h-8 border-t border-board-border bg-board-card/80 flex items-center justify-between px-4 text-[10px] font-mono text-zinc-500">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-board-emerald" />
            LINK: PCIE_GEN5_ACTIVE
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-board-emerald" />
            BUS: SMBUS_STABLE
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-board-amber" />
            MEM: XMP_3.0_PROFILE_1
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>UPTIME: 04:12:44:09</span>
          <span className="text-board-accent">S/N: BS-9920-X790-ALPHA</span>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, trend, color }: { label: string, value: string, icon: any, trend: string, color: 'accent' | 'amber' | 'rose' | 'emerald' }) {
  const colorMap = {
    accent: 'text-board-accent bg-board-accent/10 border-board-accent/20',
    amber: 'text-board-amber bg-board-amber/10 border-board-amber/20',
    rose: 'text-board-rose bg-board-rose/10 border-board-rose/20',
    emerald: 'text-board-emerald bg-board-emerald/10 border-board-emerald/20',
  };

  return (
    <div className="bg-board-card border border-board-border rounded-2xl p-5 hover:border-zinc-700 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border", colorMap[color])}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{trend}</span>
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function ThermalBar({ label, value, max, color }: { label: string, value: number, max: number, color: 'rose' | 'amber' | 'emerald' }) {
  const colorMap = {
    rose: 'bg-board-rose',
    amber: 'bg-board-amber',
    emerald: 'bg-board-emerald',
  };

  const percentage = Math.min(100, (value / max) * 100);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-mono text-zinc-400 uppercase">{label}</span>
        <span className="text-xs font-bold text-white">{value}°C</span>
      </div>
      <div className="h-1 bg-board-bg rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className={cn("h-full transition-colors duration-300", colorMap[color])}
        />
      </div>
    </div>
  );
}
