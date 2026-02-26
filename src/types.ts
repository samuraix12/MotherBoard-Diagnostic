export interface TelemetryData {
  timestamp: number;
  vcore: number;
  vcoreRipple: number;
  dram: number;
  vrmTemp: number;
  chipsetTemp: number;
  cpuTemp: number;
  stabilityScore: number;
  clockSpeed: number;
  load: number;
}

export interface HardwareComponent {
  id: string;
  name: string;
  status: 'optimal' | 'warning' | 'critical';
  details: string;
  address: string;
}

export interface DiagnosticReport {
  summary: string;
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
}
