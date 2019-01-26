import i18n from "i18next";
import LanguageDetector from 'i18next-browser-languagedetector';
import { reactI18nextModule } from "react-i18next";

i18n
  .use(LanguageDetector)
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
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    },
    react: {
      wait: true,
    }
  })


  export default i18n
