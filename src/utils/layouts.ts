export type LayoutBlock = {
  type: string;
  content: Record<string, unknown>;
  styles?: Record<string, unknown>;
  responsive_styles?: Record<string, unknown>;
};

export const layouts: Record<string, { label: string; description: string; blocks: LayoutBlock[] }> = {
  landing: {
    label: 'Landingspagina',
    description: 'Grote introductie met tekst en duidelijke actieknop.',
    blocks: [
      { type: 'hero', content: { headline: 'Welkom op mijn website', subheadline: 'Vertel bezoekers in een paar zinnen wat je doet en waarom het waardevol is.', cta_text: 'Neem contact op', cta_url: '#contact', text_align: 'center' } },
      { type: 'heading', content: { level: 'h2', text: 'Dit is wat ik voor je kan doen' } },
      { type: 'text', content: { content: 'Gebruik dit tekstblok om je belangrijkste voordeel, dienst of verhaal helder uit te leggen.' } },
      { type: 'button', content: { text: 'Meer informatie', url: '#contact', variant: 'primary', size: 'md' } }
    ]
  },
  business: {
    label: 'Bedrijfspagina',
    description: 'Overzichtelijke start voor een bedrijf of zelfstandige.',
    blocks: [
      { type: 'heading', content: { level: 'h1', text: 'Jouw bedrijf, helder uitgelegd' } },
      { type: 'text', content: { content: 'Vertel kort wie je bent, voor wie je werkt en welk probleem je oplost.' } },
      { type: 'heading', content: { level: 'h2', text: 'Onze diensten' } },
      { type: 'card', content: { title: 'Dienst één', description: 'Leg uit wat deze dienst oplevert voor je klant.', cta_text: 'Lees meer', cta_url: '#' } },
      { type: 'card', content: { title: 'Dienst twee', description: 'Voeg hier een tweede aanbod of specialisatie toe.', cta_text: 'Lees meer', cta_url: '#' } },
      { type: 'button', content: { text: 'Plan een kennismaking', url: '#contact', variant: 'primary', size: 'md' } }
    ]
  },
  contact: {
    label: 'Contactpagina',
    description: 'Een eenvoudige pagina waarmee bezoekers contact opnemen.',
    blocks: [
      { type: 'heading', content: { level: 'h1', text: 'Neem contact op' } },
      { type: 'text', content: { content: 'Heb je een vraag of wil je samenwerken? Stuur gerust een bericht.' } },
      { type: 'contact-form', content: { fields: [{ type: 'text', name: 'name', label: 'Naam', required: true }, { type: 'email', name: 'email', label: 'E-mail', required: true }, { type: 'textarea', name: 'message', label: 'Bericht', required: true }], submit_text: 'Versturen', success_message: 'Bedankt voor je bericht!' } }
    ]
  },
  portfolio: {
    label: 'Portfolio',
    description: 'Laat werk, projecten of voorbeelden overzichtelijk zien.',
    blocks: [
      { type: 'hero', content: { headline: 'Mijn werk', subheadline: 'Een selectie van projecten waar ik trots op ben.', text_align: 'left' } },
      { type: 'heading', content: { level: 'h2', text: 'Projecten' } },
      { type: 'card', content: { title: 'Projectnaam', description: 'Beschrijf kort wat je hebt gemaakt en wat het resultaat was.', cta_text: 'Bekijk project', cta_url: '#' } },
      { type: 'card', content: { title: 'Nog een project', description: 'Voeg hier een tweede voorbeeld uit je portfolio toe.', cta_text: 'Bekijk project', cta_url: '#' } }
    ]
  },
  header: {
    label: 'Header en navigatie',
    description: 'Een professionele navigatie met merknaam en actieknop.',
    blocks: [{ type: 'header', content: { logo: 'Jouw merk', links: [{ label: 'Over ons', url: '/over-ons' }, { label: 'Diensten', url: '/diensten' }, { label: 'Contact', url: '/contact' }], cta_text: 'Start gesprek', cta_url: '/contact' } }]
  },
  pricing: {
    label: 'Prijstabel',
    description: 'Vergelijk abonnementen of diensten in duidelijke kaarten.',
    blocks: [{ type: 'pricing', content: { title: 'Kies het pakket dat bij je past', plans: [{ name: 'Start', price: '€29', description: 'Voor kleine teams', features: ['Basisfuncties', 'E-mail support'], cta_text: 'Kies Start', cta_url: '#' }, { name: 'Groei', price: '€79', description: 'Voor groeiende bedrijven', features: ['Alle basisfuncties', 'Prioriteit support', 'Rapportages'], cta_text: 'Kies Groei', cta_url: '#' }, { name: 'Pro', price: '€149', description: 'Voor maximale slagkracht', features: ['Alles van Groei', 'Persoonlijke begeleiding'], cta_text: 'Kies Pro', cta_url: '#' }] } }]
  },
  blog: {
    label: 'Blogoverzicht',
    description: 'Een overzicht met artikelen, datum en doorklikactie.',
    blocks: [{ type: 'blog', content: { title: 'Laatste inzichten', posts: [{ title: 'Zo begin je goed', excerpt: 'Praktische tips om vandaag de eerste stap te zetten.', date: '12 juni 2026', url: '#' }, { title: 'Wat klanten waarderen', excerpt: 'Leer welke keuzes zorgen voor een betere ervaring.', date: '4 juni 2026', url: '#' }, { title: 'Achter de schermen', excerpt: 'Een kijkje in onze aanpak en dagelijkse praktijk.', date: '28 mei 2026', url: '#' }] } }]
  },
  faq: {
    label: 'Veelgestelde vragen',
    description: 'Uitklapbare vragen en antwoorden voor extra duidelijkheid.',
    blocks: [{ type: 'faq', content: { title: 'Veelgestelde vragen', items: [{ question: 'Hoe werkt het?', answer: 'Je kiest een layout, past de teksten aan en publiceert wanneer je klaar bent.' }, { question: 'Kan ik later wijzigen?', answer: 'Ja. Alle onderdelen blijven afzonderlijk bewerkbaar.' }, { question: 'Is de website responsive?', answer: 'Ja, de layouts zijn ontworpen voor desktop, tablet en mobiel.' }] } }]
  },
  testimonials: {
    label: 'Testimonials',
    description: 'Social proof met klantquotes en functies.',
    blocks: [{ type: 'testimonials', content: { title: 'Wat klanten zeggen', items: [{ quote: 'We hadden binnen een dag een professionele basis staan.', name: 'Sanne de Vries', role: 'Eigenaar, Studio Noord' }, { quote: 'De builder maakt keuzes begrijpelijk voor het hele team.', name: 'Mark Jansen', role: 'Marketingmanager' }] } }]
  },
  cta: {
    label: 'Call-to-action',
    description: 'Een opvallende afsluiting die bezoekers in beweging brengt.',
    blocks: [{ type: 'cta', content: { title: 'Klaar om te beginnen?', text: 'Plan een vrijblijvend gesprek en ontdek wat er mogelijk is.', button_text: 'Neem contact op', button_url: '/contact' } }]
  },
  footer: {
    label: 'Footer',
    description: 'Een nette footer met links en korte bedrijfsinformatie.',
    blocks: [{ type: 'footer', content: { text: 'Jouw merk - Samen maken we vooruitgang.', links: [{ label: 'Privacy', url: '#' }, { label: 'Contact', url: '/contact' }] } }]
  },
  auth: {
    label: 'Loginpagina',
    description: 'Een rustige login- of registratiepagina.',
    blocks: [{ type: 'auth', content: { mode: 'login', title: 'Welkom terug', subtitle: 'Log in om verder te gaan.', button_text: 'Inloggen' } }]
  },
  dashboard: {
    label: 'Dashboard',
    description: 'Een overzicht met statistieken en statusinformatie.',
    blocks: [{ type: 'dashboard', content: { title: 'Overzicht', notice: 'Alles loopt volgens plan.', stats: [{ label: 'Bezoekers', value: '12.480', change: '+12%' }, { label: 'Conversie', value: '4,8%', change: '+0,6%' }, { label: 'Projecten', value: '24' }, { label: 'Open taken', value: '7' }] } }]
  },
  notfound: {
    label: '404-pagina',
    description: 'Een vriendelijke foutpagina die bezoekers terugbrengt.',
    blocks: [{ type: 'notfound', content: { code: '404', title: 'Deze pagina bestaat niet', text: 'Misschien is de link verouderd of is de pagina verplaatst.', button_text: 'Terug naar home', button_url: '/' } }]
  }
};
