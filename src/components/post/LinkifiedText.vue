<template>
  <!-- Nessun v-html: il testo resta testo, solo i #tag diventano link al feed filtrato -->
  <span><template v-for="(p, i) in parts" :key="i"><RouterLink v-if="p.tag" :to="{ path: '/feed', query: { tag: p.tag } }" class="hashtag-link">{{ p.text }}</RouterLink><template v-else>{{ p.text }}</template></template></span>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { splitHashtags } from '../../utils/hashtags.js'

const props = defineProps({ text: { type: String, default: '' } })
const parts = computed(() => splitHashtags(props.text))
</script>

<style scoped>
.hashtag-link { @apply no-underline text-ocean-text font-semibold; }
.hashtag-link:hover { @apply underline; }
</style>
