<template>
  <div class="flex flex-col gap-3">
    <div v-for="(rig, i) in modelValue" :key="i" class="card">
      <div class="flex items-center justify-between mb-3">
        <strong class="text-sm font-bold text-foam">Montatura {{ i + 1 }}</strong>
        <button type="button" class="btn btn-danger btn-sm" @click="remove(i)">✕ Rimuovi</button>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label>Nome *</label>
          <input v-model="rig.name" type="text" placeholder="es. Paternoster, Piombo fisso" required />
        </div>
        <div class="form-group">
          <label>Tipo</label>
          <input v-model="rig.type" type="text" placeholder="es. surfcasting, feeder" />
        </div>
        <div class="form-group">
          <label>Misura amo</label>
          <input v-model="rig.hookSize" type="text" placeholder="es. 1/0, 2, 4" />
        </div>
        <div class="form-group">
          <label>Tipo amo</label>
          <input v-model="rig.hookType" type="text" placeholder="es. Aberdeen, Limerick" />
        </div>
        <div class="form-group">
          <label>Piombo (g)</label>
          <input v-model.number="rig.sinkerWeight" type="number" min="0" />
        </div>
        <div class="form-group">
          <label>Tipo piombo</label>
          <input v-model="rig.sinkerType" type="text" placeholder="es. ancora, fisso" />
        </div>
        <div class="form-group">
          <label>Filo principale (lb)</label>
          <input v-model.number="rig.lineMainLb" type="number" step="0.1" min="0" />
        </div>
        <div class="form-group">
          <label>Terminale (lb)</label>
          <input v-model.number="rig.leaderLb" type="number" step="0.1" min="0" />
        </div>
        <div class="form-group">
          <label>Girella</label>
          <input v-model="rig.swivel" type="text" placeholder="es. rolling n°8" />
        </div>
        <div class="form-group full">
          <label>Note</label>
          <input v-model="rig.notes" type="text" placeholder="Dettagli costruzione..." />
        </div>
      </div>
    </div>
    <button type="button" class="btn btn-ghost btn-sm self-start" @click="add">+ Aggiungi montatura</button>
  </div>
</template>

<script setup>
const props = defineProps({ modelValue: { type: Array, default: () => [] } })
const emit  = defineEmits(['update:modelValue'])
const empty  = () => ({ name:'', type:'', hookSize:'', hookType:'', sinkerWeight:null, sinkerType:'', lineMainLb:null, leaderLb:null, swivel:'', notes:'' })
const add    = () => emit('update:modelValue', [...props.modelValue, empty()])
const remove = i => emit('update:modelValue', props.modelValue.filter((_, idx) => idx !== i))
</script>