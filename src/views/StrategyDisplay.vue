<template>
  <div class="strategy-display">
    <!-- 页面标题 -->
    <el-card class="header-card">
      <template #header>
        <div class="card-header">
          <span>股票池策略收益分析</span>
          <div class="header-actions">
            <el-button type="primary" size="small" @click="openBacktestConfig">
              回测配置
            </el-button>
            <el-button type="primary" size="small" @click="refreshData" :loading="loading">
              刷新数据
            </el-button>
          </div>
        </div>
      </template>
    </el-card>

    <!-- 回测配置弹窗 -->
    <el-dialog v-model="backtestConfigVisible" title="回测配置" width="500px">
      <el-form :model="backtestConfig" label-width="120px">
        <el-form-item label="策略名称">
          <el-select v-model="backtestConfig.strategy_name" placeholder="请选择策略" clearable style="width: 100%">
            <el-option label="MACD策略" value="macd_hist_strategy" />
            <el-option label="均线策略" value="ma_strategy" />
            <el-option label="RSI策略" value="rsi_strategy" />
            <el-option label="布林带策略" value="bollinger_strategy" />
          </el-select>
          <div class="form-tip">不选择则使用股票池默认策略</div>
        </el-form-item>
        
        <el-form-item label="回测天数">
          <el-input-number 
            v-model="backtestConfig.days" 
            :min="30" 
            :max="1095" 
            placeholder="回测天数"
            style="width: 100%"
          />
          <div class="form-tip">默认365天，范围30-1095天</div>
        </el-form-item>
        
        <el-form-item label="开始日期">
          <el-date-picker
            v-model="backtestConfig.start_date"
            type="date"
            placeholder="选择开始日期"
            format="YYYYMMDD"
            value-format="YYYYMMDD"
            style="width: 100%"
          />
          <div class="form-tip">格式：YYYYMMDD，如20230101</div>
        </el-form-item>
        
        <el-form-item label="结束日期">
          <el-date-picker
            v-model="backtestConfig.end_date"
            type="date"
            placeholder="选择结束日期"
            format="YYYYMMDD"
            value-format="YYYYMMDD"
            style="width: 100%"
          />
          <div class="form-tip">格式：YYYYMMDD，如20231231</div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="backtestConfigVisible = false">取消</el-button>
        <el-button type="primary" @click="applyBacktestConfig">应用配置</el-button>
      </template>
    </el-dialog>

    <!-- 股票池概要信息 -->
    <el-card v-if="poolSummary" class="summary-card">
      <template #header>
        <div class="card-header">
          <span>策略概要</span>
        </div>
      </template>
      
      <el-descriptions :column="3" border>
        <el-descriptions-item label="股票池ID">{{ poolSummary.pool_id }}</el-descriptions-item>
        <el-descriptions-item label="策略名称">{{ poolSummary.strategy_name }}</el-descriptions-item>
        <el-descriptions-item label="股票数量">{{ poolSummary.total_stocks }}</el-descriptions-item>
        <el-descriptions-item label="平均收益率">{{ (poolSummary.avg_return ).toFixed(2) }}%</el-descriptions-item>
        <el-descriptions-item label="总交易次数">{{ poolSummary.total_trades }}</el-descriptions-item>
        <el-descriptions-item label="回测期间">{{ poolSummary.start_date }} 至 {{ poolSummary.end_date }}</el-descriptions-item>
      </el-descriptions>
      
      <div class="pool-description">
        <h4>股票池描述</h4>
        <p>{{ poolSummary.pool_description }}</p>
      </div>
    </el-card>

        <!-- 股票池概要信息 -->
    <el-card v-if="poolSummary" class="summary-card">
      <template #header>
        <div class="card-header">
          <span>智能分析</span>
        </div>
      </template>
    
      <el-descriptions :column="3" border>
        <el-descriptions-item label="智能分析">{{ llmResult }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 图表展示区域 -->
    <el-card v-if="stockResults && stockResults.length > 0" class="charts-card">
      <template #header>
        <div class="card-header">
          <span>策略分析图表</span>
          <el-select v-model="selectedStock" placeholder="选择股票" style="width: 200px;">
            <el-option 
              v-for="stock in stockResults" 
              :key="stock.ts_code" 
              :label="`${stock.ts_code} - ${stock.name || '未知'}`" 
              :value="stock.ts_code" 
            />
          </el-select>
        </div>
      </template>
      
      <div class="charts-container">
        <!-- K线图 + 买卖点 -->
        <div class="chart-wrapper">
          <h4>K线图与买卖点</h4>
          <div ref="klineChartRef" class="chart" style="height: 400px;"></div>
        </div>
        
        <!-- 收益率曲线 -->
        <div class="chart-wrapper">
          <h4>收益率曲线</h4>
          <div ref="returnChartRef" class="chart" style="height: 400px;"></div>
        </div>
      </div>
    </el-card>

    <!-- 加载状态 -->
    <el-card v-if="loading" class="loading-card">
      <div class="loading-content">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>正在加载策略数据...</span>
      </div>
    </el-card>

    <!-- 错误状态 -->
    <el-card v-if="error" class="error-card">
      <div class="error-content">
        <el-icon><Warning /></el-icon>
        <span>{{ error }}</span>
        <el-button type="primary" @click="loadData">重试</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading, Warning } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import request from '../utils/request'

