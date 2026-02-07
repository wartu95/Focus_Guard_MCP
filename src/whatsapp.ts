import dotenv from 'dotenv';
import pkg from 'twilio';
const { Twilio } = pkg;

dotenv.config();

const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function enviarAlerta(mensaje: string) {
    console.log("📲 Intentando enviar WhatsApp...");
    
    // Validar variables de entorno
    if (!process.env.MY_PHONE_NUMBER || !process.env.TWILIO_PHONE_FROM) {
        console.error("❌ Faltan variables de entorno: MY_PHONE_NUMBER o TWILIO_PHONE_FROM");
        return;
    }
    
    try {
        const message = await client.messages.create({
           body: `🤖 Focus Guard alerta: ${mensaje}`,
           from: process.env.TWILIO_PHONE_FROM,
           to: process.env.MY_PHONE_NUMBER
         });
         console.log("✅ WhatsApp enviado con SID:", message.sid);
    } catch (error) {
        console.error("❌ Error al enviar WhatsApp:", error);
    }
}

// Prueba directa
enviarAlerta("Hola desarrollador, soy tu asistente MCP. ¡Ya tengo voz!")