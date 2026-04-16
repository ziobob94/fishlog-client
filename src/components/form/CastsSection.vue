<template>
  <div class="flex flex-col gap-3">
    <div v-for="(cast, i) in modelValue" :key="i" class="card">
      <div class="flex items-center justify-between mb-3">
        <strong class="text-sm font-bold text-foam">Lancio {{ i + 1 }}</strong>
        <button type="button" class="btn btn-danger btn-sm" @click="remove(i)">✕ Rimuovi</button>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label>Distanza (m)</label>
          <input v-model.number="cast.distance" type="number" min="0" placeholder="es. 80" />
        </div>
        <div class="form-group">
          <label>Direzione</label>
          <input v-model="cast.direction" type="text" placeholder="es. parallela costa" />
        </div>
        <div class="form-group">
          <label>Montatura usata</label>
          <input v-model="cast.rig" type="text" placeholder="nome montatura" />
        </div>
        <div class="form-group">
          <label>Esca usata</label>
          <input v-model="cast.bait" type="text" placeholder="nome esca" />
        </div>
        <div class="form-group">
          <label>Risultato</label>
          <select v-model="cast.result">
            <option value="">--</option>
            <option value="cattura">Cattura</option>
            <option value="abboccata">Abboccata</option>
            <option value="niente">Niente</option>
          </select>
        </div>
        <div class="form-group">
          <label>Note</label>
          <input v-model="cast.notes" type="text" />
        </div>
      </div>
    </div>
    <button type="button" class="btn btn-ghost btn-sm self-start" @click="add">+ Aggiungi lancio</button>
  </div>
</template>

<script setup>
const props = defineProps({ modelValue: { type: Array, default: () => [] } })
const emit  = defineEmits(['update:modelValue'])
const empty  = () => ({ distance:null, direction:'', rig:'', bait:'', result:'', notes:'' })
const add    = () => emit('update:modelValue', [...props.modelValue, empty()])
const remove = i => emit('update:modelValue', props.modelValue.filter((_, idx) => idx !== i))
</script>