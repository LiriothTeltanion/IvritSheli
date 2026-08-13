"""Reviewed A2 additions to the built-in Hebrew starter lexicon.

The 96 exact senses in this module extend the 144-entry A0/A1 collection
without changing existing source identities.  Infinitives are preferred for
verbs so the starter data does not imply an unreviewed conjugation table.
"""

from __future__ import annotations

from collections.abc import Sequence
from typing import Any, NamedTuple

STARTER_PROVENANCE_V4 = "Ivrit Sheli editorial review; A2 practical independence sense v2.8"


class _Row(NamedTuple):
    word: str
    niqqud: str
    romanization: str
    pos: str
    gloss_en: str
    gloss_es: str
    visual_id: str
    emoji: str
    scene_en: str
    scene_es: str
    scene_he: str
    example_he: str
    example_en: str
    example_es: str
    example_romanization: str
    gender: str | None = None


def _reading_hint(
    *,
    display: str,
    note_en: str,
    note_es: str,
    note_he: str,
) -> dict[str, str]:
    """Return a linguistically reviewed reading aid."""
    return {
        "display": display,
        "note_en": note_en,
        "note_es": note_es,
        "note_he": note_he,
    }


READING_HINTS: dict[str, list[dict[str, str]]] = {
    "housing.contract": [
        _reading_hint(
            display="חוֹזֶה",
            note_en="The first vowel is o: kho-ze.",
            note_es="La primera vocal es o: jo-ze.",
            note_he="התנועה הראשונה היא חוֹ: חוֹ־זֶה.",
        )
    ],
    "bureaucracy.form": [
        _reading_hint(
            display="טֹפֶס",
            note_en="Read to-fes; the first syllable has o.",
            note_es="Se lee to-fes; la primera sílaba lleva o.",
            note_he="קוראים טוֹ־פֶס, עם תנועת o בהתחלה.",
        )
    ],
    "autonomy.can": [
        _reading_hint(
            display="אֶפְשָׁר",
            note_en="Read ef-shar, with stress on the last syllable.",
            note_es="Se lee ef-shar, con acento en la última sílaba.",
            note_he="קוראים אֶפְ־שָׁר, בהטעמה בסוף.",
        )
    ],
    "housing.rent": [
        _reading_hint(
            display="שְׂכַר דִּירָה",
            note_en="Here skhar means rent, not salary.",
            note_es="Aquí sjár significa alquiler, no salario.",
            note_he="כאן שְׂכַר פירושו תשלום על הדירה, לא משכורת.",
        )
    ],
    "services.emergency_room": [
        _reading_hint(
            display="מִיּוּן",
            note_en="Read mi-yun; in this context it means emergency department.",
            note_es="Se lee mi-yun; aquí significa urgencias.",
            note_he="קוראים מִיּוּן; כאן הכוונה לחדר המיון.",
        )
    ],
    "register.opinion": [
        _reading_hint(
            display="לְדַעְתִּי",
            note_en="Read le-da-ti: in my opinion.",
            note_es="Se lee le-da-ti: en mi opinión.",
            note_he="קוראים לְ־דַעְ־תִּי: לפי דעתי.",
        )
    ],
}


def _concept(row: _Row, category: str) -> dict[str, Any]:
    """Convert one reviewed row to the dictionary seed contract."""
    return {
        "word": row.word,
        "pos": row.pos,
        "romanization": row.romanization,
        "gender": row.gender,
        "root": None,
        "binyan": None,
        "source_key": None,
        "gloss_en": row.gloss_en,
        "gloss_es": row.gloss_es,
        "level": "A2",
        "category": category,
        "visual_key": row.visual_id,
        "visual_id": row.visual_id,
        "visual_emoji": row.emoji,
        "visual_alt_en": f"Illustration of {row.scene_en}",
        "visual_alt_es": f"Ilustración de {row.scene_es}",
        "visual_alt_he": f"איור של {row.scene_he}",
        "reading_hints": READING_HINTS.get(row.visual_id, []),
        "provenance": STARTER_PROVENANCE_V4,
        "forms": [{"form": row.niqqud, "tags": ["with-niqqud"]}],
        "examples": [
            {
                "hebrew": row.example_he,
                "translation_en": row.example_en,
                "translation_es": row.example_es,
                "romanization": row.example_romanization,
            }
        ],
    }


def _category(category: str, rows: Sequence[_Row]) -> tuple[dict[str, Any], ...]:
    """Build one fixed-size A2 category."""
    if len(rows) != 12:
        raise ValueError(f"A2 category {category!r} must contain exactly 12 entries")
    return tuple(_concept(row, category) for row in rows)


