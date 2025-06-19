import React from "react";

const mockRanking = [
  { name: "PlayerOne", score: 1500 },
  { name: "GalaxyWarrior", score: 1400 },
  { name: "CodeMaster", score: 1300 },
  { name: "AstroNinja", score: 1200 },
  { name: "SpaceExplorer", score: 1100 },
];

const AstrocodeMainScreen: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #000000, #312e81, #000000)',
      color: 'white',
      padding: '16px'
    }}>
      <h1 style={{
        fontSize: '2.5rem',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: '24px'
      }}>AstroCode: Galactic Path</h1>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '24px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Galactic Path Map */}
        <div style={{
          background: 'linear-gradient(to right, #3730a3, #7c3aed)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '40px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <span style={{ fontSize: '3rem', marginRight: '8px' }}>🚀</span>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Galactic Mission Progress</h2>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            {[...Array(10)].map((_, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <span style={{ 
                  fontSize: '2rem',
                  color: i < 4 ? '#fbbf24' : '#6b7280'
                }}>⭐</span>
                {i < 4 && (
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    right: '0',
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#10b981',
                    borderRadius: '50%'
                  }} />
                )}
              </div>
            ))}
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#374151',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '40%',
              height: '100%',
              backgroundColor: '#3b82f6',
              borderRadius: '4px'
            }} />
          </div>
        </div>

        {/* Ranking */}
        <div style={{
          background: 'linear-gradient(to right, #3730a3, #312e81)',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <span style={{ fontSize: '2rem', marginRight: '8px' }}>🏆</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Top 5 Ranking</h3>
          </div>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {mockRanking.map((player, idx) => (
              <li key={idx} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid #4b5563'
              }}>
                <span>{idx + 1}. {player.name}</span>
                <span>{player.score} pts</span>
              </li>
            ))}
          </ul>
          <button style={{
            marginTop: '16px',
            width: '100%',
            padding: '12px',
            backgroundColor: '#eab308',
            color: '#000',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}>
            View Full Ranking
          </button>
        </div>

        {/* Daily Challenge */}
        <div style={{
          background: 'linear-gradient(to right, #7c2d12, #7c3aed)',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <span style={{ fontSize: '2rem', marginRight: '8px' }}>🚀</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Daily Challenge</h3>
          </div>
          <div>
            <p style={{ marginBottom: '16px' }}>
              Today's mission: Solve 5 coding puzzles using conditional statements!
            </p>
            <button style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#ec4899',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}>
              Start Challenge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AstrocodeMainScreen;
