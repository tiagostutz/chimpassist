import i18n from "i18next";
import { reactI18nextModule } from "react-i18next";

i18n
  .use(reactI18nextModule)
  .init({
    resources: {
      en: {
        translation: {
          "Online costumers": "Online costumers",
          "Offline costumers": "Offline costumers",
          "About": "About",
          "Error connecting to MQTT interaction bus": "Error connecting to MQTT interaction bus"
        }
      },
      ptBR: {
        translation: {
          "Online costumers": "Clientes on-line",
          "Offline costumers": "Clientes off-line",
          "About": "Sobre",
          "Error connecting to MQTT interaction bus": "Erro ao conectar-se ao barramento de interação MQTT"
        }
      }
    },
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });
