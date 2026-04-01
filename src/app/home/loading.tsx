import React from 'react';

export default function Loading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0d1f1e',
        backgroundImage:
          'linear-gradient(rgba(1,121,111,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(1,121,111,0.06) 1px, transparent 1px)',
        backgroundSize: '72px 72px',
        paddingTop: '4.75rem',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '5rem 2rem 6rem',
        }}
      >
        {/* Hero skeleton */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div
            style={{
              display: 'inline-block',
              width: 160,
              height: 28,
              borderRadius: 100,
              background: 'rgba(78,161,153,0.1)',
              marginBottom: '1.5rem',
            }}
          />
          <div
            style={{
              width: '60%',
              maxWidth: 480,
              height: 72,
              borderRadius: 12,
              background: 'rgba(78,161,153,0.07)',
              margin: '0 auto 1rem',
            }}
          />
          <div
            style={{
              width: '45%',
              maxWidth: 360,
              height: 20,
              borderRadius: 8,
              background: 'rgba(78,161,153,0.05)',
              margin: '0 auto 2rem',
            }}
          />
          <div
            style={{
              width: 48,
              height: 3,
              borderRadius: 2,
              background: 'rgba(1,121,111,0.3)',
              margin: '0 auto',
            }}
          />
        </div>

        {/* Stats bar skeleton */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 0,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(78,161,153,0.15)',
            borderRadius: 16,
            padding: '1.25rem 2rem',
            marginBottom: '4rem',
            width: 'fit-content',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {[0, 1, 2].map((i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <div
                  style={{
                    width: 1,
                    height: 40,
                    background: 'rgba(78,161,153,0.2)',
                  }}
                />
              )}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '0 2.5rem',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 28,
                    borderRadius: 8,
                    background: 'rgba(78,161,153,0.1)',
                    marginBottom: '0.25rem',
                  }}
                />
                <div
                  style={{
                    width: 72,
                    height: 12,
                    borderRadius: 4,
                    background: 'rgba(78,161,153,0.06)',
                  }}
                />
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Grid skeleton */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(78,161,153,0.1)',
                borderRadius: 16,
                padding: '1.75rem',
                minHeight: 96,
                overflow: 'hidden',
                position: 'relative',
                animationDelay: `${i * 0.08}s`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(78,161,153,0.07) 40%, rgba(78,161,153,0.12) 50%, rgba(78,161,153,0.07) 60%, transparent 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.8s infinite linear',
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'rgba(78,161,153,0.1)',
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    height: 20,
                    borderRadius: 8,
                    background: 'rgba(78,161,153,0.08)',
                  }}
                />
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'rgba(78,161,153,0.06)',
                    flexShrink: 0,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
