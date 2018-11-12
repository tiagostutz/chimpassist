import i18n from "i18next";
import { reactI18nextModule } from "react-i18next";

i18n
  .use(reactI18nextModule)
  .init({
    resources: {
      en: {
        translation: {
          "You": "You",
          "Write a message": "Write a message"
        }
      },
      ptBR: {
        translation: {
          "You": "Você",
          "Write a message": "Escreva sua mensagem"
        }
      }
    },
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });
