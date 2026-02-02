import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import {
  CheckCircle, XCircle, RefreshCw, QrCode, Camera, AlertTriangle,
  Volume2, VolumeX, Clock, Search, Loader
} from 'lucide-react';
import { SCANNER_ERRORS, playTicketSound, sanitizeTicketId, validateTicketId } from '../utils/scannerUtils';
import { formatTicketDate } from '../utils/ticketFormatter';

interface Ticket {
  id: string;
  eventId: string;
  userName?: string;
  attendeeName?: string;
  used: boolean;
  checkInTime?: string;
  tierName?: string;
  pricePaid?: number;
  purchaseDate: string;
  qrCode?: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  organizerName?: string;
}

interface TicketScannerProps {
  tickets: Ticket[];
  events: Event[];
  onVerifyTicket: (ticketId: string) => Promise<{ success: boolean; message?: string }>;
  targetEventId?: string;
}

interface RecentScan {
  id: string;
  time: string;
  status: 'SUCCESS' | 'ERROR' | 'ALREADY_USED';
  name: string;
}

const TicketScanner_IMPROVED: React.FC<TicketScannerProps> = ({
  tickets,
  events,
  onVerifyTicket,
  targetEventId
}) => {
  // Mode Management
  const [mode, setMode] = useState<'CAMERA' | 'MANUAL'>('CAMERA');
  const [manualId, setManualId] = useState('');

  // Scanner State
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scannedTicket, setScannedTicket] = useState<Ticket | null>(null);
  const [scannedEvent, setScannedEvent] = useState<Event | null>(null);
  const [scanStatus, setScanStatus] = useState<'IDLE' | 'VERIFYING' | 'SUCCESS' | 'ERROR' | 'ALREADY_USED'>('IDLE');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Settings State
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);

  // Refs
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerWrapperId = 'reader';
  const verificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Stats
  const targetEvent = targetEventId ? events.find(e => e.id === targetEventId) : null;
  const eventTickets = targetEventId ? tickets.filter(t => t.eventId === targetEventId) : tickets;
  const checkedInCount = eventTickets.filter(t => t.used).length;
  const totalCount = eventTickets.length;
  const progress = totalCount > 0 ? (checkedInCount / totalCount) * 100 : 0;

  // Initialize/Cleanup Scanner
  useEffect(() => {
    if (mode === 'CAMERA' && !scanResult) {
      setCameraError(null);
      const timer = setTimeout(() => initScanner(), 100);
      return () => {
        clearTimeout(timer);
        cleanupScanner();
      };
    } else {
      cleanupScanner();
    }
  }, [mode, scanResult]);

  // Verification Timeout Handler
  useEffect(() => {
    return () => {
      if (verificationTimeoutRef.current) {
        clearTimeout(verificationTimeoutRef.current);
      }
    };
  }, []);

  const cleanupScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {});
    }
  };

  const initScanner = async () => {
    try {
      cleanupScanner();

      const scanner = new Html5QrcodeScanner(
        scannerWrapperId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          useBarCodeDetectorIfSupported: true,
        },
        false
      );

      scanner.render(
        (decodedText) => handleScan(decodedText),
        (error) => {
          // Suppress logging for minor errors
          if (!error.includes('No Multi Format Readers were provided')) {
            console.debug('Scanner debug:', error);
          }
        }
      );

      scannerRef.current = scanner;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      handleCameraError(errorMessage);
    }
  };

  const handleCameraError = (error: string) => {
    setCameraError(null);

    if (error.includes('NotAllowedError')) {
      setCameraError(SCANNER_ERRORS.PERMISSION_DENIED.message);
      setErrorMsg(SCANNER_ERRORS.PERMISSION_DENIED.message);
    } else if (error.includes('NotFoundError')) {
      setCameraError(SCANNER_ERRORS.NO_CAMERA.message);
      setErrorMsg(SCANNER_ERRORS.NO_CAMERA.message);
    } else if (error.includes('NotReadableError')) {
      setCameraError(SCANNER_ERRORS.CAMERA_IN_USE.message);
      setErrorMsg(SCANNER_ERRORS.CAMERA_IN_USE.message);
    } else {
      setCameraError(SCANNER_ERRORS.UNKNOWN_ERROR.message);
      setErrorMsg(error);
    }

    setScanStatus('ERROR');
    if (soundEnabled) playTicketSound('error');
  };

  const handleScan = async (result: string) => {
    try {
      // Sanitize and validate input
      const sanitized = sanitizeTicketId(result);
      if (!sanitized || !validateTicketId(sanitized)) {
        setErrorMsg(SCANNER_ERRORS.INVALID_FORMAT.message);
        setScanStatus('ERROR');
        if (soundEnabled) playTicketSound('error');
        return;
      }

      setScanResult(sanitized);
      await processTicket(sanitized);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process scan';
      setErrorMsg(message);
      setScanStatus('ERROR');
      if (soundEnabled) playTicketSound('error');
    }
  };

  const processTicket = async (ticketId: string) => {
    try {
      setScanStatus('VERIFYING');

      // Find ticket
      const ticket = tickets.find(
        t => t.id === ticketId || t.qrCode === ticketId
      );

      if (!ticket) {
        setErrorMsg(SCANNER_ERRORS.TICKET_NOT_FOUND.message);
        setScanStatus('ERROR');
        if (soundEnabled) playTicketSound('error');
        return;
      }

      // Check if already used
      if (ticket.used) {
        setScannedTicket(ticket);
        const event = events.find(e => e.id === ticket.eventId);
        if (event) setScannedEvent(event);
        setScanStatus('ALREADY_USED');
        setErrorMsg(`Ticket already checked in at ${formatTicketDate(ticket.checkInTime || '')}`);
        if (soundEnabled) playTicketSound('error');
        addRecentScan(ticket.id, 'ALREADY_USED', ticket.attendeeName || ticket.userName || 'Unknown');
        return;
      }

      // Check event match if specified
      if (targetEventId && ticket.eventId !== targetEventId) {
        setErrorMsg(SCANNER_ERRORS.WRONG_EVENT.message);
        setScanStatus('ERROR');
        if (soundEnabled) playTicketSound('error');
        return;
      }

      // Verify ticket with backend
      setScannedTicket(ticket);
      const event = events.find(e => e.id === ticket.eventId);
      if (event) setScannedEvent(event);

      // Set verification timeout
      verificationTimeoutRef.current = setTimeout(() => {
        setErrorMsg('Verification timeout - please try again');
        setScanStatus('ERROR');
        if (soundEnabled) playTicketSound('error');
      }, 10000);

      const result = await onVerifyTicket(ticketId);

      if (verificationTimeoutRef.current) {
        clearTimeout(verificationTimeoutRef.current);
      }

      if (result.success) {
        setScanStatus('SUCCESS');
        if (soundEnabled) playTicketSound('success');
        addRecentScan(ticket.id, 'SUCCESS', ticket.attendeeName || ticket.userName || 'Unknown');
        // Reset after 2 seconds
        setTimeout(() => resetScan(), 2000);
      } else {
        setErrorMsg(result.message || SCANNER_ERRORS.VERIFICATION_FAILED.message);
        setScanStatus('ERROR');
        if (soundEnabled) playTicketSound('error');
        addRecentScan(ticket.id, 'ERROR', ticket.attendeeName || ticket.userName || 'Unknown');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Verification failed';
      setErrorMsg(message);
      setScanStatus('ERROR');
      if (soundEnabled) playTicketSound('error');
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim()) {
      setErrorMsg('Please enter a ticket ID');
      return;
    }
    await processTicket(manualId.trim());
  };

  const addRecentScan = (id: string, status: 'SUCCESS' | 'ERROR' | 'ALREADY_USED', name: string) => {
    setRecentScans(prev => [
      { id, status, time: new Date().toLocaleTimeString(), name },
      ...prev.slice(0, 9)
    ]);
  };

  const resetScan = () => {
    setScanResult(null);
    setScannedTicket(null);
    setScannedEvent(null);
    setScanStatus('IDLE');
    setErrorMsg(null);
    setManualId('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <QrCode className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Ticket Scanner</h1>
          </div>
          <p className="text-gray-600">Scan or manually enter tickets to check in attendees</p>
        </div>

        {/* Event Info */}
        {targetEvent && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6 border-l-4 border-blue-600">
            <h3 className="font-semibold text-gray-900">{targetEvent.title}</h3>
            <p className="text-sm text-gray-600">{formatTicketDate(targetEvent.date)} • {targetEvent.location}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Scanner Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mode Selector */}
            <div className="flex gap-4 bg-white rounded-lg shadow-sm p-2">
              <button
                onClick={() => { resetScan(); setMode('CAMERA'); }}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                  mode === 'CAMERA'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-label="Camera scan mode"
              >
                <Camera className="w-4 h-4 inline mr-2" />
                Camera
              </button>
              <button
                onClick={() => { resetScan(); setMode('MANUAL'); }}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                  mode === 'MANUAL'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-label="Manual entry mode"
              >
                <Search className="w-4 h-4 inline mr-2" />
                Manual Entry
              </button>
            </div>

            {/* Camera Mode */}
            {mode === 'CAMERA' && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {!scanResult ? (
                  <>
                    {cameraError ? (
                      <div className="bg-red-50 border-l-4 border-red-600 p-6">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-red-900">Camera Error</h4>
                            <p className="text-red-700 text-sm mt-1">{cameraError}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        id={scannerWrapperId}
                        className="bg-black rounded-lg overflow-hidden"
                        style={{ minHeight: '400px' }}
                      />
                    )}
                  </>
                ) : (
                  <div className="p-6 text-center">
                    <div className="mb-4">
                      {scanStatus === 'VERIFYING' && (
                        <>
                          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-2" />
                          <p className="text-gray-700 font-medium">Verifying ticket...</p>
                        </>
                      )}
                      {scanStatus === 'SUCCESS' && (
                        <>
                          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                          <p className="text-green-700 font-medium">✓ Check-in successful!</p>
                        </>
                      )}
                      {(scanStatus === 'ERROR' || scanStatus === 'ALREADY_USED') && (
                        <>
                          <XCircle className="w-12 h-12 text-red-600 mx-auto mb-2" />
                          <p className="text-red-700 font-medium">{errorMsg}</p>
                        </>
                      )}
                    </div>
                    <button
                      onClick={resetScan}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      aria-label="Scan another ticket"
                    >
                      <RefreshCw className="w-4 h-4 inline mr-2" />
                      Scan Another
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Manual Entry Mode */}
            {mode === 'MANUAL' && (
              <form onSubmit={handleManualSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ticket ID
                  </label>
                  <input
                    type="text"
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                    placeholder="Enter ticket ID (e.g., TK-123456789)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-label="Ticket ID input"
                  />
                </div>

                {errorMsg && (
                  <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded">
                    <p className="text-red-700 text-sm">{errorMsg}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={scanStatus === 'VERIFYING' || !manualId.trim()}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    aria-label="Verify ticket"
                  >
                    {scanStatus === 'VERIFYING' ? (
                      <>
                        <Loader className="w-4 h-4 inline mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 inline mr-2" />
                        Verify Ticket
                      </>
                    )}
                  </button>
                  {scanStatus !== 'IDLE' && (
                    <button
                      type="button"
                      onClick={resetScan}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                      aria-label="Clear"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {scanStatus === 'SUCCESS' && (
                  <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded">
                    <p className="text-green-700 font-medium">✓ Ticket verified successfully!</p>
                  </div>
                )}
              </form>
            )}

            {/* Scanned Ticket Details */}
            {scannedTicket && scannedEvent && (
              <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
                <h3 className="font-semibold text-gray-900">Ticket Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Name</p>
                    <p className="font-medium text-gray-900">
                      {scannedTicket.attendeeName || scannedTicket.userName || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Tier</p>
                    <p className="font-medium text-gray-900">{scannedTicket.tierName || 'Standard'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Event</p>
                    <p className="font-medium text-gray-900">{scannedEvent.title}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status</p>
                    <p className={`font-medium ${scannedTicket.used ? 'text-red-600' : 'text-green-600'}`}>
                      {scannedTicket.used ? 'Used' : 'Valid'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">Check-in Stats</h3>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-semibold text-gray-900">{checkedInCount}/{totalCount}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2">{Math.round(progress)}% complete</p>
              </div>
            </div>

            {/* Settings */}
            <div className="bg-white rounded-lg shadow-md p-6 space-y-3">
              <h3 className="font-semibold text-gray-900">Settings</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="w-4 h-4 rounded"
                  aria-label="Toggle sound feedback"
                />
                <span className="text-sm text-gray-700">Sound Feedback</span>
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-gray-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-gray-400" />
                )}
              </label>
            </div>

            {/* Recent Scans */}
            {recentScans.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Recent Scans</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {recentScans.map((scan) => (
                    <div key={`${scan.id}-${scan.time}`} className="flex items-start gap-2 text-sm p-2 bg-gray-50 rounded">
                      {scan.status === 'SUCCESS' && (
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      )}
                      {(scan.status === 'ERROR' || scan.status === 'ALREADY_USED') && (
                        <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium truncate">{scan.name}</p>
                        <p className="text-gray-500 text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {scan.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketScanner_IMPROVED;
