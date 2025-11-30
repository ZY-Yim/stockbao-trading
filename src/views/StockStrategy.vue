<template>
  <div class="stock-strategy">
    <!-- 第一个div：股票筛选条件 -->
    <el-card class="filter-card">
      <template #header>
        <div class="card-header">
          <span>股票筛选条件</span>
        </div>
      </template>
      
      <el-form :model="filterForm" :rules="filterRules" ref="filterFormRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="市值范围(亿元)" prop="market_value_range">
              <div class="range-inputs">
                <el-input-number 
                  v-model="filterForm.market_value_min" 
                  :min="0" 
                  placeholder="最小值"
                  style="width: 45%">
                </el-input-number>
                <span class="separator">-</span>
                <el-input-number 
                  v-model="filterForm.market_value_max" 
                  :min="0" 
                  placeholder="最大值"
                  style="width: 45%">
                </el-input-number>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="行业" prop="industry">
              <el-select 
                v-model="filterForm.industry" 
                placeholder="请选择行业"
                clearable
                style="width: 100%">
                    <el-option v-for="item in industryOptions" :key="item" :label="item" :value="item" />

              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="最低换手率(%)" prop="turnover_rate_min">
              <el-input-number 
                v-model="filterForm.turnover_rate_min" 
                :min="0" 
                :max="100"
                placeholder="请输入最低换手率"
                style="width: 100%">
              </el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="PE范围" prop="pe_range">
              <div class="range-inputs">
                <el-input-number 
                  v-model="filterForm.pe_min" 
                  :min="0" 
                  placeholder="最小值"
                  style="width: 45%">
                </el-input-number>
                <span class="separator">-</span>
                <el-input-number 
                  v-model="filterForm.pe_max" 
                  :min="0" 
                  placeholder="最大值"
                  style="width: 45%">
                </el-input-number>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :loading="loading">
            提交筛选
          </el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 第二部分，筛选结果表格 -->
    <el-card v-if="stockList.length > 0" class="result-card">
      <template #header>
        <div class="card-header">
          <span>筛选结果 (共{{ stockList.length }}只股票)</span>
        </div>
      </template>
      <div style="margin-bottom: 10px;">
        <el-button type="primary" size="small" @click="toggleSelectAll">{{ isAllSelected ? '全不选' : '全选' }}</el-button>
        <el-button type="success" size="small" style="margin-left: 10px;" @click="openPoolDialog" :disabled="multipleSelection.length === 0">生成股票池</el-button>
      </div>
      <el-table :data="stockList" v-loading="loading" stripe   ref="stockTableRef"
  @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="code" label="股票代码" width="120" />
        <el-table-column prop="name" label="股票名称" width="120" />
        <el-table-column prop="industry" label="行业" width="100" />
        <el-table-column prop="market_value" label="市值(亿元)" width="120" />
        <el-table-column prop="turnover_rate" label="换手率(%)" width="120" />
        <el-table-column prop="pe_ratio" label="市盈率" width="100" />
        <el-table-column prop="current_price" label="当前价格" width="100" />
        <el-table-column prop="dividend_yield" label="股息率" width="100" />

        <el-table-column fixed="right" label="操作" width="150">
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
    <!-- 股票池提交弹窗 -->
    <el-dialog v-model="poolDialogVisible" title="生成股票池" width="400px">
      <el-form :model="poolForm" label-width="80px">
        <el-form-item label="分类">
          <el-input v-model="poolForm.category" placeholder="如：蓝筹股" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="poolForm.notes" placeholder="如：长期持有" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="poolDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitStockPool" :loading="poolLoading">提交</el-button>
      </template>
    </el-dialog>

    <!-- 第三个div：策略匹配 -->
    <el-card class="strategy-card">
      <template #header>
        <div class="card-header">
          <span>我的股票池</span>
          <el-button type="primary" size="small" @click="loadStockPools" :loading="poolsLoading">
            刷新
          </el-button>
        </div>
      </template>
      