const route = useRoute()
const loading = ref(false)
const error = ref('')

// 数据状态
const poolSummary = ref(null)
const stockResults = ref([])
const selectedStock = ref('')
const llmResult = ref('')

// 回测配置
const backtestConfigVisible = ref(false)
const backtestConfig = reactive({
  strategy_name: '',
  start_date: '20240101',
  end_date: '20250601',
  days: 365
})

// 图表实例
const klineChartRef = ref(null)
const returnChartRef = ref(null)
let klineChart = null
let returnChart = null

// 获取pool_id参数
const poolId = route.params.pool_id || route.query.pool_id

// 加载数据
const loadData = async () => {
  if (!poolId) {
    error.value = '缺少股票池ID参数'
    return
  }

  loading.value = true
  error.value = ''
  
  try {
    // 构建请求参数，只包含有值的参数
    const requestData = {}
    
    if (backtestConfig.strategy_name) {
      requestData.strategy_name = backtestConfig.strategy_name
    }
    if (backtestConfig.start_date) {
      requestData.start_date = backtestConfig.start_date
    }
    if (backtestConfig.end_date) {
      requestData.end_date = backtestConfig.end_date
    }
    if (backtestConfig.days) {
      requestData.days = backtestConfig.days
    }
    
    const response = await request.post(`/stock-pools/${poolId}/backtest_pool/`, requestData)
    console.log('回测数据响应:', response)
    
    // 处理返回数据
    if (response && response.pool_summary) {
      poolSummary.value = response.pool_summary
    }
    
    if (response && response.stock_results) {
      stockResults.value = response.stock_results
      // 默认选择第一只股票
      if (stockResults.value.length > 0) {
        selectedStock.value = stockResults.value[0].ts_code
      }
    }

    if (response && response.llm_result) {
      // 展示大模型的分析
      llmResult.value = response.llm_result
    }
    
    // 初始化图表
    await nextTick()
    initCharts()
    
  } catch (err) {
    console.error('加载策略数据失败:', err)
    error.value = '加载策略数据失败，请检查股票池ID是否正确'
  } finally {
    loading.value = false
  }
}

// 刷新数据
const refreshData = () => {
  loadData()
}

// 初始化图表
const initCharts = () => {
  if (!selectedStock.value || !stockResults.value.length) return
  
  const currentStock = stockResults.value.find(stock => stock.ts_code === selectedStock.value)
  if (!currentStock) return
  
  // 初始化K线图
  initKlineChart(currentStock)
  
  // 初始化收益率图
  initReturnChart(currentStock)
}

// 初始化K线图
const initKlineChart = (stockData) => {
  if (klineChart) {
    klineChart.dispose()
  }
  
  if (!klineChartRef.value) return
  
  klineChart = echarts.init(klineChartRef.value)
  
  // 处理K线数据
  const klineData = stockData.kline_data || []
  const dates = klineData.map(item => item.date)
  const candlestickData = klineData.map(item => [
    item.open,
    item.close,
    item.low,
    item.high
  ])
  
  // 处理买卖点数据
  const trades = stockData.trades || []
  const buyPoints = []
  const sellPoints = []
  
  trades.forEach(trade => {
    const klineIndex = klineData.findIndex(k => k.date === trade.date)
    if (klineIndex !== -1) {
      const point = [klineIndex, trade.price]
      if (trade.type === 'buy') {
        buyPoints.push(point)
      } else if (trade.type === 'sell') {
        sellPoints.push(point)
      }
    }
  })
  
  const option = {
    title: {
      text: `${stockData.ts_code} ${stockData.name} K线图与买卖点`,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      },
      formatter: function(params) {
        let result = `${params[0].axisValue}<br/>`
        params.forEach(param => {
          if (param.seriesName === 'K线') {
            const data = param.data
            result += `${param.seriesName}: 开${data[0]} 收${data[1]} 低${data[2]} 高${data[3]}<br/>`
          } else {
            result += `${param.seriesName}: ${param.data[1]}<br/>`
          }
        })
        return result
      }
    },
    legend: {
      data: ['K线', '买入点', '卖出点'],
      top: 30
    },
    grid: {
      left: '10%',
      right: '10%',
      bottom: '15%'
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        formatter: function(value) {
          // 格式化日期显示
          return value.substring(4, 6) + '/' + value.substring(6, 8)
        }
      }
    },
    yAxis: {
      type: 'value',
      scale: true,
      axisLabel: {
        formatter: '{value}'
      }
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        show: true,
        type: 'slider',
        top: '90%',
        start: 0,
        end: 100
      }
    ],
    series: [
      {
        name: 'K线',
        type: 'candlestick',
        data: candlestickData,
        itemStyle: {
          color: '#f56c6c',
          color0: '#67c23a',
          borderColor: '#f56c6c',
          borderColor0: '#67c23a'
        }
      },
      {
        name: '买入点',
        type: 'scatter',
        data: buyPoints,
        symbol: 'arrow',
        symbolSize: 15,
        itemStyle: {
          color: '#f56c6c'
        },
        markPoint: {
          data: buyPoints.map(point => ({
            coord: point,
            value: '买入',
            itemStyle: {
              color: '#f56c6c'
            }
          }))
        }
      },
      {
        name: '卖出点',
        type: 'scatter',
        data: sellPoints,
        symbol: 'arrow-down',
        symbolSize: 15,
        itemStyle: {
          color: '#67c23a'
        },
        markPoint: {
          data: sellPoints.map(point => ({
            coord: point,
            value: '卖出',
            itemStyle: {
              color: '#67c23a'
            }
          }))
        }
      }
    ]
  }
  
  klineChart.setOption(option)
}

