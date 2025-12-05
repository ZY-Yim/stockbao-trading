# Docker 部署指南

## 快速开始

### 1. 使用 Docker 构建和运行

```bash
# 构建镜像
docker build -t stock-trading-app .

# 运行容器
docker run -d -p 3000:80 --name stock-trading stock-trading-app
```

访问应用：http://localhost:3000

### 2. 使用 Docker Compose

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 配置说明

### Dockerfile
- **多阶段构建**：使用 Node.js 构建应用，然后使用 Nginx 提供静态文件服务
- **优化**：只复制必要的文件到最终镜像，减小镜像体积

### nginx.conf
- **SPA 支持**：配置了 Vue Router history 模式的支持
- **静态资源缓存**：对 JS/CSS/图片等静态资源设置缓存
- **Gzip 压缩**：启用压缩以减少传输体积
- **API 代理**：预留了 API 代理配置（如果需要）

### .dockerignore
- 排除不必要的文件和目录，减少构建上下文大小
- 提高构建速度和安全性

## 环境配置

如果需要不同环境的配置，可以创建不同的 Dockerfile：

### 开发环境 (Dockerfile.dev)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
```

### 生产环境优化
- 使用多阶段构建减小镜像体积
- 使用 Alpine Linux 减少安全漏洞
- 配置 Nginx 缓存策略

## 部署到云平台

### Docker Hub
```bash
# 标记镜像
docker tag stock-trading-app your-username/stock-trading-app:latest

# 推送到 Docker Hub
docker push your-username/stock-trading-app:latest
```

### 使用环境变量
在 docker-compose.yml 中可以配置环境变量：

```yaml
environment:
  - API_BASE_URL=https://your-api-domain.com
  - NODE_ENV=production
```

## 监控和日志

```bash
# 查看容器状态
docker ps

# 查看容器日志
docker logs stock-trading

# 进入容器
docker exec -it stock-trading sh
```

## 故障排除

1. **端口冲突**：确保端口 3000 没有被其他服务占用
2. **构建失败**：检查 package.json 中的依赖是否正确
3. **路由问题**：确保 nginx.conf 中配置了正确的 SPA 路由支持
