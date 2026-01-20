<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  upload: [data: string]
}>()

const isDragging = ref(false)
const isLoading = ref(false)
const error = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}

function handleDragLeave() {
  isDragging.value = false
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false

  const files = e.dataTransfer?.files
  const firstFile = files?.[0]
  if (firstFile) {
    processFile(firstFile)
  }
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  const files = target.files
  const firstFile = files?.[0]
  if (firstFile) {
    processFile(firstFile)
  }
}

function openFileDialog() {
  fileInput.value?.click()
}

async function processFile(file: File) {
  if (!file.name.endsWith('.ndjson') && !file.name.endsWith('.json')) {
    error.value = 'Please select a .ndjson or .json file'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const text = await file.text()
    emit('upload', text)
  } catch (e) {
    error.value = 'Error reading file'
    console.error(e)
  } finally {
    isLoading.value = false
  }
}

function loadSampleData() {
  const sampleData = [
    {
      day: '2025-01-15',
      user_login: 'sample-user',
      user_id: 12345,
      user_initiated_interaction_count: 25,
      code_generation_activity_count: 150,
      code_acceptance_activity_count: 45,
      totals_by_ide: [
        {
          ide: 'vscode',
          user_initiated_interaction_count: 25,
          code_generation_activity_count: 150,
          code_acceptance_activity_count: 45,
          loc_suggested_to_add_sum: 500,
          loc_suggested_to_delete_sum: 0,
          loc_added_sum: 200,
          loc_deleted_sum: 0
        }
      ],
      totals_by_feature: [
        {
          feature: 'code_completion',
          user_initiated_interaction_count: 0,
          code_generation_activity_count: 100,
          code_acceptance_activity_count: 30,
          loc_suggested_to_add_sum: 300,
          loc_suggested_to_delete_sum: 0,
          loc_added_sum: 120,
          loc_deleted_sum: 0
        },
        {
          feature: 'chat_panel_ask_mode',
          user_initiated_interaction_count: 25,
          code_generation_activity_count: 50,
          code_acceptance_activity_count: 15,
          loc_suggested_to_add_sum: 200,
          loc_suggested_to_delete_sum: 0,
          loc_added_sum: 80,
          loc_deleted_sum: 0
        }
      ],
      totals_by_language_feature: [
        {
          language: 'typescript',
          feature: 'code_completion',
          code_generation_activity_count: 80,
          code_acceptance_activity_count: 25,
          loc_suggested_to_add_sum: 250,
          loc_suggested_to_delete_sum: 0,
          loc_added_sum: 100,
          loc_deleted_sum: 0
        }
      ]
    }
  ]

  const ndjson = sampleData.map((item) => JSON.stringify(item)).join('\n')
  emit('upload', ndjson)
}

</script>