DAILY_ACTIONS = _category(
    "actions",
    (
        _Row("לקום", "לָקוּם", "lakum", "verb", "to get up", "levantarse", "actions.get_up", "🌅", "a person getting out of bed at sunrise", "una persona levantándose al amanecer", "אדם קם מהמיטה בזריחה", "אני צריך לקום מוקדם.", "I need to get up early.", "Necesito levantarme temprano.", "Ani tsarikh lakum mukdam."),
        _Row("ללכת", "לָלֶכֶת", "lalekhet", "verb", "to go; to walk", "ir; caminar", "actions.go", "🚶", "a person walking toward a destination", "una persona caminando hacia su destino", "אדם הולך אל היעד", "אני רוצה ללכת הביתה.", "I want to go home.", "Quiero ir a casa.", "Ani rotse lalekhet ha-bayta."),
        _Row("לבוא", "לָבוֹא", "lavo", "verb", "to come", "venir", "actions.come", "👋", "a friend arriving at the door", "un amigo llegando a la puerta", "חבר מגיע לדלת", "אפשר לבוא מחר?", "Can I come tomorrow?", "¿Puedo venir mañana?", "Efshar lavo makhar?"),
        _Row("לעשות", "לַעֲשׂוֹת", "la'asot", "verb", "to do; to make", "hacer", "actions.do", "🛠️", "hands completing a practical task", "unas manos completando una tarea práctica", "ידיים משלימות משימה מעשית", "מה צריך לעשות?", "What needs to be done?", "¿Qué hay que hacer?", "Ma tsarikh la'asot?"),
        _Row("לעבוד", "לַעֲבוֹד", "la'avod", "verb", "to work", "trabajar", "actions.work", "💻", "a person working at a desk", "una persona trabajando en un escritorio", "אדם עובד ליד שולחן", "אני צריך לעבוד היום.", "I need to work today.", "Necesito trabajar hoy.", "Ani tsarikh la'avod ha-yom."),
        _Row("ללמוד", "לִלְמוֹד", "lilmod", "verb", "to learn; to study", "aprender; estudiar", "actions.learn", "📘", "an open notebook used for study", "un cuaderno abierto para estudiar", "מחברת פתוחה ללימוד", "אני רוצה ללמוד עברית.", "I want to learn Hebrew.", "Quiero aprender hebreo.", "Ani rotse lilmod ivrit."),
        _Row("לקרוא", "לִקְרוֹא", "likro", "verb", "to read; to call", "leer; llamar", "actions.read", "📖", "a person reading a Hebrew notice", "una persona leyendo un aviso en hebreo", "אדם קורא הודעה בעברית", "קשה לי לקרוא את הטופס.", "It is hard for me to read the form.", "Me cuesta leer el formulario.", "Kashe li likro et ha-tofes."),
        _Row("לכתוב", "לִכְתּוֹב", "likhtov", "verb", "to write", "escribir", "actions.write", "✍️", "a hand writing a short message", "una mano escribiendo un mensaje breve", "יד כותבת הודעה קצרה", "אפשר לכתוב את הכתובת?", "Can you write the address?", "¿Puede escribir la dirección?", "Efshar likhtov et ha-ktovet?"),
        _Row("לדבר", "לְדַבֵּר", "ledaber", "verb", "to speak; to talk", "hablar", "actions.speak", "🗣️", "two people speaking face to face", "dos personas hablando cara a cara", "שני אנשים מדברים פנים אל פנים", "אפשר לדבר לאט?", "Can you speak slowly?", "¿Puede hablar despacio?", "Efshar ledaber le'at?"),
        _Row("להקשיב", "לְהַקְשִׁיב", "lehakshiv", "verb", "to listen", "escuchar", "actions.listen", "👂", "a learner listening carefully", "un estudiante escuchando con atención", "לומד מקשיב בתשומת לב", "חשוב להקשיב להוראות.", "It is important to listen to the instructions.", "Es importante escuchar las instrucciones.", "Khashuv lehakshiv la-hora'ot."),
        _Row("לחכות", "לְחַכּוֹת", "lekhakot", "verb", "to wait", "esperar", "actions.wait", "⏳", "a person waiting beside a clock", "una persona esperando junto a un reloj", "אדם מחכה ליד שעון", "צריך לחכות כאן.", "We need to wait here.", "Hay que esperar aquí.", "Tsarikh lekhakot kan."),
        _Row("לבחור", "לִבְחוֹר", "livkhor", "verb", "to choose", "elegir", "actions.choose", "☑️", "a person choosing between two options", "una persona eligiendo entre dos opciones", "אדם בוחר בין שתי אפשרויות", "אפשר לבחור שעה אחרת.", "You can choose another time.", "Se puede elegir otra hora.", "Efshar livkhor sha'a akheret."),
    ),
)

