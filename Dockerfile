FROM node:20-slim
WORKDIR /app
RUN echo "Test: Docker works!" && node --version && npm --version
CMD ["node", "-e", "console.log('hello')"]
