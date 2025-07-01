import React, { createContext, useState, useContext } from 'react';

const EnergyContext = createContext();

export const EnergyProvider = ({ children }) => {
  const [energyData, setEnergyData] = useState({
    totalDaily: 0,         // Günlük toplam kWh
    totalCost: 0,          // Günlük toplam maliyet (TL)
    deviceCount: 0,        // Toplam cihaz sayısı
    co2Emission: 0,        // CO2 emisyonu (kg)
    savings: 0,            // Tasarruf yüzdesi
    lastUpdated: null      // Son güncelleme zamanı
  });

  // Veriyi güncellemek için fonksiyon
  const updateEnergyData = (newData) => {
    console.log('🔥 EnergyContext güncellendi:', newData);
    setEnergyData({
      ...newData,
      lastUpdated: Date.now()
    });
  };

  return (
    <EnergyContext.Provider value={{ 
      energyData,
      updateEnergyData
    }}>
      {children}
    </EnergyContext.Provider>
  );
};

export const useEnergy = () => {
  const context = useContext(EnergyContext);
  if (!context) {
    throw new Error('useEnergy must be used within EnergyProvider');
  }
  return context;
}; 