import BookingForm from '@/components/booking/BookingForm';

export default function Booking() {
  return (
    <section className="page-enter px-4 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-center font-serif text-3xl font-bold text-text md:text-4xl">
          Prendre rendez-vous
        </h1>
        <p className="mt-4 text-center text-base text-text-light">
          Choisissez votre profil, sélectionnez vos zones et réservez un créneau.
        </p>

        <div className="mt-10">
          <BookingForm />
        </div>
      </div>
    </section>
  );
}
