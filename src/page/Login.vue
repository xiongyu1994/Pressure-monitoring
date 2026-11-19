<template>
  <div class="login-page">
    <!-- 左侧品牌区 -->
    <div class="brand-panel">
      <div class="brand-inner">
        <div class="brand-mark">
          <span class="mark-ring"></span>
          <span class="mark-core"></span>
        </div>
        <p class="brand-eyebrow">PRESSURE MONITORING SYSTEM</p>
        <h1>压力智能监控系统</h1>
        <p class="brand-desc">安全阀校验 · 实时压力采集 · 数据报告导出</p>

        <div class="brand-features">
          <div class="feature"><span class="feature-dot"></span>Modbus RTU 实时数据采集</div>
          <div class="feature"><span class="feature-dot"></span>压力曲线与超压报警</div>
          <div class="feature"><span class="feature-dot"></span>校验记录与 PDF 报告</div>
        </div>

        <p class="brand-foot">本地单机版 · 请授权后使用</p>
      </div>
    </div>

    <!-- 右侧表单区 -->
    <div class="form-panel">
      <div class="login-card">
        <div class="card-head">
          <h2>用户登录</h2>
          <p>请输入账号信息以进入监控系统</p>
        </div>

        <form @submit.prevent="handleLogin">
          <label class="field">
            <span class="field-label">用户名</span>
            <div class="input-wrap" :class="{ focused: focusField === 'username' }">
              <svg class="field-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 20a8 8 0 0 1 16 0" />
              </svg>
              <input
                v-model="form.username"
                type="text"
                autocomplete="username"
                placeholder="请输入用户名"
                @focus="focusField = 'username'"
                @blur="focusField = ''"
              />
            </div>
          </label>

          <label class="field">
            <span class="field-label">密码</span>
            <div class="input-wrap" :class="{ focused: focusField === 'password' }">
              <svg class="field-icon" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="4" y="10" width="16" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="请输入密码"
                @focus="focusField = 'password'"
                @blur="focusField = ''"
              />
              <button
                type="button"
                class="eye-btn"
                :aria-label="showPassword ? '隐藏密码' : '显示密码'"
                @click="showPassword = !showPassword"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
                  <circle cx="12" cy="12" r="2.6" />
                </svg>
              </button>
            </div>
          </label>

          <div class="form-row">
            <label class="remember">
              <input v-model="form.remember" type="checkbox" />
              <span>记住登录状态</span>
            </label>
          </div>

          <p v-if="errorMsg" class="error-banner">{{ errorMsg }}</p>

          <button class="submit-btn" type="submit" :disabled="loading">
            {{ loading ? '正在登录...' : '登 录' }}
          </button>
        </form>

        <div class="card-foot">
          <template v-if="isRemoteAuth">
            <p>已连接后端 · C 端设备操作员登录</p>
            <p class="hint">{{ authApiBase }}/c/login</p>
          </template>
          <template v-else>
            <p>默认账号 <b>admin</b> / <b>admin123</b></p>
            <p class="hint">本地模式 · 配置 VITE_API_BASE 后接入后端</p>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { loginApi, isRemoteAuth, authApiBase } from '@/api/auth'
import { useAuthStore } from '@/store/useAuthStore'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const form = reactive({ username: '', password: '', remember: true })
const loading = ref(false)
const errorMsg = ref('')
const showPassword = ref(false)
const focusField = ref('')

