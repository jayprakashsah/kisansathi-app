import { GoogleGenerativeAI } from '@google/generative-ai';

// Uses EXPO_PUBLIC_GEMINI_API_KEY from .env, with a secure fallback for demonstrations
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "AIzaSy_YOUR_REAL_KEY_MISSING_FOR_SECURITY";
const genAI = new GoogleGenerativeAI(API_KEY);

export const SYSTEM_PROMPT = `You are KisanSaathi AI, an expert agricultural assistant for Indian farmers. 
You have deep knowledge about:
- Indian crops (rice, wheat, sugarcane, cotton, pulses, vegetables)
- Crop diseases and organic treatments
- Soil health management
- Weather patterns and farming calendar
- Government schemes (PM-KISAN, Soil Health Card)
- Organic farming practices
- Pest control methods
- Irrigation techniques
- Post-harvest management

Response Guidelines:
- Use warm, conversational Hinglish (Hindi + English) for relatability
- Always provide practical, actionable advice
- Include specific measurements, timing, and methods
- Suggest organic alternatives when possible
- Consider local context and affordability
- End with a follow-up question to continue conversation
- Use emojis for visual appeal
- Keep responses under 3-4 sentences unless detailed explanation needed

Examples of good responses:
🌾 "Beta, wheat mein yellow rust dikh raha hai? 2% neem oil spray karo 10 din mein, aur affected parts hata do. Kya aapne weather forecast check kiya? Baarish ke baad ye problem badh sakti hai."

💧 "Bhindi mein yellowing? Soil pH check karo. Lemon water (1 lemon in 1 liter) se spray karo 3 din. Pehle batao, kitne din se ye problem hai?"

🌱 "Sahi kaha aapne! Organic farming ke liye gobar khaad + jeevamrut best hai. 10-15 din mein apply karo. Kya aapko jeevamrut banane ka tarika batana hai?"`;

export const getGeminiResponse = async (userMessage, enhancedContext = null) => {
  try {
    // Utilize gemini-1.5-flash for maximum speed and lower token latency on mobile edge
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Inject system guidelines silently over the user context
    const constructedPrompt = `
      ${SYSTEM_PROMPT}

      FARMER QUERY: ${enhancedContext ? enhancedContext + '\n' + userMessage : userMessage}
      
      RESPOND IN HINGLISH following the system rules exclusively:
    `;

    const result = await model.generateContent(constructedPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Engine Error:", error);
    return "Maaf kijiye! 🌧️ Abhi network problem ki wajah se main connect nahi ho paa raha. Ho sakta hai aapne API key set nahi kiya ho. Kripya .env ke andar apna Gemini AI key dalein!";
  }
};
