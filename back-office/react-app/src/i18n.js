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
          "About": "About",
          "Activity": "Activity",
          "Additional info": "Additional info",
          "Contact": "Contact",
          "Copy": "Copy",
          "Error connecting to MQTT interaction bus": "Error connecting to MQTT interaction bus",
          "Forgot password?":"Forgot password?",
          "logout": "logout",
          "Offline customers": "Offline customers",
          "Offline students": "Offline students",
          "Online customers": "Online customers",
          "Online students": "Online students",
          "Sign in": "Sign in",
          "User info": "User info",
        }
      },
      ptBR: {
        translation: {
          "About": "Sobre",
          "Activity": "Atividade",
          "Additional info": "Informações adicionais",
          "Contact": "Contato",
          "Copy": "Copiar",
          "Error connecting to MQTT interaction bus": "Erro ao conectar-se ao barramento de interação MQTT",
          "Forgot password?":"Esqueceu a senha?",
          "logout": "sair",
          "Offline customers": "Clientes off-line",
          "Offline students": "Estudantes off-line",
          "Online customers": "Clientes on-line",
          "Online students": "Estudantes on-line",
          "Sign in":"Entrar",
          "User info": "Informações",
        }
      },
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false
      },
      react: {
        wait: true,
      }
    },
  })

  export default i18n
