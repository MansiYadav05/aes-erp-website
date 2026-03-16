import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Target, Eye, History, Award, Users, ShieldCheck, Rocket, ChevronRight } from 'lucide-react';

export const About = () => {
  const [content, setContent] = useState<any>(null);

  useEffect(() => {
    fetch('/api/content/about')
      .then(res => res.json())
      .then(data => setContent(data))
      .catch(err => console.error('Error fetching about content:', err));
  }, []);

  const defaultContent = {
    hero: {
      title: "Engineering the Industrial Future",
      description: "Since 2018, Authensia Equipment Systems has been at the forefront of industrial innovation, providing the machinery and software that powers global manufacturing.",
      image: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=2070"
    },
    mission: "Design & deliver robust quality product within agreed time frame adhering to accurate process & mechanical design specifications, maintaining optimum energy utilization and manufacturing within cost estimates.",
    vision: "Establish ourselves as one of the top engineering company in India providing best turnkey solutions & plants and process equipment for various industries. We are confident to achieve this through continuous upgradation our knowledge & technology, using best manufacturing practices, quality control and quality emphasis and training activities for all employees.",
    goal: "Achieving zero-downtime manufacturing for our clients through predictive maintenance and robust engineering.",
    leadership: [
      {
        name: "Dr. Marcus Thorne",
        role: "Chief Executive Officer",
        bio: "With over 30 years in heavy engineering, Dr. Thorne has led INDUS from a local workshop to a global powerhouse.",
        image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400"
      },
      {
        name: "Sarah Chen",
        role: "Chief Technology Officer",
        bio: "A pioneer in industrial IoT, Sarah oversees our digital transformation and AI-driven machinery initiatives.",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400"
      },
      {
        name: "James Rodriguez",
        role: "Chief Operating Officer",
        bio: "James ensures our global supply chain and manufacturing facilities operate at peak efficiency across 3 continents.",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400"
      }
    ],
    milestones: [
      { year: "2018", event: "Founded as a specialized precision tool workshop in Manufacturing City." },
      { year: "2020", event: "Launched our first line of heavy-duty hydraulic presses for the automotive sector." },
      { year: "2022", event: "Expanded operations to Gujrat and Hadapsar, establishing service centers." },
      { year: "2023", event: "Achieved ISO 9001:2015 certification for all manufacturing facilities." },
      { year: "2024", event: "Introduced CNC systems, revolutionizing predictive maintenance." }
    ]
  };

  const c = content || defaultContent;

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-black text-white py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
          <img 
            src={c.hero.image} 
            alt="Factory" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-2xl"
          >
            <div className="text-2xl font-black tracking-tighter mb-8">
              AUTHENSIA<span className="text-emerald-500"> EQUIPMENT SYSTEMS</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              {c.hero.title.split(' ').slice(0, 2).join(' ')} <br />
              <span className="text-emerald-500">{c.hero.title.split(' ').slice(2).join(' ')}</span>
            </h1>
            <p className="text-xl text-gray-400 leading-relaxed">
              {c.hero.description}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-10 bg-gray-50 rounded-[2.5rem] border border-gray-100"
            >
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-8">
                <Rocket className="text-emerald-600 w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
              <p className="text-gray-600 leading-relaxed">
                {c.mission}
              </p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-10 bg-black text-white rounded-[2.5rem]"
            >
              <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center mb-8">
                <Eye className="text-white w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
              <p className="text-gray-400 leading-relaxed">
                {c.vision}
              </p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="p-10 bg-gray-50 rounded-[2.5rem] border border-gray-100"
            >
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-8">
                <Target className="text-blue-600 w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Our Goal</h3>
              <p className="text-gray-600 leading-relaxed">
                {c.goal}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* History Timeline */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-16 items-start">
            <div className="md:w-1/3 sticky top-24">
              <div className="flex items-center text-emerald-600 font-bold text-sm uppercase tracking-widest mb-4">
                <History className="w-4 h-4 mr-2" />
                Our Heritage
              </div>
              <h2 className="text-4xl font-bold mb-6">A Legacy of <br />Innovation</h2>
              <p className="text-gray-600 leading-relaxed">
                From a small precision workshop to a global leader, our journey has been defined by a relentless pursuit of engineering perfection.
              </p>
            </div>
            <div className="md:w-2/3 space-y-12">
              {c.milestones.map((m: any, idx: number) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="flex gap-8 group"
                >
                  <div className="text-3xl font-black text-gray-200 group-hover:text-emerald-500 transition-colors shrink-0 pt-1">
                    {m.year}
                  </div>
                  <div className="pb-12 border-b border-gray-100">
                    <p className="text-xl text-gray-700 leading-relaxed">
                      {m.event}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Certifications & Achievements */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Excellence Recognized</h2>
            <p className="text-gray-500">Our commitment to quality is backed by international certifications.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { title: "ISO 9001:2015", subtitle: "Quality Management System", icon: ShieldCheck },
              { title: "CE Certified", subtitle: "European Safety Standards", icon: Award },
              { title: "ASME Certified", subtitle: "Pressure Vessel Excellence", icon: Target },
              { title: "Top Innovator 2023", subtitle: "Industrial Tech Awards", icon: Rocket }
            ].map((a, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-3xl border border-gray-100 text-center hover:shadow-xl transition-all"
              >
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <a.icon className="text-emerald-600 w-6 h-6" />
                </div>
                <h4 className="font-bold text-lg mb-1">{a.title}</h4>
                <p className="text-xs text-gray-400 uppercase tracking-widest">{a.subtitle}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-16">
            <div>
              <div className="flex items-center text-emerald-600 font-bold text-sm uppercase tracking-widest mb-4">
                <Users className="w-4 h-4 mr-2" />
                Leadership
              </div>
              <h2 className="text-4xl font-bold">The Minds Behind <br />Authensia Equipment Systems</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {c.leadership.map((person: any, idx: number) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="relative h-[400px] overflow-hidden rounded-[2.5rem] mb-8">
                  <img 
                    src={person.image} 
                    alt={person.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                    <p className="text-white text-sm leading-relaxed">
                      {person.bio}
                    </p>
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-1">{person.name}</h3>
                <p className="text-emerald-600 font-bold text-sm uppercase tracking-widest">{person.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">Join the Industrial Revolution</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-12 text-lg leading-relaxed">
            Whether you're looking for world-class machinery or a career in engineering, we'd love to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <button className="px-10 py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center group">
              Work With Us <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-10 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all">
              Our Locations
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
