// @utils/ticketFormatter.ts
// Consistent date and format utilities for tickets

export const formatTicketDate = (dateStr: string | Date) => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return 'Date TBD';
    }
    
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      year: date.getFullYear(),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      fullDate: date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
      fullDateTime: date.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })
    };
  } catch (e) {
    console.error('Date formatting error:', e);
    return {
      day: '?',
      date: 0,
      month: 'N/A',
      year: 0,
      time: 'N/A',
      fullDate: 'Invalid Date',
      fullDateTime: 'Invalid Date'
    };
  }
};

export const formatPrice = (amount: number | undefined, currency: string = 'USD'): string => {
  if (amount === undefined || amount === null) {
    return 'Free';
  }
  
  const symbol = currency === 'LRD' ? 'L$' : '$';
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return `${symbol}${formatted}`;
};

export const formatTicketStatus = (used: boolean, checkInTime?: string): {
  status: 'valid' | 'used' | 'unknown';
  label: string;
  color: string;
  bgColor: string;
} => {
  if (used && checkInTime) {
    return {
      status: 'used',
      label: `Used - ${new Date(checkInTime).toLocaleString()}`,
      color: 'text-amber-700 dark:text-amber-300',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30'
    };
  } else if (used) {
    return {
      status: 'used',
      label: 'Used',
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-800'
    };
  } else {
    return {
      status: 'valid',
      label: 'Valid',
      color: 'text-green-700 dark:text-green-300',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    };
  }
};

export const getTicketDisplayName = (ticket: any): string => {
  return ticket.attendeeName || ticket.userName || 'Guest';
};

export const validateTicketData = (ticket: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!ticket.id) {
    errors.push('Missing ticket ID');
  }
  
  if (!ticket.tierName) {
    errors.push('Missing tier information');
  }
  
  if (!ticket.event) {
    errors.push('Missing event information');
  } else {
    if (!ticket.event.title) {
      errors.push('Event has no title');
    }
    if (!ticket.event.date) {
      errors.push('Event has no date');
    }
    if (!ticket.event.location) {
      errors.push('Event has no location');
    }
  }
  
  if (!ticket.purchaseDate) {
    errors.push('Missing purchase date');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

export const calculateTicketAge = (purchaseDate: string | Date): {
  days: number;
  isNew: boolean;
  isExpiring: boolean;
} => {
  try {
    const purchase = new Date(purchaseDate);
    const now = new Date();
    const diff = now.getTime() - purchase.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    return {
      days,
      isNew: days < 7,
      isExpiring: days > 30
    };
  } catch (e) {
    return { days: 0, isNew: false, isExpiring: false };
  }
};

export const generateTicketQRValue = (ticketId: string, eventId?: string): string => {
  if (eventId) {
    return `TICKET:${ticketId}:EVENT:${eventId}`;
  }
  return `TICKET:${ticketId}`;
};

export const parseTicketQRValue = (qrValue: string): { ticketId: string; eventId?: string } => {
  const parts = qrValue.split(':');
  if (parts[0] === 'TICKET') {
    return {
      ticketId: parts[1],
      eventId: parts[3]
    };
  }
  return { ticketId: qrValue };
};
