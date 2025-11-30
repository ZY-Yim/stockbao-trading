<template>
  <div class="stock-kline">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>股票K线图分析</span>
        </div>
      </template>

      <el-form :model="formData" :rules="rules" ref="formRef" inline>
        <el-form-item label="股票代码" prop="stockCode">
          <el-input 
            v-model="formData.stockCode" 
            placeholder="请输入股票代码"
            style="width: 150px"
          />
        </el-form-item>
        
        <el-form-item label="时间范围" prop="dateRange">
          <el-date-picker
            v-model="formData.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :shortcuts="dateShortcuts"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-form-item>
          <el-button 
            type="primary" 
            @click="handleQuery" 
            :loading="loading"
          >
            查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <div v-if="stockInfo" class="stock-info">
        <div class="stock-header">
          <div>
            <span class="stock-name">{{ stockInfo.name }}</span>
            <span class="stock-code">{{ stockInfo.code }}</span>
          </div>
          <el-button 
            :type="isFollowing ? 'danger' : 'success'" 
            @click="handleFollow" 
            :loading="followLoading"
          >
            {{ isFollowing ? '取消关注' : '关注' }}
          </el-button>
        </div>
      </div>

      <div 
        ref="chartRef" 
        class="chart-container"
        v-loading="loading"
      ></div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Star } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import request from '../utils/request'

const formRef = ref(null)
const chartRef = ref(null)
const loading = ref(false)
const followLoading = ref(false)
let chart = null

const stockInfo = ref(null)
const isFollowing = ref(false) // 新增变量来存储关注状态

const formData = reactive({
  stockCode: '',
  dateRange: ''
})

const rules = {
  stockCode: [
    { required: true, message: '请输入股票代码', trigger: 'blur' }
  ],
  dateRange: [
    { required: true, message: '请选择日期范围', trigger: 'change' }
  ]
}

const dateShortcuts = [
  {
    text: '最近两年',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 365 * 2)
      return [start, end]
    }
  },
  {
    text: '最近一个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      return [start, end]
    }
  },
  {
    text: '最近三个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
      return [start, end]
    }
  }
]

const initChart = () => {
  if (chart) {
    chart.dispose()
  }
  chart = echarts.init(chartRef.value)
}

const handleQuery = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    loading.value = true
    try {
      const [startDate, endDate] = formData.dateRange
      const response = await request.post('/stocks/kline_data/', {
        code: formData.stockCode,
        start_date: startDate,
        end_date: endDate
      })
      
      console.log(response); // 查看返回的数据
      stockInfo.value = {
        name: response.name,
        code: response.code,
        symbol: response.symbol,
        industry: response.industry
      }
      console.log(stockInfo.value); // 查看 stockInfo 的值
      renderChart(response.kline_data, response)

      // 查询用户是否关注该股票
      await checkIfFollowing(formData.stockCode)
    } catch (error) {
      ElMessage.error('获取数据失败')
    } finally {
      loading.value = false
    }
  })
}

// 新增方法：检查用户是否关注该股票
const checkIfFollowing = async (code) => {
  try {
    const response = await request.get(`/stocks/is_following/?code=${code}`)
    isFollowing.value = response.is_following
  } catch (error) {
    ElMessage.error('获取关注状态失败')
  }
}

const handleFollow = async () => {
  console.log("handleFollow" + stockInfo.value); // 查看 stockInfo 的值

  if (!stockInfo.value || !stockInfo.value.code) return
  
  followLoading.value = true
  try {
    if (isFollowing.value==true) {
      const response = await request.post('/stocks/unfollow/', {
        ts_code: stockInfo.value.code
      })
      ElMessage.success(response.detail)
      isFollowing.value = false // 更新关注状态
    }else{
      const response = await request.post('/stocks/follow/', {
        ts_code: stockInfo.value.code
      })
      ElMessage.success(response.detail)
      isFollowing.value = true // 更新关注状态
    }

  } catch (error) {
    // 错误已在请求拦截器中处理
  } finally {
    followLoading.value = false
  }
}

const handleReset = () => {
  formRef.value?.resetFields()
  stockInfo.value = null
  isFollowing.value = false // 重置关注状态
  if (chart) {
    chart.clear()
  }
}

