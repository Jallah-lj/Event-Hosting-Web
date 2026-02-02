// @utils/validation.ts
// Form validation utilities for organizer dashboard

export interface ValidationError {
  field: string;
  message: string;
}

export const validateEventForm = (data: {
  title: string;
  date: string;
  endDate: string;
  location: string;
  capacity: string | number;
  category: string;
  description: string;
  ticketTiers: any[];
}): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!data.title?.trim()) {
    errors.push({ field: 'title', message: 'Event title is required' });
  } else if (data.title.length > 100) {
    errors.push({ field: 'title', message: 'Title must be less than 100 characters' });
  }

  if (!data.date) {
    errors.push({ field: 'date', message: 'Event date is required' });
  } else if (new Date(data.date) < new Date()) {
    errors.push({ field: 'date', message: 'Event date cannot be in the past' });
  }

  if (!data.endDate) {
    errors.push({ field: 'endDate', message: 'End date is required' });
  } else if (new Date(data.endDate) <= new Date(data.date)) {
    errors.push({ field: 'endDate', message: 'End date must be after start date' });
  }

  if (!data.location?.trim()) {
    errors.push({ field: 'location', message: 'Location is required' });
  }

  const capacityNum = parseInt(String(data.capacity));
  if (!data.capacity || capacityNum <= 0) {
    errors.push({ field: 'capacity', message: 'Valid capacity is required (must be positive)' });
  }

  if (!data.category) {
    errors.push({ field: 'category', message: 'Category is required' });
  }

  if (!data.description?.trim()) {
    errors.push({ field: 'description', message: 'Description is required' });
  } else if (data.description.length < 50) {
    errors.push({ field: 'description', message: 'Description must be at least 50 characters' });
  }

  if (!data.ticketTiers || data.ticketTiers.length === 0) {
    errors.push({ field: 'ticketTiers', message: 'At least one ticket tier is required' });
  }

  return errors;
};

export const validatePromoCode = (code: string, value: string, type: 'PERCENT' | 'FIXED'): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!code?.trim()) {
    errors.push({ field: 'code', message: 'Promo code is required' });
  } else if (code.length < 3) {
    errors.push({ field: 'code', message: 'Code must be at least 3 characters' });
  } else if (!/^[A-Z0-9]+$/.test(code)) {
    errors.push({ field: 'code', message: 'Code must be alphanumeric and uppercase' });
  }

  const valueNum = parseFloat(value);
  if (!value || isNaN(valueNum) || valueNum <= 0) {
    errors.push({ field: 'value', message: 'Valid discount value is required' });
  } else if (type === 'PERCENT' && valueNum > 100) {
    errors.push({ field: 'value', message: 'Percentage cannot exceed 100%' });
  }

  return errors;
};

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
