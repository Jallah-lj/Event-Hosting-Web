// @utils/scannerUtils.ts
// Utility functions for ticket scanner

export interface ScannerError {
  code: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  recoverable: boolean;
}

export const SCANNER_ERRORS = {
  TICKET_NOT_FOUND: {
    code: 'TICKET_NOT_FOUND',
    message: 'Ticket ID not found in system',
    severity: 'error' as const,
    recoverable: true
  },
  TICKET_ALREADY_USED: {
    code: 'TICKET_ALREADY_USED',
    message: 'This ticket has already been checked in',
    severity: 'warning' as const,
    recoverable: true
  },
  WRONG_EVENT: {
    code: 'WRONG_EVENT',
    message: 'This ticket is for a different event',
    severity: 'error' as const,
    recoverable: true
  },
  CAMERA_PERMISSION_DENIED: {
    code: 'CAMERA_PERMISSION_DENIED',
    message: 'Camera access denied. Please allow camera permissions or use manual entry',
    severity: 'error' as const,
    recoverable: false
  },
  CAMERA_NOT_FOUND: {
    code: 'CAMERA_NOT_FOUND',
    message: 'No camera found on device',
    severity: 'error' as const,
    recoverable: false
  },
  INVALID_QR_CODE: {
    code: 'INVALID_QR_CODE',
    message: 'Invalid QR code format',
    severity: 'warning' as const,
    recoverable: true
  },
  INVALID_FORMAT: {
    code: 'INVALID_FORMAT',
    message: 'Invalid ticket ID format',
    severity: 'error' as const,
    recoverable: true
  },
  VERIFICATION_FAILED: {
    code: 'VERIFICATION_FAILED',
    message: 'Ticket verification failed',
    severity: 'error' as const,
    recoverable: true
  },
  CAMERA_IN_USE: {
    code: 'CAMERA_IN_USE',
    message: 'Camera is already in use by another application',
    severity: 'error' as const,
    recoverable: false
  },
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    message: 'Network error. Please try again',
    severity: 'error' as const,
    recoverable: true
  },
  UNKNOWN_ERROR: {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
    severity: 'error' as const,
    recoverable: true
  }
};

export const validateTicketId = (id: string): { valid: boolean; error?: string } => {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: 'Invalid ticket ID format' };
  }
  
  const trimmed = id.trim().toUpperCase();
  
  if (trimmed.length < 5) {
    return { valid: false, error: 'Ticket ID too short' };
  }
  
  if (trimmed.length > 50) {
    return { valid: false, error: 'Ticket ID too long' };
  }
  
  // Check for valid characters (alphanumeric and hyphens)
  if (!/^[A-Z0-9\-]+$/.test(trimmed)) {
    return { valid: false, error: 'Ticket ID contains invalid characters' };
  }
  
  return { valid: true };
};

export const playTicketSound = (type: 'success' | 'error' | 'warning'): void => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    switch (type) {
      case 'success':
        // Success: rising tone
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
        break;

      case 'error':
        // Error: descending tone
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
        break;

      case 'warning':
        // Warning: double tone
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.setValueAtTime(400, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
        break;
    }
  } catch (error) {
    console.error('Sound playback error:', error);
  }
};

export const vibrate = (pattern: number | number[]): void => {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch (error) {
    console.error('Vibration error:', error);
  }
};

export const handleCameraError = (error: any): ScannerError => {
  const errorStr = String(error);

  if (errorStr.includes('Permission') || errorStr.includes('NotAllowedError')) {
    return SCANNER_ERRORS.CAMERA_PERMISSION_DENIED;
  }
  
  if (errorStr.includes('NotFoundError') || errorStr.includes('NotFoundException')) {
    return SCANNER_ERRORS.CAMERA_NOT_FOUND;
  }
  
  if (errorStr.includes('NotReadableError')) {
    return {
      code: 'CAMERA_IN_USE',
      message: 'Camera is already in use by another app',
      severity: 'error' as const,
      recoverable: false
    };
  }

  return SCANNER_ERRORS.UNKNOWN_ERROR;
};

export const canRetry = (error: ScannerError): boolean => {
  return error.recoverable;
};

export const getRetryMessage = (error: ScannerError): string => {
  if (error.code === 'TICKET_ALREADY_USED') {
    return 'This ticket was already scanned. Please verify with organizer.';
  }
  if (error.code === 'WRONG_EVENT') {
    return 'This is the wrong ticket for this event. Please verify.';
  }
  if (error.code === 'CAMERA_PERMISSION_DENIED') {
    return 'Please enable camera in settings and try again, or use manual entry.';
  }
  
  return 'Please try again.';
};

export const isValidTicketFormat = (qrValue: string): boolean => {
  // Check if it looks like a valid ticket QR code
  if (qrValue.startsWith('TICKET:')) {
    const parts = qrValue.split(':');
    return parts.length >= 2 && parts[1].length > 0;
  }
  
  // Also accept plain UUID-like strings
  if (/^[a-f0-9\-]{20,}$/i.test(qrValue)) {
    return true;
  }
  
  // Accept alphanumeric IDs
  if (/^[A-Z0-9]{10,}$/i.test(qrValue)) {
    return true;
  }
  
  return false;
};

export const sanitizeTicketId = (id: string): string => {
  return id
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\-]/g, '')
    .substring(0, 50);
};

export const createScanHistoryEntry = (
  ticketId: string,
  status: 'success' | 'error' | 'warning',
  message: string,
  ticketDetails?: any
) => {
  return {
    id: Math.random().toString(36).substr(2, 9),
    ticketId,
    timestamp: new Date().toISOString(),
    status,
    message,
    details: ticketDetails,
    displayTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };
};

export const formatScanStats = (stats: any) => {
  return {
    totalScans: stats.totalScans || 0,
    successfulScans: stats.successfulScans || 0,
    failedScans: stats.failedScans || 0,
    duplicateScans: stats.duplicateScans || 0,
    successRate: stats.totalScans > 0 
      ? `${((stats.successfulScans / stats.totalScans) * 100).toFixed(1)}%`
      : 'N/A'
  };
};