COMMUNICATION = _category(
    "communication",
    (
        _Row("להבין", "לְהָבִין", "lehavin", "verb", "to understand", "entender", "communication.understand", "💡", "a learner understanding an explanation", "un estudiante entendiendo una explicación", "לומד מבין הסבר", "אני רוצה להבין את השאלה.", "I want to understand the question.", "Quiero entender la pregunta.", "Ani rotse lehavin et ha-she'ela."),
        _Row("להסביר", "לְהַסְבִּיר", "lehasbir", "verb", "to explain", "explicar", "communication.explain", "🧑‍🏫", "a person explaining a simple diagram", "una persona explicando un diagrama sencillo", "אדם מסביר תרשים פשוט", "אפשר להסביר שוב?", "Can you explain again?", "¿Puede explicarlo otra vez?", "Efshar lehasbir shuv?"),
        _Row("לשאול", "לִשְׁאוֹל", "lishol", "verb", "to ask", "preguntar", "communication.ask", "❓", "a learner raising a hand to ask", "un estudiante levantando la mano para preguntar", "לומד מרים יד כדי לשאול", "אני רוצה לשאול שאלה.", "I want to ask a question.", "Quiero hacer una pregunta.", "Ani rotse lishol she'ela."),
        _Row("לענות", "לַעֲנוֹת", "la'anot", "verb", "to answer", "responder", "communication.answer", "💬", "a speech bubble containing an answer", "un globo de diálogo con una respuesta", "בועת דיבור עם תשובה", "אפשר לענות בעברית.", "You can answer in Hebrew.", "Se puede responder en hebreo.", "Efshar la'anot be-ivrit."),
        _Row("לבקש", "לְבַקֵּשׁ", "levakesh", "verb", "to request; to ask for", "pedir; solicitar", "communication.request", "🤲", "a polite request at a service desk", "una petición amable en una ventanilla", "בקשה מנומסת בדלפק שירות", "אני רוצה לבקש עזרה.", "I want to ask for help.", "Quiero pedir ayuda.", "Ani rotse levakesh ezra."),
        _Row("להציע", "לְהַצִּיעַ", "lehatsia", "verb", "to suggest; to offer", "sugerir; ofrecer", "communication.suggest", "💭", "a colleague offering an idea", "un colega proponiendo una idea", "עמית מציע רעיון", "אפשר להציע פתרון אחר.", "We can suggest another solution.", "Podemos sugerir otra solución.", "Efshar lehatsia pitron akher."),
        _Row("להסכים", "לְהַסְכִּים", "lehaskim", "verb", "to agree", "estar de acuerdo", "communication.agree", "🤝", "two colleagues reaching agreement", "dos colegas llegando a un acuerdo", "שני עמיתים מגיעים להסכמה", "אני יכול להסכים לזה.", "I can agree to that.", "Puedo estar de acuerdo con eso.", "Ani yakhol lehaskim la-ze."),
        _Row("לא להסכים", "לֹא לְהַסְכִּים", "lo lehaskim", "phrase", "to disagree", "no estar de acuerdo", "communication.disagree", "↔️", "two respectful but different viewpoints", "dos puntos de vista distintos y respetuosos", "שתי דעות שונות ומכבדות", "מותר לא להסכים בכבוד.", "It is okay to disagree respectfully.", "Está bien no estar de acuerdo con respeto.", "Mutar lo lehaskim be-khavod."),
        _Row("לחזור", "לַחֲזוֹר", "lakhazor", "verb", "to return; to repeat", "volver; repetir", "communication.repeat", "🔁", "an arrow repeating a spoken phrase", "una flecha repitiendo una frase hablada", "חץ חוזר על משפט שנאמר", "אפשר לחזור על זה?", "Can you repeat that?", "¿Puede repetir eso?", "Efshar lakhazor al ze?"),
        _Row("להודיע", "לְהוֹדִיעַ", "lehodia", "verb", "to inform; to notify", "informar; avisar", "communication.notify", "🔔", "a notification delivering important information", "una notificación con información importante", "התראה עם מידע חשוב", "צריך להודיע למנהל.", "We need to inform the manager.", "Hay que avisar al gerente.", "Tsarikh lehodia la-menahel."),
        _Row("לשלוח", "לִשְׁלוֹחַ", "lishloakh", "verb", "to send", "enviar", "communication.send", "📤", "a message being sent from a phone", "un mensaje enviado desde un teléfono", "הודעה נשלחת מטלפון", "אפשר לשלוח לי הודעה?", "Can you send me a message?", "¿Puede enviarme un mensaje?", "Efshar lishloakh li hoda'a?"),
        _Row("לקבל", "לְקַבֵּל", "lekabel", "verb", "to receive; to accept", "recibir; aceptar", "communication.receive", "📥", "a document arriving in an inbox", "un documento llegando a una bandeja de entrada", "מסמך מגיע לתיבת דואר", "אני צריך לקבל אישור.", "I need to receive confirmation.", "Necesito recibir una confirmación.", "Ani tsarikh lekabel ishur."),
    ),
)

WORK = _category(
    "work",
    (
        _Row("עבודה", "עֲבוֹדָה", "avoda", "noun", "work; job", "trabajo; empleo", "work.job", "💼", "a work bag beside a desk", "un bolso de trabajo junto a un escritorio", "תיק עבודה ליד שולחן", "אני מחפש עבודה חדשה.", "I am looking for a new job.", "Busco un trabajo nuevo.", "Ani mekhapes avoda khadasha.", "feminine"),
        _Row("משרד", "מִשְׂרָד", "misrad", "noun", "office", "oficina", "work.office", "🏢", "a bright office workspace", "un espacio de oficina luminoso", "סביבת משרד מוארת", "המשרד פתוח היום.", "The office is open today.", "La oficina está abierta hoy.", "Ha-misrad patuakh ha-yom.", "masculine"),
        _Row("פגישה", "פְּגִישָׁה", "pgisha", "noun", "meeting; appointment", "reunión; cita", "work.meeting", "🗓️", "colleagues gathered for a meeting", "colegas reunidos para una reunión", "עמיתים יושבים בפגישה", "יש לנו פגישה בעשר.", "We have a meeting at ten.", "Tenemos una reunión a las diez.", "Yesh lanu pgisha be-eser.", "feminine"),
        _Row("משימה", "מְשִׂימָה", "mesima", "noun", "task", "tarea", "work.task", "✅", "a completed task on a checklist", "una tarea completada en una lista", "משימה שהושלמה ברשימה", "המשימה הזאת חשובה.", "This task is important.", "Esta tarea es importante.", "Ha-mesima ha-zot khashuva.", "feminine"),
        _Row("פרויקט", "פְּרוֹיֶקְט", "proyekt", "noun", "project", "proyecto", "work.project", "🧩", "a project assembled from connected pieces", "un proyecto formado por piezas conectadas", "פרויקט שמורכב מחלקים מחוברים", "הפרויקט כמעט מוכן.", "The project is almost ready.", "El proyecto está casi listo.", "Ha-proyekt kim'at mukhan.", "masculine"),
        _Row("צוות", "צֶוֶת", "tsevet", "noun", "team", "equipo", "work.team", "👥", "a team collaborating around a table", "un equipo colaborando alrededor de una mesa", "צוות עובד יחד סביב שולחן", "הצוות עובד יחד.", "The team works together.", "El equipo trabaja en conjunto.", "Ha-tsevet oved yakhad.", "masculine"),
        _Row("מנהל", "מְנַהֵל", "menahel", "noun", "manager (male)", "gerente (hombre)", "work.manager", "🧑‍💼", "a manager reviewing a work plan", "un gerente revisando un plan de trabajo", "מנהל בודק תוכנית עבודה", "המנהל נמצא בפגישה.", "The manager is in a meeting.", "El gerente está en una reunión.", "Ha-menahel nimtsa be-pgisha.", "masculine"),
        _Row("לקוח", "לָקוֹחַ", "lakoakh", "noun", "customer; client (male)", "cliente (hombre)", "work.client", "🧑", "a client speaking with a service worker", "un cliente hablando con un empleado", "לקוח מדבר עם נותן שירות", "הלקוח מחכה לתשובה.", "The client is waiting for an answer.", "El cliente espera una respuesta.", "Ha-lakoakh mekhake la-tshuva.", "masculine"),
        _Row("הודעה", "הוֹדָעָה", "hoda'a", "noun", "message; notice", "mensaje; aviso", "work.message", "💬", "a new work message on a phone", "un nuevo mensaje de trabajo en un teléfono", "הודעת עבודה חדשה בטלפון", "שלחתי הודעה לצוות.", "I sent a message to the team.", "Envié un mensaje al equipo.", "Shalakhti hoda'a la-tsevet.", "feminine"),
        _Row("דואר אלקטרוני", "דֹּאַר אֶלֶקְטְרוֹנִי", "do'ar elektroni", "noun", "email", "correo electrónico", "work.email", "📧", "an email open on a computer", "un correo abierto en una computadora", "דואר אלקטרוני פתוח במחשב", "קיבלתי דואר אלקטרוני.", "I received an email.", "Recibí un correo electrónico.", "Kibalti do'ar elektroni.", "masculine"),
        _Row("הפסקה", "הַפְסָקָה", "hafsaka", "noun", "break; pause", "descanso; pausa", "work.break", "☕", "a short coffee break at work", "una breve pausa para café en el trabajo", "הפסקת קפה קצרה בעבודה", "יש הפסקה בעוד שעה.", "There is a break in an hour.", "Hay un descanso dentro de una hora.", "Yesh hafsaka be-od sha'a.", "feminine"),
        _Row("משכורת", "מַשְׂכֹּרֶת", "maskoret", "noun", "salary", "salario", "work.salary", "💳", "a salary payment entering a bank account", "un salario entrando en una cuenta bancaria", "משכורת נכנסת לחשבון בנק", "המשכורת נכנסת מחר.", "The salary arrives tomorrow.", "El salario llega mañana.", "Ha-maskoret nikhneset makhar.", "feminine"),
    ),
)

