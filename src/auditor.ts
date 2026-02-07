import dotenv from 'dotenv';
import admin from 'firebase-admin';
import pkg from 'twilio';
const { Twilio } = pkg;


dotenv.config();

// -- Configuración Firebase --
import serviceAccount from '../firebase-credentials.json' with { type: 'json' };
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
}
const db = admin.firestore();

// -- Configuración Twilio --
const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function auditoriaDiaria() {
    console.log("🔍 Iniciando auditoría diaria...")

    const proyectosActivos = await db.collection('projects').where('status', '==', 'ACTIVE').get();

    if (proyectosActivos.empty) {
        console.log(" No hay proyectos activos. ¡Buen trabajo! 🎉");
        return;
    }

    proyectosActivos.forEach(async (doc) =>{
        const data = doc.data();
        const lastUpdate = data.last_updated.toDate();  // Convertir Timestamp a Date JS.
        const ahora = new Date();

        // Calcular la diferencia en horas
        const diffHoras = Math.abs(ahora.getTime() - lastUpdate.getTime()) / 36e5;

        console.log(`Analizando "${data.name}": Inactivo hace ${diffHoras.toFixed(1)} horas.`);

        if (diffHoras > 48) {
            // Alerta Roja: Más de 2 dias sin tocarlo
            const msg = `⚠️ PELIGRO: El proyecto " ${data.name}" lleva mas de 48h abandonado. ¿Lo pausamos o vas a trabajar hoy?`;

            // Validar variables de entorno antes de enviar
            if (process.env.MY_PHONE_NUMBER && process.env.TWILIO_PHONE_FROM) {
                await client.messages.create({
                    body: msg,
                    from: process.env.TWILIO_PHONE_FROM,
                    to: process.env.MY_PHONE_NUMBER
                });
                console.log("🚨 Alerta enviada por WhatsApp");
            } else {
                console.error("❌ No se pudo enviar WhatsApp: Faltan variables de entorno");
            }
        }else {
            console.log("✅ Proyecto en buen estado.");
        }
    });
}


auditoriaDiaria();