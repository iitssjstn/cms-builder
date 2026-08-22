import { LayoutBlock } from './layouts';

export const templateSites: Record<string, Record<string, LayoutBlock[]>> = {
  business: {
    home: [
      { type: 'hero', content: { headline: 'Samen bouwen aan groei', subheadline: 'Praktische strategie en digitale oplossingen voor organisaties die vooruit willen.', cta_text: 'Plan een gesprek', cta_url: '/contact', text_align: 'left' } },
      { type: 'heading', content: { level: 'h2', text: 'Waar we je mee helpen' } },
      { type: 'card', content: { title: 'Strategie', description: 'Van eerste idee tot helder plan met concrete stappen en meetbare doelen.', cta_text: 'Ontdek strategie', cta_url: '/diensten' } },
      { type: 'card', content: { title: 'Digitale projecten', description: 'Gebruiksvriendelijke websites en systemen die je team elke dag verder helpen.', cta_text: 'Bekijk diensten', cta_url: '/diensten' } },
      { type: 'card', content: { title: 'Samenwerking', description: 'Een betrokken partner die naast je staat en complexe keuzes begrijpelijk maakt.', cta_text: 'Over ons', cta_url: '/over-ons' } },
      { type: 'heading', content: { level: 'h2', text: 'Klaar voor de volgende stap?' } },
      { type: 'text', content: { content: 'Vertel ons waar je naartoe wilt. We denken graag mee over een aanpak die past bij jouw organisatie.' } },
      { type: 'button', content: { text: 'Neem contact op', url: '/contact', variant: 'primary', size: 'lg' } }
    ],
    'over-ons': [
      { type: 'heading', content: { level: 'h1', text: 'Een betrokken team met een heldere aanpak' } },
      { type: 'text', content: { content: 'Wij combineren vakkennis met nieuwsgierigheid. Zo maken we digitale projecten die niet alleen mooi zijn, maar vooral goed werken voor de mensen die ermee werken.' } },
      { type: 'heading', content: { level: 'h2', text: 'Onze manier van werken' } },
      { type: 'card', content: { title: 'Luisteren', description: 'We starten bij de behoefte van je klant en je team.' } },
      { type: 'card', content: { title: 'Vereenvoudigen', description: 'We brengen focus aan en maken keuzes overzichtelijk.' } },
      { type: 'card', content: { title: 'Verbeteren', description: 'We testen, leren en bouwen stap voor stap verder.' } }
      ,{ type: 'testimonials', content: { title: 'Wat klanten zeggen', items: [{ quote: 'De aanpak gaf ons rust en richting.', name: 'Lotte Vermeer', role: 'Directeur' }] } }
    ],
    diensten: [
      { type: 'heading', content: { level: 'h1', text: 'Diensten die resultaat opleveren' } },
      { type: 'text', content: { content: 'Kies de ondersteuning die past bij jouw fase. Los of als compleet traject.' } },
      { type: 'card', content: { title: 'Merk en positionering', description: 'Een duidelijk verhaal waarmee je organisatie herkenbaar en relevant wordt.' } },
      { type: 'card', content: { title: 'Website en platform', description: 'Een snelle, toegankelijke digitale ervaring die bezoekers in beweging brengt.' } },
      { type: 'card', content: { title: 'Doorontwikkeling', description: 'Blijf verbeteren met inzichten uit data, gebruikers en je eigen team.' } }
      ,{ type: 'pricing', content: { title: 'Samenwerken kan op verschillende manieren', plans: [{ name: 'Sparren', price: 'Vanaf €450', features: ['Sessie van 2 uur', 'Concreet actieplan'], cta_text: 'Plan sessie', cta_url: '/contact' }, { name: 'Traject', price: 'Op maat', features: ['Strategie en uitvoering', 'Vaste contactpersoon'], cta_text: 'Bespreek traject', cta_url: '/contact' }] } }
    ],
    contact: [
      { type: 'heading', content: { level: 'h1', text: 'Vertel ons over je uitdaging' } },
      { type: 'text', content: { content: 'Laat je gegevens achter en we nemen binnen twee werkdagen contact met je op.' } },
      { type: 'contact-form', content: { fields: [{ type: 'text', name: 'name', label: 'Naam', required: true }, { type: 'email', name: 'email', label: 'E-mail', required: true }, { type: 'textarea', name: 'message', label: 'Waar kunnen we mee helpen?', required: true }], submit_text: 'Versturen', success_message: 'Bedankt, we nemen snel contact op.' } }
      ,{ type: 'faq', content: { title: 'Veelgestelde vragen', items: [{ question: 'Wanneer hoor ik van jullie?', answer: 'Binnen twee werkdagen.' }, { question: 'Werken jullie ook op afstand?', answer: 'Ja, we werken met teams in heel Nederland.' }] } }
    ]
  },
  portfolio: {
    home: [
      { type: 'hero', content: { headline: 'Digitale producten met aandacht gemaakt', subheadline: 'Ik ontwerp heldere merken, websites en interfaces voor ambitieuze teams.', cta_text: 'Bekijk mijn werk', cta_url: '/projecten', text_align: 'left' } },
      { type: 'heading', content: { level: 'h2', text: 'Uitgelicht werk' } },
      { type: 'card', content: { title: 'Merkidentiteit voor Nova', description: 'Een frisse identiteit en website voor een groeiend technologiebedrijf.', cta_text: 'Bekijk project', cta_url: '/projecten' } },
      { type: 'card', content: { title: 'Platform voor lokale makers', description: 'Een toegankelijk platform dat vraag en aanbod bij elkaar brengt.', cta_text: 'Bekijk project', cta_url: '/projecten' } }
    ],
    projecten: [
      { type: 'heading', content: { level: 'h1', text: 'Projecten' } },
      { type: 'text', content: { content: 'Een selectie van werk waarin strategie, vormgeving en techniek samenkomen.' } },
      { type: 'gallery', content: { images: [], columns: 3, gap: '1rem' } },
      { type: 'card', content: { title: 'Nova', description: 'Merk, website en design system voor een B2B softwarebedrijf.' } },
      { type: 'card', content: { title: 'Atelier Noord', description: 'E-commerce ervaring voor een lokaal designcollectief.' } }
    ],
    'over-mij': [
      { type: 'heading', content: { level: 'h1', text: 'Hoi, ik ben de maker achter deze projecten' } },
      { type: 'text', content: { content: 'Ik help organisaties om ingewikkelde ideeën helder, bruikbaar en aantrekkelijk te maken. Mijn werk begint bij de mensen voor wie het bedoeld is.' } },
      { type: 'heading', content: { level: 'h2', text: 'Waar ik in geloof' } },
      { type: 'card', content: { title: 'Helderheid', description: 'Goede keuzes voelen logisch voor iedereen die ermee werkt.' } },
      { type: 'card', content: { title: 'Samen maken', description: 'De beste oplossingen ontstaan wanneer expertise en ervaring elkaar ontmoeten.' } }
    ],
    contact: [
      { type: 'heading', content: { level: 'h1', text: 'Samen iets goeds maken?' } },
      { type: 'text', content: { content: 'Vertel me kort over je project, timing en wat je nodig hebt.' } },
      { type: 'contact-form', content: { fields: [{ type: 'text', name: 'name', label: 'Naam', required: true }, { type: 'email', name: 'email', label: 'E-mail', required: true }, { type: 'textarea', name: 'message', label: 'Over je project', required: true }], submit_text: 'Bericht sturen', success_message: 'Bedankt, ik kom snel bij je terug.' } }
    ]
  },
  restaurant: {
    home: [
      { type: 'hero', content: { headline: 'Smaakvol tafelen, dicht bij huis', subheadline: 'Seizoensgerechten, lokale ingrediënten en een warme tafel voor elk moment.', cta_text: 'Reserveer een tafel', cta_url: '/reserveren', text_align: 'center' } },
      { type: 'heading', content: { level: 'h2', text: 'Vanavond op het menu' } },
      { type: 'card', content: { title: 'Kleine gerechten', description: 'Om samen te delen, met groenten uit het seizoen en brood uit eigen oven.' } },
      { type: 'card', content: { title: 'Hoofdgerecht', description: 'Elke week een wisselende special waarin de beste ingrediënten centraal staan.' } },
      { type: 'card', content: { title: 'Iets zoets', description: 'Een huisgemaakt dessert om rustig mee af te sluiten.' } },
      { type: 'button', content: { text: 'Bekijk het menu', url: '/menu', variant: 'primary', size: 'md' } }
    ],
    menu: [
      { type: 'heading', content: { level: 'h1', text: 'Ons menu' } },
      { type: 'text', content: { content: 'Onze kaart wisselt met het seizoen. Vraag ons team naar vegetarische, veganistische en allergenenvrije opties.' } },
      { type: 'heading', content: { level: 'h2', text: 'Om te delen' } },
      { type: 'card', content: { title: 'Zuurdesembrood', description: 'Met geklopte boter en gerookt zeezout · 6' } },
      { type: 'card', content: { title: 'Geroosterde groenten', description: 'Met kruidenolie en yoghurt · 9' } },
      { type: 'heading', content: { level: 'h2', text: 'Hoofdgerechten' } },
      { type: 'card', content: { title: 'Wisselende dagschotel', description: 'Vraag onze bediening naar de bereiding van vandaag · 21' } }
    ],
    reserveren: [
      { type: 'heading', content: { level: 'h1', text: 'Reserveer je tafel' } },
      { type: 'text', content: { content: 'Voor groepen vanaf acht personen vragen we je even telefonisch contact op te nemen.' } },
      { type: 'contact-form', content: { fields: [{ type: 'text', name: 'name', label: 'Naam', required: true }, { type: 'email', name: 'email', label: 'E-mail', required: true }, { type: 'text', name: 'date', label: 'Datum', required: true }, { type: 'text', name: 'guests', label: 'Aantal personen', required: true }, { type: 'textarea', name: 'message', label: 'Opmerking' }], submit_text: 'Aanvraag versturen', success_message: 'We bevestigen je reservering zo snel mogelijk.' } }
    ],
    contact: [
      { type: 'heading', content: { level: 'h1', text: 'Je vindt ons hier' } },
      { type: 'text', content: { content: 'Open van dinsdag tot en met zondag vanaf 17:30. Keuken open tot 21:30.' } },
      { type: 'button', content: { text: 'Bel voor vragen', url: 'tel:+31000000000', variant: 'primary', size: 'md' } }
    ]
  },
  landing: {
    home: [
      { type: 'hero', content: { headline: 'Maak ruimte voor wat belangrijk is', subheadline: 'Een heldere service voor mensen die sneller van idee naar resultaat willen.', cta_text: 'Start vandaag', cta_url: '#contact', text_align: 'center' } },
      { type: 'heading', content: { level: 'h2', text: 'Eenvoudig beginnen' } },
      { type: 'text', content: { content: 'Leg uit wat je aanbiedt, voor wie het is en welke volgende stap bezoekers kunnen zetten.' } },
      { type: 'button', content: { text: 'Plan een kennismaking', url: '#contact', variant: 'primary', size: 'lg' } },
      { type: 'contact-form', content: { fields: [{ type: 'text', name: 'name', label: 'Naam', required: true }, { type: 'email', name: 'email', label: 'E-mail', required: true }, { type: 'textarea', name: 'message', label: 'Bericht' }], submit_text: 'Neem contact op', success_message: 'Bedankt voor je bericht.' } }
    ]
  }
};
