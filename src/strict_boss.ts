import dotnev from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import  admin from 'firebase-admin';

// Cargar las variables de entorno desde el archivo .env
dotnev.config();

// -- Configuración Firebase y Gemini --
// Leer el jsON de credenciales desde una variable de entorno
import serviceAccount from '../firebase-credentials.json' with { type: 'json' };


// Incializar la aplicación de firebase
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
}

// Obtener referencia a Firestore
const db = admin.firestore();

// -- Configuración Generative AI --
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');







// --- Logica de Negocio ---
// Funcion de crear un proyecto, pero valida reglas primero.
async function proponerNuevoProyecto(nombre:string , horasEstimadas: number) {
    console.log(`🧐 Evaluando proyecto: "${nombre}" (${horasEstimadas} horas estimadas)`);

    // Consultar si ya algo activo.
    const activoSnapshot = await db.collection('projects').where('status', '==', 'ACTIVE').get();

    //Reglas de Oro (Solo 1 proyecto a la vez)
    if (!activoSnapshot.empty) { 
        const proyectoActual = activoSnapshot.docs[0]?.data();
        return `⛔ DENEGADO. Tienes un proyecto activo: "${proyectoActual?.name}". Por reglas de productividad, solo puedes tener 1 proyecto activo a la vez. Completa o archiva el proyecto actual antes de iniciar "${nombre}". `;
    }

    // Si pasa las reglas, lo crea.
    await db.collection('projects').add({
        name: nombre,
        estimaded_hours: horasEstimadas,
        status: 'ACTIVE',
        created_at: new Date(),
        last_updated: new Date()
    });

    return `✅ APROBADO. El proyecto "${nombre}" ha sido creado y marcado como ACTIVO. ¡Manos a la obra!`;
}








// --- DEFINICIÓN DE HERRAMIENTAS PARA LA AI ---   
const toolsDefinition = [
    {
        functionDeclarations: [
            {
                name: "proponer_proyecto",
                description: "Intenta crear un nuevo proyecto. Evalúa si el usuario tiene tiempo disponible.",
                parameters: {
                    type: "object",
                    properties: {
                        nombre: {
                            type: "string",
                            description: "Nombre del proyecto"
                        },
                        horasEstimadas: {
                            type: "number",
                            description: "Horas totales estimadas"
                        }
                    },
                    required: ["nombre", "horasEstimadas"]
                }
            }
        ]
    }
];

const model = genAI.getGenerativeModel({
    model : "gemini-3-pro-preview",
    tools : toolsDefinition as any
});



async function main() {

    const chat = model.startChat();


    // ESCENARIO 1: Creamos el primer proyecto (debería aprobarlo)
    console.log("--- INTENTO 1 ---");
    let msg = " Quiero empezar mi Porfolio Web astro, me tomará unas 15 horas.";
    console.log("Usuario: ", msg);

    let result = await chat.sendMessage(msg);
    let call = result.response.functionCalls()?.[0];

    if (call && call.name === "proponer_proyecto") {
        const args = call.args as any;
        const respuestaCode = await proponerNuevoProyecto(args.nombre, args.horasEstimadas);
        console.log("Sistema: ", respuestaCode);
    
        // Le enviamos el resultado a Gemini para que nos conteste.
        const result2 = await chat.sendMessage([{
            functionResponse: {
                name: "proponer_proyecto",
                response: { output : respuestaCode }
            }
    }]);
    console.log("Gemini: ", result2.response.text());
    }
    

    // ESCENARIO 2: Intentamos crear un segundo proyecto sin cerrar el primero (debería denegarlo)
    console.log("\n--- INTENTO 2 ---");
    msg = " Quiero empezar un nuevo proyecto de App de Tareas, me tomará unas 15 horas.";
    console.log("Usuario: ", msg);
    result = await chat.sendMessage(msg);
    call = result.response.functionCalls()?.[0];
    if (call && call.name === "proponer_proyecto") {
        const args = call.args as any;
        const respuestaCode = await proponerNuevoProyecto(args.nombre, args.horasEstimadas);
        console.log("Sistema: ", respuestaCode);
}

}

main();
