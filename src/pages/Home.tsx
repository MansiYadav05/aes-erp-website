import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Globe, Award, Users } from 'lucide-react';
import { motion } from 'motion/react';

export const Home = () => {
  const [content, setContent] = useState<any>(null);

  useEffect(() => {
    fetch('/api/content/home')
      .then(res => res.json())
      .then(data => setContent(data))
      .catch(err => console.error('Error fetching home content:', err));
  }, []);

  const defaultContent = {
    hero: {
      tag: "Pioneering Industrial Excellence",
      title: "Precision Engineering Future-Ready Machinery",
      description: "We design and manufacture high-performance industrial machinery for global leaders in automobile, construction, and heavy engineering.",
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=2070"
    }
  };

  const hero = content?.hero || defaultContent.hero;

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={hero.image}
            alt="Industrial Machinery"
            className="w-full h-full object-cover brightness-50"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-semibold tracking-widest uppercase bg-emerald-600 rounded-full">
              {hero.tag}
            </span>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
              {hero.title.split(' ').slice(0, 2).join(' ')} <br />
              <span className="text-emerald-400">{hero.title.split(' ').slice(2).join(' ')}</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-200 max-w-2xl mb-10 leading-relaxed">
              {hero.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/products" className="px-8 py-4 bg-white text-black font-bold rounded-lg flex items-center justify-center hover:bg-gray-100 transition-all">
                Explore Machines <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link to="/contact" className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-all">
                Request a Quote
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
                <Shield className="text-emerald-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-4">Certified Quality</h3>
              <p className="text-gray-600 leading-relaxed">ISO 9001:2015 certified processes ensuring every component meets global safety and performance standards.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Zap className="text-blue-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-4">Advanced Tech</h3>
              <p className="text-gray-600 leading-relaxed">Integrating IoT and AI-driven diagnostics into our machinery for predictive maintenance and peak efficiency.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <Globe className="text-purple-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-4">Global Support</h3>
              <p className="text-gray-600 leading-relaxed">24/7 technical support and spare parts supply across 40+ states through our extensive partner network.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Machines */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-4">Featured Machinery</h2>
              <p className="text-gray-600">Our best-selling industrial solutions for heavy-duty operations.</p>
            </div>
            <Link to="/products" className="text-emerald-600 font-semibold flex items-center hover:underline">
              View All <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: "Hydraulic Press X1", category: "Heavy Engineering", img: "https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?auto=format&fit=crop&q=80&w=800" },
              { name: "CNC Milling Center", category: "Precision Tools", img: "https://www.zintilon.com/wp-content/uploads/2024/04/5-aixs-cnc-machine-880x750.jpg" },
              { name: "Industrial Robot Arm", category: "Automation", img: "https://images.pexels.com/photos/34207359/pexels-photo-34207359/free-photo-of-industrial-robot-arm-in-a-manufacturing-facility.jpeg" }
            ].map((machine, idx) => (
              <div key={idx} className="group cursor-pointer">
                <div className="relative overflow-hidden rounded-2xl mb-4">
                  <img
                    src={machine.img}
                    alt={machine.name}
                    className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur text-xs font-bold rounded-full">{machine.category}</span>
                  </div>
                </div>
                <h4 className="text-lg font-bold group-hover:text-emerald-600 transition-colors">{machine.name}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
