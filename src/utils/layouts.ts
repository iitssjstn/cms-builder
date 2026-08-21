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
  }
};
