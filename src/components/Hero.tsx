import React from 'react';
import { Truck, Clock, Shield, Star } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

const Hero: React.FC = () => {
  const { settings } = useSettings();
  
  return (
    <div className="bg-gradient-to-br from-green-50 to-green-100">
      {/* Main hero section */}
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 leading-tight whitespace-pre-line">
              {settings.heroTitle}
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              {settings.heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-lg"
              >
                Shop Now
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="border-2 border-green-600 text-green-600 px-8 py-4 rounded-lg font-semibold hover:bg-green-600 hover:text-white transition-colors"
              >
                Learn More
              </button>
            </div>
          </div>
          
          <div className="relative">
            <img
              src={settings.homepageBanner || "https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=compress&cs=tinysrgb&w=600"}
              alt="Store banner"
              className="rounded-2xl shadow-2xl h-64 md:h-[400px] w-full object-cover"
            />
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="font-semibold">4.8/5</span>
              </div>
              <p className="text-sm text-gray-600">Customer Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features section */}
      <div id="features" className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Fast Delivery</h3>
              <p className="text-gray-600">
                Free delivery on orders over {settings.currencySymbol}{settings.freeDeliveryThreshold}. Standard delivery fee is {settings.currencySymbol}{settings.deliveryFee}.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Quality Guaranteed</h3>
              <p className="text-gray-600">
                Fresh, high-quality products sourced from trusted local suppliers and farms.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Always Open</h3>
              <p className="text-gray-600">
                Shop 24/7 online with our easy-to-use platform. Customer support available daily.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;