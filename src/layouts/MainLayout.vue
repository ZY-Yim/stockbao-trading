<template>
  <el-container>
    <el-header>
      <el-menu 
        mode="horizontal" 
        router 
        :default-active="$route.path"
      >
        <el-menu-item index="/screen">股票筛选</el-menu-item>
        <el-menu-item index="/suggestions">交易建议</el-menu-item>
        <el-menu-item index="/kline">K线分析</el-menu-item>
        <el-menu-item index="/stockpool">股票池</el-menu-item>
        <el-menu-item index="/strategydisplay">策略分析</el-menu-item>

      </el-menu>
    </el-header>
    <el-main>
      <router-view></router-view>
    </el-main>
  </el-container>
</template>

<style scoped>
.el-header {
  padding: 0;
  height: auto;
}

.el-main {
  padding: 20px;
}
</style> 