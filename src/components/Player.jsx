import React, { useState, useEffect, useRef } from 'react';

export default function Player({ items = [] }) {
  if (!items || items.length === 0) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black text-white font-sans">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
          <p className="text-xl font-light tracking-widest text-slate-400 uppercase">Cargando Parrilla FitGo TV...</p>
        </div>
      </div>
    );
  }

  const [currentIndex, setCurrentIndex] = useState(0);
  const [adMode, setAdMode] = useState(false);
  const [savedVideoTime, setSavedVideoTime] = useState(0);

  const currentItem = items[currentIndex];
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const INTERVALO_PUBLICIDAD_SEG = 600; 

  useEffect(() => {
    if (currentItem.type === 'imageItem') {
      const durationMs = (currentItem.duration || 10) * 1000;
      const timer = setTimeout(() => {
        if (adMode) {
          setAdMode(false);
        } else {
          handleNext();
        }
      }, durationMs);
      return () => clearTimeout(timer);
    }

    if (currentItem.type === 'videoItem' && videoRef.current) {
      videoRef.current.load();
      if (savedVideoTime > 0) {
        videoRef.current.currentTime = savedVideoTime;
      }
      videoRef.current.play().catch(err => console.log("Autoplay bloqueado:", err));
    }
  }, [currentIndex, adMode]);

  const handleTimeUpdate = () => {
    if (!videoRef.current || adMode || currentItem.type !== 'videoItem') return;
    const currentTime = videoRef.current.currentTime;
    if (currentTime >= INTERVALO_PUBLICIDAD_SEG && savedVideoTime === 0) {
      setSavedVideoTime(currentTime);
      videoRef.current.pause();
      setAdMode(true);
    }
  };

  const handleNext = () => {
    setSavedVideoTime(0);
    setAdMode(false);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
  };

  const getPublicidadInterrupcion = () => {
    const publicidad = items.find(item => item.type === 'imageItem');
    return publicidad || { imageUrl: currentItem.imageUrl, duration: 10 };
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => console.log(err));
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-screen h-screen bg-black flex items-center justify-center select-none"
      style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}
    >
      
      {/* BOTÓN ESTILO YOUTUBE PREMIUM */}
<button
  onClick={toggleFullscreen}
  className="hover:scale-110 active:scale-95 transition-all duration-200"
  style={{ 
    position: 'absolute', 
    bottom: '24px', 
    right: '24px', 
    zIndex: 99999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    padding: '12px',
    width: '44px',
    height: '44px',
    color: '#ffffff'
  }}
  title="Pantalla Completa"
>
  <svg 
    viewBox="0 0 24 24" 
    style={{ width: '24px', height: '24px', fill: 'none', stroke: 'currentColor', strokeWidth: '2.5', strokeLinecap: 'round', strokeLinejoin: 'round' }}
  >
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
  </svg>
</button>

      {/* RENDER DE VIDEO */}
      {currentItem.type === 'videoItem' && currentItem.videoUrl && !adMode && (
        <video
          ref={videoRef}
          src={currentItem.videoUrl}
          className="w-full h-full object-cover" 
          style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0, zIndex: 10 }}
          autoPlay
          muted
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleNext}
          playsInline
        />
      )}

      {/* RENDER DE IMAGEN */}
      {(currentItem.type === 'imageItem' || adMode) && (
        <img
          src={adMode ? getPublicidadInterrupcion().imageUrl : currentItem.imageUrl}
          alt="Publicidad FitGo"
          className="w-full h-full object-cover animate-fade-in" 
          style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0, zIndex: 10 }}
        />
      )}

    </div>
  );
}