const handleLogin = async () => {
  if (loading.value) return
  errorMsg.value = ''

  if (!form.username.trim()) {
    errorMsg.value = '请输入用户名'
    return
  }
  if (!form.password) {
    errorMsg.value = '请输入密码'
    return
  }

  loading.value = true
  try {
    const user = await loginApi({ username: form.username, password: form.password })
    auth.login({ ...user, remember: form.remember })

    // 只接受站内路径，避免 redirect 参数被塞入外部地址
    const raw = route.query.redirect
    const redirect =
      typeof raw === 'string' && raw.startsWith('/') && !raw.startsWith('//')
        ? raw
        : '/home'
    router.replace(redirect)
  } catch (err) {
    errorMsg.value = err.message || '登录失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 100vh;
  background: #eef1f5;
  color-scheme: light;
  color: #213547;
  font-family: Inter, system-ui, "Microsoft YaHei", sans-serif;
}

/* ---------- 左侧品牌区 ---------- */
.brand-panel {
  flex: 1.05;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2f4055;
  position: relative;
  overflow: hidden;
}

.brand-panel::after {
  content: "";
  position: absolute;
  right: -140px;
  bottom: -180px;
  width: 460px;
  height: 460px;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 50%;
  box-shadow: 0 0 0 70px rgba(255, 255, 255, 0.025),
              0 0 0 140px rgba(255, 255, 255, 0.018);
}

.brand-inner {
  position: relative;
  z-index: 1;
  width: 78%;
  max-width: 460px;
  color: #ffffff;
}

.brand-mark {
  position: relative;
  width: 54px;
  height: 54px;
  margin-bottom: 34px;
}

.mark-ring {
  position: absolute;
  inset: 0;
  border: 2px solid #7fd4a8;
  border-radius: 50%;
}

.mark-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 14px;
  height: 14px;
  margin: -7px 0 0 -7px;
  background: #7fd4a8;
  border-radius: 50%;
}

.brand-eyebrow {
  margin: 0 0 12px;
  font-size: 12px;
  letter-spacing: 2.4px;
  color: #8fa5bd;
}

.brand-inner h1 {
  margin: 0;
  font-size: 34px;
  font-weight: 500;
  letter-spacing: 2px;
}

.brand-desc {
  margin: 14px 0 0;
  font-size: 14px;
  color: #b8c8da;
}

.brand-features {
  margin-top: 48px;
  padding-top: 26px;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.feature {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #cfdae7;
}

.feature-dot {
  width: 6px;
  height: 6px;
  background: #7fd4a8;
  border-radius: 50%;
  flex-shrink: 0;
}

.brand-foot {
  margin-top: 56px;
  font-size: 12px;
  color: #8096ae;
}

/* ---------- 右侧表单区 ---------- */
.form-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
}

.login-card {
  width: 100%;
  max-width: 380px;
  padding: 38px 34px 30px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 14px 44px rgba(24, 38, 56, 0.13);
}

.card-head h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 500;
  color: #213547;
}

.card-head p {
  margin: 8px 0 30px;
  font-size: 13px;
  color: #7b8896;
}

.field {
  display: block;
  margin-bottom: 20px;
}

.field-label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: #3c4c5c;
}

.input-wrap {
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 12px;
  border: 1px solid #d9dfe6;
  border-radius: 6px;
  background: #fbfcfd;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input-wrap.focused {
  border-color: #4a5e76;
  box-shadow: 0 0 0 3px rgba(74, 94, 118, 0.12);
}

.field-icon {
  width: 17px;
  height: 17px;
  margin-right: 10px;
  flex-shrink: 0;
  fill: none;
  stroke: #8b9aab;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.input-wrap input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: #213547;
  font-family: inherit;
}

.input-wrap input::placeholder {
  color: #aab4bf;
}

.eye-btn {
  display: flex;
  align-items: center;
  padding: 4px;
  border: none;
  background: transparent;
  cursor: pointer;
}

.eye-btn svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: #8b9aab;
  stroke-width: 1.6;
  stroke-linecap: round;
}

.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 2px 0 22px;
}

.remember {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #5c6b7a;
  cursor: pointer;
}

.remember input {
  width: 14px;
  height: 14px;
  margin: 0;
  accent-color: #4a5e76;
  cursor: pointer;
}

.error-banner {
  margin: -8px 0 16px;
  padding: 9px 12px;
  font-size: 13px;
  color: #b4342c;
  background: #fdecec;
  border: 1px solid #f5c9c6;
  border-radius: 6px;
}

.submit-btn {
  width: 100%;
  height: 44px;
  border: none;
  border-radius: 6px;
  background: #4a5e76;
  color: #ffffff;
  font-size: 15px;
  letter-spacing: 2px;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #3b4d62;
}

.submit-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.card-foot {
  margin-top: 26px;
  padding-top: 18px;
  border-top: 1px solid #edf0f3;
  text-align: center;
}

.card-foot p {
  margin: 0;
  font-size: 12px;
  color: #6b7887;
}

.card-foot b {
  color: #3c4c5c;
  font-weight: 500;
}

.card-foot .hint {
  margin-top: 6px;
  color: #a1acb8;
}

@media (max-width: 860px) {
  .brand-panel {
    display: none;
  }
}
</style>
