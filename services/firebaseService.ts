import fs from "fs";
import path from "path";
import admin from "firebase-admin";

const CONFIG_PATH = path.join(process.cwd(), "firebase-applet-config.json");

let dbInstance: any = null;
let isFirebaseInitialized = false;

/**
 * Lazily initializes Firebase Firestore using the applet config if it exists.
 * Returns the Firestore database instance or null if not configured.
 */
export function initializeFirebase() {
  if (isFirebaseInitialized) return dbInstance;

  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      console.warn("[Firebase Admin] CONFIG AUSENTE: 'firebase-applet-config.json' não encontrado. Operando no modo de fallback local (JSON).");
      return null;
    }

    const configData = fs.readFileSync(CONFIG_PATH, "utf8");
    const firebaseConfig = JSON.parse(configData);

    if (!firebaseConfig.projectId) {
      console.warn("[Firebase Admin] CONFIG INVÁLIDA: Faltam dados essenciais no ficheiro de configuração.");
      return null;
    }

    console.log(`[Firebase Admin] A inicializar ligação Firestore Admin para o projeto: ${firebaseConfig.projectId}...`);
    
    if (admin.apps.length === 0) {
      admin.initializeApp({
        projectId: firebaseConfig.projectId
      });
    }
    
    const dbId = firebaseConfig.firestoreDatabaseId || "(default)";
    dbInstance = admin.firestore(dbId);
    isFirebaseInitialized = true;
    console.log(`[Firebase Admin] Ligação ao Firestore Admin estabelecida no banco: ${dbId}!`);
    return dbInstance;
  } catch (err) {
    console.error("[Firebase Admin] Alerta: Falha ao inicializar o Firestore em modo Admin:", err);
    return null;
  }
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error("[Firebase Admin] Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Salva ou sincroniza uma nova denúncia no Firebase Firestore.
 */
export async function saveReportToFirestore(report: any): Promise<boolean> {
  const db = initializeFirebase();
  if (!db) return false;

  const docPath = `reports/${report.id}`;
  try {
    console.log(`[Firebase Admin] A guardar denúncia ID ${report.id} no Firestore...`);
    const docRef = db.collection("reports").doc(report.id);
    
    // Clean fields ensuring they match Firestore expectations
    await docRef.set({
      id: report.id,
      tipo: report.tipo,
      local: report.local || "Não informado",
      quando: report.quando || "Não informado",
      testemunhas: report.testemunhas || "Não informado",
      descricao: report.descricao,
      status: report.status || "Recebido",
      user_code: report.user_code || "Anónimo",
      created_at: report.created_at,
      
      // Optional/Geolocation markers
      nome_denunciante: report.nome_denunciante || null,
      latitude: typeof report.latitude === "number" ? report.latitude : null,
      longitude: typeof report.longitude === "number" ? report.longitude : null,
      precisao: typeof report.precisao === "number" ? report.precisao : null,
      endereco_completo: report.endereco_completo || null,
      google_maps_link: report.google_maps_link || null,
      data_local: report.data_local || null,
      hora_local: report.hora_local || null
    });
    console.log("[Firebase Admin] Denúncia guardada no Firestore com sucesso!");
    return true;
  } catch (err) {
    if (err instanceof Error && (err.message.includes("permission") || err.message.includes("Permission"))) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
    }
    console.error(`[Firebase Admin] Erro ao gravar documento no Firestore para a denúncia ${report.id}:`, err);
    return false;
  }
}

/**
 * Tenta buscar denúncias ativas do Firebase Firestore.
 * Retorna null se o Firestore não estiver ativo ou configurado.
 */
export async function getReportsFromFirestore(): Promise<any[] | null> {
  const db = initializeFirebase();
  if (!db) return null;

  const collectionPath = "reports";
  try {
    console.log("[Firebase Admin] A obter denúncias do Firestore...");
    const snapshot = await db.collection("reports").orderBy("created_at", "desc").get();
    const reports: any[] = [];
    snapshot.forEach((doc: any) => {
      reports.push(doc.data());
    });
    console.log(`[Firebase Admin] ${reports.length} denúncias recuperadas do Firestore!`);
    return reports;
  } catch (err) {
    if (err instanceof Error && (err.message.includes("permission") || err.message.includes("Permission"))) {
      handleFirestoreError(err, OperationType.LIST, collectionPath);
    }
    console.error("[Firebase Admin] Erro ao obter dados do Firestore:", err);
    return null;
  }
}

/**
 * Atualiza o status de uma denúncia no Firebase Firestore.
 */
export async function updateReportStatusInFirestore(id: string, status: string): Promise<boolean> {
  const db = initializeFirebase();
  if (!db) return false;

  const docPath = `reports/${id}`;
  try {
    console.log(`[Firebase Admin] A atualizar status para '${status}' da denúncia ID ${id} no Firestore...`);
    const docRef = db.collection("reports").doc(id);
    await docRef.update({ status });
    console.log("[Firebase Admin] Documento no Firestore atualizado com sucesso!");
    return true;
  } catch (err) {
    if (err instanceof Error && (err.message.includes("permission") || err.message.includes("Permission"))) {
      handleFirestoreError(err, OperationType.UPDATE, docPath);
    }
    console.error(`[Firebase Admin] Erro ao atualizar documento ${id} no Firestore:`, err);
    return false;
  }
}

/**
 * Remove uma denúncia no Firebase Firestore.
 */
export async function deleteReportFromFirestore(id: string): Promise<boolean> {
  const db = initializeFirebase();
  if (!db) return false;

  const docPath = `reports/${id}`;
  try {
    console.log(`[Firebase Admin] A remover denúncia ID ${id} do Firestore...`);
    const docRef = db.collection("reports").doc(id);
    await docRef.delete();
    console.log("[Firebase Admin] Documento removido do Firestore com sucesso!");
    return true;
  } catch (err) {
    if (err instanceof Error && (err.message.includes("permission") || err.message.includes("Permission"))) {
      handleFirestoreError(err, OperationType.DELETE, docPath);
    }
    console.error(`[Firebase Admin] Erro ao apagar documento ${id} no Firestore:`, err);
    return false;
  }
}
