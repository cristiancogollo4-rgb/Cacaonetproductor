# --- ETAPA 1: CONSTRUCCIÓN (BUILD) ---
FROM node:18-alpine as build

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código fuente
COPY . .

# Construir la aplicación para producción
# IMPORTANTE: Si usas Vite, esto crea la carpeta 'dist'. Si usas Create-React-App, crea 'build'.
RUN npm run build

# --- ETAPA 2: SERVIDOR (NGINX) ---
FROM nginx:alpine

# Copiar la configuración de Nginx que creamos en el paso 1
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos construidos desde la Etapa 1 al servidor Nginx
# NOTA: Si tu proyecto no usa Vite y usa 'create-react-app', cambia '/app/dist' por '/app/build'
COPY --from=build /app/dist /usr/share/nginx/html

# Exponer el puerto 80
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]