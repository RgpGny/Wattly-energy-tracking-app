import React, { createContext, useState, useContext } from 'react';

const EnergyContext = createContext();

export const EnergyProvider = ({ children }) => {
  const [energyStats, setEnergyStats] = useState({
    daily: 0,
    weekly: 0,
    monthly: 0,
    yearly: 0
  });

  const updateEnergyStats = (period, value) => {
    setEnergyStats(prev => ({
      ...prev,
      [period]: value
    }));
  };

  return (
    <EnergyContext.Provider value={{ energyStats, updateEnergyStats }}>
      {children}
    </EnergyContext.Provider>
  );
};

export const useEnergy = () => useContext(EnergyContext); 