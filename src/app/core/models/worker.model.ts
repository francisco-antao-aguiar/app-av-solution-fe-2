export interface Worker {
  id: number;
  category: string;
  name: string;
  buyPricePerHour: number;
  sellPricePerHour: number;
}

export interface WeekDay {
  name: string;
  date: Date;
  dayOfWeek: number;
}

export interface WorkerHoursData {
  workerId: number;
  workerName: string;
  hours: { [key: string]: number }; // key: date string, value: hours
}

export interface WorkingHours {
  workerId: number;
  date: string; // ISO date format
  hours: number;
}

export interface WeeklyHoursRow {
  workerId: number;
  category: string;
  name: string;
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
  totalHours: number;
}

export interface MonthlyBuyRow {
  workerId: number;
  category: string;
  name: string;
  buyPrice: number;
  dailyHours: (number | null)[]; // null means "X" (did not work)
  totalHours: number;
  totalBuyCost: number;
}

export interface MonthlyProfitRow extends MonthlyBuyRow {
  sellPrice: number;
  totalSellPrice: number;
  profit: number;
}
