<template>
  <div class="password-input">
    <input
      :type="visible ? 'text' : 'password'"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <button
      type="button"
      class="toggle-btn"
      :aria-label="visible ? t('common.hidePassword') : t('common.showPassword')"
      tabindex="-1"
      @click="visible = !visible"
    >
      <EyeOff v-if="visible" :size="18" />
      <Eye v-else :size="18" />
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Eye, EyeOff } from 'lucide-vue-next'

const { t } = useI18n()
const visible = ref(false)

defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  required: { type: Boolean, default: false }
})
defineEmits(['update:modelValue'])
</script>

<style scoped>
.password-input { @apply relative flex items-center; }
.password-input input { @apply w-full pr-10; }
.toggle-btn {
  @apply absolute right-2 flex items-center justify-center text-muted;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}
.toggle-btn:hover { @apply text-ocean; }
</style>
