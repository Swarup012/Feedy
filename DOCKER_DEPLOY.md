# Feedy Frontend - Docker Deployment Guide

## 📦 Building for Production

### **1. Build the Docker Image**

```bash
cd Feedy

# Build with default API URL
docker build -t your-dockerhub-username/feedy-frontend:latest .

# OR build with custom API URL
docker build --build-arg NEXT_PUBLIC_API_URL=https://api.yourdomain.com -t your-dockerhub-username/feedy-frontend:latest .
```

### **2. Test Locally**

```bash
# Run the container
docker run -p 5173:5173 your-dockerhub-username/feedy-frontend:latest

# Or with environment variable
docker run -p 5173:5173 -e NEXT_PUBLIC_API_URL=https://api.yourdomain.com your-dockerhub-username/feedy-frontend:latest

# Visit http://localhost:5173
```

### **3. Push to Docker Hub**

```bash
# Login to Docker Hub
docker login

# Push the image
docker push your-dockerhub-username/feedy-frontend:latest

# Optional: Tag with version
docker tag your-dockerhub-username/feedy-frontend:latest your-dockerhub-username/feedy-frontend:v1.0.0
docker push your-dockerhub-username/feedy-frontend:v1.0.0
```

---

## 🚀 Deploying on Server

### **Using Docker Compose (Recommended)**

```bash
# Create .env file with production values
cat > .env << EOF
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
EOF

# Pull and run
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

### **Using Docker Run**

```bash
# Pull from Docker Hub
docker pull your-dockerhub-username/feedy-frontend:latest

# Run
docker run -d \
  --name feedy-frontend \
  -p 5173:5173 \
  -e NEXT_PUBLIC_API_URL=https://api.yourdomain.com \
  --restart unless-stopped \
  your-dockerhub-username/feedy-frontend:latest

# Check status
docker ps
docker logs feedy-frontend
```

---

## 🔍 Health Check

The container includes a health check that runs every 30 seconds:

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' feedy-frontend
```

---

## 🛠️ Troubleshooting

### **Container won't start**
```bash
# Check logs
docker logs feedy-frontend

# Check if port is already in use
sudo lsof -i :5173
```

### **Can't connect to backend**
```bash
# Verify environment variable
docker exec feedy-frontend env | grep NEXT_PUBLIC_API_URL

# Test backend connection from container
docker exec feedy-frontend wget -qO- http://localhost:3000/api/health
```

### **Rebuild without cache**
```bash
docker build --no-cache -t your-dockerhub-username/feedy-frontend:latest .
```

---

## 📊 Image Information

- **Base Image**: node:20-alpine
- **Final Size**: ~150-200MB (optimized)
- **Exposed Port**: 5173
- **Health Check**: Every 30s
- **User**: nextjs (non-root)

---

## 🔒 Security Notes

✅ Runs as non-root user (nextjs)  
✅ Multi-stage build (smaller attack surface)  
✅ No sensitive data in image (uses build args)  
✅ Health checks enabled  

---

## 📝 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | - | Backend API URL |
| `NODE_ENV` | No | production | Node environment |
| `PORT` | No | 5173 | Server port |

---

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      
      - name: Build and Push
        uses: docker/build-push-action@v4
        with:
          context: ./Feedy
          file: ./Feedy/Dockerfile
          push: true
          tags: |
            your-dockerhub-username/feedy-frontend:latest
            your-dockerhub-username/feedy-frontend:${{ github.sha }}
          build-args: |
            NEXT_PUBLIC_API_URL=${{ secrets.NEXT_PUBLIC_API_URL }}
```

---

## ✅ Pre-Push Checklist

- [ ] Update `NEXT_PUBLIC_API_URL` in build args
- [ ] Test build locally: `docker build -t test .`
- [ ] Test run locally: `docker run -p 5173:5173 test`
- [ ] Verify health check: `docker inspect test`
- [ ] Update version tag if needed
- [ ] Push to Docker Hub
- [ ] Test pull and run on target server
