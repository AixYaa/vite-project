<template>
    <div class="rightView">
    </div>
</template>

<script setup lang="ts">

</script>

<style scoped>
.rightView {
    background-image: url('https://picsum.photos/800/600');
    background-size: cover;
    background-position: center;
    height: 100vh;
}
/* Ensure theme change affects this view so the view-transition has visual diff */
:global(html.dark) .rightView {
    filter: brightness(0.75);
}
:global(html[data-theme='day']) .rightView {
    filter: none;
}
</style>