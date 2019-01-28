FROM node:10-alpine

RUN npm install -g create-react-app
RUN npm install -g local-web-server
RUN mkdir -p /usr/src/app

EXPOSE 80

WORKDIR /usr/src/app
RUN rm -rf build || true

COPY ./react-app/package.json /usr/src/app
RUN npm install

ARG NODE_ENV
ENV NODE_ENV $NODE_ENV
ARG DEBUG
ENV DEBUG $DEBUG
ARG BUILD_LOGO_SMALL_URL
ENV BUILD_LOGO_SMALL_URL SED_LOGO_SMALL_URL
ARG BUILD_DEFAULT_ATTENDANT_AVATAR_URL
ENV BUILD_DEFAULT_ATTENDANT_AVATAR_URL SED_DEFAULT_ATTENDANT_AVATAR_URL
ARG BUILD_AUTHENTICATION_ENDPOINT
ENV BUILD_AUTHENTICATION_ENDPOINT SED_AUTHENTICATION_ENDPOINT
ARG BUILD_BACKEND_ENDPOINT
ENV BUILD_BACKEND_ENDPOINT SED_BACKEND_ENDPOINT
ARG BUILD_STATISTICS_ENDPOINT
ENV BUILD_STATISTICS_ENDPOINT SED_STATISTICS_ENDPOINT
ARG BUILD_FORCE_i18n_LANGUAGE
ENV BUILD_FORCE_i18n_LANGUAGE SED_FORCE_i18n_LANGUAGE
ARG BUILD_ONLINE_CUSTOMERS_LABEL
ENV BUILD_ONLINE_CUSTOMERS_LABEL SED_ONLINE_CUSTOMERS_LABEL
ARG BUILD_OFFLINE_CUSTOMERS_LABEL
ENV BUILD_OFFLINE_CUSTOMERS_LABEL SED_OFFLINE_CUSTOMERS_LABEL
ARG BUILD_MQTT_BROKER_HOST
ENV BUILD_MQTT_BROKER_HOST SED_MQTT_BROKER_HOST
ARG BUILD_MQTT_USERNAME
ENV BUILD_MQTT_USERNAME SED_MQTT_USERNAME
ARG BUILD_MQTT_PASSWORD
ENV BUILD_MQTT_PASSWORD SED_MQTT_PASSWORD
ARG BUILD_MQTT_BASE_TOPIC
ENV BUILD_MQTT_BASE_TOPIC SED_MQTT_BASE_TOPIC

COPY ./react-app/public /usr/src/app/public
COPY ./react-app/src /usr/src/app/src
RUN npm run build

RUN chmod -R 777 /usr/src/app/build/
WORKDIR /usr/src/app/build/

RUN echo "echo \"LOGO_SMALL_URL=\$LOGO_SMALL_URL\"" > startup.sh
RUN echo "sed \"s|SED_LOGO_SMALL_URL|\$LOGO_SMALL_URL|g\" -i static/js/$(ls static/js | head -n 1)" >> startup.sh

RUN echo "echo \"DEFAULT_ATTENDANT_AVATAR_URL=\$DEFAULT_ATTENDANT_AVATAR_URL\"" >> startup.sh
RUN echo "sed \"s|SED_DEFAULT_ATTENDANT_AVATAR_URL|\$DEFAULT_ATTENDANT_AVATAR_URL|g\" -i static/js/$(ls static/js | head -n 1)" >> startup.sh

RUN echo "echo \"BACKEND_ENDPOINT=\$BACKEND_ENDPOINT\"" >> startup.sh
RUN echo "sed \"s|SED_BACKEND_ENDPOINT|\$BACKEND_ENDPOINT|g\" -i static/js/$(ls static/js | head -n 1)" >> startup.sh

RUN echo "echo \"FORCE_i18n_LANGUAGE=\$FORCE_i18n_LANGUAGE\"" >> startup.sh
RUN echo "sed \"s|SED_FORCE_i18n_LANGUAGE|\$FORCE_i18n_LANGUAGE|g\" -i static/js/$(ls static/js | head -n 1)" >> startup.sh

RUN echo "echo \"STATISTICS_ENDPOINT=\$STATISTICS_ENDPOINT\"" >> startup.sh
RUN echo "sed \"s|SED_STATISTICS_ENDPOINT|\$STATISTICS_ENDPOINT|g\" -i static/js/$(ls static/js | head -n 1)" >> startup.sh

RUN echo "echo \"STATISTICS_ENDPOINT=\$STATISTICS_ENDPOINT\"" >> startup.sh
RUN echo "sed \"s|SED_STATISTICS_ENDPOINT|\$STATISTICS_ENDPOINT|g\" -i static/js/$(ls static/js | head -n 1)" >> startup.sh

RUN echo "echo \"ONLINE_CUSTOMERS_LABEL=\$ONLINE_CUSTOMERS_LABEL\"" >> startup.sh
RUN echo "sed \"s|SED_ONLINE_CUSTOMERS_LABEL|\$ONLINE_CUSTOMERS_LABEL|g\" -i static/js/$(ls static/js | head -n 1)" >> startup.sh

RUN echo "echo \"OFFLINE_CUSTOMERS_LABEL=\$OFFLINE_CUSTOMERS_LABEL\"" >> startup.sh
RUN echo "sed \"s|SED_OFFLINE_CUSTOMERS_LABEL|\$OFFLINE_CUSTOMERS_LABEL|g\" -i static/js/$(ls static/js | head -n 1)" >> startup.sh

RUN echo "echo \"MQTT_BROKER_HOST=\$MQTT_BROKER_HOST\"" >> startup.sh
RUN echo "sed \"s|SED_MQTT_BROKER_HOST|\$MQTT_BROKER_HOST|g\" -i static/js/$(ls static/js | head -n 1)" >> startup.sh

RUN echo "echo \"MQTT_USERNAME=\$MQTT_USERNAME\"" >> startup.sh
RUN echo "sed \"s|SED_MQTT_USERNAME|\$MQTT_USERNAME|g\" -i static/js/$(ls static/js | head -n 1)" >> startup.sh

RUN echo "echo \"MQTT_PASSWORD=\$MQTT_PASSWORD\"" >> startup.sh
RUN echo "sed \"s|SED_MQTT_PASSWORD|\$MQTT_PASSWORD|g\" -i static/js/$(ls static/js | head -n 1)" >> startup.sh

RUN echo "echo \"MQTT_BASE_TOPIC=\$MQTT_BASE_TOPIC\"" >> startup.sh
RUN echo "sed \"s|SED_MQTT_BASE_TOPIC|\$MQTT_BASE_TOPIC|g\" -i static/js/$(ls static/js | head -n 1)" >> startup.sh

RUN echo "ws -p 80 --spa index.html" >> startup.sh
RUN chmod +x startup.sh
ENTRYPOINT [ "sh" ]
CMD ["./startup.sh"]


