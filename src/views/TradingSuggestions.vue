<template>
  <div class="suggestions">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>交易建议</span>
          <div class="button-group">
            <el-button type="success" @click="calculateSuggestions">计算今日推荐</el-button>
            <el-button type="primary" @click="refreshData">刷新</el-button>
            <el-button type="primary" @click="lastPage">上一页</el-button>
            <span>当前页码{{ page }}/{{ total_page }}</span>
            <el-button type="primary" @click="nextPage">下一页</el-button>
          </div>
        </div>
      </template>

      <el-table :data="suggestions" v-loading="loading">
        <el-table-column prop="code" label="股票代码" width="100" />
        <el-table-column prop="name" label="股票名称" width="100" />
        <el-table-column prop="suggestion" label="建议" width="120">
          <template #default="{ row }">
            <el-tag :type="getSuggestionType(row.suggestion)">
              {{ row.suggestion }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="current_price" label="当前价格" width="100"/>
        <el-table-column prop="profit_target" label="目标价格" width="100"/>
        <el-table-column prop="stop_loss" label="止损价格" width="100"/>
        <el-table-column prop="reason" label="原因" show-overflow-tooltip />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const loading = ref(false)
const suggestions = ref([])

const page = ref(1)
const page_size = ref(15)

const total_page = ref(1)

const getSuggestionType = (suggestion) => {
  const types = {
    '买入': 'success',
    '卖出': 'danger',
    '持有': 'warning'
  }
  return types[suggestion] || 'info'
}

const fetchSuggestions = async () => {
  loading.value = true
  try {
    const data = await request.get(`/stocks/all_suggestions/?page_size=${page_size.value}&page=${page.value}`)
    suggestions.value = data
    total_page.value = data[0].total_page
  } catch (error) {
    // 错误已经被拦截器处理
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  fetchSuggestions()
}

const lastPage = () => {
  if (page.value > 1) {
    page.value -= 1
    fetchSuggestions()
  }
}

const nextPage = () => {
    page.value += 1
    fetchSuggestions()
  
}

const calculateSuggestions = async () => {
  try {
    const response = await request.get('/stocks/trigger_trading_suggestions/')
    if (response.status === 'success') {
      ElMessage({
        message: '计算成功',
        type: 'success',
        duration: 3000
      })
    } else {
      ElMessage({
        message: '计算失败',
        type: 'error',
        duration: 3000
      })
    }
  } catch (error) {
    ElMessage({
      message: '计算失败',
      type: 'error',
      duration: 3000
    })
  }
}

onMounted(() => {
  fetchSuggestions()
})
</script>

<style scoped>
.suggestions {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.button-group {
  display: flex;
  gap: 10px;
  align-items: center;
}
</style> 