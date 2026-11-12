import React, { useState, useEffect, useRef } from 'react';

export default function Player({ videos = [], comerciales = [], tiempoEspera = 300 }) {
  if (!videos || videos.length === 0) {
    return (
      <div className="flex w-full h-[100dvh] items-center justify-center bg-black text-white font-sans">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
          <p className="text-xl font-light tracking-widest text-slate-400 uppercase">Cargando Videos...</p>
        </div>
      </div>
    );
  }

  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [adMode, setAdMode] = useState(false);
  const [proximoCorteAd, setProximoCorteAd] = useState(tiempoEspera);

  const currentVideo = videos[currentVideoIndex];
  const currentAd = comerciales.length > 0 ? comerciales[currentAdIndex] : null;

  const videoRef = useRef(null);
  const adVideoRef = useRef(null);
  const containerRef = useRef(null);

  // Sincronizar el tiempo de espera dinámico
  useEffect(() => {
    setProximoCorteAd(tiempoEspera);
  }, [tiempoEspera]);

  // Manejo de play/pause del video principal y escape de Fullscreen Nativo
  useEffect(() => {
    if (!videoRef.current) return;
    
    if (!adMode) {
      setTimeout(() => {
        if (videoRef.current) videoRef.current.play().catch(err => console.log(err));
      }, 50);
    } else {
      videoRef.current.pause();
      
      // PARCHE PARA MÓVILES: Si el video está en el reproductor nativo a pantalla completa, 
      // lo forzamos a cerrarse para que se pueda ver la capa de publicidad web.
      try {
        if (videoRef.current.webkitDisplayingFullscreen && videoRef.current.webkitExitFullscreen) {
          videoRef.current.webkitExitFullscreen();
        }
      } catch (error) {
        console.log("Error al salir de pantalla completa nativa:", error);
      }
    }
  }, [adMode]);

  // Cambio de video principal en la lista
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      setProximoCorteAd(tiempoEspera);
      if (!adMode) videoRef.current.play().catch(err => console.log(err));
    }
  }, [currentVideoIndex]);

  // Temporizador para la duración del comercial en pantalla
  useEffect(() => {
    if (!adMode || !currentAd) return;

    if (currentAd.duration > 0) {
      const durationMs = currentAd.duration * 1000;
      const timer = setTimeout(() => {
        regresarAlVideoPrincipal();
      }, durationMs);
      return () => clearTimeout(timer);
    } else if (currentAd.type === 'imageItem') {
      const timer = setTimeout(() => {
        regresarAlVideoPrincipal();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [adMode, currentAdIndex, currentAd]);

  // Forzar play en videos comerciales
  useEffect(() => {
    if (adMode && currentAd?.type === 'videoAdItem' && adVideoRef.current) {
      adVideoRef.current.load();
      adVideoRef.current.play().catch(err => console.log(err));
    }
  }, [adMode, currentAdIndex, currentAd]);

  const handleTimeUpdate = () => {
    if (!videoRef.current || adMode) return;
    if (videoRef.current.currentTime >= proximoCorteAd) {
      if (comerciales.length > 0) {
        setAdMode(true);
      } else {
        setProximoCorteAd(prev => prev + tiempoEspera);
      }
    }
  };

  const regresarAlVideoPrincipal = () => {
    setAdMode(false);
    setProximoCorteAd(prev => prev + tiempoEspera);
    if (comerciales.length > 0) {
      setCurrentAdIndex((prev) => (prev + 1) % comerciales.length);
    }
  };

  const handleMainVideoEnded = () => {
    setAdMode(false);
    setProximoCorteAd(tiempoEspera);
    setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
  };

  const handleAdVideoEndedFallback = () => {
    if (currentAd && (!currentAd.duration || currentAd.duration === 0)) {
      regresarAlVideoPrincipal();
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    const isFullscreen = 
      document.fullscreenElement || 
      document.webkitFullscreenElement || 
      document.mozFullScreenElement || 
      document.msFullscreenElement;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(err => console.log(err));
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      } else if (videoRef.current && videoRef.current.webkitEnterFullscreen) {
        videoRef.current.webkitEnterFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="relative bg-black flex items-center justify-center select-none overflow-hidden"
      style={{ width: '100vw', height: '100dvh' }}
    >
      
      {/* BOTÓN PANTALLA COMPLETA */}
      <button
        onClick={toggleFullscreen}
        className="hover:scale-110 active:scale-95 transition-all duration-200"
        style={{ 
          position: 'absolute', bottom: '24px', right: '24px', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '10px',
          padding: '12px', width: '48px', height: '48px', color: '#ffffff'
        }}
      >
        <svg viewBox="0 0 24 24" style={{ width: '28px', height: '28px', fill: 'none', stroke: 'currentColor', strokeWidth: '2.5', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
        </svg>
      </button>

      {/* 1. VIDEO PRINCIPAL CONTENIDO */}
      {currentVideo && (
        <video
          ref={videoRef}
          src={currentVideo.videoUrl}
          className="w-full h-full object-cover"
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            display: adMode ? 'none' : 'block',
            zIndex: 10 
          }}
          autoPlay
          muted
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleMainVideoEnded}
          playsInline 
        />
      )}

      {/* 2. CAPA DE PUBLICIDAD A PANTALLA COMPLETA */}
      {adMode && currentAd && (
        <div 
          className="bg-black flex items-center justify-center" 
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%', 
            height: '100%', 
            zIndex: 20 
          }}
        >
          {currentAd.videoUrl ? (
            <video
              ref={adVideoRef}
              src={currentAd.videoUrl}
              className="w-full h-full object-cover"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              muted
              autoPlay
              playsInline
              loop={currentAd.duration > 0}
              onEnded={handleAdVideoEndedFallback}
            />
          ) : (
            currentAd.imageUrl && (
              <img
                src={currentAd.imageUrl}
                alt="Publicidad"
                className="w-full h-full object-cover"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )
          )}
        </div>
      )}

    </div>
  );
}