BUREAUCRACY = _category(
    "bureaucracy",
    (
        _Row("תעודת זהות", "תְּעוּדַת זֶהוּת", "te'udat zehut", "noun", "identity card", "documento de identidad", "bureaucracy.id_card", "🪪", "an Israeli identity card beside a form", "un documento de identidad israelí junto a un formulario", "תעודת זהות ישראלית ליד טופס", "צריך להביא תעודת זהות.", "You need to bring an identity card.", "Hay que traer un documento de identidad.", "Tsarikh lehavi te'udat zehut.", "feminine"),
        _Row("דרכון", "דַּרְכּוֹן", "darkon", "noun", "passport", "pasaporte", "bureaucracy.passport", "🛂", "a passport at a border desk", "un pasaporte en un control fronterizo", "דרכון בדלפק ביקורת גבולות", "הדרכון שלי בתיק.", "My passport is in the bag.", "Mi pasaporte está en el bolso.", "Ha-darkon sheli ba-tik.", "masculine"),
        _Row("טופס", "טֹפֶס", "tofes", "noun", "form", "formulario", "bureaucracy.form", "📄", "a form with several fields to complete", "un formulario con varios campos", "טופס עם כמה שדות למילוי", "צריך למלא את הטופס.", "You need to fill out the form.", "Hay que completar el formulario.", "Tsarikh lemale et ha-tofes.", "masculine"),
        _Row("מסמך", "מִסְמָךְ", "mismakh", "noun", "document", "documento", "bureaucracy.document", "📑", "an official document in a folder", "un documento oficial en una carpeta", "מסמך רשמי בתיקייה", "חסר לי מסמך אחד.", "I am missing one document.", "Me falta un documento.", "Khaser li mismakh ekhad.", "masculine"),
        _Row("חתימה", "חֲתִימָה", "khatima", "noun", "signature", "firma", "bureaucracy.signature", "✒️", "a signature at the bottom of a document", "una firma al final de un documento", "חתימה בתחתית מסמך", "צריך חתימה כאן.", "A signature is needed here.", "Hace falta una firma aquí.", "Tsrikha khatima kan.", "feminine"),
        _Row("חשבון", "חֶשְׁבּוֹן", "kheshbon", "noun", "account; bill", "cuenta; factura", "bureaucracy.account", "🧾", "an account statement beside a calculator", "un estado de cuenta junto a una calculadora", "דף חשבון ליד מחשבון", "אני רוצה לפתוח חשבון.", "I want to open an account.", "Quiero abrir una cuenta.", "Ani rotse liftoakh kheshbon.", "masculine"),
        _Row("בנק", "בַּנְק", "bank", "noun", "bank", "banco", "bureaucracy.bank", "🏦", "a bank service counter", "una ventanilla de atención bancaria", "דלפק שירות בבנק", "הבנק נסגר בארבע.", "The bank closes at four.", "El banco cierra a las cuatro.", "Ha-bank nisgar be-arba.", "masculine"),
        _Row("ביטוח", "בִּטּוּחַ", "bituakh", "noun", "insurance", "seguro", "bureaucracy.insurance", "🛡️", "an insurance document protected by a shield", "un documento de seguro protegido por un escudo", "מסמך ביטוח מוגן במגן", "יש לי ביטוח בריאות.", "I have health insurance.", "Tengo seguro médico.", "Yesh li bituakh bri'ut.", "masculine"),
        _Row("עירייה", "עִירִיָּה", "iriya", "noun", "municipality; city hall", "municipalidad; ayuntamiento", "bureaucracy.municipality", "🏛️", "a municipal service building", "un edificio de servicios municipales", "בניין שירותים עירוניים", "צריך ללכת לעירייה.", "I need to go to city hall.", "Tengo que ir al ayuntamiento.", "Tsarikh lalekhet la-iriya.", "feminine"),
        _Row("משרד הפנים", "מִשְׂרַד הַפְּנִים", "misrad ha-pnim", "noun", "Population and Immigration Authority office", "oficina de población e inmigración", "bureaucracy.interior_office", "🏢", "a government population services office", "una oficina pública de población", "משרד ממשלתי לשירותי אוכלוסין", "קבעתי תור למשרד הפנים.", "I scheduled an appointment at the Population Authority.", "Pedí cita en la oficina de población.", "Kavati tor le-misrad ha-pnim.", "masculine"),
        _Row("רישיון", "רִשָּׁיוֹן", "rishayon", "noun", "license; permit", "licencia; permiso", "bureaucracy.license", "🪪", "an official license card", "una tarjeta oficial de licencia", "כרטיס רישיון רשמי", "הרישיון שלי בתוקף.", "My license is valid.", "Mi licencia está vigente.", "Ha-rishayon sheli be-tokef.", "masculine"),
        _Row("פקיד", "פָּקִיד", "pakid", "noun", "clerk; official (male)", "funcionario; empleado (hombre)", "bureaucracy.clerk", "🧑‍💼", "a clerk helping at a public counter", "un funcionario ayudando en una ventanilla", "פקיד עוזר בדלפק ציבורי", "הפקיד בודק את המסמך.", "The clerk is checking the document.", "El funcionario revisa el documento.", "Ha-pakid bodek et ha-mismakh.", "masculine"),
    ),
)

