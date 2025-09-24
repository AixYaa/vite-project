<script setup lang="ts">
import Tool from './components/SwitchUI/ToolView.vue';
import { useUiModelStore } from './stores/uiModel';
import { RouterView } from 'vue-router';

const uiModelStore = useUiModelStore();

// Initialize theme as early as possible (before mount)
const storedTheme =
  (typeof window !== 'undefined' && (localStorage.getItem('ui-theme') || localStorage.getItem('theme'))) || '';
const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
const initialTheme = storedTheme === 'dark'
  ? 'dark'
  : storedTheme === 'day'
    ? 'day'
    : (prefersDark ? 'dark' : 'day');

document.documentElement.setAttribute('data-theme', initialTheme);
uiModelStore.setUiModel(initialTheme);
try { localStorage.setItem('ui-theme', initialTheme); } catch { }
// Also toggle Element Plus dark class
document.documentElement.classList.toggle('dark', initialTheme === 'dark');
</script>

<template>
  <div id="app">
    <Tool z-index='999999' />
    <RouterView />
  </div>
</template>
<style scoped></style>
