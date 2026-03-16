import React, { useState, useEffect } from 'react';
import { Package, ShoppingCart, Info, Tag, Building2, Cpu, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

interface Machine {
  id: number;
  name: string;
  model_number: string;
  description: string;
  specifications: string;
  price: number;
  stock_quantity: number;
  sold_to?: string;
}

export const Products = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      const res = await fetch('/api/machines');
      const data = await res.json();
      setMachines(data);
    } catch (error) {
      console.error('Error fetching machines:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-black text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Industrial <span className="text-emerald-500">Machinery</span></h1>
            <p className="text-xl text-gray-400 leading-relaxed">
              Precision-engineered solutions for the world's most demanding manufacturing environments.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {machines.map((machine, idx) => {
                const specs = JSON.parse(machine.specifications || '{}');
                return (
                  <motion.div 
                    key={machine.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all overflow-hidden group"
                  >
                    <div className="p-8 md:p-10">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full mb-3 inline-block">
                            Model: {machine.model_number}
                          </span>
                          <h3 className="text-3xl font-bold group-hover:text-emerald-600 transition-colors">{machine.name}</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-black">${machine.price.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">Unit Price (Excl. Tax)</p>
                        </div>
                      </div>

                      <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                        {machine.description}
                      </p>

                      {/* Technical Details */}
                      <div className="mb-8">
                        <h4 className="flex items-center text-sm font-bold text-gray-900 mb-4">
                          <Cpu className="w-4 h-4 mr-2 text-emerald-600" />
                          Technical Specifications
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(specs).map(([key, value]: [string, any]) => (
                            <div key={key} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{key.replace('_', ' ')}</p>
                              <p className="text-sm font-semibold text-gray-900">{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Sold To / History */}
                      <div className="flex items-center justify-between pt-8 border-t border-gray-100">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
                            <Building2 className="text-gray-400 w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Major Client</p>
                            <p className="text-sm font-bold text-gray-900">{machine.sold_to || 'Available for Order'}</p>
                          </div>
                        </div>
                        <Link 
                          to="/contact" 
                          className="px-6 py-3 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all flex items-center"
                        >
                          Inquire <ArrowRight className="ml-2 w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Industry Trust Section */}
      <section className="py-24 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-[0.3em] mb-12">Trusted by Global Leaders</h2>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-40 grayscale">
            <span className="text-2xl font-black tracking-tighter">TESLA</span>
            <span className="text-2xl font-black tracking-tighter">BOEING</span>
            <span className="text-2xl font-black tracking-tighter">CATERPILLAR</span>
            <span className="text-2xl font-black tracking-tighter">SIEMENS</span>
            <span className="text-2xl font-black tracking-tighter">FORD</span>
          </div>
        </div>
      </section>
    </div>
  );
};