AUTONOMY = _category(
    "autonomy",
    (
        _Row("אפשר", "אֶפְשָׁר", "efshar", "particle", "possible; may I?", "posible; ¿se puede?", "autonomy.can", "🟢", "an open path showing that something is possible", "un camino abierto que muestra que algo es posible", "דרך פתוחה שמראה שמשהו אפשרי", "אפשר להיכנס?", "May I come in?", "¿Se puede entrar?", "Efshar lehikanes?"),
        _Row("אי אפשר", "אִי אֶפְשָׁר", "i efshar", "phrase", "impossible; cannot", "imposible; no se puede", "autonomy.cannot", "⛔", "a closed path showing that something is not possible", "un camino cerrado que muestra que algo no es posible", "דרך סגורה שמראה שמשהו אינו אפשרי", "אי אפשר לשלם כאן.", "You cannot pay here.", "No se puede pagar aquí.", "I efshar leshalem kan."),
        _Row("איפה אפשר", "אֵיפֹה אֶפְשָׁר", "eifo efshar", "phrase", "where can one...?", "¿dónde se puede...?", "autonomy.where_can", "📍", "a map marker beside an open question", "un marcador de mapa junto a una pregunta", "סמן מפה ליד שאלה פתוחה", "איפה אפשר לקנות כרטיס?", "Where can I buy a ticket?", "¿Dónde se puede comprar un billete?", "Eifo efshar liknot kartis?"),
        _Row("מתי אפשר", "מָתַי אֶפְשָׁר", "matai efshar", "phrase", "when can one...?", "¿cuándo se puede...?", "autonomy.when_can", "🕒", "a clock beside an open appointment slot", "un reloj junto a una cita disponible", "שעון ליד תור פנוי", "מתי אפשר להגיע?", "When can I come?", "¿Cuándo puedo llegar?", "Matai efshar lehagia?"),
        _Row("אני צריך עזרה", "אֲנִי צָרִיךְ עֶזְרָה", "ani tsarikh ezra", "phrase", "I need help (male speaker)", "necesito ayuda (hablante masculino)", "autonomy.need_help_m", "🆘", "a man asking clearly for help", "un hombre pidiendo ayuda claramente", "גבר מבקש עזרה באופן ברור", "אני צריך עזרה עם הטופס.", "I need help with the form.", "Necesito ayuda con el formulario.", "Ani tsarikh ezra im ha-tofes.", "masculine speaker"),
        _Row("אני צריכה עזרה", "אֲנִי צְרִיכָה עֶזְרָה", "ani tsrikha ezra", "phrase", "I need help (female speaker)", "necesito ayuda (hablante femenina)", "autonomy.need_help_f", "🆘", "a woman asking clearly for help", "una mujer pidiendo ayuda claramente", "אישה מבקשת עזרה באופן ברור", "אני צריכה עזרה עם הטופס.", "I need help with the form.", "Necesito ayuda con el formulario.", "Ani tsrikha ezra im ha-tofes.", "feminine speaker"),
        _Row("יש לי", "יֵשׁ לִי", "yesh li", "phrase", "I have", "tengo", "autonomy.i_have", "🎒", "a person showing something they have", "una persona mostrando algo que tiene", "אדם מראה דבר שיש לו", "יש לי את כל המסמכים.", "I have all the documents.", "Tengo todos los documentos.", "Yesh li et kol ha-mismakhim."),
        _Row("אין לי", "אֵין לִי", "ein li", "phrase", "I do not have", "no tengo", "autonomy.i_do_not_have", "👐", "empty hands showing something is missing", "unas manos vacías mostrando que falta algo", "ידיים ריקות שמראות שמשהו חסר", "אין לי מזומן.", "I do not have cash.", "No tengo efectivo.", "Ein li mezuman."),
        _Row("אני מחפש", "אֲנִי מְחַפֵּשׂ", "ani mekhapes", "phrase", "I am looking for (male speaker)", "estoy buscando (hablante masculino)", "autonomy.looking_m", "🔎", "a man looking for a location on a map", "un hombre buscando un lugar en un mapa", "גבר מחפש מקום במפה", "אני מחפש את המרפאה.", "I am looking for the clinic.", "Busco la clínica.", "Ani mekhapes et ha-mirpa'a.", "masculine speaker"),
        _Row("אני מחפשת", "אֲנִי מְחַפֶּשֶׂת", "ani mekhapeset", "phrase", "I am looking for (female speaker)", "estoy buscando (hablante femenina)", "autonomy.looking_f", "🔎", "a woman looking for a location on a map", "una mujer buscando un lugar en un mapa", "אישה מחפשת מקום במפה", "אני מחפשת את המרפאה.", "I am looking for the clinic.", "Busco la clínica.", "Ani mekhapeset et ha-mirpa'a.", "feminine speaker"),
        _Row("אני לא מבין", "אֲנִי לֹא מֵבִין", "ani lo mevin", "phrase", "I do not understand (male speaker)", "no entiendo (hablante masculino)", "autonomy.not_understand_m", "🤔", "a man asking for clarification", "un hombre pidiendo una aclaración", "גבר מבקש הבהרה", "אני לא מבין את המילה.", "I do not understand the word.", "No entiendo la palabra.", "Ani lo mevin et ha-mila.", "masculine speaker"),
        _Row("אני לא מבינה", "אֲנִי לֹא מְבִינָה", "ani lo mevina", "phrase", "I do not understand (female speaker)", "no entiendo (hablante femenina)", "autonomy.not_understand_f", "🤔", "a woman asking for clarification", "una mujer pidiendo una aclaración", "אישה מבקשת הבהרה", "אני לא מבינה את המילה.", "I do not understand the word.", "No entiendo la palabra.", "Ani lo mevina et ha-mila.", "feminine speaker"),
    ),
)

