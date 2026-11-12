import React, { useState, useEffect, useRef, useCallback } from 'react';

export default function Player({ videos = [], comerciales = [], tiempoEspera = 300 }) {
  // 1. TODOS los hooks deben ir siempre al inicio (nunca después de un return)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [adMode, setAdMode] = useState(false);
  const [proximoCorteAd, setProximoCorteAd] = useState(tiempoEspera);
  const [playTrigger, setPlayTrigger] = useState(0); // Fuerza el reinicio incluso si solo hay 1 video

  const videoRef = useRef(null);
  const adVideoRef = useRef(null);
  const containerRef = useRef(null);

  // Asegurar que el índice nunca se salga de rango si cambia la lista de videos
  const safeVideoIndex = videos.length > 0 ? currentVideoIndex % videos.length : 0;
  const currentVideo = videos.length > 0 ? videos[safeVideoIndex] : null;
  const currentAd = comerciales.length > 0 ? comerciales[currentAdIndex % comerciales.length] : null;

  useEffect(() => {
    setProximoCorteAd(tiempoEspera);
  }, [tiempoEspera]);

  // Función centralizada y segura para reproducir el video principal
  const playMainVideo = useCallback(() => {
    const videoEl = videoRef.current;
    if (!videoEl || adMode) return;

    const playPromise = videoEl.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.warn("Reintentando reproducción automática:", error);
        // Si falló por carga, reintentar en 1 segundo
        setTimeout(() => {
          if (videoRef.current && !adMode) {
            videoRef.current.play().catch(() => {});
          }
        }, 1000);
      });
    }
  }, [adMode]);

  // Control único de cambio de video y modo publicidad
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !currentVideo) return;

    if (adMode) {
      videoEl.pause();
      try {
        if (videoEl.webkitDisplayingFullscreen && videoEl.webkitExitFullscreen) {
          videoEl.webkitExitFullscreen();
        }
      } catch (e) {}
    } else {
      playMainVideo();
    }
  }, [adMode, currentVideoIndex, playTrigger, currentVideo, playMainVideo]);

  // Temporizador para comerciales
  useEffect(() => {
    if (!adMode || !currentAd) return;

    const durationMs = currentAd.duration > 0 
      ? currentAd.duration * 1000 
      : currentAd.type === 'imageItem' ? 10000 : null;

    if (durationMs) {
      const timer = setTimeout(() => {
        regresarAlVideoPrincipal();
      }, durationMs);
      return () => clearTimeout(timer);
    }
  }, [adMode, currentAdIndex, currentAd]);

  // Reproducir video comercial
  useEffect(() => {
    if (adMode && currentAd?.videoUrl && adVideoRef.current) {
      adVideoRef.current.currentTime = 0;
      adVideoRef.current.play().catch(err => console.warn("Error ad video:", err));
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

  // Avanzar al siguiente video (o reiniciar desde el 0 al terminar los 4)
  const avanzarSiguienteVideo = useCallback(() => {
    setAdMode(false);
    setProximoCorteAd(tiempoEspera);

    if (videos.length === 1 && videoRef.current) {
      // Si solo hay 1 video, rebobinar manualmente a 0
      videoRef.current.currentTime = 0;
      setPlayTrigger(prev => prev + 1);
    } else {
      setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
      setPlayTrigger(prev => prev + 1);
    }
  }, [videos.length, tiempoEspera]);

  // Pantalla de carga segura (después de los hooks)
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

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.();
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

      {/* 1. VIDEO PRINCIPAL */}
      {currentVideo && (
        <video
          key={`${currentVideo.videoUrl}-${safeVideoIndex}`}
          ref={videoRef}
          src={currentVideo.videoUrl}
          preload="auto"
          className="w-full h-full object-cover"
          style={{ 
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
            objectFit: 'cover', display: adMode ? 'none' : 'block', zIndex: 10 
          }}
          autoPlay
          muted
          playsInline
          onCanPlay={playMainVideo}
          onTimeUpdate={handleTimeUpdate}
          onEnded={avanzarSiguienteVideo}
          onError={() => {
            console.error("Error cargando video, saltando al siguiente en 3s...");
            setTimeout(avanzarSiguienteVideo, 3000);
          }}
        />
      )}

      {/* 2. CAPA DE PUBLICIDAD */}
      {adMode && currentAd && (
        <div 
          className="bg-black flex items-center justify-center" 
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 20 }}
        >
          {currentAd.videoUrl ? (
            <video
              key={currentAd.videoUrl}
              ref={adVideoRef}
              src={currentAd.videoUrl}
              className="w-full h-full object-cover"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              muted
              autoPlay
              playsInline
              loop={currentAd.duration > 0}
              onEnded={() => {
                if (!currentAd.duration || currentAd.duration === 0) regresarAlVideoPrincipal();
              }}
              onError={regresarAlVideoPrincipal}
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