import {
  Lead, Activity, Task, Conversation, ChatMessage, SalesRep,
  LeadSource, LeadStage, Channel, AuditEntry,
} from "./types";
import { calculateScore, qualLevel } from "./scoring";

// ── Deterministic seeded RNG ──
function seededRng(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}
const rng = seededRng(42);
const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
const pickN = <T>(arr: T[], n: number): T[] => {
  const shuffled = [...arr].sort(() => rng() - 0.5);
  return shuffled.slice(0, n);
};
const randInt = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;

// ── Reference lists ──
const FIRST_NAMES = [
  "María","Carlos","Lucía","Roberto","Sofía","Andrés","Carmen","Diego",
  "Ana","José","Valentina","Fernando","Gabriela","Patricio","Daniela",
  "Miguel","Camila","Ricardo","Alejandra","Pablo","Isabella","Santiago",
  "Natalia","Eduardo","Lorena","Sebastián","Verónica","Francisco","Paola",
  "Javier","Andrea","Tomás","Mónica","Luis","Carolina","Álvaro","Diana",
  "Manuel","Jessica","Héctor","Adriana","Emilio","Sandra","Nicolás","Laura",
];
const LAST_NAMES = [
  "González","Espinoza","Paredes","Villacís","Cevallos","Ramírez","Aguirre",
  "Moreno","López","Herrera","Guzmán","Mendoza","Ruiz","Castro","Suárez",
  "Córdova","Salazar","Vega","Ortiz","Delgado","Flores","Reyes","Jiménez",
  "Peña","Torres","Benítez","Sandoval","Vargas","Rojas","Zambrano",
];
const COMPANIES = [
  "TechCorp Ecuador","Grupo Financiero Andes","Farmacéutica Nacional",
  "Constructora Quito S.A.","Importadora del Pacífico","Automotriz Sierra",
  "Textiles Montecristi","Banano Export S.A.","Petróleo del Oriente",
  "Agrícola Costa","Seguros del Pacífico","Minera Loja","Telecomunicaciones Andes",
  "Alimentos del Valle","Industrial Guayas","Transportes Nacionales",
  "Energía Renovable EC","Software Solutions EC","Consulting Partners Quito",
  "Retail Group Ecuador","Salud Integral","Educación Superior EC",
  "Hospitalidad del Litoral","Comercial Austro","Logística Express",
  "Bienes Raíces Nacional","Media Digital Ecuador","Agencia Creativa EC",
  "Laboratorios Andinos","Constructora del Sur",
];
const REGIONS = ["Quito","Guayaquil","Cuenca","Ambato","Loja","Manta","Riobamba","Machala"];
const PLANS = [
  "Plan Corporativo Premium","Plan Corporativo Estándar","Plan Familiar Premium",
  "Plan Familiar Plus","Plan Individual Básico","Plan Individual Plus",
];
const SOURCES: { src: LeadSource; weight: number }[] = [
  { src: "Website Form", weight: 40 },
  { src: "WhatsApp Inbound", weight: 20 },
  { src: "Broker Referral", weight: 15 },
  { src: "Call Center", weight: 15 },
  { src: "Trade Show", weight: 5 },
  { src: "LinkedIn", weight: 5 },
];
const STAGES: LeadStage[] = ["New","Contacted","Qualified","Won"];
const CONSENT_METHODS = ["Web form opt-in","Verbal consent recorded","Email opt-in link","WhatsApp confirmation"];

function pickSource(): LeadSource {
  const r = rng() * 100;
  let cum = 0;
  for (const s of SOURCES) { cum += s.weight; if (r < cum) return s.src; }
  return "Website Form";
}

