import { BrowserRouter, Routes, Route } from 'react-router';
import { Reader } from './pages/Reader/Reader';
import { About } from './pages/About/About';
import { Cached } from './pages/Cached/Cached';
import { Secret } from './pages/Secret/Secret';
import { Websites } from './pages/Websites/Websites';
import { Header } from './components/Header/Header';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen overflow-x-hidden bg-white">
        <Header />
        <Routes>
          <Route path="/" element={<Reader />} />
          <Route path="/about" element={<About />} />
          <Route path="/cached" element={<Cached />} />
          <Route path="/secret" element={<Secret />} />
          <Route path="/websites" element={<Websites />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