<template>
  <div class="upload-container">
    <div class="upload-hero">
      <div class="hero-icon">
        <svg viewBox="0 0 24 24" fill="currentColor" width="64" height="64">
          <path
            d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"
          />
        </svg>
      </div>
      <h1 class="hero-title">Copilot Metrics Dashboard</h1>
      <p class="hero-subtitle">
        Visualize and analyze GitHub Copilot adoption metrics across your teams
      </p>
    </div>

    <div
      class="upload-zone"
      :class="{ 'is-dragging': isDragging, 'is-loading': isLoading }"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
      @click="openFileDialog"
    >
      <input
        ref="fileInput"
        type="file"
        accept=".ndjson,.json"
        class="file-input"
        @change="handleFileSelect"
      />

      <div v-if="isLoading" class="upload-loading">
        <div class="loading-spinner"></div>
        <p>Loading data...</p>
      </div>

      <div v-else class="upload-content">
        <div class="upload-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <p class="upload-text">
          <strong>Drag and drop</strong> your metrics.ndjson file here
        </p>
        <p class="upload-hint">or click to select a file</p>
      </div>
    </div>

    <div v-if="error" class="upload-error">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path
          d="M8 0a8 8 0 100 16A8 8 0 008 0zm0 14.5a6.5 6.5 0 110-13 6.5 6.5 0 010 13zm-.75-2.25a.75.75 0 101.5 0 .75.75 0 00-1.5 0zM8 4a.75.75 0 00-.75.75v4.5a.75.75 0 001.5 0v-4.5A.75.75 0 008 4z"
        />
      </svg>
      {{ error }}
    </div>

    <div class="upload-divider">
      <span>or</span>
    </div>

    <button class="demo-button" @click="loadSampleData" :disabled="isLoading">
      <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
        <path
          d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8z"
        />
      </svg>
      Load sample data
    </button>

    <div class="upload-info">
      <h3>How to get your data?</h3>
      <p>
        Export your Copilot metrics via the GitHub API or enterprise dashboard:
      </p>
      <ol>
        <li>Access your organization's Copilot settings</li>
        <li>Download the usage report in NDJSON format</li>
        <li>Import the file above</li>
      </ol>
      <a
        href="https://docs.github.com/en/copilot/reference/copilot-usage-metrics"
        target="_blank"
        rel="noopener"
        class="info-link"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
          <path
            d="M8 0a8 8 0 110 16A8 8 0 018 0zM1.5 8a6.5 6.5 0 1013 0 6.5 6.5 0 00-13 0zm4.879-2.773l4.264 2.559a.25.25 0 010 .428l-4.264 2.559A.25.25 0 016 10.559V5.442a.25.25 0 01.379-.215z"
          />
        </svg>
        Documentation GitHub
      </a>
    </div>
  </div>
</template>

<style scoped>
.upload-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

.upload-hero {
  text-align: center;
  margin-bottom: 2rem;
}

.hero-icon {
  color: var(--color-text-primary);
  margin-bottom: 1rem;
}

.hero-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}

.hero-subtitle {
  font-size: 1rem;
  color: var(--color-text-secondary);
  max-width: 400px;
  margin: 0 auto;
}

.upload-zone {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: var(--color-bg-secondary);
}

.upload-zone:hover {
  border-color: var(--color-accent-blue);
  background-color: rgba(31, 111, 235, 0.05);
}

.upload-zone.is-dragging {
  border-color: var(--color-accent-green);
  background-color: rgba(35, 134, 54, 0.1);
}

.upload-zone.is-loading {
  pointer-events: none;
  opacity: 0.7;
}

.file-input {
  display: none;
}

.upload-icon {
  color: var(--color-text-muted);
  margin-bottom: 1rem;
}

.upload-icon svg {
  width: 48px;
  height: 48px;
}

.upload-text {
  font-size: 1rem;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}

.upload-hint {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.upload-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: var(--color-text-secondary);
}

.upload-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  margin-top: 1rem;
  background-color: rgba(248, 81, 73, 0.1);
  border: 1px solid var(--color-accent-red);
  border-radius: var(--radius-md);
  color: var(--color-accent-red);
  font-size: 0.875rem;
}

.upload-divider {
  display: flex;
  align-items: center;
  margin: 1.5rem 0;
  color: var(--color-text-muted);
}

.upload-divider::before,
.upload-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background-color: var(--color-border);
}

.upload-divider span {
  padding: 0 1rem;
  font-size: 0.875rem;
}

.demo-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.875rem 1.5rem;
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.demo-button:hover:not(:disabled) {
  background-color: var(--color-accent-blue);
  border-color: var(--color-accent-blue);
}

.demo-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.upload-info {
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.upload-info h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.75rem;
}

.upload-info p {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.75rem;
}

.upload-info ol {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  padding-left: 1.25rem;
  margin-bottom: 1rem;
}

.upload-info li {
  margin-bottom: 0.25rem;
}

.info-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--color-accent-blue);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
}

.info-link:hover {
  text-decoration: underline;
}
</style>