<div class="strategy-content">
  <el-table :data="stockPools" v-loading="poolsLoading" stripe>
    <el-table-column prop="description" label="股票池名称" width="150" />
    <el-table-column prop="description" label="描述" />
    <el-table-column label="股票数量" width="100">
      <template #default="{ row }">
        {{ row.stocks ? row.stocks.length : 0 }}
      </template>
    </el-table-column>
    <el-table-column label="策略" width="100">
      <template #default="{ row }">
        {{ row.ext_info?.strategy || '-' }}
      </template>
    </el-table-column>
    <el-table-column prop="created_at" label="创建时间" width="180" />
    <el-table-column fixed="right" label="操作" width="200">
      <template #default="{ row }">
        <el-button 
          type="primary" 
          link 
          @click="viewPoolDetail(row)"
        >
          查看
        </el-button>
        <el-button 
          type="warning" 
          link 
          @click="editPool(row)"
        >
          编辑
        </el-button>
        <el-button 
          type="danger" 
          link 
          @click="deletePool(row)"
        >
          删除
        </el-button>
      </template>
    </el-table-column>
  </el-table>
  

</div>
    </el-card>

<!-- 股票池详情弹窗 -->
<el-dialog v-model="poolDetailVisible" title="股票池详情" width="800px">
  <div v-if="currentPool">
    <el-descriptions :column="2" border>
      <el-descriptions-item label="股票池名称">{{ currentPool.description }}</el-descriptions-item>
      <el-descriptions-item label="描述">{{ currentPool.description }}</el-descriptions-item>
      <el-descriptions-item label="分类">{{ currentPool.ext_info?.category || '-' }}</el-descriptions-item>
      <el-descriptions-item label="创建时间">{{ currentPool.created_at }}</el-descriptions-item>
      <el-descriptions-item label="策略" :span="2">
        <template v-if="currentPool.ext_info?.strategy && currentPool.ext_info.strategy.length > 0">
          <div class="strategy-info">
            <span>{{ currentPool.ext_info.strategy.join(', ') }}</span>
            <el-button 
              type="primary" 
              link 
              @click="viewStrategy(currentPool)"
              style="margin-left: 10px;"
            >
              查看策略分析
            </el-button>
          </div>
        </template>
        <template v-else>
          <span>-</span>
        </template>
      </el-descriptions-item>
    </el-descriptions>
    
    <div style="margin-top: 20px;">
      <h4>包含股票 ({{ currentPool.stocks?.length || 0 }}只)</h4>
      <div class="stock-codes-display">
        <span class="stock-codes-label">股票代码：</span>
        <div class="stock-codes-list">
          <template v-if="currentPool.stocks && currentPool.stocks.length > 0">
            <el-tag 
              v-for="(code, index) in currentPool.stocks"
              :key="index"
              class="stock-code-tag"
              @click="copyStockCode(code)"
              style="cursor: pointer; margin-right: 8px; margin-bottom: 8px;"
            >
              {{ code }}
            </el-tag>
            <span v-if="currentPool.stocks.length > 3" class="more-stocks">
              {{ currentPool.stocks.length }}只股票
            </span>
          </template>
          <span v-else class="no-stocks">暂无股票</span>
        </div>
      </div>
    </div>
  </div>
</el-dialog>

<!-- 编辑股票池弹窗 -->
<el-dialog v-model="editPoolDialogVisible" title="编辑股票池" width="600px">
  <el-form :model="editPoolForm" label-width="100px" v-loading="editPoolLoading">
    <el-form-item label="描述">
      <el-input v-model="editPoolForm.description" placeholder="请输入股票池描述" />
    </el-form-item>
    
    <el-form-item label="股票代码">
      <el-input 
        v-model="editPoolForm.stockCodesText" 
        type="textarea" 
        :rows="4"
        placeholder="请输入股票代码，每行一个，如：&#10;000001.SZ&#10;600000.SH"
      />
      <div class="form-tip">每行输入一个股票代码</div>
    </el-form-item>
    
    <el-form-item label="策略">
      <el-select 
        v-model="editPoolForm.strategy" 
        multiple 
        filterable 
        allow-create 
        default-first-option
        placeholder="请选择或输入策略"
        style="width: 100%"
      >
        <el-option 
          v-for="strategy in strategyOptions" 
          :key="strategy.name" 
          :label="strategy.description" 
          :value="strategy.name" 
        />
      </el-select>
      <div class="form-tip">可以选择已有策略或输入新策略</div>
    </el-form-item>
    
    <el-form-item label="分类">
      <el-input v-model="editPoolForm.category" placeholder="如：蓝筹股" />
    </el-form-item>
    
    <el-form-item label="备注">
      <el-input v-model="editPoolForm.notes" placeholder="如：长期持有" />
    </el-form-item>
  </el-form>
  
  <template #footer>
    <el-button @click="editPoolDialogVisible = false">取消</el-button>
    <el-button type="primary" @click="submitEditPool" :loading="editPoolLoading">提交</el-button>
  </template>
