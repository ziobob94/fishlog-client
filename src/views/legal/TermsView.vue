<template>
  <div class="legal-page">
    <div class="card legal-card">
      <h1>Termini di Servizio</h1>
      <p class="legal-updated">Ultimo aggiornamento: 8 settembre 2026</p>

      <p v-if="legal.loaded && !legal.contactEmail" class="legal-placeholder-notice">
        ⚠️ L'email di contatto non è ancora stata compilata. Un amministratore può impostarla dal pannello
        Admin → Configurazioni → "Dati legali (Privacy/Termini)".
      </p>

      <h2>1. Oggetto</h2>
      <p>
        FishLog è una piattaforma social dedicata alla pesca che consente di registrare uscite di pesca,
        condividere post e foto, comunicare con altri utenti tramite chat, creare gruppi e pubblicare
        annunci di compravendita di materiale usato tra privati. Utilizzando il servizio accetti i presenti
        Termini e l'<RouterLink to="/privacy-policy">Informativa Privacy</RouterLink>.
      </p>

      <h2>2. Requisiti di accesso</h2>
      <p>
        L'iscrizione è consentita a chi ha compiuto almeno 14 anni. Se hai tra i 14 e i 17 anni, dichiari
        che chi esercita la responsabilità genitoriale su di te è a conoscenza dell'iscrizione e ne autorizza
        l'uso. È possibile registrare un solo account per persona e le credenziali di accesso non vanno
        condivise con terzi; sei responsabile di ogni attività svolta con il tuo account.
      </p>

      <h2>3. Contenuti pubblicati dagli utenti</h2>
      <p>
        Rimani proprietario dei contenuti che pubblichi (sessioni, foto, video, post, annunci, messaggi).
        Pubblicandoli su FishLog ci concedi una licenza non esclusiva, gratuita e limitata a ospitarli,
        conservarli e mostrarli agli altri utenti secondo le impostazioni di visibilità che scegli, per il
        solo scopo di erogare il servizio. Dichiari di possedere i diritti necessari sui contenuti caricati
        e di non violare diritti d'autore, marchi o diritti di terzi (incluso il diritto alla propria immagine
        di eventuali persone ritratte).
      </p>

      <h2>4. Condotta vietata</h2>
      <p>Non è consentito utilizzare FishLog per:</p>
      <ul>
        <li>pubblicare contenuti illegali, diffamatori, molesti, discriminatori o che violino diritti di terzi;</li>
        <li>promuovere o vendere specie ittiche protette, catture non conformi alle normative su taglie minime, periodi di fermo pesca o aree protette, o materiale la cui vendita è vietata dalla legge;</li>
        <li>inviare spam, contenuti fraudolenti o tentare di aggirare le misure di sicurezza della piattaforma;</li>
        <li>impersonare altre persone o creare account falsi.</li>
      </ul>
      <p>
        Puoi segnalare contenuti o utenti che violano questi Termini; i moderatori e gli amministratori
        possono rimuovere contenuti, sospendere o eliminare account che violano le regole della community.
      </p>

      <h2>5. Mercatino tra privati</h2>
      <p>
        La sezione "Market" consente agli utenti di pubblicare annunci di compravendita tra privati (o come
        "negozio" verificato). <strong>FishLog non è parte della compravendita</strong>: non gestisce
        pagamenti, spedizioni o consegne e non garantisce l'esistenza, la qualità, la sicurezza o la
        legalità degli oggetti annunciati. Ogni accordo, pagamento e consegna avviene direttamente e sotto
        la responsabilità di chi vende e chi acquista, nel rispetto delle norme applicabili (incluse quelle
        a tutela del consumatore, ove pertinenti). Ti invitiamo a adottare le normali precauzioni nelle
        transazioni con altri utenti.
      </p>

      <h2>6. Sospensione e cessazione</h2>
      <p>
        Puoi cancellare il tuo account in qualsiasi momento dalla pagina Profilo. Ci riserviamo il diritto
        di sospendere o eliminare account che violino in modo grave o ripetuto questi Termini, dandone
        comunicazione salvo i casi che richiedano un intervento immediato a tutela della sicurezza del
        servizio o di terzi.
      </p>

      <h2>7. Proprietà intellettuale della piattaforma</h2>
      <p>
        Il nome FishLog, il logo, l'interfaccia e il software sottostante sono di proprietà del Titolare del
        servizio o dei rispettivi licenzianti e non possono essere riprodotti senza autorizzazione.
      </p>

      <h2>8. Limitazione di responsabilità</h2>
      <p>
        Il servizio è fornito "così com'è". Pur adottando misure ragionevoli per garantirne sicurezza e
        continuità, non garantiamo che sia sempre privo di interruzioni o errori. Nei limiti consentiti
        dalla legge, non siamo responsabili per contenuti pubblicati da altri utenti né per le transazioni
        avvenute nel mercatino tra privati.
      </p>

      <h2>9. Modifiche ai Termini</h2>
      <p>
        Possiamo aggiornare questi Termini per riflettere modifiche al servizio o alla normativa applicabile.
        Le modifiche sostanziali ti saranno comunicate prima di diventare efficaci; l'uso continuato del
        servizio dopo la comunicazione costituisce accettazione dei nuovi Termini.
      </p>

      <h2>10. Legge applicabile</h2>
      <p>
        I presenti Termini sono regolati dalla legge italiana. Per gli utenti che rivestono la qualifica di
        consumatori resta fermo il foro del luogo di residenza o domicilio del consumatore, ove
        inderogabilmente previsto dalla legge.
      </p>

      <h2>11. Contatti</h2>
      <p>
        Per domande su questi Termini scrivi a <strong>{{ legal.contactEmailOrPlaceholder() }}</strong>.
      </p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useLegalStore } from '../../stores/legal.js'

const legal = useLegalStore()

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
