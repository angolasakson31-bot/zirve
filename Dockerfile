FROM node:20-slim
WORKDIR /app
COPY package.json ./
RUN npm install --legacy-peer-deps --no-optional --no-audit --no-fund
CMD ["node", "-e", "require('http').createServer((r,s)=>s.end('ok')).listen(process.env.PORT||3000)"]
