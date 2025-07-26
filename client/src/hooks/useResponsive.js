import { useState, useEffect } from 'react';

const useResponsive = () => {
  const [screenSize, setScreenSize] = useState('desktop');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [orientation, setOrientation] = useState('landscape');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Determine screen size
      if (width < 640) {
        setScreenSize('mobile');
        setIsMobile(true);
        setIsTablet(false);
        setIsDesktop(false);
      } else if (width < 1024) {
        setScreenSize('tablet');
        setIsMobile(false);
        setIsTablet(true);
        setIsDesktop(false);
      } else {
        setScreenSize('desktop');
        setIsMobile(false);
        setIsTablet(false);
        setIsDesktop(true);
      }

      // Determine orientation
      setOrientation(width > height ? 'landscape' : 'portrait');
    };

    // Initial check
    handleResize();

    // Add event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Device detection utilities
  const getDeviceType = () => {
    const userAgent = navigator.userAgent;
    if (/android/i.test(userAgent)) return 'android';
    if (/iPad|iPhone|iPod/.test(userAgent)) return 'ios';
    return 'web';
  };

  const getDeviceInfo = () => {
    return {
      type: screenSize,
      platform: getDeviceType(),
      userAgent: navigator.userAgent,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      orientation: orientation,
      isOnline: navigator.onLine,
      language: navigator.language
    };
  };

  // Responsive CSS classes helper
  const getResponsiveClasses = (mobileClass, tabletClass, desktopClass) => {
    if (isMobile) return mobileClass;
    if (isTablet) return tabletClass;
    return desktopClass;
  };

  // Grid columns helper
  const getGridCols = (mobile = 1, tablet = 2, desktop = 3) => {
    if (isMobile) return `grid-cols-${mobile}`;
    if (isTablet) return `grid-cols-${tablet}`;
    return `grid-cols-${desktop}`;
  };

  // Padding/margin helper
  const getSpacing = (mobile = 'p-4', tablet = 'p-6', desktop = 'p-8') => {
    if (isMobile) return mobile;
    if (isTablet) return tablet;
    return desktop;
  };

  // Text size helper
  const getTextSize = (mobile = 'text-sm', tablet = 'text-base', desktop = 'text-lg') => {
    if (isMobile) return mobile;
    if (isTablet) return tablet;
    return desktop;
  };

  return {
    screenSize,
    isMobile,
    isTablet,
    isDesktop,
    orientation,
    getDeviceType,
    getDeviceInfo,
    getResponsiveClasses,
    getGridCols,
    getSpacing,
    getTextSize
  };
};

export default useResponsive;