// 渲染图表的方法，等待接口文档后补充具体实现
const renderChart = (data, response) => {
  if (!chart) {
    initChart()
  }

  // 提取数据
  const dates = data.map(item => item.date);
  const klineData = data.map(item => [item.open, item.close, item.low, item.high]);
  const volumeData = data.map(item => item.volume);
  const macdHist = data.map(item => item.indicators.macd.hist);
  const macdDea = data.map(item => item.indicators.macd.dea);
  const macdDiff = data.map(item => item.indicators.macd.diff);

  const rsiData = data.map(item => item.indicators.rsi);
  const ma5 = data.map(item => item.indicators.ma.ma5);
  const ma10 = data.map(item => item.indicators.ma.ma10);
  const ma20 = data.map(item => item.indicators.ma.ma20);

  const markData = []
  var buy_signals = response.buy_signals
  var describes = response.describes

  for(var i=0;i<buy_signals.length;i++){

    for(var j = 0;j<response[buy_signals[i]].length;j++){
      
      if(response[buy_signals[i]][j] == true){
        markData.push({ name: '买点', value: i + "_buy", xAxis: j, yAxis: klineData[j][1] });
      }
    }

  }


  // 添加图表配置
  const option = {
    title: {
      text: ''
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    grid: [
        {
          left: '10%',
          right: '8%',
          height: '40%'
          
        },
        {
          left: '10%',
          right: '8%',
          top: '45%',
          height: '5%'
        },
        {
          left: '10%',
          right: '8%',
          top: '55%',
          height: '10%'
        },
        {
          left: '10%',
          right: '8%',
          top: '65%',
          height: '10%'
        }
      ],
    legend: {
      data: ['K线', 'MA5', 'MA10', 'MA20', '成交量', 'MACD', 'RSI']
    },
    xAxis: [
      {
        type: 'category',
        data: dates,
        scale: true,
        show: true,
        boundaryGap: false,
        axisLine: { onZero: false },
        splitLine: { show: false }
      },
      {
        type: 'category',
        data: dates,
        show: false,
        scale: true,
        gridIndex: 1,
        boundaryGap: false,
        axisLine: { onZero: false },
        splitLine: { show: false },
      },
      {
        type: 'category',
        data: dates,
        show: true,
        scale: true,
        gridIndex: 2,
        boundaryGap: false,
        axisLine: { onZero: true },
        splitLine: { show: false },
      },
      {
        type: 'category',
        data: dates,
        show: true,
        scale: true,
        gridIndex: 3,
        boundaryGap: false,
        axisLine: { onZero: false },
        splitLine: { show: false },
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: '价格',
        position: 'left',
        axisLine: { lineStyle: { color: '#333' } },
        splitLine: { show: false },
        min: (value) => value.min - 1, // 设置下限
        max: (value) => value.max + 1  // 设置上限
      },
      {
        type: 'value',
        name: '成交量',
        position: 'right',
        gridIndex: 1,
        offset: 80,
        axisLine: { lineStyle: { color: '#333' } },
        splitLine: { show: false },
        min: 0, // 设置成交量下限
        max: Math.max(...volumeData) * 1.2 // 设置成交量上限
      },
      {
        type: 'value',
        name: 'MACD',
        gridIndex: 2,
        position: 'left',
        axisLine: { lineStyle: { color: '#333' } },
        splitLine: { show: false },
        min: (value) => value.min, // 设置下限
        max: (value) => value.max  // 设置上限
      },
      {
        type: 'value',
        name: 'RSI',
        gridIndex: 3,
        position: 'right',
        axisLine: { lineStyle: { color: '#333' } },
        splitLine: { show: false },
        min: 0, // 设置RSI下限
        max: 100 // 设置RSI上限
      }
    ],
    dataZoom: [
        {
          type: 'inside',
          xAxisIndex: [0, 1,2,3],
          start: 0,
          end: 100
        },
        {
          type: 'inside',
          xAxisIndex: [0, 1, 2, 3],
          start: 0,
          end: 100
        }
        ,
        {
          type: 'inside',
          xAxisIndex: [0, 1, 2, 3],
          start: 0,
          end: 100
        },
        {

          show: true,
          xAxisIndex: [0, 1, 2, 3],
          type: 'slider',
          top: '80%',
          start: 0,
          end: 100
        }
      ],
    series: [
      {
        name: 'K线',
        type: 'candlestick',
        data: klineData,
        itemStyle: {
          color: '#ec0000',
          color0: '#00da3c',
          borderColor: '#ec0000',
          borderColor0: '#00da3c'
        },
        tooltip: {
          formatter: (params) => {
            return `${params[0].name}<br/>开盘: ${params[0].data[0]}<br/>收盘: ${params[0].data[1]}<br/>最低: ${params[0].data[2]}<br/>最高: ${params[0].data[3]}`;
          }
        },
        markPoint: {
          data: markData,
          symbolSize:25
        },
      },
      {
        name: 'MA5',
        type: 'line',
        data: ma5,
        smooth: true,
        lineStyle: {
          color: '#ffcc00'
        },symbolSize:0
      },
      {
        name: 'MA10',
        type: 'line',
        data: ma10,
        smooth: true,
        lineStyle: {
          color: '#ff6600'
        },symbolSize:0
      },
      {
        name: 'MA20',
        type: 'line',
        data: ma20,
        smooth: true,
        lineStyle: {
          color: '#00ccff'
        },symbolSize:0
      },
      {
        name: '成交量',
        type: 'bar',
        data: volumeData,
        xAxisIndex: 1,
        yAxisIndex: 1,
        itemStyle: {
          color: '#00da3c'
        },
        tooltip: {
          formatter: (params) => {
            return `${params[0].name}<br/>成交量: ${params[0].data}`;
          }
        }
      },
      {
        name: 'MACD',
        type: 'bar',
        xAxisIndex: 2,
        yAxisIndex: 2,
        data: macdHist,
        smooth: true,
        lineStyle: {
          color: '#ff0000'
        },symbolSize:0
      },
      {
        name: 'MACD',
        type: 'line',
        xAxisIndex: 2,
        yAxisIndex: 2,
        data: macdDea,
        smooth: true,
        lineStyle: {
          color: '#0000ff'
        },symbolSize:0
      },
      {
        name: 'MACD',
        type: 'line',
        xAxisIndex: 2,
        yAxisIndex: 2,
        data: macdDiff,
        smooth: true,
        lineStyle: {
          color: '#000000'
        },symbolSize:0
      },
      {
        name: 'RSI',
        type: 'line',
        xAxisIndex: 3,
        yAxisIndex: 3,
        data: rsiData,
        smooth: true,
        lineStyle: {
          color: '#0000ff'
        },symbolSize:0
      }
    ]
  };

  chart.setOption(option); // 设置图表配置
}

onMounted(() => {
  initChart()
})

onUnmounted(() => {
  if (chart) {
    chart.dispose()
    chart = null
  }
})
</script>

<style scoped>
.stock-kline {
  padding: 20px;
}

.chart-container {
  height: 600px;
  margin-top: 20px;
}

.stock-info {
  margin: 20px 0;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.stock-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stock-name {
  font-size: 18px;
  font-weight: bold;
  margin-right: 10px;
}

.stock-code {
  color: #909399;
}
</style>