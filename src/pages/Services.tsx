import React, { useState, useEffect } from 'react';
import { Settings, Wrench, ShieldCheck, Truck, Cpu, Users, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

const iconMap: { [key: string]: any } = {
  Settings, Wrench, ShieldCheck, Truck, Cpu, Users
};

export const Services = () => {
  const [content, setContent] = useState<any>(null);

  useEffect(() => {
    fetch('/api/content/services')
      .then(res => res.json())
      .then(data => setContent(data))
      .catch(err => console.error('Error fetching services content:', err));
  }, []);

  const defaultContent = {
    hero: {
      title: "Comprehensive Industrial Services",
      description: "Beyond manufacturing, we provide end-to-end support to ensure your operations run smoothly, efficiently, and without interruption."
    },
    services: [
      {
        title: "Machine Installation",
        description: "Expert on-site installation and commissioning of industrial machinery by our certified engineers to ensure peak performance from day one.",
        icon: "Settings",
        color: "bg-blue-50 text-blue-600",
        image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=800"
      },
      {
        title: "Maintenance & Repair",
        description: "Comprehensive preventive maintenance programs and rapid-response repair services to minimize downtime and extend equipment lifespan.",
        icon: "Wrench",
        color: "bg-emerald-50 text-emerald-600",
        image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=800"
      },
      {
        title: "Spare Parts Supply",
        description: "Global distribution network for genuine OEM spare parts, ensuring high compatibility and maintaining the integrity of your machinery.",
        icon: "Truck",
        color: "bg-orange-50 text-orange-600",
        image: "https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&q=80&w=800"
      },
      {
        title: "Custom Engineering",
        description: "Tailored engineering solutions to adapt our machinery to your specific production requirements and unique facility constraints.",
        icon: "Cpu",
        color: "bg-purple-50 text-purple-600",
        image: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&q=80&w=800"
      },
      {
        title: "Technical Training",
        description: "In-depth training programs for your operators and maintenance staff to maximize safety and operational efficiency.",
        icon: "Users",
        color: "bg-indigo-50 text-indigo-600",
        image: "https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?auto=format&fit=crop&q=80&w=800"
      },
      {
        title: "Quality Assurance",
        description: "Rigorous testing and certification services to ensure your production output consistently meets international quality standards.",
        icon: "ShieldCheck",
        color: "bg-red-50 text-red-600",
        image: "https://iso9001consultants.com.au/wp-content/uploads/2023/02/How-to-do-quality-assurance.jpg"
      }
    ]
  };

  const c = content || defaultContent;

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-black text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {c.hero.title.split(' ').slice(0, 1).join(' ')} <span className="text-emerald-500">{c.hero.title.split(' ').slice(1).join(' ')}</span>
            </h1>
            <p className="text-xl text-gray-400 leading-relaxed">
              {c.hero.description}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {c.services.map((service: any, idx: number) => {
              const Icon = iconMap[service.icon] || Settings;
              return (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group"
                >
                  <div className="relative h-48 overflow-hidden rounded-2xl mb-6">
                    <img 
                      src={service.image} 
                      alt={service.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 left-4">
                      <div className={`w-10 h-10 ${service.color} rounded-xl flex items-center justify-center shadow-lg`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-emerald-600 transition-colors">{service.title}</h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    {service.description}
                  </p>
                  <Link to="/contact" className="inline-flex items-center font-bold text-sm text-black hover:text-emerald-600 transition-colors">
                    Learn More <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-black rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <img 
                src="https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=2070" 
                alt="Background Pattern" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-8">
                Ready to Optimize Your Production?
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto mb-12 text-lg">
                Our team of expert engineers is ready to help you implement the best industrial solutions for your facility.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/contact" className="px-10 py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all">
                  Schedule a Consultation
                </Link>
                <Link to="/products" className="px-10 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-all">
                  View Machinery
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
