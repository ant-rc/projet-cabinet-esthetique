import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="wave-divider relative overflow-hidden bg-gradient-to-br from-rose-soft via-rose-soft to-nude-dark px-4 pb-28 pt-16 lg:px-8 lg:pb-36 lg:pt-24">
      {/* Decorative blurred shapes */}
      <div className="animate-pulse-soft pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary-light/30 blur-3xl" />
      <div className="animate-pulse-soft pointer-events-none absolute -left-32 top-1/3 h-64 w-64 rounded-full bg-primary-light/20 blur-3xl" style={{ animationDelay: '2s' }} />
      <div className="animate-pulse-soft pointer-events-none absolute bottom-10 right-1/4 h-48 w-48 rounded-full bg-primary/10 blur-2xl" style={{ animationDelay: '4s' }} />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-16">
        {/* Left column: text */}
        <div className="flex flex-1 flex-col items-center gap-6 text-center lg:items-start lg:text-left">
          <div className="hero-animate-1 flex items-baseline gap-2">
            <span className="font-serif text-4xl font-bold tracking-wide text-primary-dark lg:text-5xl">
              AA
            </span>
            <span className="text-base font-semibold uppercase tracking-[0.25em] text-text lg:text-lg">
              Laser Med
            </span>
          </div>

          <h1 className="hero-animate-2 font-serif text-4xl font-bold leading-[1.15] text-text md:text-5xl lg:text-6xl">
            Épilation laser définitive
          </h1>

          <p className="hero-animate-3 max-w-md text-base text-text-light md:text-lg">
            Par une infirmière diplômée d&apos;État — Technologie Candela GentleMax Pro
          </p>

          <div className="hero-animate-4 flex flex-col gap-4 sm:flex-row">
            <Link
              to="/reservation"
              className="rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:bg-primary-dark hover:shadow-lg"
            >
              Prendre rendez-vous
            </Link>
            <a
              href="#tarifs"
              className="rounded-full border-2 border-primary bg-white/60 px-8 py-3.5 text-sm font-semibold text-primary backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-primary hover:text-white"
            >
              Voir nos tarifs
            </a>
          </div>
        </div>

        {/* Right column: machine image */}
        <div className="hero-image-animate relative flex flex-1 items-center justify-center">
          <div className="relative">
            {/* Glow behind */}
            <div className="absolute inset-0 -m-6 rounded-[2rem] bg-gradient-to-br from-primary-light/40 to-rose-soft/60 blur-2xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/40 bg-white/80 shadow-2xl backdrop-blur-sm">
              <img
                src="/images/machine.jpeg"
                alt="Laser Candela GentleMax Pro utilisé au centre AA Laser Med"
                className="h-auto w-full max-w-sm object-cover"
                loading="eager"
              />
            </div>

            {/* Floating decorative elements */}
            <div className="animate-float absolute -right-4 top-8 h-14 w-14 rounded-full bg-primary/15 blur-xl" />
            <div className="animate-float-reverse absolute -left-4 bottom-10 h-12 w-12 rounded-full bg-primary-light/25 blur-lg" />
          </div>
        </div>
      </div>
    </section>
  );
}
