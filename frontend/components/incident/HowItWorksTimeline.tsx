'use client';

import React from 'react';
import { FileText, MapPin, Camera, Send, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
  {
    step: 1,
    icon: FileText,
    title: 'Describe the Incident',
    description: 'Select category, priority level, and provide a detailed description of the emergency situation.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    glowColor: 'shadow-blue-500/10',
  },
  {
    step: 2,
    icon: MapPin,
    title: 'Confirm Your Location',
    description: 'Auto-detected GPS coordinates displayed on a live map. Drag the pin to adjust if needed.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    glowColor: 'shadow-emerald-500/10',
  },
  {
    step: 3,
    icon: Camera,
    title: 'Upload Evidence',
    description: 'Attach photos from your camera or gallery. Each image is auto-watermarked with GPS and timestamp.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    glowColor: 'shadow-amber-500/10',
  },
  {
    step: 4,
    icon: Send,
    title: 'Submit Report',
    description: 'Review all details and submit. Dispatchers receive the report instantly with full context.',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    glowColor: 'shadow-red-500/10',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5 } },
};

export const HowItWorksTimeline: React.FC = () => {
  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-zinc-950 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <span className="inline-block text-xs font-bold tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
            Simple 4-Step Process
          </span>
          <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-white tracking-tight">
            How It Works
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Designed to take less than 30 seconds under critical conditions.
          </p>
        </motion.div>

        {/* Timeline */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="relative"
        >
          {/* Vertical Connector Line */}
          <div className="absolute left-[23px] md:left-[27px] top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/40 via-emerald-500/30 via-amber-500/20 to-red-500/30 hidden sm:block" />

          <div className="space-y-6">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                variants={item}
                className="flex items-start gap-5 group"
              >
                {/* Step Number Badge */}
                <div className="relative shrink-0">
                  <div className={`w-12 h-12 rounded-2xl ${step.bg} border ${step.borderColor} flex items-center justify-center transition-all group-hover:scale-110 shadow-lg ${step.glowColor}`}>
                    <step.icon className={`w-5 h-5 ${step.color}`} />
                  </div>
                  {/* Ping on first step */}
                  {i === 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
                    </span>
                  )}
                </div>

                {/* Content Card */}
                <div className={`flex-1 glass-card-solid rounded-2xl p-5 group-hover:-translate-y-0.5 transition-all duration-300`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-[10px] font-bold tracking-widest ${step.color} uppercase`}>
                      Step {step.step}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-1.5">{step.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
