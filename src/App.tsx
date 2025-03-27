import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import HomePage from './pages/HomePage';
import ContactPage from './pages/ContactPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import Footer from './components/Footer';

function App() {
  const location = useLocation();

  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    // Handle scrolling on route changes
    if (!location.state?.scrollTo) {
      handleScrollToTop();
    }

    // Handle scrolling to specific sections
    if (location.state?.scrollTo) {
      setTimeout(() => {
        const element = document.getElementById(location.state.scrollTo);
        element?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [location.pathname, location.state]);

  return (
    <div className="bg-gradient-to-b from-true-black to-off-black min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/blog" element={<div>Blog Works!</div>} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;

