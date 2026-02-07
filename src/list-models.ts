import dotenv from 'dotenv';

dotenv.config();

async function listModels() {
    try {
        console.log('🔍 Consultando modelos disponibles desde la API de Google...\n');
        
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('❌ No se encontró GEMINI_API_KEY en el archivo .env');
            return;
        }

        // Llamar a la API REST directamente
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        const models = data.models || [];
        
        console.log(`📊 Se encontraron ${models.length} modelos:\n`);
        
        models.forEach((model: any, index: number) => {
            console.log(`${index + 1}. ${model.name}`);
            console.log(`   Display Name: ${model.displayName || 'N/A'}`);
            console.log(`   Description: ${model.description || 'N/A'}`);
            console.log(`   Supported Methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
            console.log('');
        });
        
        // Filtrar modelos que soporten generateContent
        const generateContentModels = models.filter((m: any) => 
            m.supportedGenerationMethods?.includes('generateContent')
        );
        
        console.log('\n✅ Modelos recomendados para tu código (soportan generateContent + tools):');
        generateContentModels.forEach((model: any) => {
            const modelId = model.name.replace('models/', '');
            console.log(`   - "${modelId}"`);
        });
        
    } catch (error: any) {
        console.error('❌ Error al listar modelos:', error.message);
        console.log('\n💡 Verifica que tu GEMINI_API_KEY en el archivo .env sea correcta');
    }
}

listModels();
