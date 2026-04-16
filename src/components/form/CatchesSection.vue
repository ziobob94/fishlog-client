<template>
  <div class="flex flex-col gap-3">
    <div v-for="(c, i) in modelValue" :key="i" class="card border-ocean/25">
      <div class="flex items-center justify-between mb-3">
        <strong class="text-sm font-bold text-ocean">Cattura {{ i + 1 }}</strong>
        <button type="button" class="btn btn-danger btn-sm" @click="remove(i)">✕ Rimuovi</button>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label>Specie *</label>
          <input v-model="c.species" type="text" placeholder="es. Spigola, Orate, Rombo" required />
        </div>
        <div class="form-group">
          <label>Peso (kg)</label>
          <input v-model.number="c.weightKg" type="number" step="0.01" min="0" />
        </div>
        <div class="form-group">
          <label>Lunghezza (cm)</label>
          <input v-model.number="c.lengthCm" type="number" step="0.5" min="0" />
        </div>
        <div class="form-group">
          <label>Ora cattura</label>
          <input v-model="c.time" type="time" />
        </div>
        <div class="form-group">
          <label>Distanza (m)</label>
          <input v-model.number="c.distance" type="number" min="0" />
        </div>
        <div class="form-group">
          <label>Rilasciata</label>
          <select v-model="c.released">
            <option :value="false">No (tenuta)</option>
            <option :value="true">Sì (rilasciata)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Esca usata</label>
          <input v-model="c.baitUsed" type="text" />
        </div>
        <div class="form-group">
          <label>Montatura usata</label>
          <input v-model="c.rigUsed" type="text" />
        </div>
        <div class="form-group full">
          <label>Note</label>
          <input v-model="c.notes" type="text" placeholder="Dove esattamente, canna usata..." />
        </div>
      </div>
    </div>
    <button type="button" class="btn btn-ghost btn-sm self-start" @click="add">+ Aggiungi cattura</button>
  </div>
</template>

<script setup>
const props = defineProps({ modelValue: { type: Array, default: () => [] } })
const emit  = defineEmits(['update:modelValue'])
const empty  = () => ({ species:'', weightKg:null, lengthCm:null, time:'', distance:null, released:false, baitUsed:'', rigUsed:'', notes:'' })
const add    = () => emit('update:modelValue', [...props.modelValue, empty()])
const remove = i => emit('update:modelValue', props.modelValue.filter((_, idx) => idx !== i))
</script>