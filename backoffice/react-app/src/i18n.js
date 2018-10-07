import i18n from "i18next";
import { reactI18nextModule } from "react-i18next";

i18n
  .use(reactI18nextModule)
  .init({
    resources: {
      en: {
        translation: {
          "Last seen at": "last seen at",
          "Online costumers": "On-line costumers",
          "Other costumers": "Other costumers",
        }
      },
      ptBR: {
        translation: {
          "Last seen at": "visto por último às",
          "Online costumers": "Clientes on-line",
          "Other costumers": "Outros Clientes"
        }
      }
    },
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });
