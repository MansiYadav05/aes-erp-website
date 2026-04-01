import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Facebook, Twitter, Linkedin, Instagram, Mail, Phone, MapPin,
  ArrowUpRight, CheckCircle, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Footer = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === 'loading') return;

    setStatus('loading');
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        setStatus('success');
        setEmail('');
        setToast({ message: 'Successfully subscribed to newsletter!', type: 'success' });
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        let errorMessage = 'Failed to subscribe.';
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        }
        setToast({ message: errorMessage, type: 'error' });
        setStatus('idle');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setToast({ message: 'Failed to subscribe. Please try again.', type: 'error' });
      setStatus('idle');
    }
  };

  return (
    <footer className="bg-black text-white pt-20 pb-10 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Company Info */}
          <div className="space-y-6">
            <Link to="/" className="text-2xl font-black tracking-tighter flex items-center">
              AUTHENSIA EQUIPMENT SYSTEMS
            </Link>
            <p className="text-gray-400 leading-relaxed">
              Pioneering industrial excellence through precision engineering and advanced manufacturing solutions since 2018.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center hover:bg-emerald-600 transition-colors group">
                <Facebook className="w-5 h-5 text-gray-400 group-hover:text-white" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center hover:bg-emerald-600 transition-colors group">
                <Twitter className="w-5 h-5 text-gray-400 group-hover:text-white" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center hover:bg-emerald-600 transition-colors group">
                <Linkedin className="w-5 h-5 text-gray-400 group-hover:text-white" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center hover:bg-emerald-600 transition-colors group">
                <Instagram className="w-5 h-5 text-gray-400 group-hover:text-white" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-6">Quick Links</h4>
            <ul className="space-y-4">
              <li>
                <Link to="/products" className="text-gray-400 hover:text-emerald-500 transition-colors flex items-center group">
                  Machinery <ArrowUpRight className="ml-1 w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" />
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-gray-400 hover:text-emerald-500 transition-colors flex items-center group">
                  Services <ArrowUpRight className="ml-1 w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" />
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-emerald-500 transition-colors flex items-center group">
                  About Us <ArrowUpRight className="ml-1 w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" />
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-emerald-500 transition-colors flex items-center group">
                  Contact <ArrowUpRight className="ml-1 w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-lg font-bold mb-6">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3 text-gray-400">
                <MapPin className="w-5 h-5 text-emerald-500 shrink-0 mt-1" />
                <span>Dehu Alandi Road,Talawade Pune.</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-400">
                <Phone className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>+91 721 913 9524</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-400">
                <Mail className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>sales.authensia@gmail.com</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-lg font-bold mb-6">Newsletter</h4>
            <p className="text-gray-400 mb-4 text-sm">Subscribe to get the latest industrial insights and product updates.</p>
            <form onSubmit={handleSubscribe} className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="absolute right-2 top-2 bg-emerald-600 hover:bg-emerald-700 p-1.5 rounded-md transition-colors disabled:opacity-50"
              >
                {status === 'success' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <ArrowUpRight className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Authensia Equipment Systems. All rights reserved.
          </p>
          <div className="flex space-x-6 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={`fixed bottom-10 left-1/2 z-[100] px-8 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 border ${toast.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-red-600 border-red-500 text-white'
              }`}
          >
            {toast.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <X className="w-5 h-5 shrink-0" />}
            <span className="font-bold text-sm whitespace-nowrap">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  );
};
