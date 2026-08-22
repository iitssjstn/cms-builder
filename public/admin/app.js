function app() {
  return {
    // Auth / bootstrap
    loading: false,
    showLogin: false,
    showSetup: false,
    user: null,
    csrfToken: null,
    globalError: '',

    loginForm: { email: '', password: '' },
    loginError: '',
    setupForm: { email: '', password: '', confirmPassword: '' },
    setupError: '',

    // Layout
    sidebarCollapsed: false,
    currentView: 'overview',
    navItems: [
      { id: 'overview', label: 'Overzicht', icon: '📊' },
      { id: 'pages', label: "Pagina's", icon: '📄' },
      { id: 'builder', label: 'Builder', icon: '🧩' },
      { id: 'media', label: 'Media', icon: '🖼️' },
      { id: 'navigation', label: 'Navigatie', icon: '🧭' },
      { id: 'design', label: 'Ontwerp', icon: '🎨' },
      { id: 'settings', label: 'Instellingen', icon: '⚙️' },
      { id: 'preview', label: 'Preview', icon: '👁️' },
      { id: 'export', label: 'Exporteren', icon: '📦' }
    ],

    // Projects
    projects: [],
    currentProjectId: '',
    currentProject: null,
    showCreateProject: false,
    newProject: { name: '', slug: '', description: '', template: 'blank' },
    projectError: '',
    templateLibrary: [
      { id: 'business', label: 'Bedrijf', description: 'Zakelijke website met diensten, over ons en contact.', category: 'Zakelijk' },
      { id: 'restaurant', label: 'Restaurant', description: 'Menu, reserveringen en lokale sfeer.', category: 'Horeca' },
      { id: 'portfolio', label: 'Portfolio', description: 'Werk, projecten en persoonlijke introductie.', category: 'Creatief' },
      { id: 'photographer', label: 'Fotograaf', description: 'Beeldgerichte portfolio voor studio en maker.', category: 'Creatief' },
      { id: 'shop', label: 'Webshop', description: 'Producten, bundels en conversiegerichte CTA’s.', category: 'E-commerce' },
      { id: 'gym', label: 'Sportschool', description: 'Trainingen, lidmaatschappen en motivatie.', category: 'Gezondheid' },
      { id: 'real-estate', label: 'Makelaar', description: 'Betrouwbare woning- en vastgoedpresentatie.', category: 'Zakelijk' },
      { id: 'freelancer', label: 'Freelancer', description: 'Persoonlijke dienstenwebsite voor zelfstandigen.', category: 'Persoonlijk' },
      { id: 'it-company', label: 'IT-bedrijf', description: 'B2B-presentatie voor IT en consultancy.', category: 'Technologie' },
      { id: 'saas', label: 'SaaS / startup', description: 'Product, pricing en social proof.', category: 'Technologie' },
      { id: 'blog', label: 'Blog', description: 'Redactionele website voor artikelen en nieuws.', category: 'Content' },
      { id: 'personal', label: 'Persoonlijk', description: 'Warm verhaal, werk en contact.', category: 'Persoonlijk' },
      { id: 'local-business', label: 'Lokale onderneming', description: 'Toegankelijke site voor buurt en klanten.', category: 'Lokaal' }
    ],

    // Pages
    pages: [],
    showCreatePage: false,
    newPage: { name: '', slug: '', title: '' },
    pageError: '',

    // Builder
    builderPage: null,
    blocks: [],
    blockTypes: ['heading', 'text', 'image', 'button', 'link', 'video', 'container', 'columns', 'hero', 'card', 'gallery', 'contact-form', 'pricing', 'blog', 'faq', 'testimonials', 'cta', 'header', 'footer', 'auth', 'dashboard', 'notfound', 'divider', 'spacer'],
    newBlock: { type: 'text', content: { content: '' } },
    editingBlock: null,
    layoutPresets: [
      { id: 'landing', label: 'Landingspagina', description: 'Introductie met duidelijke actieknop' },
      { id: 'business', label: 'Bedrijf', description: 'Diensten en kennismaking' },
      { id: 'contact', label: 'Contact', description: 'Contactinformatie en formulier' },
      { id: 'portfolio', label: 'Portfolio', description: 'Projecten en voorbeelden' },
      { id: 'header', label: 'Header', description: 'Navigatie en actieknop' },
      { id: 'pricing', label: 'Prijzen', description: 'Vergelijkbare pakketten' },
      { id: 'blog', label: 'Blog', description: 'Artikelenoverzicht' },
      { id: 'faq', label: 'FAQ', description: 'Vragen en antwoorden' },
      { id: 'testimonials', label: 'Reviews', description: 'Klantreacties' },
      { id: 'cta', label: 'CTA', description: 'Actieblok' },
      { id: 'footer', label: 'Footer', description: 'Footer met links' },
      { id: 'auth', label: 'Login', description: 'Loginformulier' },
      { id: 'dashboard', label: 'Dashboard', description: 'Statistieken en status' },
      { id: 'notfound', label: '404', description: 'Vriendelijke foutpagina' }
    ],
    blockError: '',

    // Media
    media: [],
    mediaError: '',

    // Navigation
    navItemsList: [],
    newNavItem: { label: '', page_id: '', url: '' },
    navError: '',

    // Design / site settings
    designForm: {},
    designError: '',
    siteForm: {},
    siteError: '',
    exportError: '',

    async init() {
      try {
        const status = await this.raw('/api/auth/setup/status');
        if (!status.setupCompleted) {
          this.showSetup = true;
          return;
        }
      } catch (e) {
        this.globalError = 'Kan geen verbinding maken met de server';
        return;
      }

      await this.refreshCsrfToken();

      try {
        const me = await this.raw('/api/auth/me');
        this.user = me.user;
        await this.loadProjects();
      } catch (e) {
        this.showLogin = true;
      }
    },

    // --- low-level request helpers ---
    async refreshCsrfToken() {
      try {
        const data = await this.raw('/api/auth/csrf-token');
        this.csrfToken = data.csrfToken;
      } catch (e) {
        // negeren, token wordt bij volgende actie opnieuw opgehaald indien nodig
      }
    },

    async raw(url, options = {}) {
      const res = await fetch(url, {
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        ...options
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Fout (${res.status})`);
      }
      return data;
    },

    async api(url, options = {}) {
      const method = (options.method || 'GET').toUpperCase();
      const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
      if (method !== 'GET' && this.csrfToken) {
        headers['CSRF-Token'] = this.csrfToken;
      }

      const res = await fetch(url, {
        credentials: 'same-origin',
        ...options,
        headers
      });

      if (res.status === 401) {
        this.user = null;
        this.showLogin = true;
        throw new Error('Sessie verlopen, log opnieuw in');
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Fout (${res.status})`);
      }
      return data;
    },

    // --- auth ---
    async login() {
      this.loading = true;
      this.loginError = '';
      try {
        await this.refreshCsrfToken();
        const data = await this.api('/api/auth/login', { method: 'POST', body: JSON.stringify(this.loginForm) });
        this.user = data.user;
        this.showLogin = false;
        await this.refreshCsrfToken();
        await this.loadProjects();
      } catch (e) {
        this.loginError = e.message;
      } finally {
        this.loading = false;
      }
    },

    async setup() {
      this.loading = true;
      this.setupError = '';
      try {
        await this.refreshCsrfToken();
        const data = await this.api('/api/auth/setup', { method: 'POST', body: JSON.stringify(this.setupForm) });
        this.showSetup = false;
        await this.init();
      } catch (e) {
        this.setupError = e.message;
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      try {
        await this.api('/api/auth/logout', { method: 'POST' });
      } catch (e) {
        // negeren
      }
      this.user = null;
      this.currentProjectId = '';
      this.currentProject = null;
      this.showLogin = true;
    },

    // --- projects ---
    async loadProjects() {
      const data = await this.api('/api/projects');
      this.projects = data.projects;
    },

    async selectProject(id) {
      this.currentProjectId = id;
      await this.switchProject(id);
    },

    async switchProject(id) {
      if (!id) {
        this.currentProject = null;
        return;
      }
      this.currentProjectId = Number(id);
      const data = await this.api(`/api/projects/${id}`);
      this.currentProject = data.project;
      this.currentView = 'overview';
      await Promise.all([this.loadPages(), this.loadMedia(), this.loadNavigation(), this.loadDesign(), this.loadSiteSettings()]);
    },

    async createProject() {
      this.loading = true;
      this.projectError = '';
      try {
        const payload = { ...this.newProject };
        if (!payload.slug) delete payload.slug;
        const data = await this.api('/api/projects', { method: 'POST', body: JSON.stringify(payload) });
        this.showCreateProject = false;
        this.newProject = { name: '', slug: '', description: '', template: 'blank' };
        await this.loadProjects();
        await this.selectProject(data.project.id);
      } catch (e) {
        this.projectError = e.message;
      } finally {
        this.loading = false;
      }
    },

    async useTemplate(template) {
      this.newProject = { name: `${template.label} website`, slug: '', description: template.description, template: template.id };
      this.projectError = '';
      await this.createProject();
    },

    previewTemplate(template) {
      window.open(`/preview/template/${encodeURIComponent(template.id)}`, '_blank', 'noopener');
    },

    async duplicateProject(id) {
      try {
        await this.api(`/api/projects/${id}/duplicate`, { method: 'POST' });
        await this.loadProjects();
      } catch (e) {
        this.globalError = e.message;
      }
    },

    async deleteProject(p) {
      if (!confirm(`Project "${p.name}" verwijderen? Dit kan niet ongedaan gemaakt worden.`)) return;
      try {
        await this.api(`/api/projects/${p.id}`, { method: 'DELETE' });
        if (this.currentProjectId === p.id) {
          this.currentProjectId = '';
          this.currentProject = null;
        }
        await this.loadProjects();
      } catch (e) {
        this.globalError = e.message;
      }
    },

    switchView(id) {
      this.currentView = id;
    },

    openPreview() {
      if (!this.currentProject?.slug) return;
      const page = this.pages.find(item => item.status === 'published') || this.pages[0];
      const pagePath = page ? `/${encodeURIComponent(page.slug)}` : '';
      window.open(`/preview/${encodeURIComponent(this.currentProject.slug)}${pagePath}`, '_blank', 'noopener');
    },

    // --- pages ---
    async loadPages() {
      const data = await this.api(`/api/projects/${this.currentProjectId}/pages`);
      this.pages = data.pages;
    },

    async createPage() {
      this.loading = true;
      this.pageError = '';
      try {
        await this.api(`/api/projects/${this.currentProjectId}/pages`, { method: 'POST', body: JSON.stringify(this.newPage) });
        this.showCreatePage = false;
        this.newPage = { name: '', slug: '', title: '' };
        await this.loadPages();
      } catch (e) {
        this.pageError = e.message;
      } finally {
        this.loading = false;
      }
    },

    async togglePageStatus(p) {
      const status = p.status === 'published' ? 'draft' : 'published';
      try {
        await this.api(`/api/projects/${this.currentProjectId}/pages/${p.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
        await this.loadPages();
      } catch (e) {
        this.globalError = e.message;
      }
    },

    async deletePage(p) {
      if (!confirm(`Pagina "${p.name}" verwijderen?`)) return;
      try {
        await this.api(`/api/projects/${this.currentProjectId}/pages/${p.id}`, { method: 'DELETE' });
        if (this.builderPage?.id === p.id) {
          this.builderPage = null;
          this.blocks = [];
        }
        await this.loadPages();
      } catch (e) {
        this.globalError = e.message;
      }
    },

    // --- builder / blocks ---
    async openBuilder(p) {
      this.builderPage = p;
      this.currentView = 'builder';
      await this.loadBlocks();
    },

    async loadBlocks() {
      if (!this.builderPage) return;
      const data = await this.api(`/api/pages/${this.builderPage.id}/blocks`);
      this.blocks = data.blocks;
    },

    async createBlock() {
      this.blockError = '';
      this.loading = true;
      try {
        await this.api(`/api/pages/${this.builderPage.id}/blocks`, {
          method: 'POST',
          body: JSON.stringify({ type: this.newBlock.type, content: this.newBlock.content })
        });
        this.resetNewBlockContent();
        await this.loadBlocks();
      } catch (e) {
        this.blockError = e.message;
      } finally {
        this.loading = false;
      }
    },

    async applyLayout(layout) {
      if (!this.builderPage) return;
      if (!confirm('Deze layout wordt onderaan de pagina toegevoegd. Doorgaan?')) return;
      this.blockError = '';
      this.loading = true;
      try {
        await this.api(`/api/pages/${this.builderPage.id}/blocks/layout`, { method: 'POST', body: JSON.stringify({ layout }) });
        await this.loadBlocks();
      } catch (e) {
        this.blockError = e.message;
      } finally {
        this.loading = false;
      }
    },

    resetNewBlockContent() {
      this.newBlock.content = this.defaultBlockContent(this.newBlock.type);
    },

    defaultBlockContent(type) {
      const defaults = {
        heading: { level: 'h2', text: '' },
        text: { content: '' },
        image: { src: '', alt: '' },
        button: { text: '', url: '', variant: 'primary', size: 'md' },
        link: { text: '', url: '', target: '_self' },
        video: { src: '', controls: true, autoplay: false, loop: false, muted: true },
        container: { children: [] },
        columns: { columns: 2, gap: '1.5rem', children: [[], []] },
        hero: { headline: '', subheadline: '', cta_text: '', cta_url: '', text_align: 'center' },
        card: { image: '', title: '', description: '', cta_text: '', cta_url: '' },
        gallery: { images: [], columns: 3, gap: '1rem' },
        'contact-form': { fields: [{ type: 'text', name: 'name', label: 'Naam', required: true }, { type: 'email', name: 'email', label: 'E-mail', required: true }, { type: 'textarea', name: 'message', label: 'Bericht', required: true }], submit_text: 'Versturen', success_message: 'Bedankt voor je bericht!' },
        pricing: { title: 'Kies je plan', plans: [{ name: 'Start', price: '€29', features: ['Basisfuncties'], cta_text: 'Start nu', cta_url: '#' }] },
        blog: { title: 'Laatste artikelen', posts: [{ title: 'Nieuw artikel', excerpt: 'Schrijf hier een korte introductie.', date: '', url: '#' }] },
        faq: { title: 'Veelgestelde vragen', items: [{ question: 'Hoe werkt het?', answer: 'Geef hier een duidelijk antwoord.' }] },
        testimonials: { title: 'Wat klanten zeggen', items: [{ quote: 'Een korte klantreactie.', name: 'Naam klant', role: 'Functie' }] },
        cta: { title: 'Klaar om te beginnen?', text: 'Vertel bezoekers wat de volgende stap is.', button_text: 'Neem contact op', button_url: '#contact' },
        header: { logo: 'Jouw merk', links: [{ label: 'Home', url: '/' }, { label: 'Contact', url: '/contact' }], cta_text: 'Start gesprek', cta_url: '/contact' },
        footer: { text: 'Jouw merk - Samen maken we vooruitgang.', links: [{ label: 'Contact', url: '/contact' }] },
        auth: { mode: 'login', title: 'Welkom terug', subtitle: 'Log in om verder te gaan.', button_text: 'Inloggen' },
        dashboard: { title: 'Overzicht', stats: [{ label: 'Bezoekers', value: '1.240', change: '+12%' }], notice: 'Alles loopt volgens plan.' },
        notfound: { code: '404', title: 'Deze pagina bestaat niet', text: 'Ga terug naar de startpagina.', button_text: 'Terug naar home', button_url: '/' },
        divider: { variant: 'solid' },
        spacer: { size: 'md' }
      };
      return JSON.parse(JSON.stringify(defaults[type] || defaults.text));
    },

    blockLabel(type) {
      return { heading: 'Koptekst', text: 'Tekst', image: 'Afbeelding', button: 'Knop', link: 'Link', video: 'Video', container: 'Sectie', columns: 'Kolommen', hero: 'Hero-sectie', card: 'Kaart', gallery: 'Galerij', 'contact-form': 'Contactformulier', pricing: 'Prijstabel', blog: 'Blog', faq: 'Veelgestelde vragen', testimonials: 'Testimonials', cta: 'Call-to-action', header: 'Header', footer: 'Footer', auth: 'Login / registratie', dashboard: 'Dashboard', notfound: '404-pagina', divider: 'Scheidingslijn', spacer: 'Ruimte' }[type] || type;
    },

    blockSummary(block) {
      const content = block.content || {};
      return content.text || content.content || content.headline || content.title || '';
    },

    editBlock(block) {
      this.blockError = '';
      this.editingBlock = { ...block, content: JSON.parse(JSON.stringify(block.content || {})) };
    },

    async saveEditedBlock() {
      if (!this.editingBlock) return;
      this.blockError = '';
      this.loading = true;
      try {
        await this.api(`/api/pages/${this.builderPage.id}/blocks/${this.editingBlock.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ content: this.editingBlock.content })
        });
        this.editingBlock = null;
        await this.loadBlocks();
      } catch (e) {
        this.blockError = e.message;
      } finally {
        this.loading = false;
      }
    },

    async moveBlock(index, direction) {
      const target = index + direction;
      if (target < 0 || target >= this.blocks.length) return;
      const ids = this.blocks.map(b => b.id);
      [ids[index], ids[target]] = [ids[target], ids[index]];
      try {
        await this.api(`/api/pages/${this.builderPage.id}/blocks/reorder`, {
          method: 'POST',
          body: JSON.stringify({ blockIds: ids })
        });
        await this.loadBlocks();
      } catch (e) {
        this.blockError = e.message;
      }
    },

    async deleteBlock(block) {
      if (!confirm('Block verwijderen?')) return;
      try {
        await this.api(`/api/pages/${this.builderPage.id}/blocks/${block.id}`, { method: 'DELETE' });
        await this.loadBlocks();
      } catch (e) {
        this.blockError = e.message;
      }
    },

    async duplicateBlock(block) {
      this.blockError = '';
      try {
        await this.api(`/api/pages/${this.builderPage.id}/blocks/${block.id}/duplicate`, { method: 'POST' });
        await this.loadBlocks();
      } catch (e) {
        this.blockError = e.message;
      }
    },

    async downloadExport() {
      if (!this.currentProjectId) return;
      this.exportError = '';
      this.loading = true;
      try {
        const res = await fetch(`/api/projects/${this.currentProjectId}/export`, {
          credentials: 'same-origin',
          headers: { 'CSRF-Token': this.csrfToken }
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Exporteren mislukt');
        }
        const blob = await res.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${this.currentProject?.slug || 'website'}-export.zip`;
        link.click();
        URL.revokeObjectURL(link.href);
      } catch (e) {
        this.exportError = e.message;
      } finally {
        this.loading = false;
      }
    },

    // --- media ---
    async loadMedia() {
      const data = await this.api(`/api/projects/${this.currentProjectId}/media`);
      this.media = data.media;
    },

    async uploadMedia(event) {
      const file = event.target.files[0];
      if (!file) return;
      this.mediaError = '';

      const formData = new FormData();
      formData.append('file', file);

      try {
        const headers = {};
        if (this.csrfToken) headers['CSRF-Token'] = this.csrfToken;
        const res = await fetch(`/api/projects/${this.currentProjectId}/media`, {
          method: 'POST',
          credentials: 'same-origin',
          headers,
          body: formData
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Upload mislukt');
        await this.loadMedia();
      } catch (e) {
        this.mediaError = e.message;
      } finally {
        event.target.value = '';
      }
    },

    async deleteMedia(m) {
      if (!confirm(`"${m.original_name}" verwijderen?`)) return;
      try {
        await this.api(`/api/projects/${this.currentProjectId}/media/${m.id}`, { method: 'DELETE' });
        await this.loadMedia();
      } catch (e) {
        this.mediaError = e.message;
      }
    },

    // --- navigation ---
    async loadNavigation() {
      const data = await this.api(`/api/projects/${this.currentProjectId}/navigation`);
      this.navItemsList = data.items;
    },

    async createNavItem() {
      this.navError = '';
      this.loading = true;
      try {
        const payload = { label: this.newNavItem.label };
        if (this.newNavItem.page_id) payload.page_id = Number(this.newNavItem.page_id);
        if (this.newNavItem.url) payload.url = this.newNavItem.url;
        await this.api(`/api/projects/${this.currentProjectId}/navigation`, { method: 'POST', body: JSON.stringify(payload) });
        this.newNavItem = { label: '', page_id: '', url: '' };
        await this.loadNavigation();
      } catch (e) {
        this.navError = e.message;
      } finally {
        this.loading = false;
      }
    },

    async moveNavItem(index, direction) {
      const target = index + direction;
      if (target < 0 || target >= this.navItemsList.length) return;
      const ids = this.navItemsList.map(i => i.id);
      [ids[index], ids[target]] = [ids[target], ids[index]];
      try {
        await this.api(`/api/projects/${this.currentProjectId}/navigation/reorder`, {
          method: 'POST',
          body: JSON.stringify({ itemIds: ids })
        });
        await this.loadNavigation();
      } catch (e) {
        this.navError = e.message;
      }
    },

    async deleteNavItem(item) {
      try {
        await this.api(`/api/projects/${this.currentProjectId}/navigation/${item.id}`, { method: 'DELETE' });
        await this.loadNavigation();
      } catch (e) {
        this.navError = e.message;
      }
    },

    // --- design / site settings ---
    async loadDesign() {
      const data = await this.api(`/api/projects/${this.currentProjectId}/design`);
      this.designForm = data.design || {};
    },

    async saveDesign() {
      this.designError = '';
      this.loading = true;
      try {
        const { id, project_id, updated_at, ...payload } = this.designForm;
        payload.custom_css = payload.custom_css || '';
        const data = await this.api(`/api/projects/${this.currentProjectId}/design`, { method: 'PATCH', body: JSON.stringify(payload) });
        this.designForm = data.design;
      } catch (e) {
        this.designError = e.message;
      } finally {
        this.loading = false;
      }
    },

    async loadSiteSettings() {
      const data = await this.api(`/api/projects/${this.currentProjectId}/settings`);
      this.siteForm = data.settings || {};
    },

    async saveSiteSettings() {
      this.siteError = '';
      this.loading = true;
      try {
        const { id, project_id, updated_at, social_links, ...payload } = this.siteForm;
        const data = await this.api(`/api/projects/${this.currentProjectId}/settings`, { method: 'PATCH', body: JSON.stringify(payload) });
        this.siteForm = data.settings;
      } catch (e) {
        this.siteError = e.message;
      } finally {
        this.loading = false;
      }
    }
  };
}
