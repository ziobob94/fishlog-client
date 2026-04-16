<template>
  <div class="flex flex-col gap-3">
    <div v-for="(bait, i) in modelValue" :key="i" class="card">
      <div class="flex items-center justify-between mb-3">
        <strong class="text-sm font-bold text-foam">Esca {{ i + 1 }}</strong>
        <button type="button" class="btn btn-danger btn-sm" @click="remove(i)">✕ Rimuovi</button>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label>Nome *</label>
          <input v-model="bait.name" type="text" placeholder="es. Arenicola, Calamaro" required />
        </div>
        <div class="form-group">
          <label>Tipo</label>
          <select v-model="bait.type">
            <option value="">--</option>
            <option value="naturale">Naturale</option>
            <option value="artificiale">Artificiale</option>
            <option value="misto">Misto</option>
          </select>
        </div>
        <div class="form-group">
          <label>Presentazione</label>
          <input v-model="bait.presentation" type="text" placeholder="es. intera, a pezzi" />
        </div>
        <div class="form-group">
          <label>Note</label>
          <input v-model="bait.notes" type="text" placeholder="Fresca, surgelata..." />
        </div>
      </div>
    </div>
    <button type="button" class="btn btn-ghost btn-sm self-start" @click="add">+ Aggiungi esca</button>
  </div>
</template>

<script setup>
const props = defineProps({ modelValue: { type: Array, default: () => [] } })
const emit  = defineEmits(['update:modelValue'])
const add    = () => emit('update:modelValue', [...props.modelValue, { name:'', type:'', presentation:'', notes:'' }])
const remove = i => emit('update:modelValue', props.modelValue.filter((_, idx) => idx !== i))
</script>