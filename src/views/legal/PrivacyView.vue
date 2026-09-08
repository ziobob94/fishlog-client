<template>
  <div class="legal-page">
    <div class="card legal-card">
      <h1>Informativa sulla Privacy</h1>
      <p class="legal-updated">Ultimo aggiornamento: 8 settembre 2026</p>

      <p v-if="legal.loaded && !legalComplete" class="legal-placeholder-notice">
        ⚠️ I dati del Titolare del trattamento non sono ancora stati compilati. Un amministratore può
        impostarli dal pannello Admin → Configurazioni → "Dati legali (Privacy/Termini)".
      </p>

      <h2>1. Titolare del trattamento</h2>
      <p>
        Il Titolare del trattamento dei dati raccolti tramite FishLog è
        <strong>{{ legal.companyNameOrPlaceholder() }}</strong>, con sede in
        <strong>{{ legal.addressOrPlaceholder() }}</strong>, [Codice Fiscale / P.IVA: {{ legal.taxIdOrPlaceholder() }}].
        Per qualsiasi richiesta relativa al trattamento dei dati personali è possibile scrivere a
        <strong>{{ legal.contactEmailOrPlaceholder() }}</strong>.
      </p>

      <h2>2. Dati raccolti</h2>
      <p>Nell'ambito del servizio raccogliamo le seguenti categorie di dati:</p>
      <ul>
        <li><strong>Dati account:</strong> email, nome visualizzato, password (salvata in forma crittografata, mai in chiaro), avatar.</li>
        <li><strong>Dati di accesso social:</strong> se scegli di accedere con Google o Facebook, riceviamo identificativo, nome, email e immagine profilo dal provider scelto.</li>
        <li><strong>Contenuti generati dall'utente:</strong> sessioni di pesca (data, tecnica, catture, note), foto e video caricati, post in bacheca, annunci nel mercatino, messaggi di chat privata, gruppi e amicizie.</li>
        <li><strong>Dati di posizione:</strong> le coordinate geografiche e il nome del luogo indicati volontariamente per una sessione di pesca o un annuncio. Non raccogliamo la posizione del dispositivo in automatico.</li>
        <li><strong>Dati tecnici:</strong> indirizzo IP, log di accesso e log applicativi, raccolti per finalità di sicurezza (prevenzione di abusi, frodi, accessi non autorizzati) e conservati per il tempo strettamente necessario.</li>
      </ul>

      <h2>3. Finalità e base giuridica del trattamento</h2>
      <ul>
        <li><strong>Erogazione del servizio</strong> (creazione account, gestione sessioni/post/annunci/chat) — base giuridica: esecuzione del contratto (art. 6.1.b GDPR).</li>
        <li><strong>Accesso tramite Google/Facebook</strong> — base giuridica: consenso (art. 6.1.a GDPR), prestato scegliendo di autenticarti con quel provider.</li>
        <li><strong>Comunicazioni di servizio</strong> (email di benvenuto, conferma email, reset password, avvisi di sicurezza, notifiche opzionali) — base giuridica: esecuzione del contratto e, per le notifiche opzionali, consenso revocabile dalle impostazioni del profilo.</li>
        <li><strong>Sicurezza e prevenzione abusi</strong> (rate limiting, log, moderazione dei contenuti) — base giuridica: legittimo interesse del Titolare (art. 6.1.f GDPR) a garantire un servizio sicuro.</li>
      </ul>

      <h2>4. Destinatari e trasferimento dei dati</h2>
      <p>I dati possono essere condivisi, nei limiti strettamente necessari, con:</p>
      <ul>
        <li>fornitori tecnici che erogano infrastruttura di hosting ed email transazionali (in qualità di responsabili del trattamento);</li>
        <li>Google LLC e Meta Platforms Inc., limitatamente all'autenticazione OAuth, se scegli di usarla;</li>
        <li>eBay, se l'integrazione di ricerca annunci comparabili nel mercatino è attiva sul tuo account negozio.</li>
      </ul>
      <p>
        I server dell'applicazione sono ospitati in Italia/UE. Google e Meta possono trattare i dati minimi
        necessari all'autenticazione anche al di fuori dello Spazio Economico Europeo, nell'ambito dei
        rispettivi programmi di conformità (es. Data Privacy Framework UE-USA) o di clausole contrattuali
        standard. Non vendiamo né cediamo i tuoi dati a terzi per finalità di marketing.
      </p>

      <h2>5. Periodo di conservazione</h2>
      <p>
        I dati sono conservati per tutta la durata dell'account. Alla cancellazione dell'account (disponibile
        in autonomia dalla pagina Profilo), sessioni, post, media, messaggi inviati e relazioni di amicizia
        collegate vengono eliminati, salvi gli obblighi di conservazione previsti dalla legge (es. log di
        sicurezza per un periodo limitato).
      </p>

      <h2>6. I tuoi diritti</h2>
      <p>In qualità di interessato hai diritto di:</p>
      <ul>
        <li>accedere ai tuoi dati ed esportarli in formato leggibile (funzione "Esporta i miei dati" nel Profilo);</li>
        <li>rettificare i dati inesatti direttamente dal Profilo;</li>
        <li>cancellare il tuo account e i dati collegati (funzione "Elimina account" nel Profilo);</li>
        <li>opporti od ottenere la limitazione di un trattamento;</li>
        <li>revocare in ogni momento un consenso prestato (es. disattivando il login social o le notifiche email);</li>
        <li>proporre reclamo al Garante per la protezione dei dati personali (<a href="https://www.garanteprivacy.it" target="_blank" rel="noopener">www.garanteprivacy.it</a>).</li>
      </ul>
      <p>
        Per esercitare i diritti non disponibili in autonomia dal Profilo, scrivi a
        <strong>{{ legal.contactEmailOrPlaceholder() }}</strong>.
      </p>

      <h2>7. Minori</h2>
      <p>
        L'iscrizione a FishLog è consentita a chi ha compiuto almeno 14 anni. Se hai tra i 14 e i 17 anni,
        l'iscrizione presuppone che chi esercita la responsabilità genitoriale ne sia a conoscenza e abbia
        prestato il consenso richiesto dalla legge per il trattamento dei tuoi dati.
      </p>

      <h2>8. Sicurezza</h2>
      <p>
        Le password sono conservate con hashing crittografico (bcrypt) e mai in chiaro. L'accesso alle
        funzioni amministrative è limitato per ruolo, le richieste sono soggette a limitazione di frequenza
        (rate limiting) per contrastare tentativi di accesso non autorizzati, e le comunicazioni con il
        server dovrebbero avvenire sempre tramite connessione cifrata (HTTPS).
      </p>

      <h2>9. Cookie e tecnologie simili</h2>
      <p>
        Per i dettagli su cookie e storage locale del browser utilizzati da FishLog, consulta la
        <RouterLink to="/cookie-policy">Cookie Policy</RouterLink>.
      </p>

      <h2>10. Modifiche a questa informativa</h2>
      <p>
        Eventuali modifiche sostanziali a questa informativa saranno comunicate agli utenti tramite
        notifica in-app o email prima di diventare efficaci.
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useLegalStore } from '../../stores/legal.js'

const legal = useLegalStore()
const legalComplete = computed(() =>
  !!(legal.companyName && legal.address && legal.taxId && legal.contactEmail)
)

onMounted(() => {
  if (!legal.loaded) legal.fetchLegalInfo()
})
</script>

<style scoped>
.legal-page  { @apply flex justify-center; }
.legal-card  { @apply max-w-2xl w-full p-6 sm:p-8; }
.legal-card h1 { @apply text-2xl font-extrabold mb-1; }
.legal-updated { @apply text-muted text-xs mb-4; }
.legal-placeholder-notice {
  @apply bg-sand/10 border border-sand text-sand text-sm rounded-sm px-3 py-2 mb-5;
}
.legal-card h2 { @apply text-base font-bold mt-6 mb-2 text-foam; }
.legal-card p  { @apply text-sm leading-relaxed mb-3 text-muted; }
.legal-card ul { @apply list-disc pl-5 text-sm leading-relaxed mb-3 text-muted; }
.legal-card li { @apply mb-1.5; }
.legal-card a  { @apply text-ocean hover:underline; }
</style>
