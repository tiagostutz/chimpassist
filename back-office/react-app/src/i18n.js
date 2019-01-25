import i18n from "i18next";
import { reactI18nextModule } from "react-i18next";

i18n
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
          "Forgot password?":"Esqueceu a senha?",
          "Offline customers": "Offline customers",
          "Online customers": "Online customers",
          "Sign in": "Entrar",
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
          "Forgot password?":"Forgot password?",
          "Offline customers": "Estudantes off-line",
          "Online customers": "Estudantes on-line",
          "Sign in":"Sign in",
          "User info": "Informações",
        }
      }
    },
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });
