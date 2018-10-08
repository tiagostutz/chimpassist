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
        }
      },
      ptBR: {
        translation: {
          "Online costumers": "Clientes on-line",
          "Offline costumers": "Outros Clientes"
        }
      }
    },
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });
