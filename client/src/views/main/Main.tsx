import React from 'react';
import './Main.css';

interface LeaderboardUser {
  name: string;
  level: string;
  score: number;
  avatar: string;
}

const Main: React.FC = () => {
  const leaderboardData: LeaderboardUser[] = [
    {
      name: 'Ricardo',
      level: 'Level 5',
      score: 1500,
      avatar: 'https://cdn.usegalileo.ai/sdxl10/6158dcf0-61b2-4f3a-b7f5-f5cc02494053.png'
    },
    {
      name: 'Anna',
      level: 'Level 4',
      score: 1200,
      avatar: 'https://cdn.usegalileo.ai/sdxl10/b105e251-6b00-4590-9022-bfb4411ac170.png'
    },
    {
      name: 'John',
      level: 'Level 3',
      score: 900,
      avatar: 'https://cdn.usegalileo.ai/sdxl10/d32085e5-7964-4833-a300-69201f3dc590.png'
    },
    {
      name: 'Sophia',
      level: 'Level 2',
      score: 700,
      avatar: 'https://cdn.usegalileo.ai/sdxl10/2e58a568-aa50-44e4-9391-dbb85b43a4dc.png'
    },
    {
      name: 'Michael',
      level: 'Level 1',
      score: 500,
      avatar: 'https://cdn.usegalileo.ai/sdxl10/6158dcf0-61b2-4f3a-b7f5-f5cc02494053.png'
    }
  ];

  return (
    <div className="main-container">
      <div className="layout-container">
        <div className="content-wrapper">
          {/* Sidebar */}
          <div className="sidebar">
            <div className="sidebar-content">
              <div className="sidebar-top">
                <h1 className="sidebar-title">Python Mastery</h1>
                <div className="nav-menu">
                  <div className="nav-item active">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M224,115.55V208a16,16,0,0,1-16,16H168a16,16,0,0,1-16-16V168a8,8,0,0,0-8-8H112a8,8,0,0,0-8,8v40a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V115.55a16,16,0,0,1,5.17-11.78l80-75.48.11-.11a16,16,0,0,1,21.53,0,1.14,1.14,0,0,0,.11.11l80,75.48A16,16,0,0,1,224,115.55Z" />
                    </svg>
                    <p>Home</p>
                  </div>
                  <div className="nav-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M208,24H72A32,32,0,0,0,40,56V224a8,8,0,0,0,8,8H192a8,8,0,0,0,0-16H56a16,16,0,0,1,16-16H208a8,8,0,0,0,8-8V32A8,8,0,0,0,208,24Zm-8,160H72a31.82,31.82,0,0,0-16,4.29V56A16,16,0,0,1,72,40H200Z" />
                    </svg>
                    <p>Learn</p>
                  </div>
                  <div className="nav-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM51.31,160,136,75.31,152.69,92,68,176.68ZM48,179.31,76.69,208H48Zm48,25.38L79.31,188,164,103.31,180.69,120Zm96-96L147.31,64l24-24L216,84.68Z" />
                    </svg>
                    <p>Practice</p>
                  </div>
                  <div className="nav-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M232,64H208V56a16,16,0,0,0-16-16H64A16,16,0,0,0,48,56v8H24A16,16,0,0,0,8,80V96a40,40,0,0,0,40,40h3.65A80.13,80.13,0,0,0,120,191.61V216H96a8,8,0,0,0,0,16h64a8,8,0,0,0,0-16H136V191.58c31.94-3.23,58.44-25.64,68.08-55.58H208a40,40,0,0,0,40-40V80A16,16,0,0,0,232,64ZM48,120A24,24,0,0,1,24,96V80H48v32q0,4,.39,8Zm144-8.9c0,35.52-28.49,64.64-63.51,64.9H128a64,64,0,0,1-64-64V56H192ZM232,96a24,24,0,0,1-24,24h-.5a81.81,81.81,0,0,0,.5-8.9V80h24Z" />
                    </svg>
                    <p>Challenges</p>
                  </div>
                  <div className="nav-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M216,56H176V48a24,24,0,0,0-24-24H104A24,24,0,0,0,80,48v8H40A16,16,0,0,0,24,72V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V72A16,16,0,0,0,216,56ZM96,48a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96ZM216,72v41.61A184,184,0,0,1,128,136a184.07,184.07,0,0,1-88-22.38V72Zm0,128H40V131.64A200.19,200.19,0,0,0,128,152a200.25,200.25,0,0,0,88-20.37V200ZM104,112a8,8,0,0,1,8-8h32a8,8,0,0,1,0,16H112A8,8,0,0,1,104,112Z" />
                    </svg>
                    <p>Projects</p>
                  </div>
                  <div className="nav-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM40,72H216a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16ZM216,184H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Z" />
                    </svg>
                    <p>Leaderboard</p>
                  </div>
                </div>
              </div>
              
              <div className="sidebar-bottom">
                <button className="upgrade-btn">
                  <span>Upgrade</span>
                </button>
                <div className="bottom-menu">
                  <div className="nav-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92ZM40,108a44,44,0,1,1,44,44A44.05,44.05,0,0,1,40,108Zm210.14,98.7a8,8,0,0,1-11.07-2.33A79.83,79.83,0,0,0,172,168a8,8,0,0,1,0-16,44,44,0,1,0-16.34-84.87,8,8,0,1,1-5.94-14.85,60,60,0,0,1,55.53,105.64,95.83,95.83,0,0,1,47.22,37.71A8,8,0,0,1,250.14,206.7Z" />
                    </svg>
                    <p>Invite friends</p>
                  </div>
                  <div className="nav-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216ZM80,108a12,12,0,1,1,12,12A12,12,0,0,1,80,108Zm96,0a12,12,0,1,1-12-12A12,12,0,0,1,176,108Zm-1.07,48c-10.29,17.79-27.4,28-46.93,28s-36.63-10.2-46.92-28a8,8,0,1,1,13.84-8c7.47,12.91,19.21,20,33.08,20s25.61-7.1,33.07-20a8,8,0,0,1,13.86,8Z" />
                    </svg>
                    <p>Feedback</p>
                  </div>
                  <div className="nav-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M140,180a12,12,0,1,1-12-12A12,12,0,0,1,140,180ZM128,72c-22.06,0-40,16.15-40,36v4a8,8,0,0,0,16,0v-4c0-11,10.77-20,24-20s24,9,24,20-10.77,20-24,20a8,8,0,0,0-8,8v8a8,8,0,0,0,16,0v-.72c18.24-3.35,32-17.9,32-35.28C168,88.15,150.06,72,128,72Zm104,56A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z" />
                    </svg>
                    <p>Help Center</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="main-content">
            <div className="welcome-section">
              <div className="welcome-text">
                <p className="welcome-title">Good evening, Alex</p>
                <p className="welcome-subtitle">You're 3 lessons away from completing the Python Basics course</p>
              </div>
            </div>
            
            <h2 className="section-title">Today's challenge</h2>
            <div className="challenge-card">
              <div className="challenge-content">
                <div className="challenge-text">
                  <div className="challenge-info">
                    <p className="challenge-title">Create a new function</p>
                    <p className="challenge-description">Write a function that takes two arguments, and returns the sum of those two arguments.</p>
                  </div>
                  <button className="start-challenge-btn">
                    <span>Start challenge</span>
                  </button>
                </div>
                <div 
                  className="challenge-image"
                  style={{backgroundImage: 'url("https://cdn.usegalileo.ai/sdxl10/abbfea20-0410-4d3f-a425-c81534cde1ec.png")'}}>
                </div>
              </div>
            </div>
            
            <h2 className="section-title">Roadmap</h2>
            <div className="roadmap-item">
              <div className="roadmap-header">
                <p className="roadmap-title">Python Basics</p>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{width: '30%'}}></div>
              </div>
              <p className="progress-text">2/5 lessons</p>
            </div>
            
            <div className="roadmap-item">
              <div className="roadmap-header">
                <p className="roadmap-title">Python Functions</p>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{width: '60%'}}></div>
              </div>
              <p className="progress-text">4/5 lessons</p>
            </div>
            
            <div className="roadmap-item">
              <div className="roadmap-header">
                <p className="roadmap-title">Python Lists</p>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{width: '80%'}}></div>
              </div>
              <p className="progress-text">3/5 lessons</p>
            </div>
            
            <h2 className="section-title">Leaderboard</h2>
            {leaderboardData.map((user, index) => (
              <div key={index} className="leaderboard-item">
                <div className="user-info">
                  <div 
                    className="user-avatar"
                    style={{backgroundImage: `url("${user.avatar}")`}}>
                  </div>
                  <div className="user-details">
                    <p className="user-name">{user.name}</p>
                    <p className="user-level">{user.level}</p>
                  </div>
                </div>
                <div className="user-score">
                  <p>{user.score.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Main;