// 初始化收益率图
const initReturnChart = (stockData) => {
  if (returnChart) {
    returnChart.dispose()
  }
  
  if (!returnChartRef.value) return
  
  returnChart = echarts.init(returnChartRef.value)
  
  // 处理收益率数据
  const equityCurve = stockData.equity_curve || []
  const dates = equityCurve.map(item => item.date)
  const initialEquity = equityCurve.length > 0 ? equityCurve[0].equity : 1000000
  const returnData = equityCurve.map(item => {
    const returnRate = ((item.equity - initialEquity) / initialEquity) * 100
    return returnRate.toFixed(2)
  })
  
  const option = {
    title: {
      text: `${stockData.ts_code} ${stockData.name} 收益率曲线`,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        const date = params[0].axisValue
        const returnRate = params[0].data
        return `${date}<br/>收益率: ${returnRate}%`
      }
    },
    legend: {
      data: ['累计收益率'],
      top: 30
    },
    grid: {
      left: '10%',
      right: '10%',
      bottom: '15%'
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        formatter: function(value) {
          // 格式化日期显示
          return value.substring(4, 6) + '/' + value.substring(6, 8)
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value}%'
      },
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed'
        }
      }
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        show: true,
        type: 'slider',
        top: '90%',
        start: 0,
        end: 100
      }
    ],
    series: [
      {
        name: '累计收益率',
        type: 'line',
        data: returnData,
        smooth: true,
        lineStyle: {
          color: '#409eff',
          width: 2
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
            ]
          }
        },
        itemStyle: {
          color: '#409eff'
        },
        markPoint: {
          data: [
            { type: 'max', name: '最高收益率' },
            { type: 'min', name: '最低收益率' }
          ]
        },
        markLine: {
          data: [
            { type: 'average', name: '平均收益率' },
            { yAxis: 0, name: '零收益线' }
          ]
        }
      }
    ]
  }
  
  returnChart.setOption(option)
}

// 监听股票选择变化
const handleStockChange = () => {
  initCharts()
}

// 监听窗口大小变化，调整图表大小
const handleResize = () => {
  if (klineChart) {
    klineChart.resize()
  }
  if (returnChart) {
    returnChart.resize()
  }
}

// 组件挂载
onMounted(() => {
  loadData()
  window.addEventListener('resize', handleResize)
})

// 组件卸载
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (klineChart) {
    klineChart.dispose()
  }
  if (returnChart) {
    returnChart.dispose()
  }
})

// 监听selectedStock变化
watch(selectedStock, handleStockChange)

// 打开回测配置弹窗
const openBacktestConfig = () => {
  backtestConfigVisible.value = true
}

// 应用回测配置
const applyBacktestConfig = () => {
  backtestConfigVisible.value = false
  // 重新加载数据
  loadData()
}
</script>

<style scoped>
.strategy-display {
  padding: 20px;
}

.header-card,
.summary-card,
.charts-card,
.loading-card,
.error-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.pool-description {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.pool-description h4 {
  margin: 0 0 10px 0;
  color: #303133;
}

.pool-description p {
  margin: 0;
  color: #606266;
  line-height: 1.6;
}

.charts-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.chart-wrapper {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 20px;
}

.chart-wrapper h4 {
  margin: 0 0 15px 0;
  color: #303133;
}

.chart {
  width: 100%;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.loading-content,
.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 40px;
  color: #909399;
}

.error-content {
  color: #f56c6c;
}

.error-content .el-button {
  margin-top: 10px;
}

.el-icon {
  font-size: 24px;
}
</style> 