// ── Sales Reps ──
export const salesReps: SalesRep[] = [
  { id: "REP-01", name: "Carlos Mendoza", region: "Quito", email: "c.mendoza@saludsa.com" },
  { id: "REP-02", name: "Ana Ruiz", region: "Guayaquil", email: "a.ruiz@saludsa.com" },
  { id: "REP-03", name: "Patricia Herrera", region: "Cuenca", email: "p.herrera@saludsa.com" },
  { id: "REP-04", name: "Marco Delgado", region: "Quito", email: "m.delgado@saludsa.com" },
  { id: "REP-05", name: "Silvia Flores", region: "Guayaquil", email: "s.flores@saludsa.com" },
  { id: "REP-06", name: "Tomás Vega", region: "Ambato", email: "t.vega@saludsa.com" },
  { id: "REP-07", name: "Lorena Córdova", region: "Manta", email: "l.cordova@saludsa.com" },
  { id: "REP-08", name: "Javier Suárez", region: "Loja", email: "j.suarez@saludsa.com" },
  { id: "REP-09", name: "Daniela Torres", region: "Riobamba", email: "d.torres@saludsa.com" },
  { id: "REP-10", name: "Eduardo Sandoval", region: "Machala", email: "e.sandoval@saludsa.com" },
];

// ── Generate 200 leads ──
const NOW = new Date("2026-02-24T12:00:00");
function daysAgo(d: number) {
  const dt = new Date(NOW);
  dt.setDate(dt.getDate() - d);
  dt.setHours(randInt(7, 18), randInt(0, 59), 0, 0);
  return dt.toISOString();
}

function generateLeads(): Lead[] {
  const result: Lead[] = [];
  const usedNames = new Set<string>();
  for (let i = 1; i <= 200; i++) {
    let name: string;
    do {
      name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    } while (usedNames.has(name));
    usedNames.add(name);

    const company = pick(COMPANIES);
    const region = pick(REGIONS);
    const rep = pick(salesReps);
    const source = pickSource();
    const companySize = source === "Broker Referral" || source === "LinkedIn"
      ? randInt(30, 500)
      : randInt(1, 200);
    const stage = pick(STAGES);
    const createdDaysAgo = randInt(1, 90);
    const createdAt = daysAgo(createdDaysAgo);
    const contacted = stage !== "New";
    const lastContactedDaysAgo = contacted ? randInt(0, Math.min(createdDaysAgo, 14)) : 0;
    const lastContactedAt = contacted ? daysAgo(lastContactedDaysAgo) : "";
    const chatInteractions = randInt(0, 6);
    const emailResponses = randInt(0, 4);
    const callsCount = randInt(0, 3);
    const requestedQuote = rng() > 0.6;
    const consentStatus = rng() > 0.15 ? "granted" as const : rng() > 0.5 ? "pending" as const : "declined" as const;

    const partial = {
      companySize, source, chatInteractions, emailResponses, callsCount,
      requestedQuote, lastContactedAt,
    };
    const breakdown = calculateScore(partial);

    const emailUser = name.toLowerCase().replace(/[áéíóúñü]/g, c => {
      const map: Record<string,string> = {á:"a",é:"e",í:"i",ó:"o",ú:"u",ñ:"n",ü:"u"};
      return map[c] || c;
    }).split(" ");
    const emailAddr = `${emailUser[0]}.${emailUser[1]}@${company.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10)}.ec`;

    result.push({
      id: `LD-${String(i).padStart(3, "0")}`,
      name,
      company,
      email: emailAddr,
      phone: `+593 9${randInt(6, 9)} ${randInt(100, 999)} ${randInt(1000, 9999)}`,
      source,
      planInterest: pick(PLANS),
      stage,
      qualScore: breakdown.total,
      qualLevel: qualLevel(breakdown.total),
      assignedTo: rep.name,
      region,
      companySize,
      createdAt,
      lastContactedAt,
      requestedQuote,
      chatInteractions,
      emailResponses,
      callsCount,
      consentStatus,
      consentTimestamp: consentStatus === "granted" ? createdAt : undefined,
      consentMethod: consentStatus === "granted" ? pick(CONSENT_METHODS) : undefined,
      scoreBreakdown: breakdown,
    });
  }
  return result;
}

