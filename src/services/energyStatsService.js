import { energyStatsRef } from '../firebaseConfig';
import { getCurrentUserId } from './firebaseService';
import { set, get } from 'firebase/database';

export const calculateDailyConsumption = (devices) => {
  return devices.reduce((total, device) => {
    const dailyUsageHours = device.dailyUsage || 0;
    const powerInKW = device.guc / 1000; // Watt'tan kW'a çevirme
    return total + (powerInKW * dailyUsageHours);
  }, 0);
};

export const calculateMonthlyCost = (kwh) => {
  // Türkiye'deki ortalama elektrik tarifesi (örnek değer)
  const ratePerKwh = 1.5; // TL/kWh
  return kwh * ratePerKwh;
};

export const calculateCarbonFootprint = (kwh) => {
  // Türkiye için ortalama CO2 emisyon faktörü
  const carbonFactor = 0.472; // kg CO2/kWh
  return kwh * carbonFactor;
};

export const saveDailyStats = async (stats) => {
  const userId = getCurrentUserId();
  const date = new Date().toISOString().split('T')[0];
  
  await set(energyStatsRef(`${userId}/daily/${date}`), stats);
}; 