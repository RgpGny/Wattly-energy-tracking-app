const turkishDays = {
  0: 'Pazar',
  1: 'Pazartesi',
  2: 'Salı',
  3: 'Çarşamba',
  4: 'Perşembe',
  5: 'Cuma',
  6: 'Cumartesi'
};

const turkishDaysShort = {
  0: 'Paz',
  1: 'Pzt',
  2: 'Sal',
  3: 'Çar',
  4: 'Per',
  5: 'Cum',
  6: 'Cmt'
};

export const getWeekDayFromDate = (dateStr) => {
  // YYYYMMDD formatındaki string'i Date objesine çevir
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1; // Ay 0-based
  const day = parseInt(dateStr.substring(6, 8));
  
  const date = new Date(year, month, day);
  return {
    dayIndex: date.getDay(),
    fullName: turkishDays[date.getDay()],
    shortName: turkishDaysShort[date.getDay()],
    date: date,
    dateStr: dateStr
  };
};

export const sortDataByDayOfWeek = (data) => {
  return Object.entries(data).sort((a, b) => {
    const dateA = getWeekDayFromDate(a[0]);
    const dateB = getWeekDayFromDate(b[0]);
    return dateA.date - dateB.date;
  });
};

export const getLastWeekDates = () => {
  const dates = [];
  const today = new Date();
  
  // Son 7 günü hesapla
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    dates.push({
      dateStr,
      ...getWeekDayFromDate(dateStr)
    });
  }
  
  return dates;
};

// Haftanın başlangıç ve bitiş tarihlerini hesapla
export const getWeekBoundaries = (date = new Date()) => {
  const currentDate = new Date(date);
  const currentDay = currentDate.getDay() || 7; // Pazar 0 yerine 7 olsun
  
  // Haftanın başlangıcı (Pazartesi)
  const monday = new Date(currentDate);
  monday.setDate(currentDate.getDate() - (currentDay - 1));
  monday.setHours(0, 0, 0, 0);

  // Haftanın sonu (Pazar)
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    start: monday,
    end: sunday
  };
};

// Mevcut haftanın günlerini getir
export const getCurrentWeekDates = () => {
  const { start } = getWeekBoundaries();
  const dates = [];

  // Pazartesiden başlayarak 7 günü hesapla
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    dates.push({
      dateStr,
      ...getWeekDayFromDate(dateStr)
    });
  }

  return dates;
}; 