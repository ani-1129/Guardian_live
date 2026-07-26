'use client';

import React from 'react';
import { MapPin, Camera, Bell, Shield, Radio, Wifi, Fingerprint, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: MapPin,
    title: 'Live GPS Location',
    description: 'Automatic pinpoint location detection with interactive map adjustment for maximum accuracy.',
    color: 'text-blue-400',
    glowClass: 'group-hover:glow-blue',
    bgAccent: 'bg-blue-500/10',
  },
  {
    icon: Camera,
    title: 'Watermarked Evidence',
    description: 'Auto-stamped photos with GPS coordinates and timestamps for verified, tamper-proof evidence.',
    color: 'text-emerald-400',
    glowClass: 'group-hover:glow-green',
    bgAccent: 'bg-emerald-500/10',
  },
  {
    icon: Bell,
    title: 'Real-Time Alerts',
    description: 'Instant notification pipeline to dispatch centers with priority-based routing and SLA tracking.',
    color: 'text-amber-400',
    glowClass: 'group-hover:glow-amber',
    bgAccent: 'bg-amber-500/10',
  },
  {
    icon: Shield,
    title: 'Anonymous Reporting',
    description: 'Submit reports without creating an account. Optional contact info for follow-up only.',
    color: 'text-purple-400',
    glowClass: '',
    bgAccent: 'bg-purple-500/10',
  },
  {
    icon: Radio,
    title: 'Multi-Agency Dispatch',
    description: 'Reports routed to the nearest available unit across fire, police, and EMS agencies.',
    color: 'text-red-400',
    glowClass: 'group-hover:glow-red',
    bgAccent: 'bg-red-500/10',
  },
  {
    icon: Smartphone,
    title: 'Mobile-First Design',
    description: 'Optimized for one-handed use in stressful situations. Large touch targets, minimal typing.',
    color: 'text-cyan-400',
    glowClass: '',
    bgAccent: 'bg-cyan-500/10',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export const FeaturesGrid: React.FC = () => {
  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-zinc-950 via-zinc-900/50 to-zinc-950 relative">
      {/* Background accent */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <span className="inline-block text-xs font-bold tracking-widest text-blue-400 uppercase bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">
            Enterprise-Grade Features
          </span>
          <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-white tracking-tight">
            Built for Stressful Emergency Situations
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Every second counts. Designed for maximum accessibility, speed, and reliability.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              variants={item}
              className={`group glass-card-solid rounded-2xl p-6 hover:-translate-y-1 transition-all duration-300 cursor-default ${feature.glowClass}`}
            >
              <div className={`w-12 h-12 rounded-xl ${feature.bgAccent} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-base font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
