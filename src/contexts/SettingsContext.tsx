import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSettings } from '../data/adminStore';
import { useSocket } from '../hooks/useSocket';

export interface StoreSettings {
  websiteName: string;
  storeName: string;
  storeLogo: string;
  favicon: string;
  storeDescription: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  
  homepageBanner: string;
  heroTitle: string;
  heroSubtitle: string;
  facebookLink: string;
  instagramLink: string;
  twitterLink: string;

  guestCheckout: boolean;
  emailVerification: boolean;
  socialLogin: boolean;

  deliveryFee: number;
  freeDeliveryThreshold: number;
  minOrderAmount: number;
  orderPrefix: string;

  zaadEnabled: boolean;
  zaadApiKey: string;
  evcEnabled: boolean;
  evcApiKey: string;
  edahabEnabled: boolean;
  edahabApiKey: string;
  currencySymbol: string;

  themeColor: string;
  secondaryColor: string;

  maintenanceMode: boolean;
  lowStockThreshold: number;
  rewardPointsRatio: number;

  adminDashboardName: string;
  adminDarkMode: boolean;
}

const defaultSettings: StoreSettings = {
  websiteName: 'Hargeisa Grocery',
  storeName: 'Hargeisa Grocery',
  storeLogo: '',
  favicon: '/favicon.png',
  storeDescription: 'Your premium source for fresh groceries delivered straight to your door in Hargeisa.',
  contactEmail: 'hello@hargeisa.com',
  contactPhone: '+252 63 609 7266',
  address: 'Jidka Xoriyada, Hargeisa, Somaliland',
  
  homepageBanner: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80',
  heroTitle: 'Fresh Groceries Delivered to Your Door',
  heroSubtitle: 'Experience the finest selection of fresh produce, premium meats, and daily essentials with our same-day delivery service across Hargeisa.',
  facebookLink: '#',
  instagramLink: '#',
  twitterLink: '#',

  guestCheckout: true,
  emailVerification: false,
  socialLogin: false,

  deliveryFee: 3.50,
  freeDeliveryThreshold: 25.00,
  minOrderAmount: 0,
  orderPrefix: 'HG',

  zaadEnabled: true,
  zaadApiKey: '',
  evcEnabled: true,
  evcApiKey: '',
  edahabEnabled: true,
  edahabApiKey: '',
  currencySymbol: '$',

  themeColor: '#16a34a', // green-600
  secondaryColor: '#1f2937', // gray-800

  maintenanceMode: false,
  lowStockThreshold: 10,
  rewardPointsRatio: 1.0,
  
  adminDashboardName: 'Admin Dashboard',
  adminDarkMode: true
};

interface SettingsContextType {
  settings: StoreSettings;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// ✅ Apply favicon to DOM
const applyFaviconToDOM = (faviconUrl: string) => {
  if (!faviconUrl) return;
  
  // ✅ FIX: Convert HTTP to HTTPS if needed (mixed content fix)
  let url = faviconUrl;
  if (url.startsWith('http://')) {
    url = url.replace('http://', 'https://');
  }
  
  let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  // Cache bust to force update
  link.href = url.includes('?') 
    ? url + '&v=' + Date.now() 
    : url + '?v=' + Date.now();
  
  console.log('✅ Favicon applied:', link.href);
};

// ✅ Update page title
const updatePageTitle = (websiteName: string) => {
  if (websiteName) {
    document.title = websiteName + ' - Web App';
  }
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const data = await getSettings();
      if (data && Object.keys(data).length > 0) {
        setSettings(prev => ({
          ...prev,
          ...data,
          // Parse specific types
          deliveryFee: data.deliveryFee ? parseFloat(data.deliveryFee) : prev.deliveryFee,
          freeDeliveryThreshold: data.freeDeliveryThreshold ? parseFloat(data.freeDeliveryThreshold) : prev.freeDeliveryThreshold,
          minOrderAmount: data.minOrderAmount ? parseFloat(data.minOrderAmount) : prev.minOrderAmount,
          lowStockThreshold: data.lowStockThreshold ? parseInt(data.lowStockThreshold) : prev.lowStockThreshold,
          rewardPointsRatio: data.rewardPointsRatio ? parseFloat(data.rewardPointsRatio) : prev.rewardPointsRatio,
          guestCheckout: data.guestCheckout === 'true',
          emailVerification: data.emailVerification === 'true',
          socialLogin: data.socialLogin === 'true',
          zaadEnabled: data.zaadEnabled === 'true',
          evcEnabled: data.evcEnabled === 'true',
          edahabEnabled: data.edahabEnabled === 'true',
          maintenanceMode: data.maintenanceMode === 'true',
          adminDarkMode: data.adminDarkMode === undefined ? true : data.adminDarkMode === 'true',
        }));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const { socket } = useSocket();

  useEffect(() => {
    fetchSettings();
  }, []);

  // ✅ Apply favicon & title whenever settings change
  useEffect(() => {
    if (settings.favicon) {
      applyFaviconToDOM(settings.favicon);
    }
    if (settings.websiteName) {
      updatePageTitle(settings.websiteName);
    }
  }, [settings.favicon, settings.websiteName]);

  useEffect(() => {
    if (socket) {
      socket.on('SETTINGS_UPDATED', fetchSettings);
      return () => {
        socket.off('SETTINGS_UPDATED', fetchSettings);
      };
    }
  }, [socket]);

  return (
    <SettingsContext.Provider value={{ settings, isLoading, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
