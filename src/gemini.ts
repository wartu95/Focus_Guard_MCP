import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai'

// Cargar las variables de entorno desde el archivo .env
dotenv.config();
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error( "❌ Error: No encontré la clave de API de Gemini. Asegúrate de que GEMINI_API_KEY esté definida en el archivo .env" );
    process.exit(1);
}

// Inicializar el cliente de Gemini
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel( {model : "gemini-3-flash-preview"});

async function chatWithGemini() {
    try {
        // Enviar un mensaje a Gemini
        const prompt = "Hola, soy un desarrollador creando un asistente de productividad. Dame una frase corta motivadora.";
        console.log(" 📤 Enviando a Gemini:", prompt)

        const result = await model.generateContent(prompt);
        const response = result.response;

        console.log(" 📥 Respuesta de Gemini:", response.text());
    } catch (error) {
        console.error("❌ Error al comunicarme con Gemini:", error);
    }
}

// Ejecutar la función de chat
chatWithGemini();