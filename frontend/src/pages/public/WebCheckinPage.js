import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import goIndigoLogo from '../../assets/images/indigo.png';
import airIndiaExpressLogo from '../../assets/images/Air-India_express.jpg';
import spicejetLogo from '../../assets/images/Spicejet.png';
import akasaAirLogo from '../../assets/images/AkasaAir.png';
import philippineAirlinesLogo from '../../assets/images/Philip.png';
import emiratesLogo from '../../assets/images/Emirates.png';
import qatarAirwaysLogo from '../../assets/images/qatarairways.png';

const WebCheckInPage = () => {
  const [hoveredCard, setHoveredCard] = useState(null);

  const airlines = [
    {
      id: 1,
      name: 'Go Indigo',
      logo: goIndigoLogo,
      altText: 'Go Indigo Airline Logo',
      checkInUrl: 'https://www.goindigo.in/web-check-in.html',
      color: '#003DA5',
      accentColor: '#FFB800'
    },
    {
      id: 2,
      name: 'Air India Express',
      logo: airIndiaExpressLogo,
      altText: 'Air India Express Airline Logo',
      checkInUrl: 'https://www.airindiaexpress.com/checkin-home',
      color: '#E31937',
      accentColor: '#1C1C1C'
    },
    {
      id: 3,
      name: 'SpiceJet',
      logo: spicejetLogo,
      altText: 'SpiceJet Airline Logo',
      checkInUrl: 'https://www.spicejet.com/#checkin',
      color: '#FFB81C',
      accentColor: '#000000'
    },
    {
      id: 4,
      name: 'Akasa Air',
      logo: akasaAirLogo,
      altText: 'Akasa Air Airline Logo',
      checkInUrl: 'https://www.akasaair.com/check-in',
      color: '#001F5C',
      accentColor: '#FF6B35'
    },
    {
      id: 5,
      name: 'Philippine Airlines',
      logo: philippineAirlinesLogo,
      altText: 'Philippine Airlines Logo',
      checkInUrl: 'https://www.philippineairlines.com/ph/en/check-in-online.html',
      color: '#003D7A',
      accentColor: '#F1A91B'
    },
    {
      id: 6,
      name: 'Emirates',
      logo: emiratesLogo,
      altText: 'Emirates Airline Logo',
      checkInUrl: 'https://www.emirates.com/in/english/manage-booking/online-check-in/',
      color: '#C41E3A',
      accentColor: '#FFFFFF'
    },
    {
      id: 7,
      name: 'Qatar Airways',
      logo: qatarAirwaysLogo,
      altText: 'Qatar Airways Logo',
      checkInUrl: 'https://cki.qatarairways.com/cki/dashboard',
      color: '#6B1E3F',
      accentColor: '#A29BD0'
    }
  ];

  const handleCardClick = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: '#f2f6fb',
      padding: '40px 20px',
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      overflow: 'hidden',
      position: 'relative'
    },
    bgPattern: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: `
        radial-gradient(circle at 20% 50%, rgba(29, 99, 191, 0.06) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(29, 99, 191, 0.06) 0%, transparent 50%)
      `,
      pointerEvents: 'none',
      zIndex: 0
    },
    content: {
      position: 'relative',
      zIndex: 1,
      maxWidth: '1200px',
      margin: '0 auto'
    },
    header: {
      textAlign: 'center',
      marginBottom: '60px',
      animation: 'slideDown 0.8s ease-out',
      backgroundColor: '#1d63bf',
      padding: '30px 20px',
      borderRadius: '8px'
    },
    title: {
      fontSize: '3.15rem',
      fontWeight: '700',
      color: '#ffffff',
      marginBottom: '12px',
      letterSpacing: '-1px'
    },
    subtitle: {
      fontSize: '1.08rem',
      color: '#ffffff',
      fontWeight: '300',
      letterSpacing: '0.5px'
    },
    cardsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '32px',
      marginBottom: '40px',
      animation: 'fadeIn 1s ease-out 0.2s both'
    },
    card: {
      cursor: 'pointer',
      borderRadius: '8px',
      border: '1px solid #d2dceb',
      background: '#ffffff',
      padding: '32px 24px',
      textAlign: 'center',
      transition: 'all 0.4s cubic-bezier(0.23, 1, 0.320, 1)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      position: 'relative',
      overflow: 'hidden'
    },
    cardBeforeHover: {
      transform: 'translateY(0) scale(1)',
      borderColor: '#d2dceb',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    },
    cardHovered: {
      transform: 'translateY(-12px) scale(1.02)',
      borderColor: '#1d63bf',
      boxShadow: '0 12px 24px rgba(29, 99, 191, 0.2)',
      background: '#ffffff'
    },
    cardContent: {
      position: 'relative',
      zIndex: 2
    },
    logoContainer: {
      height: '80px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '20px',
      perspective: '1000px'
    },
    logo: {
      maxWidth: '100%',
      maxHeight: '100%',
      objectFit: 'contain',
      filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
      transition: 'transform 0.4s ease-out'
    },
    airlineName: {
      fontSize: '1.17rem',
      fontWeight: '600',
      color: '#1c3556',
      marginBottom: '16px',
      letterSpacing: '0.3px'
    },
    checkInButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      marginTop: '16px',
      padding: '10px 20px',
      backgroundColor: '#ffffff',
      color: '#1c3556',
      border: '1.5px solid #d2dceb',
      borderRadius: '4px',
      fontSize: '0.81rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      textTransform: 'uppercase',
      letterSpacing: '0.8px'
    },
    checkInButtonHovered: {
      backgroundColor: '#1d63bfbb',
      borderColor: '#1d63bf',
      color: '#ffffff',
      transform: 'translateX(4px)'
    },
    footer: {
      textAlign: 'center',
      color: '#6c809f',
      fontSize: '0.855rem',
      marginTop: '60px',
      paddingTop: '40px',
      borderTop: '1px solid #d2dceb',
      animation: 'fadeIn 1s ease-out 0.4s both'
    },
    '@keyframes': `
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
    `
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: 'border-box';
        }

        body {
          font-family: 'Sora', sans-serif;
          background: #f2f6fb;
          color: #1c3556;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .airline-card:hover .airline-logo {
          transform: scale(1.1) rotate(2deg);
        }

        .airline-card:hover .check-in-btn {
          background-color: #1d63bfbb;
          border-color: #1d63bf;
          color: #ffffff;
          transform: translateX(4px);
        }
      `}</style>

      <div style={styles.container}>
        <div style={styles.bgPattern}></div>

        <div style={styles.content}>
          {/* Header Section */}
          <div style={styles.header}>
            <h1 style={styles.title}>Web Check-In</h1>
            <p style={styles.subtitle}>Quick check-in for all airlines, anywhere, anytime</p>
          </div>

          {/* Cards Grid */}
          <div style={styles.cardsGrid}>
            {airlines.map((airline) => (
              <div
                key={airline.id}
                className="airline-card"
                style={{
                  ...styles.card,
                  ...(hoveredCard === airline.id ? styles.cardHovered : styles.cardBeforeHover)
                }}
                onMouseEnter={() => setHoveredCard(airline.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleCardClick(airline.checkInUrl)}
              >
                <div style={styles.cardContent}>
                  {/* Logo Container */}
                  <div style={styles.logoContainer}>
                    <img
                      className="airline-logo"
                      src={airline.logo}
                      alt={airline.altText}
                      style={{
                        ...styles.logo,
                        transition: 'transform 0.4s ease-out'
                      }}
                    />
                  </div>

                  {/* Airline Name */}
                  <h2 style={styles.airlineName}>{airline.name}</h2>

                  {/* Check-In Button */}
                  <button
                    className="check-in-btn"
                    style={styles.checkInButton}
                  >
                    <span>Check In</span>
                    <ExternalLink size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={styles.footer}>
            <p>✈️ All links redirect to official airline portals. Check-in windows typically open 24-48 hours before departure.</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default WebCheckInPage;
