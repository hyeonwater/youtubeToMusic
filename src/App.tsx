import { AppProvider } from './app/providers/AppProvider';
import { HomePage } from './presentation/pages/HomePage';

function App() {
  return (
    <AppProvider>
      <HomePage />
    </AppProvider>
  );
}

export default App;
