<template>
  <div class="bg-surface-2 border border-border rounded-sm overflow-auto">
    <div class="casts-row border-b border-border text-muted text-[0.72rem] font-bold uppercase tracking-wide">
      <span>{{ t('castsTable.distance') }}</span><span>{{ t('castsTable.direction') }}</span><span>{{ t('castsTable.bait') }}</span><span>{{ t('castsTable.rig') }}</span><span>{{ t('castsTable.result') }}</span>
    </div>
    <div
      v-for="(c, i) in casts"
      :key="i"
      class="casts-row border-b border-border last:border-b-0 text-sm hover:bg-surface transition-colors"
    >
      <span class="font-mono text-ocean">{{ c.distance != null ? `${c.distance}m` : t('common.none') }}</span>
      <span class="text-foam">{{ c.direction || t('common.none') }}</span>
      <span class="text-foam">{{ c.bait || t('common.none') }}</span>
      <span class="text-foam">{{ c.rig || t('common.none') }}</span>
      <span>
        <span v-if="c.result" class="badge" :class="resultBadge(c.result)">{{ c.result }}</span>
        <span v-else class="text-muted">{{ t('common.none') }}</span>
      </span>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
defineProps({ casts: { type: Array, required: true } })
const resultBadge = r => ({ cattura:'badge-success', abboccata:'badge-sand', niente:'' }[r] || '')
</script>

<style scoped>
.casts-row {
  display: grid;
  grid-template-columns: 90px 1fr 1fr 1fr 100px;
  gap: 0.5rem;
  padding: 0.5rem 0.85rem;
}
@media (max-width: 768px) {
  .casts-row { grid-template-columns: 70px 1fr 1fr; }
  .casts-row span:nth-child(n+4) { display: none; }
}
</style>