import React from 'react';
import { ShoppingCart, Phone, Mail, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-green-600 p-2 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Hargeisa Grocery</h3>
                <p className="text-sm text-gray-400">Fresh. Fast. Local.</p>
              </div>
            </div>
            <p className="text-gray-400 mb-4">
              Your trusted neighborhood grocery store, bringing fresh quality products 
              to families across Hargeisa since 2024.
            </p>
            <div className="flex space-x-4">
              <Facebook className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
              <Instagram className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
              <Twitter className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Our Products</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Delivery Info</a></li>
              <li>
                <button
                  onClick={() => {
                    const event = new CustomEvent('openOrderTracking');
                    window.dispatchEvent(event);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Track Order
                </button>
              </li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help & Support</a></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Categories</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Fresh Produce</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Meat & Poultry</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Dairy Products</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Dry Foods</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Household Items</a></li>
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-green-600" />
                <span className="text-gray-400">Jidka Xoriyada, Hargeisa, Somaliland</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-green-600" />
                <span className="text-gray-400">+252 63 609 7266</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-green-600" />
                <span className="text-gray-400">info@hargeisagrocery.com</span>
              </div>
            </div>

            {/* Payment methods */}
            <div className="mt-6">
              <h5 className="font-semibold mb-2">Payment Methods</h5>
              <div className="flex space-x-2">
                <div className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold">ZAAD</div>
                <div className="bg-orange-600 text-white px-3 py-1 rounded text-sm font-semibold">EVC</div>
                <div className="bg-gray-600 text-white px-3 py-1 rounded text-sm font-semibold">Edahab</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2024 Hargeisa Grocery. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;