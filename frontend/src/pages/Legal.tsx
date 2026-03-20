export default function Legal() {
  return (
    <section className="px-4 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-serif text-3xl font-bold text-text md:text-4xl">
          Mentions légales
        </h1>

        <div className="mt-10 flex flex-col gap-8 text-sm leading-relaxed text-text-light">
          <div>
            <h2 className="mb-3 text-lg font-semibold text-text">Éditeur du site</h2>
            <p>
              AA Laser Med<br />
              Cabinet d&apos;épilation laser<br />
              Adresse : [Adresse du cabinet]<br />
              Téléphone : [Numéro de téléphone]<br />
              E-mail : [Adresse e-mail de contact]
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-text">Responsable de la publication</h2>
            <p>[Nom de la responsable], infirmière diplômée d&apos;État.</p>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-text">Hébergement</h2>
            <p>
              [Nom de l&apos;hébergeur]<br />
              [Adresse de l&apos;hébergeur]<br />
              [Téléphone de l&apos;hébergeur]
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-text">Propriété intellectuelle</h2>
            <p>
              L&apos;ensemble du contenu de ce site (textes, images, graphismes, logo,
              structure) est la propriété exclusive de AA Laser Med, sauf mention
              contraire. Toute reproduction, représentation, modification, publication
              ou adaptation de tout ou partie des éléments du site est interdite sans
              autorisation écrite préalable.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-text">Données personnelles</h2>
            <p>
              Les informations recueillies via le formulaire de prise de rendez-vous
              sont destinées exclusivement à AA Laser Med pour le traitement de votre
              demande. Conformément au Règlement Général sur la Protection des Données
              (RGPD), vous disposez d&apos;un droit d&apos;accès, de rectification et
              de suppression de vos données. Pour exercer ce droit, contactez-nous à
              l&apos;adresse indiquée ci-dessus.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-text">Cookies</h2>
            <p>
              Ce site utilise des cookies techniques nécessaires au bon fonctionnement
              du service. Aucun cookie publicitaire ou de traçage n&apos;est utilisé.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
