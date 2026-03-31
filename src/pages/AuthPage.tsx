import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import { Settings, Mail, Lock, User as UserIcon, ArrowRight, Eye, EyeOff, Shield, Briefcase, Phone, MapPin, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../AuthContext';

export const AuthPage = ({ mode }: { mode: 'login' | 'signup' }) => {
  const { syncUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState<'admin' | 'employee'>('employee');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });

        // Use syncUser from context to update global state with additional profile data
        await syncUser(role, {
          phone: `${countryCode}${phone}`,
          address: address
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        // Re-sync to get the correct role state
        await syncUser();
      }

      // The ProtectedRoute will handle the actual redirection based on updated context state
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-10 border border-gray-100"
      >
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Settings className="text-white w-6 h-6" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">
            {mode === 'login' ? 'Welcome Back' : 'Join AES'}
          </h2>
          <p className="text-gray-500 text-sm">
            {mode === 'login' ? 'Access your industrial management portal' : 'Create your account to manage machinery and orders'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                    placeholder="Your Name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Phone Number</label>
                <div className="flex gap-2">
                  <div className="relative flex-shrink-0 w-24">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-full pl-4 pr-8 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all appearance-none"
                    >
                      <option value="+1">+1 (US)</option>
                      <option value="+44">+44 (UK)</option>
                      <option value="+91">+91 (IN)</option>
                      <option value="+86">+86 (CN)</option>
                      <option value="+81">+81 (JP)</option>
                      <option value="+61">+61 (AU)</option>
                      <option value="+33">+33 (FR)</option>
                      <option value="+49">+49 (DE)</option>
                      <option value="+39">+39 (IT)</option>
                      <option value="+34">+34 (ES)</option>
                      <option value="+55">+55 (BR)</option>
                      <option value="+27">+27 (ZA)</option>
                      <option value="+966">+966 (SA)</option>
                      <option value="+971">+971 (AE)</option>
                      <option value="+65">+65 (SG)</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                  <div className="relative flex-1">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                      placeholder="Phone number"
                      maxLength={15}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
                  <textarea
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all resize-none"
                    placeholder="Enter your full address"
                    rows={2}
                  />
                </div>
              </div>
            </>
          )}

          {mode === 'login' && (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Select Role</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`flex items-center justify-center p-3 rounded-xl border transition-all ${role === 'admin'
                    ? 'bg-black text-white border-black'
                    : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-gray-300'
                    }`}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  <span className="text-sm font-bold">Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('employee')}
                  className={`flex items-center justify-center p-3 rounded-xl border transition-all ${role === 'employee'
                    ? 'bg-black text-white border-black'
                    : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-gray-300'
                    }`}
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  <span className="text-sm font-bold">Employee</span>
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Select Role</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('employee')}
                  className={`flex items-center justify-center p-3 rounded-xl border transition-all ${role === 'employee'
                      ? 'bg-black text-white border-black'
                      : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-gray-300'
                    }`}
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  <span className="text-sm font-bold">Employee</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`flex items-center justify-center p-3 rounded-xl border transition-all ${role === 'admin'
                      ? 'bg-black text-white border-black'
                      : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-gray-300'
                    }`}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  <span className="text-sm font-bold">Admin</span>
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center disabled:opacity-50"
          >
            {loading ? 'Processing...' : (
              <>
                {mode === 'login' ? 'Sign In' : 'Create Account'}
                <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
            <Link
              to={mode === 'login' ? '/signup' : '/login'}
              className="text-black font-bold hover:underline"
            >
              {mode === 'login' ? 'Sign Up' : 'Log In'}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
