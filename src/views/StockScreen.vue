<template>
  <div class="stock-screen">
    <el-row :gutter="20">
      <!-- 左侧：原有筛选功能 -->
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>股票筛选</span>
            </div>
          </template>
          
          <el-form :model="filterForm" inline>
        <el-form-item label="行业">
          <el-select 
            v-model="filterForm.industry" 
            placeholder="请选择行业"
            clearable
            filterable
            style="width: 200px;"
            :loading="industriesLoading"
          >
            <el-option 
              v-for="industry in industries" 
              :key="industry" 
              :label="industry" 
              :value="industry" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="市值范围">
          <el-input-number 
            v-model="filterForm.market_value_min" 
            :min="0" 
            placeholder="最小值">
          </el-input-number>
          <span class="separator">-</span>
          <el-input-number 
            v-model="filterForm.market_value_max" 
            :min="0" 
            placeholder="最大值">
          </el-input-number>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :loading="loading">
            搜索
          </el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table 
        :data="stockList" 
        v-loading="loading"
        height="400"
        style="width: 100%"
      >
        <el-table-column prop="code" label="股票代码" width="120" />
        <el-table-column prop="name" label="股票名称" width="120" />
        <el-table-column prop="industry" label="行业" />
        <el-table-column prop="market_value" label="市值(亿元)" />
        <el-table-column prop="turnover_rate" label="换手率(%)" />
        <el-table-column prop="pe_ratio" label="市盈率" />
        <el-table-column fixed="right" label="操作" width="120">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              link 
              @click="handleFollow(row)"
              :loading="followLoading"
            >
              关注
            </el-button>
          </template>
        </el-table-column>
      </el-table>
        </el-card>

        <!-- 新增：关键字搜索 -->
        <el-card style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <span>关键字搜索</span>
            </div>
          </template>
          
          <el-form inline>
            <el-form-item label="关键字">
              <el-input 
                v-model="keyword" 
                placeholder="请输入股票代码或名称"
                clearable
                style="width: 300px;"
                @keyup.enter="handleKeywordSearch"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleKeywordSearch" :loading="keywordLoading">
                搜索
              </el-button>
            </el-form-item>
          </el-form>

          <el-table 
            :data="keywordStockList" 
            v-loading="keywordLoading"
            height="400"
            style="width: 100%"
          >
            <el-table-column prop="code" label="股票代码" width="120" />
            <el-table-column prop="name" label="股票名称" width="120" />
            <el-table-column prop="industry" label="行业" />
            <el-table-column prop="market_value" label="市值(亿元)" />
            <el-table-column prop="turnover_rate" label="换手率(%)" />
            <el-table-column prop="pe_ratio" label="市盈率" />
            <el-table-column fixed="right" label="操作" width="120">
              <template #default="{ row }">
                <el-button 
                  type="primary" 
                  link 
                  @click="handleFollow(row)"
                  :loading="followLoading"
                >
                  关注
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      
      <!-- 右侧：30分钟选股法 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>30分钟选股法</span>
              <el-button 
                type="primary" 
                size="small" 
                @click="loadQuickScreenedStocks" 
                :loading="quickScreenLoading"
              >
                刷新
              </el-button>
            </div>
          </template>
          
          <div v-if="quickScreenData.date" class="quick-screen-info">
            <el-tag type="info" size="small">{{ quickScreenData.date }}</el-tag>
            <el-tag type="success" size="small" style="margin-left: 8px;">
              共{{ quickScreenData.total }}只股票
            </el-tag>
          </div>
          
          <el-table 
            :data="quickScreenData.stocks" 
            v-loading="quickScreenLoading" 
            size="small"
            height="600"
          >
            <el-table-column prop="ts_code" label="代码" width="80" />
            <el-table-column prop="name" label="股票名称" width="90" show-overflow-tooltip />
            <el-table-column label="涨跌幅" width="70">
              <template #default="{ row }">
                <span :class="row.pct_chg >= 0 ? 'text-red' : 'text-green'">
                  {{ row.pct_chg?.toFixed(2) }}%
                </span>
              </template>
            </el-table-column>
            <el-table-column label="量比" width="60">
              <template #default="{ row }">
                {{ row.volume_ratio?.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column label="换手率" width="70">
              <template #default="{ row }">
                {{ row.turnover_rate?.toFixed(2) }}%
              </template>
            </el-table-column>
            <el-table-column label="市值" width="70">
              <template #default="{ row }">
                {{ row.total_mv?.toFixed(1) }}亿
              </template>
            </el-table-column>
            <el-table-column label="操作" width="50">
              <template #default="{ row }">
                <el-button 
                  type="primary" 
                  link 
                  size="small"
                  @click="handleQuickFollow(row)"
                  :loading="followLoading"
                >
                  关注
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const loading = ref(false)
const followLoading = ref(false)
const industriesLoading = ref(false)
const quickScreenLoading = ref(false)
const keywordLoading = ref(false)
const stockList = ref([])
const keywordStockList = ref([])
const industries = ref([])
const keyword = ref('')

const filterForm = reactive({
  industry: '',
  market_value_min: null,
  market_value_max: null
})

const quickScreenData = reactive({
  date: '',
  total: 0,
  stocks: []
})

const handleSearch = async () => {
  loading.value = true
  try {
    const { results } = await request.post('/stocks/screen/', filterForm)
    stockList.value = results
  } catch (error) {
    // 错误已经被拦截器处理
  } finally {
    loading.value = false
  }
}

const handleFollow = async (stock) => {
  if (!stock || !stock.code) {
    ElMessage.warning('股票代码不能为空')
    return
  }
  
  followLoading.value = true
  try {
    const { detail } = await request.post('/stocks/follow/', {
      ts_code: stock.code
    })
    ElMessage.success(detail || '关注成功')
  } catch (error) {
    // 错误已经被拦截器处理
  } finally {
    followLoading.value = false
  }
}

const loadIndustries = async () => {
  industriesLoading.value = true
  try {
    const response = await request.get('/stocks/get_industries/')
    console.log('行业数据响应:', response)
    
    // 处理嵌套的数据结构：{ code: 0, message: "success", data: { industries: [...] } }
    let industryList = []
    if (response.data && response.data.industries) {
      industryList = response.data.industries
    } else if (response.industries) {
      // 如果数据直接在 response.industries 中
      industryList = response.industries
    } else if (Array.isArray(response)) {
      // 如果响应直接是数组
      industryList = response
    } else {
      console.warn('行业数据格式异常:', response)
      industryList = []
    }
    
    // 按照拼音首字母排序
    industries.value = industryList.sort((a, b) => {
      return a.localeCompare(b, 'zh-CN', { 
        numeric: true, 
        sensitivity: 'accent',
        caseFirst: 'lower'
      })
    })
    
    console.log('处理并排序后的行业列表:', industries.value)
  } catch (error) {
    ElMessage.error('加载行业列表失败')
    console.error('加载行业列表失败:', error)
  } finally {
    industriesLoading.value = false
  }
}

const loadQuickScreenedStocks = async () => {
  quickScreenLoading.value = true
  try {
    const response = await request.get('/stocks/get_screened_stocks_quickly/')
    console.log('30分钟选股数据响应:', response)
    
    if (response.data) {
      quickScreenData.date = response.data.date || ''
      quickScreenData.total = response.data.total || 0
      quickScreenData.stocks = response.data.stocks || []
    } else {
      // 如果数据直接在response中
      quickScreenData.date = response.date || ''
      quickScreenData.total = response.total || 0
      quickScreenData.stocks = response.stocks || []
    }
    
    console.log('处理后的30分钟选股数据:', quickScreenData)
  } catch (error) {
    ElMessage.error('加载30分钟选股数据失败')
    console.error('加载30分钟选股数据失败:', error)
  } finally {
    quickScreenLoading.value = false
  }
}

const handleQuickFollow = async (stock) => {
  if (!stock || !stock.ts_code) {
    ElMessage.warning('股票代码不能为空')
    return
  }
  
  followLoading.value = true
  try {
    const { detail } = await request.post('/stocks/follow/', {
      ts_code: stock.ts_code
    })
    ElMessage.success(detail || '关注成功')
  } catch (error) {
    // 错误已经被拦截器处理
  } finally {
    followLoading.value = false
  }
}

const handleKeywordSearch = async () => {
  if (!keyword.value.trim()) {
    ElMessage.warning('请输入搜索关键字')
    return
  }
  
  keywordLoading.value = true
  try {
    const { results } = await request.get('/stocks/query/', {
      params: { keyword: keyword.value }
    })
    keywordStockList.value = results || []
    if (results && results.length === 0) {
      ElMessage.info('未找到相关股票')
    }
  } catch (error) {
    // 错误已经被拦截器处理
  } finally {
    keywordLoading.value = false
  }
}

const resetForm = () => {
  Object.keys(filterForm).forEach(key => {
    if (typeof filterForm[key] === 'string') {
      filterForm[key] = ''
    } else {
      filterForm[key] = null
    }
  })
}

onMounted(() => {
  loadIndustries()
  loadQuickScreenedStocks()
})
</script>

<style scoped>
.stock-screen {
  padding: 20px;
}

.separator {
  margin: 0 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quick-screen-info {
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.text-red {
  color: #f56c6c;
}

.text-green {
  color: #67c23a;
}
</style> 