HOUSING = _category(
    "housing",
    (
        _Row("דירה", "דִּירָה", "dira", "noun", "apartment", "apartamento", "housing.apartment", "🏠", "an apartment building with balconies", "un edificio de apartamentos con balcones", "בניין דירות עם מרפסות", "אני גר בדירה קטנה.", "I live in a small apartment.", "Vivo en un apartamento pequeño.", "Ani gar be-dira ktana.", "feminine"),
        _Row("שכר דירה", "שְׂכַר דִּירָה", "skhar dira", "noun", "rent", "alquiler", "housing.rent", "💸", "a monthly rent payment beside a house key", "un pago mensual de alquiler junto a una llave", "תשלום שכר דירה ליד מפתח", "שכר הדירה גבוה.", "The rent is high.", "El alquiler es alto.", "Skhar ha-dira gavoha.", "masculine"),
        _Row("חוזה", "חוֹזֶה", "khoze", "noun", "contract", "contrato", "housing.contract", "📝", "a signed rental contract", "un contrato de alquiler firmado", "חוזה שכירות חתום", "קראתי את החוזה.", "I read the contract.", "Leí el contrato.", "Karati et ha-khoze.", "masculine"),
        _Row("בעל דירה", "בַּעַל דִּירָה", "ba'al dira", "noun", "landlord (male)", "propietario; casero", "housing.landlord", "🗝️", "a landlord handing over apartment keys", "un propietario entregando las llaves", "בעל דירה מוסר מפתחות", "בעל הדירה התקשר.", "The landlord called.", "El propietario llamó.", "Ba'al ha-dira hitkasher.", "masculine"),
        _Row("ארנונה", "אַרְנוֹנָה", "arnona", "noun", "municipal property tax", "impuesto municipal sobre la propiedad", "housing.arnona", "🏛️", "a municipal tax bill for an apartment", "una factura municipal de un apartamento", "חשבון ארנונה לדירה", "צריך לשלם ארנונה.", "The municipal property tax must be paid.", "Hay que pagar el impuesto municipal.", "Tsarikh leshalem arnona.", "feminine"),
        _Row("ועד בית", "וַעַד בַּיִת", "va'ad bayit", "noun", "building committee", "comité del edificio", "housing.committee", "👥", "neighbors meeting as a building committee", "vecinos reunidos como comité del edificio", "שכנים בישיבת ועד בית", "יש ישיבה של ועד הבית.", "There is a building committee meeting.", "Hay una reunión del comité del edificio.", "Yesh yeshiva shel va'ad ha-bayit.", "masculine"),
        _Row("תיקון", "תִּקּוּן", "tikun", "noun", "repair", "reparación", "housing.repair", "🔧", "a tool repairing a household fixture", "una herramienta reparando algo de la casa", "כלי מתקן מתקן ביתי", "התיקון ייקח שעה.", "The repair will take an hour.", "La reparación tardará una hora.", "Ha-tikun yikakh sha'a.", "masculine"),
        _Row("תקלה", "תַּקָּלָה", "takala", "noun", "malfunction; fault", "avería; fallo", "housing.fault", "⚠️", "a warning sign beside a broken appliance", "una señal de aviso junto a un aparato averiado", "סימן אזהרה ליד מכשיר מקולקל", "יש תקלה במעלית.", "There is a fault in the elevator.", "Hay una avería en el ascensor.", "Yesh takala ba-ma'alit.", "feminine"),
        _Row("שכונה", "שְׁכוּנָה", "shkhuna", "noun", "neighborhood", "barrio", "housing.neighborhood", "🏘️", "a friendly residential neighborhood", "un barrio residencial acogedor", "שכונת מגורים נעימה", "זאת שכונה שקטה.", "This is a quiet neighborhood.", "Este es un barrio tranquilo.", "Zot shkhuna shketa.", "feminine"),
        _Row("כתובת", "כְּתוֹבֶת", "ktovet", "noun", "address", "dirección", "housing.address", "📍", "an address marked on a map", "una dirección marcada en un mapa", "כתובת מסומנת במפה", "מה הכתובת שלך?", "What is your address?", "¿Cuál es tu dirección?", "Ma ha-ktovet shelkha?", "feminine"),
        _Row("קומה", "קוֹמָה", "koma", "noun", "floor; story", "piso; planta", "housing.floor", "4️⃣", "a four-storey apartment building in section, with the lift stopped at the top floor", "un edificio de cuatro plantas en sección, con el ascensor detenido en la planta superior", "בניין בן ארבע קומות בחתך, כשהמעלית עצרה בקומה העליונה", "הדירה בקומה ארבע.", "The apartment is on the fourth floor.", "El apartamento está en el cuarto piso.", "Ha-dira be-koma arba.", "feminine"),
        _Row("מעלית", "מַעֲלִית", "ma'alit", "noun", "elevator", "ascensor", "housing.elevator", "🛗", "an elevator with its doors open", "un ascensor con las puertas abiertas", "מעלית עם דלתות פתוחות", "המעלית לא עובדת.", "The elevator is not working.", "El ascensor no funciona.", "Ha-ma'alit lo ovedet.", "feminine"),
    ),
)

