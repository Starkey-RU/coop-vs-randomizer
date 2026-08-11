import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Room from './pages/Room';
import Admin from './pages/Admin';

function App() {
  useEffect(() => {
      // Инициализация темы при первой загрузке приложения
      const savedTheme = localStorage.getItem('bingo_theme') || 'steam2003';
      const savedDarkMode = localStorage.getItem('bingo_dark_mode') != 'false';
      
      document.body.setAttribute('data-theme', savedTheme);
      if (savedDarkMode) {
          document.body.setAttribute('data-dark', 'true');
      } else {
          document.body.setAttribute('data-dark', 'false');
      }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:id" element={<Room />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
