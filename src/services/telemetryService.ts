import { TelemetryData, HardwareComponent } from '../types';

export const generateMockTelemetry = (prev?: TelemetryData): TelemetryData => {
  const timestamp = Date.now();
  const baseVcore = 1.25;
  const load = Math.random() * 100;
  
  // Simulate voltage droop and ripple
  const vcore = baseVcore - (load * 0.0005) + (Math.random() * 0.01 - 0.005);
  const vcoreRipple = Math.random() * 15 + (load > 80 ? 10 : 0); // mV
  
  const vrmTemp = 45 + (load * 0.35) + (Math.random() * 2);
  const cpuTemp = 35 + (load * 0.45) + (Math.random() * 3);
  
  const stabilityScore = Math.max(0, 100 - (vcoreRipple / 2) - (vrmTemp > 85 ? (vrmTemp - 85) * 2 : 0));

  return {
    timestamp,
    vcore: Number(vcore.toFixed(3)),
    vcoreRipple: Number(vcoreRipple.toFixed(1)),
    dram: 1.35 + (Math.random() * 0.005),
    vrmTemp: Number(vrmTemp.toFixed(1)),
    chipsetTemp: 52 + (Math.random() * 1),
    cpuTemp: Number(cpuTemp.toFixed(1)),
    stabilityScore: Math.round(stabilityScore),
    clockSpeed: 4800 + (load * 5),
    load: Math.round(load)
  };
};

export const MOCK_COMPONENTS: HardwareComponent[] = [
  { id: 'vrm-01', name: 'VRM Phase 1-12', status: 'optimal', details: 'DrMOS 90A Smart Power Stages', address: '0x40' },
  { id: 'cap-01', name: 'Primary Capacitors', status: 'optimal', details: '10K Black Metallic Caps', address: '0x48' },
  { id: 'pcie-01', name: 'PCIe Gen5 Slot 1', status: 'warning', details: 'Signal integrity variance detected', address: '0x1A' },
  { id: 'chip-01', name: 'Z790 Chipset', status: 'optimal', details: 'Thermal interface stable', address: '0x02' },
  { id: 'mem-01', name: 'DIMM A2/B2', status: 'optimal', details: 'XMP 3.0 Profile Active', address: '0x50' },
];