REGISTER = _category(
    "register",
    (
        _Row("תודה רבה", "תּוֹדָה רַבָּה", "toda raba", "phrase", "thank you very much", "muchas gracias", "register.many_thanks", "🙏", "warm gratitude after receiving help", "agradecimiento cálido después de recibir ayuda", "הכרת תודה חמה לאחר קבלת עזרה", "תודה רבה על הזמן שלך.", "Thank you very much for your time.", "Muchas gracias por tu tiempo.", "Toda raba al ha-zman shelkha."),
        _Row("בשמחה", "בְּשִׂמְחָה", "besimkha", "phrase", "gladly; my pleasure", "con gusto; encantado", "register.my_pleasure", "😊", "a friendly response to thanks", "una respuesta amable a un agradecimiento", "תגובה ידידותית לתודה", "בשמחה, אין בעיה.", "My pleasure, no problem.", "Con gusto, no hay problema.", "Besimkha, ein be'aya."),
        _Row("אין בעיה", "אֵין בְּעָיָה", "ein be'aya", "phrase", "no problem", "no hay problema", "register.no_problem", "👌", "a reassuring gesture that everything is fine", "un gesto tranquilizador de que todo está bien", "מחווה מרגיעה שהכול בסדר", "אין בעיה, אני אחכה.", "No problem, I will wait.", "No hay problema, esperaré.", "Ein be'aya, ani akhake."),
        _Row("רגע בבקשה", "רֶגַע בְּבַקָּשָׁה", "rega bevakasha", "phrase", "one moment, please", "un momento, por favor", "register.one_moment", "☝️", "a polite request to wait one moment", "una petición amable de esperar un momento", "בקשה מנומסת להמתין רגע", "רגע בבקשה, אני בודק.", "One moment, please; I am checking.", "Un momento, por favor; estoy revisando.", "Rega bevakasha, ani bodek."),
        _Row("אפשר לעזור", "אֶפְשָׁר לַעֲזוֹר", "efshar la'azor", "phrase", "can I help?", "¿puedo ayudar?", "register.offer_help", "🤝", "a helper reaching with open hands toward a heavy box another person is carrying alone", "una persona que extiende las manos hacia una caja pesada que otra lleva sola", "אדם שמושיט ידיים לעבר ארגז כבד שאדם אחר נושא לבדו", "אפשר לעזור לך?", "Can I help you?", "¿Puedo ayudarte?", "Efshar la'azor lekha?"),
        _Row("כדאי", "כְּדַאי", "kedai", "adjective", "worthwhile; advisable", "vale la pena; conviene", "register.advisable", "💡", "a useful recommendation highlighted by a light", "una recomendación útil resaltada por una luz", "המלצה שימושית מודגשת באור", "כדאי להזמין תור מראש.", "It is advisable to book an appointment in advance.", "Conviene pedir cita con antelación.", "Kedai lehazmin tor me-rosh."),
        _Row("חשוב", "חָשׁוּב", "khashuv", "adjective", "important", "importante", "register.important", "❗", "an important note clearly highlighted", "una nota importante claramente resaltada", "הערה חשובה מסומנת בבירור", "חשוב לשמור את הקבלה.", "It is important to keep the receipt.", "Es importante guardar el recibo.", "Khashuv lishmor et ha-kabala.", "masculine"),
        _Row("בטח", "בֶּטַח", "betakh", "adverb", "sure; of course", "claro; por supuesto", "register.sure", "👍", "a confident friendly confirmation", "una confirmación amistosa y segura", "אישור ידידותי ובטוח", "בטח, אני יכול לעזור.", "Sure, I can help.", "Claro, puedo ayudar.", "Betakh, ani yakhol la'azor."),
        _Row("אולי", "אוּלַי", "ulai", "adverb", "maybe", "quizá; tal vez", "register.maybe", "🤔", "two possible paths under consideration", "dos caminos posibles bajo consideración", "שתי דרכים אפשריות למחשבה", "אולי ניפגש מחר.", "Maybe we will meet tomorrow.", "Quizá nos veamos mañana.", "Ulai nipagesh makhar."),
        _Row("לדעתי", "לְדַעְתִּי", "leda'ati", "phrase", "in my opinion", "en mi opinión", "register.opinion", "💭", "a person sharing a respectful opinion", "una persona compartiendo una opinión respetuosa", "אדם משתף דעה מכבדת", "לדעתי, זה פתרון טוב.", "In my opinion, this is a good solution.", "En mi opinión, es una buena solución.", "Leda'ati, ze pitron tov."),
        _Row("אני מסכים", "אֲנִי מַסְכִּים", "ani maskim", "phrase", "I agree (male speaker)", "estoy de acuerdo (hablante masculino)", "register.agree_m", "🤝", "a man expressing respectful agreement", "un hombre expresando acuerdo con respeto", "גבר מביע הסכמה מכבדת", "אני מסכים עם הרעיון.", "I agree with the idea.", "Estoy de acuerdo con la idea.", "Ani maskim im ha-ra'ayon.", "masculine speaker"),
        _Row("אני מסכימה", "אֲנִי מַסְכִּימָה", "ani maskima", "phrase", "I agree (female speaker)", "estoy de acuerdo (hablante femenina)", "register.agree_f", "🤝", "a woman expressing respectful agreement", "una mujer expresando acuerdo con respeto", "אישה מביעה הסכמה מכבדת", "אני מסכימה עם הרעיון.", "I agree with the idea.", "Estoy de acuerdo con la idea.", "Ani maskima im ha-ra'ayon.", "feminine speaker"),
    ),
)

