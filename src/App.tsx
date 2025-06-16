import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './app/providers/AppProvider';
import { HomePage } from './presentation/pages/HomePage';
import { OAuthCallback } from './presentation/components/OAuthCallback';

function App() {
  // 개발 환경에서는 basename을 설정하지 않고, 프로덕션에서만 설정
  const basename = import.meta.env.MODE === 'development' ? undefined : '/youtubeToMusic';
  
  return (
    <AppProvider>
      <Router basename={basename}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;
