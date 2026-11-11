<template>
  <div class="wx-sk" aria-busy="true">
    <p class="wx-sr" role="status">{{ t('weather.loading') }}</p>
    <div class="wx-block"><div class="m-skeleton" style="height:22px;width:40%"></div><div class="m-skeleton" style="height:52px;width:55%;margin-top:14px"></div><div class="m-skeleton" style="height:70px;margin-top:14px"></div></div>
    <div class="wx-block"><div class="m-skeleton" style="height:22px;width:30%"></div><div class="m-skeleton" style="height:90px;margin-top:14px"></div></div>
    <div class="wx-block"><div class="m-skeleton" style="height:22px;width:35%"></div><div class="m-skeleton" style="height:100px;margin-top:14px"></div></div>
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
