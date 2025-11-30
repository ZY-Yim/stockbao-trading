<template>
  <div class="stock-screen">
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

      <el-table :data="stockList" v-loading="loading">
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const loading = ref(false)
const followLoading = ref(false)
const industriesLoading = ref(false)
const stockList = ref([])
const industries = ref([])

const filterForm = reactive({
  industry: '',
  market_value_min: null,
  market_value_max: null
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
    if (response.data && response.data.industries) {
      industries.value = response.data.industries
    } else if (response.industries) {
      // 如果数据直接在 response.industries 中
      industries.value = response.industries
    } else if (Array.isArray(response)) {
      // 如果响应直接是数组
      industries.value = response
    } else {
      console.warn('行业数据格式异常:', response)
      industries.value = []
    }
    
    console.log('处理后的行业列表:', industries.value)
  } catch (error) {
    ElMessage.error('加载行业列表失败')
    console.error('加载行业列表失败:', error)
  } finally {
    industriesLoading.value = false
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
})
</script>

<style scoped>
.stock-screen {
  padding: 20px;
}

.separator {
  margin: 0 10px;
}
</style> 