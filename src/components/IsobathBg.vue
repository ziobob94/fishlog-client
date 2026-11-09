<template>
  <!-- Isobate: curve di livello in alto a destra. Mettere dentro un contenitore position:relative; overflow:hidden. -->
  <svg class="isobath" viewBox="0 0 400 240" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
    <g fill="none" stroke="rgb(var(--color-ocean-text))" stroke-width="1.5" stroke-linejoin="round">
      <path opacity=".12" d="M250-10c80 0 160 45 170 120s-40 140-120 150-170-20-190-100S170-10 250-10Z" />
      <path opacity=".2"  d="M255 14c60 0 125 38 132 96s-30 110-95 124-135-12-152-80S198 14 255 14Z" />
      <path opacity=".3"  d="M260 40c40 0 80 30 85 70s-20 80-70 90-100-10-110-55 55-105 95-105Z" />
      <path opacity=".42" d="M262 66c28 0 55 22 58 50s-14 56-48 62-70-8-76-38 38-74 66-74Z" />
    </g>
  </svg>
</template>

<style scoped>
.isobath { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
</style>
