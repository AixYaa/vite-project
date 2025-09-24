<script lang="ts" setup>
import LeftView from './leftView/FromView.vue'
import RightView from './rightView/RightView.vue';
</script>

<template>
    <div class="loginView">
        <LeftView />
        <RightView />
    </div>

</template>

<style scoped>
.loginView {
    display: flex;
    width: 100%;
    height: 100vh;
}
/* 左1 右3 */
.loginView > :first-child {
    flex: 1;
}
.loginView > :last-child {
    flex: 4;
}
</style>