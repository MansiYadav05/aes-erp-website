import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, Users, Package, ShoppingCart, BarChart3, Menu, X, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { auth } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar = () => {
  const { user, isAdmin, isEmployee } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
                <Settings className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight">AUTHENSIA <span className="text-emerald-600"> EQUIPMENT SYSTEMS</span></span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/products" className="text-sm font-medium text-gray-600 hover:text-black">Machinery</Link>
            <Link to="/services" className="text-sm font-medium text-gray-600 hover:text-black">Services</Link>
            <Link to="/about" className="text-sm font-medium text-gray-600 hover:text-black">About</Link>
            <Link to="/contact" className="text-sm font-medium text-gray-600 hover:text-black">Contact</Link>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex flex-col items-end mr-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Logged in as</span>
                  <span className={`text-xs font-bold leading-none mt-1 ${isAdmin ? 'text-emerald-600' : 'text-blue-600'}`}>
                    {isAdmin ? 'Administrator' : 'Employee'}
                  </span>
                </div>
                <Link 
                  to={isAdmin ? "/admin" : "/dashboard"} 
                  className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                  {isAdmin ? "Admin ERP" : "Employee Portal"}
                </Link>
                <button 
                  onClick={() => auth.signOut()}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-black">Login</Link>
                <Link to="/signup" className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">Sign Up</Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              <Link to="/products" className="block px-3 py-2 text-base font-medium text-gray-600">Machinery</Link>
              <Link to="/services" className="block px-3 py-2 text-base font-medium text-gray-600">Services</Link>
              <Link to="/about" className="block px-3 py-2 text-base font-medium text-gray-600">About</Link>
              <Link to="/contact" className="block px-3 py-2 text-base font-medium text-gray-600">Contact</Link>
              <div className="pt-4 border-t border-gray-100">
                {user ? (
                  <Link to={isAdmin ? "/admin" : "/dashboard"} className="block px-3 py-2 text-base font-medium text-emerald-600">Dashboard</Link>
                ) : (
                  <>
                    <Link to="/login" className="block px-3 py-2 text-base font-medium text-gray-600">Login</Link>
                    <Link to="/signup" className="block px-3 py-2 text-base font-medium text-emerald-600">Sign Up</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
