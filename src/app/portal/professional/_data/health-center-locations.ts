export interface HealthCenterLocation {
  centerId: string;
  latitude: number;
  longitude: number;
  waitTimeMinutes: number;
  referralFocus: string;
}

export const healthCenterLocations: HealthCenterLocation[] = [
  {
    centerId: "hc-1",
    latitude: -0.150458,
    longitude: -78.488052,
    waitTimeMinutes: 18,
    referralFocus: "Emergencia cardiovascular",
  },
  {
    centerId: "hc-2",
    latitude: -2.170998,
    longitude: -79.922359,
    waitTimeMinutes: 24,
    referralFocus: "Seguimiento ambulatorio integral",
  },
  {
    centerId: "hc-3",
    latitude: -2.900128,
    longitude: -79.005896,
    waitTimeMinutes: 31,
    referralFocus: "Triage e imagenologia",
  },
];
