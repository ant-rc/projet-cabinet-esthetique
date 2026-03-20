import { Link } from 'react-router-dom';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export default function CTASection() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-rose-soft to-nude px-4 py-20 lg:px-8 lg:py-28">
      <div className="pointer-events-none absolute left-1/2 top-0 h-full w-[200%] -translate-x-1/2">
        <div className="animate-pulse-soft absolute -left-20 top-10 h-40 w-40 rounded-full bg-primary-light/20 blur-3xl" />
        <div className="animate-pulse-soft absolute -right-10 bottom-10 h-56 w-56 rounded-full bg-primary/10 blur-3xl" style={{ animationDelay: '2s' }} />
      </div>

      <div ref={ref} className={`reveal-scale ${isVisible ? 'visible' : ''} relative mx-auto flex max-w-2xl flex-col items-center gap-6 text-center`}>
        <h2 className="font-serif text-3xl font-bold text-text md:text-4xl">
          Prête à commencer&nbsp;?
        </h2>
        <p className="text-base text-text-light">
          Réservez dès maintenant votre première consultation et faites le premier
          pas vers une peau durablement lisse.
        </p>
        <Link
          to="/rendez-vous"
          className="rounded-full bg-primary px-10 py-4 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-primary-dark hover:shadow-xl"
        >
          Prendre rendez-vous
        </Link>
      </div>
    </section>
  );
}
