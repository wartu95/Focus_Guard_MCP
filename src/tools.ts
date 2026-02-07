import dotnev from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import  admin from 'firebase-admin';

dotnev.config();

// -- Configuración Firabase --
// Leer el jsON de credenciales desde una variable de entorno
import serviceAccount from '../firebase-credentials.json' with { type: 'json' };


// Incializar la aplicación de firebase
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
}

const db = admin.firestore();

// -- Configuración Generative AI --
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

//Definimos la herramienta
const toolsDefinition = [
    {
        functionDeclarations: [
            {
                name: "Crear_tarea_en_db",
                description: "Guarda una nueva tarea en la base de datos del usuario.",
                parameters: {
                    type: "object", // En minúsculas es más seguro
                    properties: {
                        titulo: {
                            type: "string",
                            description: "Título de la tarea"
                        },
                        proyecto: {
                            type: "string",
                            description: "El proyecto al que pertenece (ej: Personal, Trabajo, nombre de un proyecto específico, etc.)"
                        }
                    },
                    required: ["titulo", "proyecto"] // <-- MOVIDO AQUÍ (fuera de properties)
                }
            }
        ]
    }
];

const model = genAI.getGenerativeModel({
    model : "gemini-3-pro-preview",
    tools : toolsDefinition as any
});

// Función Real 
async function crearTareaEnDB(titulo: string, proyecto: string) {
const res = await db.collection('tasks').add({
    title: titulo,
    project: proyecto,
    status: 'PENDIENTE',
    date: new Date()
});
return `✅ Tarea guardada con ID: ${res.id}`;
}

async function main() {
    const mensajeUser = "Por favor recuerdame que tengo que comprar leche y pan, y guarda esta tarea en mi proyecto Personal.";
    console.log("Usuario dice: ", mensajeUser);

    const chat = model.startChat();
    const result = await chat.sendMessage(mensajeUser);
    const response = result.response; 

    //Verificar si AI quiere llamar una function.
    const functionCalls = response.functionCalls();
    if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        console.log(`🤖 La AI quiere ejecutar: ${call?.name}`);
        console.log("📂 Datos extraidos: ", call?.args);

        //Ejecutar la función real
        if (call?.name === "Crear_tarea_en_db") {
        const args = call.args as any; // En un caso real, deberíamos validar esto mejor
        const resultado = await crearTareaEnDB(args.titulo, args.proyecto);
        console.log("Resultado de la función: ", resultado);
        }
    } else {
        console.log("AI respondio texto normal: ", response.text());
    }
    
}

main();