// ── Generate activities ──
const ACTIVITY_TEMPLATES: { type: Activity["type"]; titles: string[] }[] = [
  { type: "note", titles: ["Lead captured","Initial assessment","Research completed","Notes updated"] },
  { type: "call", titles: ["Outbound call","Follow-up call","Qualification call","Demo scheduling call"] },
  { type: "email", titles: ["Welcome email sent","Plan comparison sent","Follow-up email","Proposal sent"] },
  { type: "meeting", titles: ["Virtual presentation","In-person meeting","Product demo","Contract review"] },
  { type: "chat", titles: ["WhatsApp follow-up","Web chat inquiry","Chat qualification","Quick response"] },
  { type: "task", titles: ["Send proposal","Schedule demo","Prepare ROI analysis","Follow-up reminder"] },
];

function generateActivities(leads: Lead[]): Activity[] {
  const result: Activity[] = [];
  let id = 1;
  for (const lead of leads) {
    const count = randInt(2, 10);
    const created = new Date(lead.createdAt);
    for (let j = 0; j < count; j++) {
      const tmpl = pick(ACTIVITY_TEMPLATES);
      const dayOffset = randInt(0, Math.max(1, Math.floor((NOW.getTime() - created.getTime()) / 86400000)));
      const actDate = new Date(created);
      actDate.setDate(actDate.getDate() + dayOffset);
      actDate.setHours(randInt(8, 17), randInt(0, 59));
      result.push({
        id: `A${id++}`,
        leadId: lead.id,
        type: tmpl.type,
        title: pick(tmpl.titles),
        description: `${pick(tmpl.titles)} for ${lead.name} at ${lead.company}.`,
        date: actDate.toISOString(),
        completed: tmpl.type === "task" ? rng() > 0.5 : undefined,
        actor: lead.assignedTo,
      });
    }
  }
  return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// ── Generate tasks ──
function generateTasks(leads: Lead[]): Task[] {
  const taskTypes: Task["type"][] = ["call","email","meeting"];
  const taskTitles = [
    "Send proposal document","Follow-up call","Schedule product demo",
    "Send broker referral info","Prepare ROI analysis","Contract review",
    "Send pricing comparison","Follow-up on coverage questions",
  ];
  const result: Task[] = [];
  const subset = pickN(leads.filter(l => l.stage !== "Won"), 20);
  let id = 1;
  for (const lead of subset) {
    const due = new Date(NOW);
    due.setDate(due.getDate() + randInt(-2, 5));
    result.push({
      id: `T${id++}`,
      leadId: lead.id,
      leadName: lead.name,
      title: pick(taskTitles),
      dueDate: due.toISOString().slice(0, 10),
      completed: rng() > 0.7,
      type: pick(taskTypes),
    });
  }
  return result;
}

// ── Generate conversations ──
const SAMPLE_MSGS_ES: string[][] = [
  [
    "¡Hola! Soy {agent} de Saludsa. Recibimos tu solicitud sobre nuestro {plan}. ¿Tienes unos minutos para conversar?",
    "¡Hola! Sí, claro. Estamos buscando un plan de salud para nuestros empleados.",
    "Perfecto. El {plan} incluye cobertura médica completa, dental, y acceso a nuestra red de especialistas. ¿Les interesa la cobertura internacional?",
    "Sí, tenemos empleados que viajan frecuentemente. ¿Qué cobertura tienen fuera del país?",
    "El plan incluye cobertura de emergencias internacionales hasta $500,000. Te envío el detalle por correo.",
    "Me interesa mucho. ¿Podemos agendar una reunión con nuestro director de RRHH?",
  ],
  [
    "Buenos días, le contacto de Saludsa respecto a la cotización que solicitó.",
    "Buenos días, sí, necesito información para mi empresa de {size} empleados.",
    "Tenemos opciones corporativas muy competitivas. ¿Qué cobertura necesitan prioritariamente?",
    "Necesitamos cobertura dental y de maternidad obligatoriamente.",
    "Ambas están incluidas en nuestro Plan Corporativo. Le preparo una propuesta personalizada.",
    "Perfecto, quedo atenta. Mi correo es {email}.",
  ],
  [
    "Hola, vi su anuncio en LinkedIn sobre planes corporativos de salud.",
    "¡Hola! Gracias por escribirnos. ¿Para cuántas personas necesita cobertura?",
    "Somos una empresa de {size} personas, buscamos cambiar de proveedor.",
    "Entiendo. ¿Cuál es su presupuesto mensual por empleado?",
    "Actualmente pagamos $85 por empleado. ¿Pueden ofrecer algo similar?",
    "Tenemos opciones desde $70 por empleado con coberturas superiores. Le envío comparativa.",
  ],
];

function generateConversations(leads: Lead[]): Conversation[] {
  const result: Conversation[] = [];
  const channels: Channel[] = ["whatsapp","webchat","email","phone"];
  const convLeads = pickN(leads.filter(l => l.stage !== "New"), 30);
  let id = 1;
  for (const lead of convLeads) {
    const channel = pick(channels);
    const template = pick(SAMPLE_MSGS_ES);
    const messages: ChatMessage[] = template.map((text, i) => ({
      id: `CM${id}-${i}`,
      sender: (i % 2 === 0 ? "agent" : "lead") as "agent" | "lead",
      text: text
        .replace("{agent}", lead.assignedTo.split(" ")[0])
        .replace("{plan}", lead.planInterest)
        .replace("{size}", String(lead.companySize))
        .replace("{email}", lead.email),
      time: `${10 + Math.floor(i / 2)}:${30 + (i % 2) * 3}`,
      channel,
    }));
    result.push({
      id: `CONV-${id}`,
      leadId: lead.id,
      leadName: lead.name,
      channel,
      assignedAgent: lead.assignedTo,
      lastMessage: messages[messages.length - 1].text.slice(0, 60),
      lastMessageTime: messages[messages.length - 1].time,
      unreadCount: rng() > 0.6 ? randInt(1, 5) : 0,
      messages,
      createdAt: lead.createdAt,
    });
    id++;
  }
  return result;
}

// ── Web Chat demo flows ──
export const webChatDemoFlows: { id: string; title: string; messages: ChatMessage[] }[] = [
  {
    id: "demo-1",
    title: "Consulta Corporativa Premium",
    messages: [
      { id: "WC1-1", sender: "bot", text: "¡Bienvenido a Saludsa! 👋 Soy su asistente virtual. ¿En qué puedo ayudarle hoy?", time: "09:00" },
      { id: "WC1-2", sender: "lead", text: "Hola, busco un plan de salud corporativo para mi empresa.", time: "09:01" },
      { id: "WC1-3", sender: "bot", text: "¡Excelente! Me encantaría ayudarle. ¿Cuántos empleados tiene su empresa?", time: "09:01" },
      { id: "WC1-4", sender: "lead", text: "Somos 75 personas actualmente.", time: "09:02" },
      { id: "WC1-5", sender: "bot", text: "Perfecto, para una empresa de 75 empleados tenemos opciones muy competitivas. ¿En qué plazo necesitan activar el plan?", time: "09:02" },
      { id: "WC1-6", sender: "lead", text: "Necesitamos tenerlo listo para abril.", time: "09:03" },
      { id: "WC1-7", sender: "bot", text: "Entendido. ¿Necesitan cobertura internacional para viajes de negocios?", time: "09:03" },
      { id: "WC1-8", sender: "lead", text: "Sí, es importante. Varios ejecutivos viajan a Colombia y Perú.", time: "09:04" },
      { id: "WC1-9", sender: "bot", text: "¿Fueron referidos por algún broker o corredor de seguros?", time: "09:04" },
      { id: "WC1-10", sender: "lead", text: "Sí, nos recomendó Seguros del Pacífico.", time: "09:05" },
      { id: "WC1-11", sender: "bot", text: "Para enviarle una cotización personalizada, ¿podría proporcionarme su nombre, empresa y correo electrónico?", time: "09:05" },
      { id: "WC1-12", sender: "lead", text: "Soy Rafael Moreno de Industrial Guayas. rafael.moreno@indguayas.ec", time: "09:06" },
      { id: "WC1-13", sender: "bot", text: "Gracias, Rafael. Para procesar su solicitud necesitamos su consentimiento para el tratamiento de datos personales. ¿Acepta nuestra política de privacidad?", time: "09:06" },
      { id: "WC1-14", sender: "lead", text: "Sí, acepto.", time: "09:07" },
      { id: "WC1-15", sender: "bot", text: "✅ Registro completado. Un asesor especializado en planes corporativos le contactará en las próximas 2 horas. ¡Gracias por elegir Saludsa!", time: "09:07" },
    ],
  },
  {
    id: "demo-2",
    title: "Plan Familiar Urgente",
    messages: [
      { id: "WC2-1", sender: "bot", text: "¡Bienvenido a Saludsa! 👋 ¿En qué puedo ayudarle?", time: "14:00" },
      { id: "WC2-2", sender: "lead", text: "Necesito un plan familiar urgente, mi esposa está embarazada.", time: "14:01" },
      { id: "WC2-3", sender: "bot", text: "Entiendo la urgencia. ¿Cuántas personas necesitan cobertura?", time: "14:01" },
      { id: "WC2-4", sender: "lead", text: "Somos 4: mi esposa, mis dos hijos y yo.", time: "14:02" },
      { id: "WC2-5", sender: "bot", text: "Para una familia de 4, nuestro Plan Familiar Premium incluye cobertura de maternidad completa. ¿Necesitan cobertura internacional?", time: "14:02" },
      { id: "WC2-6", sender: "lead", text: "No, solo Ecuador.", time: "14:03" },
      { id: "WC2-7", sender: "bot", text: "¿Tienen alguna referencia de un broker?", time: "14:03" },
      { id: "WC2-8", sender: "lead", text: "No, encontré Saludsa buscando en internet.", time: "14:04" },
      { id: "WC2-9", sender: "bot", text: "Para enviarle la cotización inmediatamente, ¿me proporciona su nombre y correo?", time: "14:04" },
      { id: "WC2-10", sender: "lead", text: "Julio Herrera, julio.herrera@gmail.com", time: "14:05" },
      { id: "WC2-11", sender: "bot", text: "¿Acepta el tratamiento de sus datos personales conforme a nuestra política de privacidad?", time: "14:05" },
      { id: "WC2-12", sender: "lead", text: "Sí, acepto.", time: "14:06" },
      { id: "WC2-13", sender: "bot", text: "✅ Dado que indica urgencia, un asesor le llamará en los próximos 30 minutos. ¡Gracias por confiar en Saludsa!", time: "14:06" },
    ],
  },
  {
    id: "demo-3",
    title: "Consulta Individual por Pricing",
    messages: [
      { id: "WC3-1", sender: "bot", text: "¡Hola! Bienvenido a Saludsa. ¿Cómo puedo asistirle?", time: "11:00" },
      { id: "WC3-2", sender: "lead", text: "Quiero saber los precios de un plan individual.", time: "11:01" },
      { id: "WC3-3", sender: "bot", text: "Con gusto. ¿Solo para usted o incluye dependientes?", time: "11:01" },
      { id: "WC3-4", sender: "lead", text: "Solo para mí.", time: "11:02" },
      { id: "WC3-5", sender: "bot", text: "Nuestro Plan Individual Básico inicia desde $45/mes y el Plus desde $75/mes. ¿Le interesa alguno en particular?", time: "11:02" },
      { id: "WC3-6", sender: "lead", text: "¿Qué incluye el Plus que no tenga el Básico?", time: "11:03" },
      { id: "WC3-7", sender: "bot", text: "El Plus agrega dental, visión y cobertura de emergencia internacional. ¿Desea una cotización formal?", time: "11:03" },
      { id: "WC3-8", sender: "lead", text: "Sí, me interesa el pricing completo.", time: "11:04" },
      { id: "WC3-9", sender: "bot", text: "¿Me comparte su nombre y correo para enviarle la cotización?", time: "11:04" },
      { id: "WC3-10", sender: "lead", text: "Sandra López, sandra.lopez@outlook.com", time: "11:05" },
      { id: "WC3-11", sender: "bot", text: "¿Acepta nuestra política de privacidad para el tratamiento de sus datos?", time: "11:05" },
      { id: "WC3-12", sender: "lead", text: "Sí.", time: "11:06" },
      { id: "WC3-13", sender: "bot", text: "✅ Cotización enviada a su correo. Un asesor le contactará para resolver cualquier duda. ¡Gracias!", time: "11:06" },
    ],
  },
  {
    id: "demo-4",
    title: "Empresa Pequeña — Consulta WhatsApp",
    messages: [
      { id: "WC4-1", sender: "bot", text: "¡Hola! Gracias por contactar a Saludsa. ¿En qué le podemos ayudar?", time: "16:00" },
      { id: "WC4-2", sender: "lead", text: "Hola, tengo una empresa pequeña de 12 personas. ¿Tienen planes corporativos para nosotros?", time: "16:01" },
      { id: "WC4-3", sender: "bot", text: "¡Claro! Tenemos planes desde 10 empleados. ¿Cuál es su industria?", time: "16:01" },
      { id: "WC4-4", sender: "lead", text: "Somos una agencia de marketing digital.", time: "16:02" },
      { id: "WC4-5", sender: "bot", text: "Excelente. ¿En qué plazo necesitan la cobertura?", time: "16:02" },
      { id: "WC4-6", sender: "lead", text: "No hay urgencia, estamos explorando opciones para el segundo semestre.", time: "16:03" },
      { id: "WC4-7", sender: "bot", text: "¿Necesitan cobertura internacional?", time: "16:03" },
      { id: "WC4-8", sender: "lead", text: "No por ahora.", time: "16:04" },
      { id: "WC4-9", sender: "bot", text: "¿Cómo conocieron Saludsa?", time: "16:04" },
      { id: "WC4-10", sender: "lead", text: "Vi un post en LinkedIn.", time: "16:05" },
      { id: "WC4-11", sender: "bot", text: "Para preparar una propuesta, ¿me comparte su nombre, empresa y correo?", time: "16:05" },
      { id: "WC4-12", sender: "lead", text: "Martín Peña, Agencia Creativa EC, martin@agcreativa.ec", time: "16:06" },
      { id: "WC4-13", sender: "bot", text: "¿Acepta el tratamiento de datos según nuestra política de privacidad?", time: "16:06" },
      { id: "WC4-14", sender: "lead", text: "Sí, de acuerdo.", time: "16:07" },
      { id: "WC4-15", sender: "bot", text: "✅ Registrado. Le enviaremos información por correo y un asesor le contactará cuando lo indique. ¡Gracias!", time: "16:07" },
    ],
  },
];

// ── Build everything ──
export const initialLeads = generateLeads();
export const initialActivities = generateActivities(initialLeads);
export const initialTasks = generateTasks(initialLeads);
export const initialConversations = generateConversations(initialLeads);

// Pipeline data derived
export function computePipelineData(leads: Lead[]) {
  const stages: LeadStage[] = ["New","Contacted","Qualified","Won"];
  const colors: Record<LeadStage, string> = {
    New: "hsl(217, 91%, 50%)", Contacted: "hsl(38, 92%, 50%)",
    Qualified: "hsl(262, 83%, 58%)", Won: "hsl(142, 71%, 45%)",
  };
  return stages.map(stage => ({
    stage,
    count: leads.filter(l => l.stage === stage).length,
    color: colors[stage],
  }));
}
