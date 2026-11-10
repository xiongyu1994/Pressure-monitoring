<!-- src/App.vue -->
<template>
  <n-config-provider :locale="zhCN" :date-locale="dateZhCN">
    <n-message-provider>
  <div class="layout">
    <!-- 左侧侧边栏 -->
    <!-- <aside class="sidebar">
      <div class="logo">压力监控系统</div>
      <nav>
        <router-link to="/home" class="nav-item">
          🌡️ 传感器压力监测
        </router-link>
        <router-link to="/pressure" class="nav-item">
          📈 普通压力
        </router-link>
        
      </nav>
    </aside> -->

    <!-- 右侧主内容区 -->
    <main class="content">
      <router-view></router-view>
    </main>
  </div>
  </n-message-provider>
  </n-config-provider>
</template>

<script setup>
// 引入需要的组件和中文包
import { NConfigProvider, NMessageProvider, zhCN, dateZhCN } from 'naive-ui'
</script>
<style>
body { margin: 0; padding: 0; font-family: system-ui; }
.layout { display: flex; height: 100vh; overflow: hidden; }

/* 侧边栏 */
.sidebar { width: 220px; background: #001529; color: white; display: flex; flex-direction: column; }
.logo { padding: 20px; font-size: 18px; font-weight: bold; text-align: center; background: #002140; color: #fff; }
.sidebar nav { display: flex; flex-direction: column; padding-top: 10px; }
.nav-item { color: #a6adb4; text-decoration: none; padding: 15px 24px; transition: all 0.3s; font-size: 15px; }
.nav-item:hover { color: #fff; background: #1890ff; }
.nav-item.router-link-active { color: #fff; background: #1890ff; border-right: 4px solid #faad14; }

/* 内容区 */
.content { flex: 1; overflow-y: auto; background-color: #f0f2f5; }
</style>