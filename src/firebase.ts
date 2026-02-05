import dotenv from 'dotenv';   
import  admin from 'firebase-admin';

dotenv.config();


// Leer el jsON de credenciales desde una variable de entorno
import serviceAccount from '../firebase-credentials.json' with { type: 'json' };


// Incializar la aplicación de firebase
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
}

const db = admin.firestore();

async function testDatabase() {
    console.log("🔥 Conectando a Firebase...");

    try {
        const res = await db.collection('tasks').add({
            title: 'Configurar entorno Node.js',
            status: 'COMPLETADO',
            created_at: new Date(),
            project: 'FocusGuard'
        });
        
        console.log(' ✅ Documento creado con ID: ', res.id);

        // Leer datos (Consultar tareas completadas)
        const snapshot = await db.collection('tasks').where('status', '==', 'COMPLETADO').get();

        snapshot.forEach(doc => {
            console.log('📄 Tareas encontradas: ', doc.id, '=>', doc.data());
        })
    }
    catch (error) {
        console.error( "❌ Error al conectar con Firebase: ", error);
    }
}

testDatabase();