SERVICES = _category(
    "services",
    (
        _Row("סופרמרקט", "סוּפֶּרְמַרְקֶט", "supermarket", "noun", "supermarket", "supermercado", "services.supermarket", "🛒", "a supermarket aisle and shopping cart", "un pasillo de supermercado y un carrito", "מעבר בסופרמרקט ועגלת קניות", "הסופרמרקט פתוח עד עשר.", "The supermarket is open until ten.", "El supermercado está abierto hasta las diez.", "Ha-supermarket patuakh ad eser.", "masculine"),
        _Row("דואר", "דֹּאַר", "do'ar", "noun", "post office; mail", "correo; oficina de correos", "services.post_office", "📮", "a post office counter and parcel", "un mostrador de correos y un paquete", "דלפק דואר וחבילה", "אני צריך לשלוח את זה בדואר.", "I need to send this by mail.", "Necesito enviar esto por correo.", "Ani tsarikh lishloakh et ze ba-do'ar.", "masculine"),
        _Row("ספרייה", "סִפְרִיָּה", "sifriya", "noun", "library", "biblioteca", "services.library", "📚", "shelves inside a public library", "estantes dentro de una biblioteca pública", "מדפים בתוך ספרייה ציבורית", "אפשר ללמוד בספרייה.", "You can study in the library.", "Se puede estudiar en la biblioteca.", "Efshar lilmod ba-sifriya.", "feminine"),
        _Row("מרפאה", "מִרְפָּאָה", "mirpa'a", "noun", "clinic", "clínica", "services.clinic", "🩺", "a neighborhood medical clinic", "una clínica médica de barrio", "מרפאה רפואית בשכונה", "המרפאה ליד הבנק.", "The clinic is next to the bank.", "La clínica está junto al banco.", "Ha-mirpa'a le-yad ha-bank.", "feminine"),
        _Row("מיון", "מִיּוּן", "miyun", "noun", "emergency department", "urgencias", "services.emergency_room", "🚑", "a hospital emergency entrance", "una entrada de urgencias de hospital", "כניסה לחדר מיון בבית חולים", "הוא נמצא במיון.", "He is in the emergency department.", "Está en urgencias.", "Hu nimtsa ba-miyun.", "masculine"),
        _Row("מוקד", "מוֹקֵד", "moked", "noun", "service hotline; call center", "línea de atención; central telefónica", "services.hotline", "☎️", "a service agent answering a hotline", "un agente atendiendo una línea de ayuda", "נציג שירות עונה במוקד", "התקשרתי למוקד השירות.", "I called the service hotline.", "Llamé a la línea de atención.", "Hitkasharti le-moked ha-sherut.", "masculine"),
        _Row("משטרה", "מִשְׁטָרָה", "mishtara", "noun", "police", "policía", "services.police", "👮", "a police station help desk", "un mostrador de ayuda en una comisaría", "דלפק עזרה בתחנת משטרה", "צריך להתקשר למשטרה.", "We need to call the police.", "Hay que llamar a la policía.", "Tsarikh lehitkasher la-mishtara.", "feminine"),
        _Row("חשבונית", "חֶשְׁבּוֹנִית", "kheshbonit", "noun", "invoice", "factura", "services.invoice", "🧾", "an itemized invoice on a desk", "una factura detallada sobre un escritorio", "חשבונית מפורטת על שולחן", "אפשר לקבל חשבונית?", "Can I get an invoice?", "¿Puedo recibir una factura?", "Efshar lekabel kheshbonit?", "feminine"),
        _Row("הזמנה", "הַזְמָנָה", "hazmana", "noun", "order; reservation", "pedido; reserva", "services.order", "📋", "a confirmed order on a screen", "un pedido confirmado en una pantalla", "הזמנה מאושרת על מסך", "ההזמנה שלי מוכנה.", "My order is ready.", "Mi pedido está listo.", "Ha-hazmana sheli mukhana.", "feminine"),
        _Row("משלוח", "מִשְׁלוֹחַ", "mishloakh", "noun", "delivery; shipment", "entrega; envío", "services.delivery", "📦", "a delivery box arriving at a door", "una caja de entrega llegando a una puerta", "חבילת משלוח מגיעה לדלת", "מתי המשלוח מגיע?", "When does the delivery arrive?", "¿Cuándo llega la entrega?", "Matai ha-mishloakh magia?", "masculine"),
        _Row("שירות לקוחות", "שֵׁרוּת לָקוֹחוֹת", "sherut lakokhot", "noun", "customer service", "atención al cliente", "services.customer_service", "🎧", "a customer service representative with a headset", "un representante de atención con auriculares", "נציג שירות לקוחות עם אוזניות", "פניתי לשירות הלקוחות.", "I contacted customer service.", "Contacté con atención al cliente.", "Paniti le-sherut ha-lakokhot.", "masculine"),
        _Row("שעות פתיחה", "שְׁעוֹת פְּתִיחָה", "she'ot ptikha", "noun", "opening hours", "horario de apertura", "services.opening_hours", "🕘", "opening hours posted beside a shop door", "un horario publicado junto a la puerta de una tienda", "שעות פתיחה ליד דלת חנות", "מה שעות הפתיחה?", "What are the opening hours?", "¿Cuál es el horario de apertura?", "Ma she'ot ha-ptikha?", "feminine plural"),
    ),
)

A2_EXPANSION_ENTRIES: tuple[dict[str, Any], ...] = (
    DAILY_ACTIONS
    + COMMUNICATION
    + WORK
    + BUREAUCRACY
    + AUTONOMY
    + HOUSING
    + REGISTER
    + SERVICES
)
