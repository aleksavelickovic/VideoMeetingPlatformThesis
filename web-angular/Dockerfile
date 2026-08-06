FROM node:22-alpine AS build
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine AS runtime
COPY --from=build /app/dist/lilly-recorder-angular/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY public/env.template.js /usr/share/nginx/html/env.template.js

ENV VITE_API_URL=/api
ENV VITE_LIVEKIT_URL=ws://localhost:7880
ENV VITE_API_KEY=

EXPOSE 3000
CMD ["/bin/sh", "-c", "envsubst < /usr/share/nginx/html/env.template.js > /usr/share/nginx/html/env.js && exec nginx -g 'daemon off;'"]
