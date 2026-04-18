'use client';

import { useState } from 'react';
import {
  Play,
  TrendingUp,
  DollarSign,
  Globe,
  Laptop,
  Users,
  Award,
  BarChart3,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Star,
  MapPin,
  Zap,
  Shield,
  Headphones,
  GraduationCap,
  Building2,
  ArrowRight,
  Phone,
  Mail,
  Send,
} from 'lucide-react';

// ============================================================
// HERO SECTION
// ============================================================
function HeroSection() {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F1923] via-[#1A2F3F] to-[#0F1923]" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300B4C8' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        {/* Gradient orbs */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#5CE0D2]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#F5A623]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-[1280px] mx-auto px-4 md:px-6 py-20 md:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Content */}
          <div>
            <div className="inline-flex items-center gap-2 bg-[#5CE0D2]/20 text-[#5CE0D2] text-sm font-bold px-4 py-2 rounded-full mb-6">
              <Zap size={14} />
              La inmobiliaria digital #1 del Caribe Mexicano
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Tu carrera inmobiliaria{' '}
              <span className="text-[#5CE0D2]">sin límites</span>
            </h1>

            <p className="text-lg md:text-xl text-white/70 leading-relaxed mb-8 max-w-xl">
              Únete a Propyte y accede a la tecnología, capacitación y red de contactos
              que necesitas para dominar el mercado más dinámico de México.
              Comisiones competitivas y sin cuotas de escritorio.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <a
                href="#aplicar"
                className="inline-flex items-center justify-center gap-2 h-14 px-8 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-white font-bold text-lg rounded-xl transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-[#5CE0D2]/20"
              >
                Quiero unirme
                <ArrowRight size={20} />
              </a>
              <button
                onClick={() => setShowVideo(true)}
                className="inline-flex items-center justify-center gap-2 h-14 px-8 border-2 border-white/20 hover:border-white/40 text-white font-bold text-lg rounded-xl transition-all hover:bg-white/5"
              >
                <Play size={20} className="fill-white" />
                Ver video
              </button>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-6">
              {[
                { value: '500+', label: 'Agentes activos' },
                { value: '$2B+', label: 'MXN en ventas' },
                { value: '95%', label: 'Satisfacción' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl md:text-3xl font-bold text-[#5CE0D2]">{stat.value}</div>
                  <div className="text-sm text-white/50">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Video/Image card */}
          <div className="relative">
            <div className="relative bg-gradient-to-br from-[#1A2F3F] to-[#0F1923] rounded-2xl overflow-hidden border border-white/10 shadow-2xl aspect-video">
              {showVideo ? (
                <iframe
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0"
                  className="absolute inset-0 w-full h-full"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Placeholder visual */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F1923] via-transparent to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 hover:bg-white/20 transition-colors cursor-pointer group"
                        onClick={() => setShowVideo(true)}
                      >
                        <Play size={36} className="text-white fill-white ml-1 group-hover:scale-110 transition-transform" />
                      </div>
                      <p className="text-white/60 text-sm mt-4 font-medium">Conoce Propyte en 2 minutos</p>
                    </div>
                  </div>
                  {/* Decorative grid */}
                  <div className="absolute inset-4 border border-white/5 rounded-xl" />
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                    <div className="w-3 h-3 rounded-full bg-green-400/60" />
                  </div>
                </div>
              )}
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-4 -left-4 bg-[#F5A623] text-[#2C2C2C] font-bold text-sm px-4 py-2 rounded-xl shadow-lg">
              ⭐ Top 1% en Riviera Maya
            </div>
          </div>
        </div>
      </div>

      {/* Video modal overlay */}
      {showVideo && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 lg:hidden"
          onClick={() => setShowVideo(false)}
        >
          <div className="w-full max-w-3xl aspect-video" onClick={e => e.stopPropagation()}>
            <iframe
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0"
              className="w-full h-full rounded-xl"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </section>
  );
}

// ============================================================
// LOGOS / SOCIAL PROOF
// ============================================================
function SocialProofBar() {
  const logos = [
    'Riviera Maya', 'Playa del Carmen', 'Tulum', 'Cancún', 'Mérida', 'CDMX', 'Vallarta', 'Los Cabos',
  ];
  return (
    <section className="bg-white border-y border-gray-100 py-8">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <p className="text-center text-xs text-gray-400 uppercase tracking-wider font-semibold mb-6">
          Presencia en los mercados más importantes de México
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {logos.map((city) => (
            <div key={city} className="flex items-center gap-2 text-gray-400 hover:text-[#1A2F3F] transition-colors">
              <MapPin size={14} />
              <span className="text-sm font-semibold">{city}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// WHY PROPYTE
// ============================================================
function WhyPropyte() {
  const benefits = [
    {
      icon: DollarSign,
      title: 'Comisiones del 80% al 100%',
      description: 'Gana lo que mereces. Nuestro modelo progresivo te permite quedarte con hasta el 100% de tu comisión una vez alcanzas tu cap anual.',
      highlight: '80-100%',
    },
    {
      icon: Laptop,
      title: 'Plataforma 100% digital',
      description: 'CRM inteligente, firma electrónica, marketing automatizado, reportes en tiempo real. Todo desde tu celular o laptop.',
      highlight: 'Tech-first',
    },
    {
      icon: GraduationCap,
      title: 'Academia Propyte',
      description: 'Más de 200 horas de capacitación en ventas, marketing digital, inversión inmobiliaria, y desarrollo personal.',
      highlight: '200+ hrs',
    },
    {
      icon: Users,
      title: 'Red de revenue sharing',
      description: 'Invita agentes a Propyte y gana un porcentaje de las transacciones de tu red, hasta 5 niveles de profundidad.',
      highlight: '5 niveles',
    },
    {
      icon: Globe,
      title: 'Mercado internacional',
      description: 'Conecta con compradores de EE.UU., Canadá y Europa que buscan invertir en el Caribe Mexicano. Leads calificados incluidos.',
      highlight: 'Global',
    },
    {
      icon: Shield,
      title: 'Respaldo y marca',
      description: 'Operamos bajo una marca reconocida con respaldo legal, seguros, y un equipo de soporte dedicado para cada agente.',
      highlight: 'Confianza',
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-[#F4F6F8]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="text-center mb-14">
          <span className="text-[#5CE0D2] font-bold text-sm uppercase tracking-wider">¿Por qué Propyte?</span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#2C2C2C] mt-3">
            Todo lo que necesitas para <span className="text-[#1A2F3F]">triunfar</span>
          </h2>
          <p className="text-gray-500 mt-4 max-w-2xl mx-auto">
            No somos una inmobiliaria tradicional. Somos una plataforma tecnológica que empodera
            a agentes independientes con las mejores herramientas del mercado.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-[#5CE0D2]/30 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-[#5CE0D2]/10 rounded-xl flex items-center justify-center group-hover:bg-[#5CE0D2]/20 transition-colors">
                  <b.icon size={24} className="text-[#5CE0D2]" />
                </div>
                <span className="text-xs font-bold text-[#5CE0D2] bg-[#5CE0D2]/10 px-2.5 py-1 rounded-full">
                  {b.highlight}
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#2C2C2C] mb-2">{b.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{b.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// COMMISSION MODEL
// ============================================================
function CommissionModel() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Visual */}
          <div className="relative">
            <div className="bg-gradient-to-br from-[#0F1923] to-[#1A2F3F] rounded-2xl p-8 md:p-10">
              <h3 className="text-white text-xl font-bold mb-8">Tu plan de comisiones</h3>

              {/* Commission tiers */}
              <div className="space-y-4">
                {[
                  { range: '$0 - $500K MXN', pct: '80%', you: '$400K', propyte: '$100K', bar: 80 },
                  { range: '$500K - $1.5M MXN', pct: '85%', you: '$850K', propyte: '$150K', bar: 85 },
                  { range: 'Cap alcanzado', pct: '100%', you: 'Todo tuyo', propyte: '$0', bar: 100 },
                ].map((tier) => (
                  <div key={tier.range} className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white/60">{tier.range}</span>
                      <span className="text-lg font-bold text-[#5CE0D2]">{tier.pct}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#5CE0D2] to-[#00D4EA] rounded-full transition-all"
                        style={{ width: `${tier.bar}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs">
                      <span className="text-[#5CE0D2]">Tú: {tier.you}</span>
                      <span className="text-white/40">Propyte: {tier.propyte}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cap info */}
              <div className="mt-6 bg-[#F5A623]/10 border border-[#F5A623]/20 rounded-xl p-4 flex items-start gap-3">
                <Award size={20} className="text-[#F5A623] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-white">Cap anual: $180,000 MXN</p>
                  <p className="text-xs text-white/50 mt-1">
                    Una vez alcanzas el cap, te quedas con el 100% de todas tus comisiones por el resto del año.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Content */}
          <div>
            <span className="text-[#5CE0D2] font-bold text-sm uppercase tracking-wider">Modelo de comisiones</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#2C2C2C] mt-3 mb-6">
              Gana más,{' '}
              <span className="text-[#1A2F3F]">quédate con más</span>
            </h2>
            <p className="text-gray-500 leading-relaxed mb-8">
              Nuestro modelo progresivo está diseñado para que los agentes más productivos
              maximicen sus ingresos. Sin cuotas de escritorio, sin cargos ocultos.
            </p>

            <div className="space-y-4">
              {[
                'Split inicial del 80/20 — mejor que el promedio del mercado',
                'Cap anual bajo de $180K MXN — alcánzalo en pocas ventas',
                'Una vez alcanzado el cap: 100% de comisión para ti',
                'Sin cuota mensual de escritorio ni cargos fijos',
                'Revenue sharing: gana de las ventas de tu red',
                'Bonos trimestrales por volumen y productividad',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-[#5CE0D2] flex-shrink-0 mt-0.5" />
                  <span className="text-[#2C2C2C] font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// REVENUE SHARING
// ============================================================
function RevenueSharing() {
  const levels = [
    { level: 1, pct: '3.5%', agents: 'Tú invitas', color: '#5CE0D2' },
    { level: 2, pct: '1.5%', agents: 'Ellos invitan', color: '#4BCEC0' },
    { level: 3, pct: '1.0%', agents: 'Nivel 3', color: '#0D7A8A' },
    { level: 4, pct: '0.5%', agents: 'Nivel 4', color: '#1A2F3F' },
    { level: 5, pct: '0.25%', agents: 'Nivel 5', color: '#0F1923' },
  ];

  return (
    <section className="py-20 md:py-28 bg-[#F4F6F8]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Content */}
          <div>
            <span className="text-[#5CE0D2] font-bold text-sm uppercase tracking-wider">Revenue sharing</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#2C2C2C] mt-3 mb-6">
              Construye tu propia{' '}
              <span className="text-[#1A2F3F]">red de ingresos</span>
            </h2>
            <p className="text-gray-500 leading-relaxed mb-8">
              Cada agente que invites a Propyte genera ingresos para ti. Y cuando ellos inviten más agentes,
              sigues ganando hasta 5 niveles de profundidad. Es como tener tu propia inmobiliaria,
              pero sin las complicaciones.
            </p>

            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h4 className="font-bold text-[#2C2C2C] mb-4">Ejemplo de ingresos mensuales</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#F4F6F8] rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-[#5CE0D2]">10</div>
                  <div className="text-xs text-gray-500 mt-1">Agentes directos</div>
                </div>
                <div className="bg-[#F4F6F8] rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-[#F5A623]">$45K</div>
                  <div className="text-xs text-gray-500 mt-1">MXN/mes extra</div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                *Basado en producción promedio por agente de $5M MXN/año en ventas
              </p>
            </div>
          </div>

          {/* Right: Levels visual */}
          <div className="space-y-3">
            {levels.map((l) => (
              <div
                key={l.level}
                className="flex items-center gap-4 bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-all"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                  style={{ backgroundColor: l.color }}
                >
                  {l.level}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#2C2C2C]">Nivel {l.level}</span>
                    <span className="text-lg font-bold text-[#5CE0D2]">{l.pct}</span>
                  </div>
                  <span className="text-sm text-gray-400">{l.agents}</span>
                </div>
                <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden max-w-[120px]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${100 - (l.level - 1) * 18}%`,
                      backgroundColor: l.color,
                    }}
                  />
                </div>
              </div>
            ))}

            <div className="bg-[#5CE0D2]/5 border border-[#5CE0D2]/20 rounded-xl p-4 mt-4">
              <p className="text-sm text-[#2C2C2C] font-medium">
                💡 Los ingresos por revenue sharing son <strong>adicionales</strong> a tus comisiones
                por ventas propias. No hay límite en el tamaño de tu red.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// TECHNOLOGY PLATFORM
// ============================================================
function TechPlatform() {
  const tools = [
    { icon: BarChart3, name: 'CRM Inteligente', desc: 'Seguimiento de leads, pipeline de ventas, y automatización de seguimiento' },
    { icon: Globe, name: 'Portal de Propiedades', desc: 'Tu propia página de agente con listings sincronizados en tiempo real' },
    { icon: Laptop, name: 'App Móvil', desc: 'Gestiona tu negocio desde cualquier lugar con nuestra app nativa' },
    { icon: TrendingUp, name: 'Analytics Avanzados', desc: 'Dashboards con métricas de conversión, ROI de marketing, y proyecciones' },
    { icon: Zap, name: 'Marketing Automatizado', desc: 'Campañas de email, redes sociales, y publicidad digital configuradas para ti' },
    { icon: Headphones, name: 'Soporte 24/7', desc: 'Equipo de soporte dedicado via WhatsApp, chat, y videollamada' },
  ];

  return (
    <section className="py-20 md:py-28 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#F4F6F8] to-transparent" />

      <div className="relative max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="text-center mb-14">
          <span className="text-[#5CE0D2] font-bold text-sm uppercase tracking-wider">Tecnología</span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#2C2C2C] mt-3">
            Herramientas de <span className="text-[#1A2F3F]">clase mundial</span>
          </h2>
          <p className="text-gray-500 mt-4 max-w-2xl mx-auto">
            Cada agente Propyte recibe acceso a nuestra suite completa de herramientas
            diseñadas para el mercado inmobiliario mexicano.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tools.map((tool) => (
            <div key={tool.name} className="flex items-start gap-4 p-5 rounded-2xl hover:bg-[#F4F6F8] transition-colors">
              <div className="w-10 h-10 bg-[#1A2F3F] rounded-lg flex items-center justify-center flex-shrink-0">
                <tool.icon size={20} className="text-[#5CE0D2]" />
              </div>
              <div>
                <h4 className="font-bold text-[#2C2C2C] mb-1">{tool.name}</h4>
                <p className="text-sm text-gray-500">{tool.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Platform screenshot placeholder */}
        <div className="mt-14 bg-gradient-to-br from-[#0F1923] to-[#1A2F3F] rounded-2xl p-1 mx-auto max-w-4xl">
          <div className="bg-[#0F1923] rounded-xl overflow-hidden">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                <div className="w-3 h-3 rounded-full bg-green-400/60" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-white/10 rounded-lg h-7 flex items-center px-3 max-w-md mx-auto">
                  <span className="text-xs text-white/40">app.propyte.com/dashboard</span>
                </div>
              </div>
            </div>
            {/* Dashboard mock */}
            <div className="p-6 grid grid-cols-4 gap-4">
              {[
                { label: 'Leads activos', value: '47', change: '+12%' },
                { label: 'Ventas del mes', value: '3', change: '+50%' },
                { label: 'Comisión acum.', value: '$234K', change: '' },
                { label: 'Revenue share', value: '$18K', change: '+8%' },
              ].map((s) => (
                <div key={s.label} className="bg-white/5 rounded-lg p-4">
                  <div className="text-xs text-white/40">{s.label}</div>
                  <div className="text-xl font-bold text-white mt-1">{s.value}</div>
                  {s.change && <div className="text-xs text-green-400 mt-1">{s.change}</div>}
                </div>
              ))}
            </div>
            <div className="px-6 pb-6">
              <div className="h-32 bg-white/5 rounded-lg flex items-end justify-around p-4 gap-2">
                {[40, 65, 55, 80, 70, 90, 75, 95, 85, 60, 88, 92].map((h, i) => (
                  <div key={i} className="flex-1 bg-[#5CE0D2]/60 rounded-t" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// TESTIMONIALS
// ============================================================
function Testimonials() {
  const testimonials = [
    {
      name: 'María Fernanda López',
      role: 'Top Producer, Playa del Carmen',
      quote: 'En mi primer año con Propyte cerré 12 operaciones y generé más ingresos que en 3 años con mi agencia anterior. La tecnología y los leads internacionales hacen toda la diferencia.',
      stats: '$18M MXN en ventas',
      avatar: 'ML',
    },
    {
      name: 'Roberto García Mendoza',
      role: 'Team Leader, Tulum',
      quote: 'El revenue sharing me cambió la vida. Construí un equipo de 15 agentes y ahora genero ingresos pasivos de más de $60K mensuales, además de mis propias ventas.',
      stats: '15 agentes en su red',
      avatar: 'RG',
    },
    {
      name: 'Ana Sofía Hernández',
      role: 'Agente Senior, Cancún',
      quote: 'Lo que más valoro es la capacitación. La Academia Propyte me dio las herramientas para pasar de vendedora a consultora de inversión. Mis clientes confían más y mis comisiones subieron un 40%.',
      stats: '40% más en comisiones',
      avatar: 'AH',
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-[#0F1923]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="text-center mb-14">
          <span className="text-[#5CE0D2] font-bold text-sm uppercase tracking-wider">Testimonios</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mt-3">
            Lo que dicen nuestros agentes
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-[#5CE0D2]/30 transition-all"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={16} className="text-[#F5A623] fill-[#F5A623]" />
                ))}
              </div>
              <p className="text-white/80 leading-relaxed mb-6 text-sm">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#5CE0D2]/20 rounded-full flex items-center justify-center text-[#5CE0D2] font-bold text-sm">
                  {t.avatar}
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{t.name}</div>
                  <div className="text-white/40 text-xs">{t.role}</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <span className="text-[#5CE0D2] font-bold text-sm">{t.stats}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// STATS SECTION
// ============================================================
function StatsSection() {
  const stats = [
    { value: '500+', label: 'Agentes en la red', icon: Users },
    { value: '$2B+', label: 'MXN en transacciones', icon: DollarSign },
    { value: '8', label: 'Ciudades con presencia', icon: MapPin },
    { value: '15K+', label: 'Propiedades vendidas', icon: Building2 },
    { value: '95%', label: 'Retención de agentes', icon: Award },
    { value: '48hrs', label: 'Pago de comisiones', icon: Zap },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="w-12 h-12 mx-auto bg-[#5CE0D2]/10 rounded-xl flex items-center justify-center mb-3">
                <s.icon size={24} className="text-[#5CE0D2]" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// HOW TO JOIN / PROCESS
// ============================================================
function JoinProcess() {
  const steps = [
    {
      num: '01',
      title: 'Aplica en línea',
      desc: 'Completa el formulario con tu información y experiencia. Te responderemos en menos de 24 horas.',
    },
    {
      num: '02',
      title: 'Entrevista virtual',
      desc: 'Conoce a tu futuro Team Leader en una videollamada de 30 minutos para alinear expectativas.',
    },
    {
      num: '03',
      title: 'Onboarding acelerado',
      desc: 'Completa nuestro programa de onboarding de 1 semana: herramientas, capacitación, y tu primer portafolio.',
    },
    {
      num: '04',
      title: '¡Comienza a vender!',
      desc: 'Desde el día 1 tienes acceso a leads, portafolio de propiedades, y todas nuestras herramientas.',
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-[#F4F6F8]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="text-center mb-14">
          <span className="text-[#5CE0D2] font-bold text-sm uppercase tracking-wider">Proceso</span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#2C2C2C] mt-3">
            Únete en <span className="text-[#1A2F3F]">4 simples pasos</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div key={step.num} className="relative">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[calc(50%+32px)] right-[-calc(50%-32px)] w-[calc(100%-64px)] h-0.5 bg-[#5CE0D2]/20" style={{ left: 'calc(50% + 32px)', width: 'calc(100% - 32px)' }} />
              )}
              <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 hover:border-[#5CE0D2]/30 hover:shadow-lg transition-all relative">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#5CE0D2] to-[#4BCEC0] rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-4">
                  {step.num}
                </div>
                <h4 className="font-bold text-[#2C2C2C] text-lg mb-2">{step.title}</h4>
                <p className="text-sm text-gray-500">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// FAQ
// ============================================================
function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  const faqs = [
    {
      q: '¿Necesito experiencia previa en bienes raíces?',
      a: 'No es obligatorio, pero sí valoramos experiencia en ventas, atención al cliente, o marketing. Nuestra Academia Propyte te da toda la capacitación necesaria para iniciar desde cero.',
    },
    {
      q: '¿Cuánto cuesta unirse a Propyte?',
      a: 'No hay cuota de inscripción. Solo pagas una membresía mensual de $2,500 MXN que incluye todas las herramientas, CRM, capacitación, y soporte. Sin cuota de escritorio ni cargos ocultos.',
    },
    {
      q: '¿Cómo funciona el revenue sharing?',
      a: 'Cuando invitas a un agente a Propyte, recibes un porcentaje de la comisión que Propyte cobra en cada transacción que ese agente cierre. Esto se extiende hasta 5 niveles de profundidad en tu red.',
    },
    {
      q: '¿Puedo trabajar desde cualquier lugar?',
      a: 'Sí. Propyte es 100% digital. Puedes trabajar desde casa, una cafetería, o mostrando propiedades en campo. No hay oficina física obligatoria.',
    },
    {
      q: '¿Qué mercados puedo trabajar?',
      a: 'Actualmente operamos en Riviera Maya, Cancún, Mérida, CDMX, Vallarta, y Los Cabos. Estamos en expansión constante y puedes operar en múltiples mercados simultáneamente.',
    },
    {
      q: '¿Cada cuánto me pagan mis comisiones?',
      a: 'Las comisiones se pagan dentro de las 48 horas posteriores al cierre de la operación y recepción del pago. Sin esperas de 30, 60 o 90 días como en otras agencias.',
    },
    {
      q: '¿Puedo traer mi cartera de clientes actual?',
      a: 'Absolutamente. Tu cartera de clientes es tuya. Propyte te da las herramientas para gestionarla mejor y convertir más leads en ventas.',
    },
    {
      q: '¿Qué diferencia a Propyte de una inmobiliaria tradicional?',
      a: 'Somos una plataforma tecnológica, no una inmobiliaria con oficinas. Eso nos permite ofrecer splits más altos, mejor tecnología, y un modelo de revenue sharing que no existe en las agencias tradicionales.',
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <div className="text-center mb-14">
          <span className="text-[#5CE0D2] font-bold text-sm uppercase tracking-wider">Preguntas frecuentes</span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#2C2C2C] mt-3">
            ¿Tienes dudas?
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={`border rounded-xl overflow-hidden transition-all ${
                open === i ? 'border-[#5CE0D2]/30 shadow-sm' : 'border-gray-200'
              }`}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-[#2C2C2C] pr-4">{faq.q}</span>
                {open === i ? (
                  <ChevronUp size={20} className="text-[#5CE0D2] flex-shrink-0" />
                ) : (
                  <ChevronDown size={20} className="text-gray-400 flex-shrink-0" />
                )}
              </button>
              {open === i && (
                <div className="px-5 pb-5">
                  <p className="text-gray-500 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// APPLICATION FORM (CTA)
// ============================================================
function ApplicationForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    // Simulate submission
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <section id="aplicar" className="py-20 md:py-28 bg-gradient-to-br from-[#0F1923] via-[#1A2F3F] to-[#0F1923] relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#5CE0D2]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#F5A623]/5 rounded-full blur-3xl" />

      <div className="relative max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Content */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              ¿Listo para transformar tu{' '}
              <span className="text-[#5CE0D2]">carrera inmobiliaria</span>?
            </h2>
            <p className="text-white/70 leading-relaxed mb-8 text-lg">
              Completa el formulario y un miembro de nuestro equipo te contactará
              en las próximas 24 horas para agendar tu entrevista.
            </p>

            <div className="space-y-4">
              {[
                { icon: Phone, text: '+52 984 XXX XXXX' },
                { icon: Mail, text: 'reclutamiento@propyte.com' },
              ].map((c) => (
                <div key={c.text} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                    <c.icon size={18} className="text-[#5CE0D2]" />
                  </div>
                  <span className="text-white/80 font-medium">{c.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Form */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-2xl">
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto bg-green-50 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle size={32} className="text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-[#2C2C2C] mb-2">¡Aplicación enviada!</h3>
                <p className="text-gray-500">
                  Te contactaremos en menos de 24 horas. Revisa tu correo y WhatsApp.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h3 className="text-xl font-bold text-[#2C2C2C] mb-6">Aplica ahora</h3>

                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#2C2C2C] mb-1.5">Nombre completo *</label>
                      <input
                        type="text"
                        required
                        className="w-full h-11 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5CE0D2]/20 focus:border-[#5CE0D2]"
                        placeholder="Tu nombre"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#2C2C2C] mb-1.5">WhatsApp *</label>
                      <input
                        type="tel"
                        required
                        className="w-full h-11 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5CE0D2]/20 focus:border-[#5CE0D2]"
                        placeholder="+52 984 ..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#2C2C2C] mb-1.5">Correo electrónico *</label>
                    <input
                      type="email"
                      required
                      className="w-full h-11 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5CE0D2]/20 focus:border-[#5CE0D2]"
                      placeholder="tu@correo.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#2C2C2C] mb-1.5">Ciudad de operación *</label>
                    <select
                      required
                      className="w-full h-11 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5CE0D2]/20 focus:border-[#5CE0D2] bg-white"
                    >
                      <option value="">Selecciona tu ciudad</option>
                      <option value="playa">Playa del Carmen</option>
                      <option value="tulum">Tulum</option>
                      <option value="cancun">Cancún</option>
                      <option value="merida">Mérida</option>
                      <option value="cdmx">CDMX</option>
                      <option value="vallarta">Puerto Vallarta</option>
                      <option value="cabos">Los Cabos</option>
                      <option value="otra">Otra</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#2C2C2C] mb-1.5">Experiencia en bienes raíces</label>
                    <select
                      className="w-full h-11 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5CE0D2]/20 focus:border-[#5CE0D2] bg-white"
                    >
                      <option value="">Selecciona</option>
                      <option value="0">Sin experiencia (quiero empezar)</option>
                      <option value="1-2">1-2 años</option>
                      <option value="3-5">3-5 años</option>
                      <option value="5+">Más de 5 años</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#2C2C2C] mb-1.5">¿Qué te interesa más de Propyte?</label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5CE0D2]/20 focus:border-[#5CE0D2] resize-none"
                      placeholder="Cuéntanos sobre ti y qué buscas..."
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 h-12 bg-[#5CE0D2] hover:bg-[#4BCEC0] disabled:bg-gray-300 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#5CE0D2]/20"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={18} />
                      Enviar mi aplicación
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-400 text-center mt-4">
                  Al enviar, aceptas nuestros términos y política de privacidad.
                  Te contactaremos por WhatsApp y correo electrónico.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// FINAL CTA BANNER
// ============================================================
function FinalCTA() {
  return (
    <section className="py-16 bg-[#5CE0D2]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
          El futuro de los bienes raíces en México es digital. Sé parte de él.
        </h2>
        <p className="text-white/80 mb-8 max-w-2xl mx-auto">
          Más de 500 agentes ya eligieron Propyte. ¿Qué estás esperando?
        </p>
        <a
          href="#aplicar"
          className="inline-flex items-center gap-2 h-14 px-10 bg-white text-[#5CE0D2] font-bold text-lg rounded-xl hover:bg-gray-50 transition-all hover:shadow-lg"
        >
          Únete hoy
          <ArrowRight size={20} />
        </a>
      </div>
    </section>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function UnetePageContent() {
  return (
    <div>
      <HeroSection />
      <SocialProofBar />
      <WhyPropyte />
      <CommissionModel />
      <RevenueSharing />
      <TechPlatform />
      <Testimonials />
      <StatsSection />
      <JoinProcess />
      <FAQ />
      <ApplicationForm />
      <FinalCTA />
    </div>
  );
}
