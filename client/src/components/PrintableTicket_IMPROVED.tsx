import { forwardRef } from 'react';
import QRCode from 'react-qr-code';
import { MapPin, User, Star, Calendar, DollarSign } from 'lucide-react';
import { formatTicketDate, formatPrice, formatTicketStatus } from '../utils/ticketFormatter';

interface Sponsor {
  id: string;
  name: string;
  logoUrl: string;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze';
  website?: string;
}

interface PrintableTicketProps {
  ticket: {
    id: string;
    tierName?: string;
    pricePaid?: number;
    purchaseDate: string;
    used: boolean;
    checkInTime?: string;
    attendeeName?: string;
    userName?: string;
  };
  event: {
    title: string;
    date: string;
    endDate?: string;
    location: string;
    imageUrl?: string;
    organizerName?: string;
    sponsors?: Sponsor[];
  };
  attendeeEmail?: string;
  currency?: string;
}

const PrintableTicket_IMPROVED = forwardRef<HTMLDivElement, PrintableTicketProps>(
  ({ ticket, event, attendeeEmail, currency = 'USD' }, ref) => {
    const currencySymbol = currency === 'LRD' ? 'L$' : '$';
    
    // Safe date formatting with error handling
    const eventDate = (() => {
      try {
        return formatTicketDate(event.date);
      } catch {
        return 'Date unavailable';
      }
    })();

    const purchaseDate = (() => {
      try {
        return formatTicketDate(ticket.purchaseDate);
      } catch {
        return 'Unknown';
      }
    })();

    const checkInDate = ticket.checkInTime ? (() => {
      try {
        return formatTicketDate(ticket.checkInTime);
      } catch {
        return 'Unknown';
      }
    })() : null;

    const ticketPrice = ticket.pricePaid !== undefined ? formatPrice(ticket.pricePaid, currency) : 'Complimentary';
    const ticketStatus = formatTicketStatus(ticket.used, ticket.checkInTime);

    // Sponsor filtering
    const platinumSponsors = event.sponsors?.filter(s => s.tier === 'platinum') || [];
    const goldSponsors = event.sponsors?.filter(s => s.tier === 'gold') || [];
    const silverSponsors = event.sponsors?.filter(s => s.tier === 'silver') || [];
    const bronzeSponsors = event.sponsors?.filter(s => s.tier === 'bronze') || [];

    const attendeeName = ticket.attendeeName || ticket.userName || 'Ticket Holder';
    const qrValue = ticket.id; // Use ticket ID for QR code

    return (
      <div
        ref={ref}
        className="printable-ticket bg-white"
        style={{
          width: '800px',
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          borderRadius: '20px',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Decorative Background Pattern */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.03,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23002868' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            pointerEvents: 'none'
          }}
        />

        {/* Main Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Header Section with Event Image/Logo */}
          <div 
            style={{
              background: 'linear-gradient(135deg, #002868 0%, #003d99 50%, #002868 100%)',
              padding: '0',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Background Image Overlay */}
            {event.imageUrl && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundImage: `url(${event.imageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: 0.15,
                  zIndex: 0
                }}
              />
            )}

            {/* Header Content */}
            <div style={{ position: 'relative', zIndex: 1, padding: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h1 style={{
                    margin: '0 0 10px 0',
                    color: '#ffffff',
                    fontSize: '32px',
                    fontWeight: 'bold',
                    lineHeight: '1.2'
                  }}>
                    {event.title}
                  </h1>
                  <p style={{
                    margin: '0',
                    color: '#e0e7ff',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                    <span>📅 {typeof eventDate === 'string' ? eventDate : `${eventDate.day}, ${eventDate.month} ${eventDate.date}, ${eventDate.year}`}</span>
                    {event.organizerName && <span>• {event.organizerName}</span>}
                  </p>
                </div>

                {/* QR Code */}
                <div style={{
                  marginLeft: '20px',
                  backgroundColor: '#ffffff',
                  padding: '10px',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                  <QRCode
                    value={qrValue}
                    size={120}
                    level="H"
                    includeMargin={false}
                    fgColor="#002868"
                    bgColor="#ffffff"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div style={{ padding: '30px' }}>
            {/* Event Details Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '30px',
              paddingBottom: '30px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              {/* Date & Time */}
              <div>
                <p style={{ margin: '0 0 5px 0', color: '#6b7280', fontSize: '12px', fontWeight: '600' }}>
                  📅 EVENT DATE & TIME
                </p>
                <p style={{ margin: '0', color: '#1f2937', fontSize: '16px', fontWeight: '500' }}>
                  {typeof eventDate === 'string' 
                    ? eventDate 
                    : `${eventDate.day}, ${eventDate.month} ${eventDate.date}, ${eventDate.year} at ${eventDate.time}`}
                </p>
                {event.endDate && (
                  <p style={{ margin: '5px 0 0 0', color: '#6b7280', fontSize: '12px' }}>
                    Ends: {(() => {
                      try {
                        const endDate = formatTicketDate(event.endDate);
                        return typeof endDate === 'string' 
                          ? endDate 
                          : `${endDate.day}, ${endDate.month} ${endDate.date}`;
                      } catch {
                        return 'Unknown';
                      }
                    })()}
                  </p>
                )}
              </div>

              {/* Location */}
              <div>
                <p style={{ margin: '0 0 5px 0', color: '#6b7280', fontSize: '12px', fontWeight: '600' }}>
                  📍 LOCATION
                </p>
                <p style={{ margin: '0', color: '#1f2937', fontSize: '16px', fontWeight: '500' }}>
                  {event.location}
                </p>
              </div>

              {/* Ticket Holder */}
              <div>
                <p style={{ margin: '0 0 5px 0', color: '#6b7280', fontSize: '12px', fontWeight: '600' }}>
                  👤 TICKET HOLDER
                </p>
                <p style={{ margin: '0', color: '#1f2937', fontSize: '16px', fontWeight: '500' }}>
                  {attendeeName}
                </p>
                {attendeeEmail && (
                  <p style={{ margin: '5px 0 0 0', color: '#6b7280', fontSize: '12px' }}>
                    {attendeeEmail}
                  </p>
                )}
              </div>

              {/* Ticket Tier */}
              <div>
                <p style={{ margin: '0 0 5px 0', color: '#6b7280', fontSize: '12px', fontWeight: '600' }}>
                  🎫 TICKET TIER
                </p>
                <p style={{
                  margin: '0',
                  color: '#1f2937',
                  fontSize: '16px',
                  fontWeight: '600',
                  display: 'inline-block',
                  padding: '4px 12px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db'
                }}>
                  {ticket.tierName || 'Standard'}
                </p>
              </div>
            </div>

            {/* Ticket Information */}
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '20px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '15px'
              }}>
                {/* Ticket ID */}
                <div>
                  <p style={{ margin: '0 0 5px 0', color: '#6b7280', fontSize: '11px', fontWeight: '600' }}>
                    TICKET ID
                  </p>
                  <p style={{ margin: '0', color: '#1f2937', fontSize: '14px', fontWeight: '600', fontFamily: 'monospace' }}>
                    {ticket.id}
                  </p>
                </div>

                {/* Price */}
                <div>
                  <p style={{ margin: '0 0 5px 0', color: '#6b7280', fontSize: '11px', fontWeight: '600' }}>
                    PRICE PAID
                  </p>
                  <p style={{ margin: '0', color: '#1f2937', fontSize: '14px', fontWeight: '600' }}>
                    {ticketPrice}
                  </p>
                </div>

                {/* Purchase Date */}
                <div>
                  <p style={{ margin: '0 0 5px 0', color: '#6b7280', fontSize: '11px', fontWeight: '600' }}>
                    PURCHASE DATE
                  </p>
                  <p style={{ margin: '0', color: '#1f2937', fontSize: '14px', fontWeight: '600' }}>
                    {purchaseDate}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Bar */}
            <div style={{
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              backgroundColor: ticket.used ? '#fef2f2' : '#f0fdf4',
              border: `2px solid ${ticket.used ? '#fecaca' : '#86efac'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <p style={{
                  margin: '0',
                  color: ticket.used ? '#991b1b' : '#166534',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  STATUS: {ticketStatus}
                </p>
                {ticket.used && checkInDate && (
                  <p style={{
                    margin: '5px 0 0 0',
                    color: ticket.used ? '#7f1d1d' : '#15803d',
                    fontSize: '12px'
                  }}>
                    Checked in: {checkInDate}
                  </p>
                )}
              </div>
              <div style={{
                fontSize: '28px',
                color: ticket.used ? '#991b1b' : '#166534'
              }}>
                {ticket.used ? '✓ USED' : '✓ VALID'}
              </div>
            </div>

            {/* Sponsors Section */}
            {event.sponsors && event.sponsors.length > 0 && (
              <div style={{
                marginTop: '30px',
                paddingTop: '30px',
                borderTop: '2px solid #f0f0f0'
              }}>
                {/* Platinum Sponsors */}
                {platinumSponsors.length > 0 && (
                  <div style={{ marginBottom: '25px' }}>
                    <p style={{
                      margin: '0 0 15px 0',
                      color: '#6b7280',
                      fontSize: '11px',
                      fontWeight: '700',
                      letterSpacing: '1px',
                      textTransform: 'uppercase'
                    }}>
                      ⭐ Platinum Sponsors
                    </p>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '15px'
                    }}>
                      {platinumSponsors.map(sponsor => (
                        <div
                          key={sponsor.id}
                          style={{
                            padding: '12px',
                            backgroundColor: '#fef3c7',
                            borderRadius: '8px',
                            textAlign: 'center',
                            border: '1px solid #fcd34d'
                          }}
                        >
                          {sponsor.logoUrl && (
                            <img
                              src={sponsor.logoUrl}
                              alt={sponsor.name}
                              style={{
                                maxWidth: '100%',
                                maxHeight: '40px',
                                marginBottom: '8px'
                              }}
                            />
                          )}
                          <p style={{
                            margin: '0',
                            color: '#1f2937',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {sponsor.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gold Sponsors */}
                {goldSponsors.length > 0 && (
                  <div style={{ marginBottom: '25px' }}>
                    <p style={{
                      margin: '0 0 15px 0',
                      color: '#6b7280',
                      fontSize: '11px',
                      fontWeight: '700',
                      letterSpacing: '1px',
                      textTransform: 'uppercase'
                    }}>
                      ✨ Gold Sponsors
                    </p>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: '12px'
                    }}>
                      {goldSponsors.map(sponsor => (
                        <div
                          key={sponsor.id}
                          style={{
                            padding: '10px',
                            backgroundColor: '#fef08a',
                            borderRadius: '6px',
                            textAlign: 'center',
                            border: '1px solid #fde047'
                          }}
                        >
                          {sponsor.logoUrl && (
                            <img
                              src={sponsor.logoUrl}
                              alt={sponsor.name}
                              style={{
                                maxWidth: '100%',
                                maxHeight: '30px',
                                marginBottom: '6px'
                              }}
                            />
                          )}
                          <p style={{
                            margin: '0',
                            color: '#1f2937',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}>
                            {sponsor.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Silver & Bronze Sponsors */}
                {(silverSponsors.length > 0 || bronzeSponsors.length > 0) && (
                  <div>
                    <p style={{
                      margin: '0 0 12px 0',
                      color: '#6b7280',
                      fontSize: '11px',
                      fontWeight: '700',
                      letterSpacing: '1px',
                      textTransform: 'uppercase'
                    }}>
                      🤝 Supporting Partners
                    </p>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      {[...silverSponsors, ...bronzeSponsors].map(sponsor => (
                        <span
                          key={sponsor.id}
                          style={{
                            display: 'inline-block',
                            padding: '6px 12px',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '500',
                            color: '#4b5563',
                            border: '1px solid #e5e7eb'
                          }}
                        >
                          {sponsor.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div style={{
              marginTop: '40px',
              paddingTop: '20px',
              borderTop: '1px solid #e5e7eb',
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: '11px'
            }}>
              <p style={{ margin: '0 0 8px 0' }}>
                Keep this ticket safe and secure. Show the QR code for check-in.
              </p>
              <p style={{ margin: '0', fontSize: '10px' }}>
                Event hosting system • Print date: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

PrintableTicket_IMPROVED.displayName = 'PrintableTicket_IMPROVED';

export default PrintableTicket_IMPROVED;
