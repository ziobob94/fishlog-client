<template>
  <div class="legal-page">
    <div class="card legal-card">
      <h1>Cookie Policy</h1>
      <p class="legal-updated">Ultimo aggiornamento: 8 settembre 2026</p>

      <h2>1. Cosa usiamo</h2>
      <p>
        FishLog non utilizza cookie di profilazione, pubblicitari o di tracciamento di terze parti.
        Utilizziamo esclusivamente lo <strong>storage locale del browser</strong> (localStorage) per far
        funzionare l'applicazione:
      </p>
      <ul>
        <li><strong>Sessione di accesso</strong> — il token che ti mantiene collegato al tuo account, così non devi effettuare il login a ogni visita.</li>
        <li><strong>Preferenza tema</strong> — se hai scelto la modalità chiara o scura.</li>
        <li><strong>Preferenze di interfaccia</strong> — ad esempio se la barra laterale è "bloccata" aperta.</li>
      </ul>
      <p>
        Questi dati sono <strong>tecnici e strettamente necessari</strong> al funzionamento del servizio:
        secondo la normativa vigente non richiedono il tuo consenso preventivo, ma abbiamo comunque il
        dovere di informarti del loro utilizzo.
      </p>

      <h2>2. Nessun tracciamento di terze parti</h2>
      <p>
        Non sono attualmente integrati strumenti di analytics, pubblicità o pixel di terze parti. Se in
        futuro dovessimo introdurne, questa pagina sarà aggiornata e — dove richiesto dalla legge — ti
        chiederemo un consenso esplicito prima di attivarli.
      </p>

      <h2>3. Come gestire lo storage locale</h2>
      <p>
        Puoi cancellare in qualsiasi momento i dati salvati nel browser dalle impostazioni del browser
        stesso ("cancella dati di navigazione" / "svuota storage del sito"). Tieni presente che cancellando
        il token di accesso verrai disconnesso da FishLog e dovrai effettuare nuovamente il login.
      </p>

      <h2>4. Ulteriori informazioni</h2>
      <p>
        Per i dettagli su come trattiamo i tuoi dati personali consulta l'
        <RouterLink to="/privacy-policy">Informativa Privacy</RouterLink>.
      </p>
    </div>
  </div>
</template>

<style scoped>
.legal-page  { @apply flex justify-center; }
.legal-card  { @apply max-w-2xl w-full p-6 sm:p-8; }
.legal-card h1 { @apply text-2xl font-extrabold mb-1; }
.legal-updated { @apply text-muted text-xs mb-4; }
.legal-card h2 { @apply text-base font-bold mt-6 mb-2 text-foam; }
.legal-card p  { @apply text-sm leading-relaxed mb-3 text-muted; }
.legal-card ul { @apply list-disc pl-5 text-sm leading-relaxed mb-3 text-muted; }
.legal-card li { @apply mb-1.5; }
.legal-card a  { @apply text-ocean hover:underline; }
</style>