</el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage ,ElMessageBox} from 'element-plus'
import request from '../utils/request'

const router = useRouter()

const loading = ref(false)
const followLoading = ref(false)
const stockList = ref([])
const filterFormRef = ref()

const filterForm = reactive({
  market_value_min: null,
  market_value_max: null,
  industry: '',
  turnover_rate_min: null,
  pe_min: null,
  pe_max: null
})

const stockTableRef = ref()
const multipleSelection = ref([])
const isAllSelected = ref(false)

const poolDialogVisible = ref(false)
const poolLoading = ref(false)
const poolForm = reactive({
  category: '',
  notes: ''
})

// 股票池相关
const stockPools = ref([])
const poolsLoading = ref(false)
const poolDetailVisible = ref(false)
const currentPool = ref(null)

// 编辑股票池相关
const editPoolDialogVisible = ref(false)
const editPoolLoading = ref(false)
const editPoolForm = reactive({
  description: '',
  stockCodesText: '',
  strategy: [],
  category: '',
  notes: ''
})
const editingPool = ref(null)

// 策略数据缓存
const strategyOptions = ref([])
const strategiesLoaded = ref(false)

// 加载股票池列表
const loadStockPools = async () => {
  poolsLoading.value = true
  try {
    const response = await request.get('/stock-pools/')
    console.log('完整响应:', response)
    
    // 处理不同的数据结构
    let data
    if (response) {
      // 如果响应格式是 { results: [...] }
      data = response
    } else if (Array.isArray(response)) {
      // 如果响应直接是数组
      data = response

    } else {
      // 其他情况，尝试获取data字段
      data = response?.data || []
    }
    
    console.log('处理后的数据:', data)
    console.log('数据长度:', data.length)
    stockPools.value = data
  } catch (error) {
    console.error('加载股票池失败:', error)
    // 错误已经被拦截器处理
  } finally {
    poolsLoading.value = false
  }
}

// 加载策略数据
const loadStrategies = async () => {
  // 如果已经加载过，直接返回
  if (strategiesLoaded.value) {
    return
  }
  
  try {
    const response = await request.get('/stock-pools/get_strategies/')
    console.log('策略数据响应:', response)
    
    // 处理不同的数据结构
    let data = response.strategies

    
    strategyOptions.value = data
    strategiesLoaded.value = true
    console.log('策略选项:', strategyOptions.value)
  } catch (error) {
    console.error('加载策略数据失败:', error)
    // 如果获取失败，使用默认策略
    strategyOptions.value = ['价值投资', '成长投资', '技术分析', '基本面分析', '量化策略']
    strategiesLoaded.value = true
  }
}

// 查看股票池详情
const viewPoolDetail = async (pool) => {
  currentPool.value = pool
  poolDetailVisible.value = true
}

// 查看策略分析
const viewStrategy = (pool) => {
  router.push(`/strategydisplay?pool_id=${pool.pool_id}`)
}

// 编辑股票池
const editPool = async (pool) => {
  editingPool.value = pool
  // 填充表单数据
  editPoolForm.description = pool.description || ''
  editPoolForm.stockCodesText = pool.stocks ? pool.stocks.join('\n') : ''
  editPoolForm.strategy = pool.ext_info.strategy ? [...pool.ext_info.strategy] : []
  editPoolForm.category = pool.ext_info?.category || ''
  editPoolForm.notes = pool.ext_info?.notes || ''
  
  // 确保策略数据已加载
  await loadStrategies()
  
  editPoolDialogVisible.value = true
}

