// api/generar_examen.js

export default async function handler(req, res) {
  // Permitir CORS (opcional si tu frontend está en el mismo dominio, pero recomendable)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Responder al preflight (OPTIONS)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Solo permitimos POST aquí
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  // Extraer el texto del body
  const { texto } = req.body ?? {};
  if (!texto || typeof texto !== "string") {
    return res.status(400).json({ error: "Falta el texto del PDF" });
  }

  // Asegurarse de que la API key está configurada en Vercel
  const API_KEY = process.env.Api_Gemini;
  if (!API_KEY) {
    console.error("🔴 GEMINI_API_KEY no está definida en las variables de entorno de Vercel");
    return res.status(500).json({ error: "Clave de Gemini no configurada en el servidor" });
  }

  // Construir el prompt para Gemini
  const prompt = `
Eres un generador de exámenes tipo test. A partir del siguiente texto extraído de un PDF, crea un examen con 20 preguntas de opción múltiple (4 opciones cada una, con la respuesta correcta al final de cada pregunta). No incluyas explicaciones adicionales, solo las preguntas en este formato:

Pregunta 1: [Texto de la pregunta]
a) [Opción A]
b) [Opción B]
c) [Opción C]
d) [Opción D]
Respuesta: [a/b/c/d]

(continúa con Pregunta 2, … Hasta la pregunta 20)

TEXTO DEL PDF:
----------------
${texto}
  `;

  try {
    // Llamada a la API de Gemini
    const respuestaGemini = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt.trim() }] }]
        })
      }
    );

    // Leer el texto crudo de la respuesta
    const raw = await respuestaGemini.text();

    // Si Gemini devolvió un status distinto de 2xx, propagar el error
    if (!respuestaGemini.ok) {
      console.error("🔴 Error al llamar a Gemini:", respuestaGemini.status, raw);
      return res.status(502).json({ error: "Error al llamar a Gemini: " + raw });
    }

    // Intentar parsear JSON
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error("🔴 Gemini devolvió algo que no es JSON válido:", raw);
      return res.status(502).json({ error: "Respuesta inválida de Gemini" });
    }

    // Extraer el examen generado
    const examenGenerado = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!examenGenerado) {
      console.error("🔴 Gemini devolvió datos inesperados:", data);
      return res.status(500).json({ error: "No se pudo generar el examen" });
    }

    // Devolver el examen como JSON
    return res.status(200).json({ examen: examenGenerado.trim() });
  } catch (err) {
    console.error("🔴 Error interno al generar examen:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
