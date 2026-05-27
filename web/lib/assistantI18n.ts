import { isLocale, type Locale } from "./i18n";

type AssistantActionCopy = {
  startDesigning: string;
  viewShirt: string;
  openAiCreator: string;
  useThisIdea: string;
  setCenterChest: string;
  setLeftChest: string;
  openUpload: string;
  continueToQuote: string;
  resetBubble: string;
};

export type AssistantCopy = {
  languageName: string;
  title: string;
  launcherLabel: string;
  kicker: string;
  welcomeMessage: string;
  quickPrompts: string[];
  suggestionsLabel: string;
  assistantLabel: string;
  userLabel: string;
  thinking: string;
  actionsLabel: string;
  actions: AssistantActionCopy;
  inputLabel: string;
  placeholder: string;
  send: string;
  footnote: string;
  helper: string;
  panelAria: string;
  closeAria: string;
  sendAria: string;
  launcherAria: string;
  unavailable: string;
  disabled: string;
  notConfigured: string;
  rateLimit: string;
  badRequest: string;
  emptyRequest: string;
  suggestedArtworkFallback: string;
  suggestedEidPrompt: string;
};

const assistantCopies: Record<Locale, AssistantCopy> = {
  en: {
    languageName: "English",
    title: "AI Design Agent",
    launcherLabel: "Design Agent",
    kicker: "Stitchra Studio",
    welcomeMessage:
      "I can help you choose placement, prepare your logo file, understand the quote flow and decide what to upload.",
    quickPrompts: [
      "Help me choose logo placement",
      "What logo file should I upload?",
      "How much will it cost?",
      "Can I order one T-shirt?",
      "When do I pay?",
      "Can I use a brand logo?",
    ],
    suggestionsLabel: "Suggested prompts",
    assistantLabel: "Design agent",
    userLabel: "You",
    thinking: "Thinking...",
    actionsLabel: "Design actions",
    actions: {
      startDesigning: "Start Designing",
      viewShirt: "View Shirt",
      openAiCreator: "Open AI Creator",
      useThisIdea: "Use this idea",
      setCenterChest: "Set Center Chest",
      setLeftChest: "Set Left Chest",
      openUpload: "Open Upload",
      continueToQuote: "Continue to Quote",
      resetBubble: "Reset bubble",
    },
    inputLabel: "Ask about your design",
    placeholder: "Ask about placement, logo files, price or payment...",
    send: "Send",
    footnote:
      "Session-only guidance. Do not share card details or private order data here.",
    helper: "I’m here to help",
    panelAria: "Stitchra AI Design Agent",
    closeAria: "Close Stitchra AI Design Agent",
    sendAria: "Send message",
    launcherAria: "Open Stitchra AI Design Agent. Drag on mobile to move.",
    unavailable:
      "The Stitchra AI Design Agent is temporarily unavailable. You can still use the configurator and submit a quote request.",
    disabled: "Stitchra AI Design Agent is currently disabled.",
    notConfigured: "Stitchra AI Design Agent is not configured yet.",
    rateLimit:
      "You reached the assistant limit for now. You can still use the configurator and submit a quote request.",
    badRequest: "Send a message to the Stitchra Design Agent.",
    emptyRequest:
      "Ask me about logo placement, upload files, pricing or the Stitchra quote flow.",
    suggestedArtworkFallback:
      "clean event badge with bold text, simple icon and 4-6 colors",
    suggestedEidPrompt:
      "original school Eid al-Adha badge with crescent, lantern and bold text",
  },
  de: {
    languageName: "German",
    title: "KI-Design-Assistent",
    launcherLabel: "Design-Assistent",
    kicker: "Stitchra Studio",
    welcomeMessage:
      "Ich helfe dir bei Platzierung, Logo-Dateien, dem Angebotsablauf und der Frage, was du hochladen solltest.",
    quickPrompts: [
      "Hilf mir bei der Logo-Platzierung",
      "Welche Logo-Datei soll ich hochladen?",
      "Wie viel kostet es?",
      "Kann ich ein einzelnes T-Shirt bestellen?",
      "Wann bezahle ich?",
      "Darf ich ein Markenlogo verwenden?",
    ],
    suggestionsLabel: "Vorschläge",
    assistantLabel: "Design-Assistent",
    userLabel: "Du",
    thinking: "Denke nach...",
    actionsLabel: "Design-Aktionen",
    actions: {
      startDesigning: "Design starten",
      viewShirt: "Shirt ansehen",
      openAiCreator: "KI-Creator öffnen",
      useThisIdea: "Idee verwenden",
      setCenterChest: "Mittig platzieren",
      setLeftChest: "Linke Brust",
      openUpload: "Upload öffnen",
      continueToQuote: "Zum Angebot",
      resetBubble: "Blase zurücksetzen",
    },
    inputLabel: "Frage zu deinem Design",
    placeholder:
      "Frag nach Platzierung, Logo-Dateien, Preis oder Zahlung...",
    send: "Senden",
    footnote:
      "Nur Sitzungs-Hilfe. Teile hier keine Kartendaten oder privaten Bestelldaten.",
    helper: "Ich helfe dir",
    panelAria: "Stitchra KI-Design-Assistent",
    closeAria: "Stitchra KI-Design-Assistent schließen",
    sendAria: "Nachricht senden",
    launcherAria:
      "Stitchra KI-Design-Assistent öffnen. Auf Mobilgeräten ziehen zum Verschieben.",
    unavailable:
      "Der Stitchra KI-Design-Assistent ist vorübergehend nicht verfügbar. Du kannst den Konfigurator weiter nutzen und eine Anfrage senden.",
    disabled:
      "Der Stitchra KI-Design-Assistent ist aktuell deaktiviert.",
    notConfigured:
      "Der Stitchra KI-Design-Assistent ist noch nicht konfiguriert.",
    rateLimit:
      "Du hast das Assistentenlimit vorerst erreicht. Du kannst den Konfigurator weiter nutzen und eine Anfrage senden.",
    badRequest: "Sende eine Nachricht an den Stitchra Design-Assistenten.",
    emptyRequest:
      "Frag mich nach Logo-Platzierung, Upload-Dateien, Preisen oder dem Stitchra Angebotsablauf.",
    suggestedArtworkFallback:
      "sauberes Event-Badge mit kräftigem Text, einfachem Symbol und 4-6 Farben",
    suggestedEidPrompt:
      "originelles Schul-Badge zu Eid al-Adha mit Halbmond, Laterne und kräftigem Text",
  },
  fr: {
    languageName: "French",
    title: "Assistant design IA",
    launcherLabel: "Assistant design",
    kicker: "Studio Stitchra",
    welcomeMessage:
      "Je peux t’aider à choisir l’emplacement, préparer ton fichier logo, comprendre le devis et décider quoi importer.",
    quickPrompts: [
      "Aide-moi à choisir l’emplacement du logo",
      "Quel fichier logo dois-je importer ?",
      "Combien ça va coûter ?",
      "Puis-je commander un seul T-shirt ?",
      "Quand est-ce que je paie ?",
      "Puis-je utiliser un logo de marque ?",
    ],
    suggestionsLabel: "Questions rapides",
    assistantLabel: "Assistant design",
    userLabel: "Vous",
    thinking: "Réflexion...",
    actionsLabel: "Actions design",
    actions: {
      startDesigning: "Commencer le design",
      viewShirt: "Voir le T-shirt",
      openAiCreator: "Ouvrir le créateur IA",
      useThisIdea: "Utiliser cette idée",
      setCenterChest: "Centrer poitrine",
      setLeftChest: "Poitrine gauche",
      openUpload: "Importer un logo",
      continueToQuote: "Continuer au devis",
      resetBubble: "Réinitialiser la bulle",
    },
    inputLabel: "Question sur votre design",
    placeholder:
      "Pose une question sur le placement, les fichiers logo, le prix ou le paiement...",
    send: "Envoyer",
    footnote:
      "Conseils limités à cette session. Ne partagez pas de données bancaires ou de commande privée ici.",
    helper: "Je suis là pour aider",
    panelAria: "Assistant design IA de Stitchra",
    closeAria: "Fermer l’assistant design IA de Stitchra",
    sendAria: "Envoyer le message",
    launcherAria:
      "Ouvrir l’assistant design IA de Stitchra. Faites glisser sur mobile pour le déplacer.",
    unavailable:
      "L’assistant design IA de Stitchra est temporairement indisponible. Vous pouvez toujours utiliser le configurateur et envoyer une demande de devis.",
    disabled:
      "L’assistant design IA de Stitchra est actuellement désactivé.",
    notConfigured:
      "L’assistant design IA de Stitchra n’est pas encore configuré.",
    rateLimit:
      "Vous avez atteint la limite de l’assistant pour le moment. Vous pouvez toujours utiliser le configurateur et envoyer une demande.",
    badRequest: "Envoyez un message à l’assistant design Stitchra.",
    emptyRequest:
      "Posez-moi une question sur l’emplacement du logo, les fichiers, les prix ou le devis Stitchra.",
    suggestedArtworkFallback:
      "badge d’événement propre avec texte lisible, icône simple et 4 à 6 couleurs",
    suggestedEidPrompt:
      "badge scolaire original pour l’Aïd al-Adha avec croissant, lanterne et texte lisible",
  },
  ar: {
    languageName: "Arabic",
    title: "مساعد التصميم بالذكاء الاصطناعي",
    launcherLabel: "مساعد التصميم",
    kicker: "استوديو Stitchra",
    welcomeMessage:
      "أساعدك في اختيار موضع الشعار، وتجهيز ملف التصميم، وفهم طلب السعر وما الأفضل رفعه.",
    quickPrompts: [
      "ساعدني في اختيار موضع الشعار",
      "ما نوع ملف الشعار المناسب؟",
      "كم سيكلف؟",
      "هل يمكنني طلب قميص واحد؟",
      "متى أدفع؟",
      "هل يمكنني استخدام شعار علامة تجارية؟",
    ],
    suggestionsLabel: "أسئلة سريعة",
    assistantLabel: "مساعد التصميم",
    userLabel: "أنت",
    thinking: "جار التفكير...",
    actionsLabel: "إجراءات التصميم",
    actions: {
      startDesigning: "ابدأ التصميم",
      viewShirt: "عرض القميص",
      openAiCreator: "افتح منشئ AI",
      useThisIdea: "استخدم هذه الفكرة",
      setCenterChest: "توسيط على الصدر",
      setLeftChest: "الصدر الأيسر",
      openUpload: "رفع شعار",
      continueToQuote: "المتابعة للسعر",
      resetBubble: "إعادة ضبط الفقاعة",
    },
    inputLabel: "اسأل عن تصميمك",
    placeholder: "اسأل عن موضع الشعار أو الملفات أو السعر أو الدفع...",
    send: "إرسال",
    footnote:
      "إرشاد لهذه الجلسة فقط. لا تشارك بيانات البطاقة أو الطلب الخاصة هنا.",
    helper: "أنا هنا للمساعدة",
    panelAria: "مساعد التصميم بالذكاء الاصطناعي من Stitchra",
    closeAria: "إغلاق مساعد التصميم من Stitchra",
    sendAria: "إرسال الرسالة",
    launcherAria:
      "افتح مساعد التصميم من Stitchra. اسحبه على الهاتف لتغيير مكانه.",
    unavailable:
      "مساعد التصميم بالذكاء الاصطناعي في Stitchra غير متاح مؤقتًا. يمكنك استخدام أداة التصميم وإرسال طلب سعر.",
    disabled:
      "مساعد التصميم بالذكاء الاصطناعي في Stitchra غير متاح حاليًا.",
    notConfigured:
      "مساعد التصميم بالذكاء الاصطناعي في Stitchra غير مهيأ بعد.",
    rateLimit:
      "وصلت إلى حد استخدام المساعد الآن. يمكنك متابعة استخدام أداة التصميم وإرسال طلب سعر.",
    badRequest: "أرسل رسالة إلى مساعد التصميم في Stitchra.",
    emptyRequest:
      "اسألني عن موضع الشعار أو ملفات الرفع أو الأسعار أو طريقة طلب السعر في Stitchra.",
    suggestedArtworkFallback:
      "شارة حدث أصلية بنص واضح وأيقونة بسيطة و4 إلى 6 ألوان",
    suggestedEidPrompt:
      "شارة مدرسية أصلية لعيد الأضحى مع هلال وفانوس ونص واضح",
  },
  es: {
    languageName: "Spanish",
    title: "Asistente de diseño IA",
    launcherLabel: "Asistente diseño",
    kicker: "Studio Stitchra",
    welcomeMessage:
      "Puedo ayudarte a elegir la ubicación, preparar tu archivo de logo, entender el flujo de presupuesto y decidir qué subir.",
    quickPrompts: [
      "Ayúdame a elegir la ubicación del logo",
      "¿Qué archivo de logo debo subir?",
      "¿Cuánto costará?",
      "¿Puedo pedir una sola camiseta?",
      "¿Cuándo pago?",
      "¿Puedo usar un logo de marca?",
    ],
    suggestionsLabel: "Preguntas rápidas",
    assistantLabel: "Asistente de diseño",
    userLabel: "Tú",
    thinking: "Pensando...",
    actionsLabel: "Acciones de diseño",
    actions: {
      startDesigning: "Empezar diseño",
      viewShirt: "Ver camiseta",
      openAiCreator: "Abrir creador IA",
      useThisIdea: "Usar esta idea",
      setCenterChest: "Centro del pecho",
      setLeftChest: "Pecho izquierdo",
      openUpload: "Subir logo",
      continueToQuote: "Continuar al precio",
      resetBubble: "Restablecer burbuja",
    },
    inputLabel: "Pregunta sobre tu diseño",
    placeholder:
      "Pregunta sobre ubicación, archivos de logo, precio o pago...",
    send: "Enviar",
    footnote:
      "Guía solo para esta sesión. No compartas datos de tarjeta ni datos privados del pedido aquí.",
    helper: "Estoy aquí para ayudarte",
    panelAria: "Asistente de diseño IA de Stitchra",
    closeAria: "Cerrar asistente de diseño IA de Stitchra",
    sendAria: "Enviar mensaje",
    launcherAria:
      "Abrir el asistente de diseño IA de Stitchra. Arrastra en móvil para moverlo.",
    unavailable:
      "El asistente de diseño IA de Stitchra no está disponible temporalmente. Puedes seguir usando el configurador y enviar una solicitud de presupuesto.",
    disabled:
      "El asistente de diseño IA de Stitchra está desactivado actualmente.",
    notConfigured:
      "El asistente de diseño IA de Stitchra aún no está configurado.",
    rateLimit:
      "Has alcanzado el límite del asistente por ahora. Puedes seguir usando el configurador y enviar una solicitud.",
    badRequest: "Envía un mensaje al asistente de diseño de Stitchra.",
    emptyRequest:
      "Pregúntame sobre ubicación del logo, archivos, precios o el flujo de presupuesto de Stitchra.",
    suggestedArtworkFallback:
      "insignia de evento limpia con texto claro, icono simple y 4-6 colores",
    suggestedEidPrompt:
      "insignia escolar original de Eid al-Adha con media luna, farol y texto claro",
  },
  ru: {
    languageName: "Russian",
    title: "AI-помощник по дизайну",
    launcherLabel: "AI-помощник",
    kicker: "Студия Stitchra",
    welcomeMessage:
      "Я помогу выбрать размещение, подготовить файл логотипа, понять запрос цены и решить, что лучше загрузить.",
    quickPrompts: [
      "Помоги выбрать место для логотипа",
      "Какой файл логотипа загрузить?",
      "Сколько это будет стоить?",
      "Можно заказать одну футболку?",
      "Когда нужно платить?",
      "Можно использовать логотип бренда?",
    ],
    suggestionsLabel: "Быстрые вопросы",
    assistantLabel: "Помощник по дизайну",
    userLabel: "Вы",
    thinking: "Думаю...",
    actionsLabel: "Действия дизайна",
    actions: {
      startDesigning: "Начать дизайн",
      viewShirt: "Посмотреть футболку",
      openAiCreator: "Открыть AI Creator",
      useThisIdea: "Использовать идею",
      setCenterChest: "По центру груди",
      setLeftChest: "Левая грудь",
      openUpload: "Загрузить логотип",
      continueToQuote: "К расчету цены",
      resetBubble: "Сбросить пузырь",
    },
    inputLabel: "Вопрос о вашем дизайне",
    placeholder:
      "Спросите о размещении, файлах логотипа, цене или оплате...",
    send: "Отправить",
    footnote:
      "Подсказки только для этой сессии. Не отправляйте здесь данные карты или приватные данные заказа.",
    helper: "Я здесь, чтобы помочь",
    panelAria: "AI-помощник Stitchra по дизайну",
    closeAria: "Закрыть AI-помощника Stitchra",
    sendAria: "Отправить сообщение",
    launcherAria:
      "Открыть AI-помощника Stitchra. На мобильном можно перетащить.",
    unavailable:
      "AI-помощник Stitchra временно недоступен. Вы всё равно можете использовать конфигуратор и отправить запрос цены.",
    disabled: "AI-помощник Stitchra сейчас отключён.",
    notConfigured: "AI-помощник Stitchra ещё не настроен.",
    rateLimit:
      "Вы достигли лимита помощника на данный момент. Вы всё равно можете использовать конфигуратор и отправить запрос.",
    badRequest: "Отправьте сообщение AI-помощнику Stitchra.",
    emptyRequest:
      "Спросите меня о размещении логотипа, файлах, ценах или запросе цены в Stitchra.",
    suggestedArtworkFallback:
      "чистый бейдж для события с понятным текстом, простым значком и 4-6 цветами",
    suggestedEidPrompt:
      "оригинальный школьный бейдж для Eid al-Adha с полумесяцем, фонарем и понятным текстом",
  },
};

export function normalizeAssistantLocale(value: unknown): Locale {
  return typeof value === "string" && isLocale(value) ? value : "en";
}

export function getAssistantCopy(locale: Locale) {
  return assistantCopies[locale] ?? assistantCopies.en;
}

export function getAssistantLanguageInstruction(locale: Locale) {
  const copy = getAssistantCopy(locale);

  if (locale === "ar") {
    return "Answer in Arabic. Use natural Arabic. Keep brand names like Stitchra, Stripe and Pollinations.ai unchanged. Do not mix English unless necessary. Keep the answer short, helpful and specific to Stitchra.";
  }

  return `Answer in ${copy.languageName}. Keep brand names like Stitchra, Stripe and Pollinations.ai unchanged. Keep the answer short, helpful and specific to Stitchra.`;
}