// 删除股票池
const deletePool = async (pool) => {
  try {
    await ElMessageBox.confirm(`确定要删除股票池"${pool.description}"吗？`, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    // /stock-pools/{pool_id}/delete_pool/
    
    await request.delete(`/stock-pools/${pool.pool_id}/delete_pool/`)
    ElMessage.success('删除成功')
    loadStockPools() // 重新加载列表
  } catch (error) {
    if (error !== 'cancel') {
      // 错误已经被拦截器处理
    }
  }
}
// 组件挂载时加载股票池
onMounted(() => {
  loadStockPools()
  // 预加载策略数据
  loadStrategies()
})

const handleSelectionChange = (val) => {
  multipleSelection.value = val
  isAllSelected.value = val.length === stockList.value.length && stockList.value.length > 0
}

const toggleSelectAll = () => {
  if (!stockTableRef.value) return
  if (isAllSelected.value) {
    stockTableRef.value.clearSelection()
  } else {
    stockTableRef.value.clearSelection()
    stockList.value.forEach(row => {
      stockTableRef.value.toggleRowSelection(row, true)
    })
  }
  // isAllSelected 会在 handleSelectionChange 中自动更新
}

const openPoolDialog = () => {
  poolForm.category = ''
  poolForm.notes = ''
  poolDialogVisible.value = true
}
// 修改submitStockPool方法，在成功后添加刷新
const submitStockPool = async () => {
  if (!poolForm.category || !poolForm.notes) {
    ElMessage.warning('请填写分类和备注')
    return
  }
  poolLoading.value = true
  try {
    const stock_codes = multipleSelection.value.map(item => item.code)
    await request.post('/stock-pools/create/', {
      description: poolForm.notes,
      stock_codes,
      ext_info: {
        category: poolForm.category
      }
    })
    ElMessage.success('股票池生成成功')
    poolDialogVisible.value = false
    // 清空选择
    stockTableRef.value.clearSelection()
    multipleSelection.value = []
    isAllSelected.value = false
    // 刷新股票池列表
    loadStockPools()
  } catch (e) {
    // 错误已被拦截器处理
  } finally {
    poolLoading.value = false
  }
}

const industryOptions = [
  'IT设备','专用机械','中成药','乳制品','互联网','仓储物流','供气供热','保险','元器件','全国地产','公共交通','公路','其他商业','其他建材','农业综合','农用机械','农药化肥','出版业','化学制药','化工原料','化工机械','化纤','区域地产','医疗保健','医药商业','半导体','商品城','商贸代理','啤酒','园区开发','塑料','多元金融','家居用品','家用电器','小金属','工程机械','广告包装','建筑工程','影视音像','房产服务','批发业','摩托车','文教休闲','新型电力','旅游景点','旅游服务','日用化工','普钢','服饰','机场','机床制造','机械基件','林业','染料涂料','橡胶','水力发电','水务','水泥','水运','汽车整车','汽车服务','汽车配件','渔业','港口','火力发电','焦炭加工','煤炭开采','特种钢','环境保护','玻璃','生物制药','电信运营','电器仪表','电器连锁','电气设备','白酒','百货','石油加工','石油开采','石油贸易','矿物制品','种植业','空运','红黄酒','纺织','纺织机械','综合类','航空','船舶','装修装饰','证券','超市连锁','路桥','软件服务','软饮料','轻工机械','运输设备','通信设备','造纸','酒店餐饮','钢加工','铁路','铅锌','铜','铝','银行','陶瓷','食品','饲料','黄金'
]
const filterRules = {
  market_value_min: [
    { type: 'number', min: 0, message: '市值最小值不能小于0', trigger: 'blur' }
  ],
  market_value_max: [
    { type: 'number', min: 0, message: '市值最大值不能小于0', trigger: 'blur' }
  ],
  turnover_rate_min: [
    { type: 'number', min: 0, max: 100, message: '换手率范围应在0-100之间', trigger: 'blur' }
  ],
  pe_min: [
    { type: 'number', min: 0, message: 'PE最小值不能小于0', trigger: 'blur' }
  ],
  pe_max: [
    { type: 'number', min: 0, message: 'PE最大值不能小于0', trigger: 'blur' }
  ]
}


const handleSearch = async () => {
  // 验证表单
  try {
    await filterFormRef.value.validate()
  } catch (error) {
    ElMessage.error('请检查输入参数')
    return
  }
  
  loading.value = true
  try {
    // 过滤掉空值
    const params = {}
    Object.keys(filterForm).forEach(key => {
      if (filterForm[key] !== null && filterForm[key] !== '') {
        params[key] = filterForm[key]
      }
    })
    
    const { results } = await request.post('/stocks/screen/', params)
    stockList.value = results
    ElMessage.success(`筛选完成，共找到 ${results.length} 只股票`)
        multipleSelection.value = []
    isAllSelected.value = false
    if (stockTableRef.value) stockTableRef.value.clearSelection()
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

const handleAnalyze = (stock) => {
  ElMessage.info(`正在分析 ${stock.name} 的投资策略...`)
  // 这里可以添加跳转到分析页面的逻辑
}

const resetForm = () => {
  filterFormRef.value.resetFields()
  stockList.value = []
}

const copyStockCode = async (code) => {
  try {
    await navigator.clipboard.writeText(code)
    ElMessage.success(`股票代码 ${code} 已复制到剪贴板`)
  } catch (error) {
    // 如果clipboard API不可用，使用备用方法
    const textArea = document.createElement('textarea')
    textArea.value = code
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      ElMessage.success(`股票代码 ${code} 已复制到剪贴板`)
    } catch (err) {
      ElMessage.error('复制失败，请手动复制')
    }
    document.body.removeChild(textArea)
  }
}

// 提交编辑股票池
const submitEditPool = async () => {
  if (!editingPool.value) {
    ElMessage.error('编辑数据异常')
    return
  }
  
  if (!editPoolForm.description.trim()) {
    ElMessage.warning('请输入股票池描述')
    return
  }
  
  editPoolLoading.value = true
  try {
    // 处理股票代码文本，转换为数组
    const stock_codes = editPoolForm.stockCodesText
      .split('\n')
      .map(code => code.trim())
      .filter(code => code.length > 0)
    
    // 处理策略文本，转换为数组
    const strategy = editPoolForm.strategy
    
    const updateData = {
      description: editPoolForm.description.trim(),
      stock_codes,
      strategy,
      ext_info: {
        category: editPoolForm.category.trim(),
        notes: editPoolForm.notes.trim()
      }
    }
    
    await request.put(`/stock-pools/${editingPool.value.pool_id}/update_pool/`, updateData)
    ElMessage.success('股票池更新成功')
    editPoolDialogVisible.value = false
    // 刷新股票池列表
    loadStockPools()
  } catch (error) {
    // 错误已经被拦截器处理
  } finally {
    editPoolLoading.value = false
  }
}
</script>

<style scoped>
.stock-strategy {
  padding: 20px;
}

.filter-card,
.strategy-card,
.result-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.range-inputs {
  display: flex;
  align-items: center;
  width: 100%;
}

.separator {
  margin: 0 10px;
  color: #909399;
}

.strategy-content {
  padding: 20px 0;
}

.strategy-placeholder {
  margin-top: 20px;
  text-align: center;
}

.el-form-item {
  margin-bottom: 20px;
}

.el-row {
  margin-bottom: 10px;
}

.stock-codes-display {
  margin-top: 20px;
}

.stock-codes-label {
  font-weight: bold;
}

.stock-codes-list {
  margin-top: 10px;
}

.stock-code-tag {
  cursor: pointer;
  margin-right: 8px;
  margin-bottom: 8px;
}

.more-stocks {
  margin-left: 10px;
}

.no-stocks {
  color: #909399;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.strategy-info {
  display: flex;
  align-items: center;
}
</style> 